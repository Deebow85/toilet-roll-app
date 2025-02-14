import { describe, it, expect } from 'vitest';
import { validateNumericInput } from '../validation';

describe('validateNumericInput', () => {
  it('should validate required values', () => {
    expect(validateNumericInput('')).toEqual({
      isValid: false,
      message: 'Value is required'
    });
  });

  it('should validate numeric values', () => {
    expect(validateNumericInput('abc')).toEqual({
      isValid: false,
      message: 'Must be a valid number'
    });
  });

  it('should validate integer values when decimals not allowed', () => {
    expect(validateNumericInput('1.5', { allowDecimal: false })).toEqual({
      isValid: false,
      message: 'Must be a whole number'
    });
  });

  it('should validate minimum values', () => {
    expect(validateNumericInput('5', { min: 10 })).toEqual({
      isValid: false,
      message: 'Must be at least 10'
    });
  });

  it('should validate maximum values', () => {
    expect(validateNumericInput('15', { max: 10 })).toEqual({
      isValid: false,
      message: 'Must be no more than 10'
    });
  });

  it('should pass valid values', () => {
    expect(validateNumericInput('10')).toEqual({
      isValid: true
    });
  });
});