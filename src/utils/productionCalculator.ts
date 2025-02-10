// Production rate calculator with diameter and perf length combinations
export interface ConversionFactor {
  diameter: number;
  perfLength: number;
  factor: number;
}

// Define known conversion factors for specific diameter/perf length combinations
export const DEFAULT_CONVERSION_FACTORS: ConversionFactor[] = [
  { diameter: 105, perfLength: 120, factor: 23.53 },
  { diameter: 112, perfLength: 124, factor: 23.99 }
];

// Get conversion factors from localStorage or use defaults
export function getStoredConversionFactors(): ConversionFactor[] {
  const stored = localStorage.getItem('conversionFactors');
  return stored ? JSON.parse(stored) : DEFAULT_CONVERSION_FACTORS;
}

// Save conversion factors to localStorage
export function saveConversionFactors(factors: ConversionFactor[]) {
  localStorage.setItem('conversionFactors', JSON.stringify(factors));
}

export function getConversionFactor(diameter: number, perfLength: number): number | null {
  console.log('Checking factor for:', { diameter, perfLength });
  const factors = getStoredConversionFactors();
  const factor = factors.find(f => 
    f.diameter === diameter && f.perfLength === perfLength
  );
  console.log('Found factor:', factor);
  return factor ? factor.factor : null;
}

export function calculateLogsPerMinute(speedMPM: number, diameter: number | undefined, perfLength: number | undefined): number | null {
  console.log('Calculating logs/min with:', { speedMPM, diameter, perfLength });
  
  if (!diameter || !perfLength) {
    console.log('Missing diameter or perf length');
    return null;
  }
  
  const factor = getConversionFactor(diameter, perfLength);
  if (!factor) {
    console.log('No conversion factor found');
    return null;
  }

  // Speed (m/min) divided by conversion factor = logs/min
  const result = Number((speedMPM / factor).toFixed(1));
  console.log('Calculated logs/min:', result);
  return result;
}

export function calculateRequiredSpeed(targetLogsPerMinute: number, diameter: number | undefined, perfLength: number | undefined): number | null {
  console.log('Calculating required speed with:', { targetLogsPerMinute, diameter, perfLength });
  
  if (!diameter || !perfLength) {
    console.log('Missing diameter or perf length');
    return null;
  }
  
  const factor = getConversionFactor(diameter, perfLength);
  if (!factor) {
    console.log('No conversion factor found');
    return null;
  }

  // Target logs/min multiplied by conversion factor = required speed (m/min)
  const result = Number((targetLogsPerMinute * factor).toFixed(1));
  console.log('Calculated required speed:', result);
  return result;
}

// Helper function to check if a product spec has a valid conversion factor
export function hasValidConversionFactor(diameter: number | undefined, perfLength: number | undefined): boolean {
  if (!diameter || !perfLength) return false;
  const factors = getStoredConversionFactors();
  return factors.some(f => f.diameter === diameter && f.perfLength === perfLength);
}