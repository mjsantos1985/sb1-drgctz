import { XMLParser } from 'fast-xml-parser';
import { validateXMLString, XMLValidationError } from './validators/xmlValidator';
import { validateNFEStructure, NFEValidationError } from './validators/nfeValidator';
import { insertPedido, insertVendedor, insertProdutoPedido } from './db';
import { NFEData } from './types/xml';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => name === 'det',
  parseAttributeValue: true,
  parseTagValue: true,
  trimValues: true,
  allowBooleanAttributes: true
});

export const processXML = async (xmlContent: string) => {
  try {
    // Step 1: Validate XML structure
    validateXMLString(xmlContent);

    // Step 2: Parse XML
    let parsedData: any;
    try {
      parsedData = parser.parse(xmlContent.trim());
    } catch (error) {
      throw new XMLValidationError('Erro ao processar XML: formato inválido');
    }

    // Step 3: Validate NFE structure and get typed data
    const nfeData: NFEData = validateNFEStructure(parsedData);
    const nfe = nfeData.nfeProc.NFe.infNFe;

    // Step 4: Process vendedor
    try {
      await insertVendedor({
        id: nfe.emit.CNPJ,
        nome: nfe.emit.xNome,
        email: nfe.emit.email || `${nfe.emit.CNPJ}@placeholder.com`
      });
    } catch (error) {
      throw new Error('Falha ao salvar dados do vendedor');
    }

    // Step 5: Create pedido
    const pedidoId = `PED${Date.now()}`;
    try {
      await insertPedido({
        id: pedidoId,
        vendedor_id: nfe.emit.CNPJ,
        cliente: nfe.dest.xNome,
        valor: parseFloat(nfe.total.ICMSTot.vNF),
        status: 'Pendente',
        data: nfe.ide.dhEmi,
        produtos: nfe.det.length
      });
    } catch (error) {
      throw new Error('Falha ao criar pedido');
    }

    // Step 6: Process produtos
    try {
      for (const item of nfe.det) {
        await insertProdutoPedido({
          pedido_id: pedidoId,
          produto: item.prod.xProd,
          quantidade: parseInt(item.prod.qCom),
          valor_unitario: parseFloat(item.prod.vUnCom)
        });
      }
    } catch (error) {
      throw new Error('Falha ao processar produtos do pedido');
    }

    return { 
      success: true, 
      pedidoId,
      details: {
        numero: nfe.ide.nNF,
        serie: nfe.ide.serie,
        chave: nfeData.nfeProc.protNFe?.infProt.chNFe,
        protocolo: nfeData.nfeProc.protNFe?.infProt.nProt
      }
    };
  } catch (error) {
    console.error('Erro no processamento:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido no processamento'
    };
  }
};