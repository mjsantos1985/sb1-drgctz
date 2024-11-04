import { NFEData } from '../types/xml';

export class NFEValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NFEValidationError';
  }
}

const validateEmitente = (emit: any): void => {
  if (!emit) {
    throw new NFEValidationError('Dados do emitente não encontrados');
  }

  if (!emit.CNPJ) {
    throw new NFEValidationError('CNPJ do emitente é obrigatório');
  }

  if (!emit.xNome) {
    throw new NFEValidationError('Nome do emitente é obrigatório');
  }
};

const validateDestinatario = (dest: any): void => {
  if (!dest) {
    throw new NFEValidationError('Dados do destinatário não encontrados');
  }

  if (!dest.xNome) {
    throw new NFEValidationError('Nome do destinatário é obrigatório');
  }

  // Allow either CNPJ or CPF
  if (!dest.CNPJ && !dest.CPF) {
    throw new NFEValidationError('Destinatário deve ter CNPJ ou CPF');
  }
};

const validateProduto = (det: any, index: number): void => {
  if (!det.prod) {
    throw new NFEValidationError(`Produto ${index + 1}: dados não encontrados`);
  }

  const { prod } = det;

  if (!prod.xProd) {
    throw new NFEValidationError(`Produto ${index + 1}: descrição é obrigatória`);
  }

  if (!prod.qCom || isNaN(parseFloat(prod.qCom)) || parseFloat(prod.qCom) <= 0) {
    throw new NFEValidationError(`Produto ${index + 1}: quantidade inválida`);
  }

  if (!prod.vUnCom || isNaN(parseFloat(prod.vUnCom)) || parseFloat(prod.vUnCom) <= 0) {
    throw new NFEValidationError(`Produto ${index + 1}: valor unitário inválido`);
  }

  if (!prod.vProd || isNaN(parseFloat(prod.vProd)) || parseFloat(prod.vProd) <= 0) {
    throw new NFEValidationError(`Produto ${index + 1}: valor total inválido`);
  }
};

const validateTotal = (total: any): void => {
  if (!total || !total.ICMSTot) {
    throw new NFEValidationError('Totais da nota não encontrados');
  }

  const { ICMSTot } = total;

  if (!ICMSTot.vNF || isNaN(parseFloat(ICMSTot.vNF)) || parseFloat(ICMSTot.vNF) <= 0) {
    throw new NFEValidationError('Valor total da nota fiscal inválido');
  }
};

export const validateNFEStructure = (data: any): NFEData => {
  if (!data?.nfeProc?.NFe?.infNFe) {
    throw new NFEValidationError('Estrutura NFe inválida ou incompleta');
  }

  const nfe = data.nfeProc.NFe.infNFe;

  // Validate emitente
  validateEmitente(nfe.emit);

  // Validate destinatário
  validateDestinatario(nfe.dest);

  // Validate products
  if (!Array.isArray(nfe.det)) {
    throw new NFEValidationError('Lista de produtos inválida');
  }

  if (nfe.det.length === 0) {
    throw new NFEValidationError('A nota fiscal deve conter pelo menos um produto');
  }

  // Validate each product
  nfe.det.forEach((det, index) => validateProduto(det, index));

  // Validate totals
  validateTotal(nfe.total);

  return data as NFEData;
}