import { XMLParser } from 'fast-xml-parser';
import { validateXMLString } from '../validators/xmlValidator';
import { validateNFEStructure } from '../validators/nfeValidator';
import { insertPedido, insertVendedor, insertProdutoPedido } from '../db';
import { XMLPedido } from '../types/xml';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => name === 'det',
  parseAttributeValue: true,
  parseTagValue: true,
  trimValues: true
});

export interface ProcessResult {
  success: boolean;
  error?: string;
  pedidoId?: string;
}

export const processXML = async (xmlContent: string): Promise<ProcessResult> => {
  try {
    // Validate XML string
    const xmlValidation = validateXMLString(xmlContent);
    if (!xmlValidation.isValid) {
      return { success: false, error: xmlValidation.error };
    }

    // Parse XML
    let parsedData: any;
    try {
      parsedData = parser.parse(xmlContent);
    } catch (parseError) {
      return { 
        success: false, 
        error: 'Erro ao fazer parse do XML: formato inválido' 
      };
    }

    // Validate NFE structure
    const nfeValidation = validateNFEStructure(parsedData);
    if (!nfeValidation.isValid) {
      return { success: false, error: nfeValidation.error };
    }

    const nfe = parsedData.nfeProc.NFe.infNFe;

    // Process vendedor
    try {
      const vendedor = {
        id: nfe.emit.CNPJ,
        nome: nfe.emit.xNome,
        email: nfe.emit.email
      };
      insertVendedor(vendedor);
    } catch (error) {
      return { 
        success: false, 
        error: 'Erro ao processar dados do vendedor' 
      };
    }

    // Process pedido
    let pedidoId: string;
    try {
      pedidoId = `PED${Date.now()}`;
      const pedido = {
        id: pedidoId,
        vendedor_id: nfe.emit.CNPJ,
        cliente: nfe.dest.xNome,
        valor: parseFloat(nfe.total.ICMSTot.vNF),
        status: 'Pendente',
        data: new Date().toISOString(),
        produtos: nfe.det.length
      };
      insertPedido(pedido);
    } catch (error) {
      return { 
        success: false, 
        error: 'Erro ao processar dados do pedido' 
      };
    }

    // Process produtos
    try {
      nfe.det.forEach(item => {
        insertProdutoPedido({
          pedido_id: pedidoId!,
          produto: item.prod.xProd,
          quantidade: parseInt(item.prod.qCom),
          valor_unitario: parseFloat(item.prod.vUnCom)
        });
      });
    } catch (error) {
      return { 
        success: false, 
        error: 'Erro ao processar produtos do pedido' 
      };
    }

    return { success: true, pedidoId };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido ao processar o arquivo XML'
    };
  }
};