export class XMLValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'XMLValidationError';
  }
}

export const validateXMLString = (xmlContent: string): void => {
  if (!xmlContent || typeof xmlContent !== 'string') {
    throw new XMLValidationError('Conteúdo XML inválido ou vazio');
  }

  if (!xmlContent.includes('<?xml')) {
    throw new XMLValidationError('Arquivo não possui estrutura XML válida');
  }

  if (!xmlContent.includes('<nfeProc')) {
    throw new XMLValidationError('Arquivo XML não possui estrutura de NFe');
  }

  // Basic structure validation
  const requiredElements = [
    '<NFe',
    '<infNFe',
    '<emit>',
    '<dest>',
    '<det',
    '<total>',
  ];

  for (const element of requiredElements) {
    if (!xmlContent.includes(element)) {
      throw new XMLValidationError(`Elemento obrigatório não encontrado: ${element}`);
    }
  }
}