/**
 * Calculate runtime in minutes for a reel
 * @param diameter Current diameter in mm
 * @param endDiameter End diameter in mm
 * @param speed Speed in meters per minute
 * @param bulk Bulk in mm
 * @param isTwoPly Whether the tissue is 2-ply (runs out twice as fast)
 * @returns Runtime in minutes
 */
export function calculateRuntime(
  diameter: number,
  endDiameter: number,
  speed: number,
  bulk: number,
  isTwoPly: boolean = false
): number {
  if (!diameter || !endDiameter || !speed || !bulk) return 0;
  if (diameter <= endDiameter) return 0;
  
  // Convert all measurements to meters for calculation
  const outerDiameter = diameter / 1000;
  const innerDiameter = endDiameter / 1000;
  const bulkMeters = bulk / 1000;
  
  // Calculate length using the formula: L = π(D²-d²)/(4t)
  // Where: L = length, D = outer diameter, d = inner diameter, t = bulk
  const length = Math.PI * (Math.pow(outerDiameter, 2) - Math.pow(innerDiameter, 2)) / (4 * bulkMeters);
  
  // Runtime = length / speed
  let runtime = length / speed;
  
  // For 2-ply tissue, halve the runtime as it runs out twice as fast
  if (isTwoPly) {
    runtime = runtime / 2;
  }
  
  // Return rounded to nearest minute
  return Math.round(runtime);
}

/**
 * Calculate runtime to break in minutes
 * @param diameter Current diameter in mm
 * @param breakDiameter Break diameter in mm
 * @param speed Speed in meters per minute
 * @param bulk Bulk in mm
 * @param isTwoPly Whether the tissue is 2-ply (runs out twice as fast)
 * @returns Runtime to break in minutes
 */
export function calculateRuntimeToBreak(
  diameter: number,
  breakDiameter: number,
  speed: number,
  bulk: number,
  isTwoPly: boolean = false
): number {
  if (!diameter || !breakDiameter || !speed || !bulk) return 0;
  if (diameter <= breakDiameter) return 0;
  
  // Convert all measurements to meters for calculation
  const outerDiameter = diameter / 1000;
  const breakDiameterMeters = breakDiameter / 1000;
  const bulkMeters = bulk / 1000;
  
  // Calculate length using the formula: L = π(D²-d²)/(4t)
  // Where: L = length, D = outer diameter, d = break diameter, t = bulk
  const length = Math.PI * (Math.pow(outerDiameter, 2) - Math.pow(breakDiameterMeters, 2)) / (4 * bulkMeters);
  
  // Runtime = length / speed
  let runtime = length / speed;
  
  // For 2-ply tissue, halve the runtime as it runs out twice as fast
  if (isTwoPly) {
    runtime = runtime / 2;
  }
  
  // Return rounded to nearest minute
  return Math.round(runtime);
}

/**
 * Calculate total length of tissue on a reel in meters
 * @param diameter Current diameter in mm
 * @param endDiameter End diameter in mm
 * @param bulk Bulk in mm
 * @returns Total length in meters
 */
export function calculateLength(
  diameter: number,
  endDiameter: number,
  bulk: number
): number {
  if (!diameter || !endDiameter || !bulk) return 0;
  if (diameter <= endDiameter) return 0;
  
  // Calculate length using the formula: L = π(D²-d²)/(4t)
  // Where: L = length in meters, D = outer diameter in mm, d = inner diameter in mm, t = bulk in mm
  const length = Number((Math.PI * (Math.pow(diameter, 2) - Math.pow(endDiameter, 2)) / (4 * bulk) / 1000).toFixed(5));
  return length;
}

/**
 * Format a time in minutes to HH:mm:ss
 * @param minutes Time in minutes
 * @returns Formatted time string
 */
export function formatTime(minutes: number): string {
  if (!minutes) return '00:00:00';
  
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  const secs = Math.round((minutes % 1) * 60);
  
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}