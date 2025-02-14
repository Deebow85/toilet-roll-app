export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export function validateNumericInput(value: string, options?: {
  min?: number;
  max?: number;
  allowDecimal?: boolean;
}): ValidationResult {
  if (!value.trim()) {
    return { isValid: false, message: 'Value is required' };
  }

  const number = parseFloat(value);

  if (isNaN(number)) {
    return { isValid: false, message: 'Must be a valid number' };
  }

  if (!options?.allowDecimal && !Number.isInteger(number)) {
    return { isValid: false, message: 'Must be a whole number' };
  }

  if (options?.min !== undefined && number < options.min) {
    return { isValid: false, message: `Must be at least ${options.min}` };
  }

  if (options?.max !== undefined && number > options.max) {
    return { isValid: false, message: `Must be no more than ${options.max}` };
  }

  return { isValid: true };
}