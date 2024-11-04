export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateXMLFile = (file: File): FileValidationResult => {
  if (!file.name.toLowerCase().endsWith('.xml')) {
    return {
      isValid: false,
      error: 'O arquivo deve ter extensão .xml'
    };
  }

  if (file.size === 0) {
    return {
      isValid: false,
      error: 'O arquivo está vazio'
    };
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'O arquivo é muito grande. Limite máximo: 5MB'
    };
  }

  return { isValid: true };
};