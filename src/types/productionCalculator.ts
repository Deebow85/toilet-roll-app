@@ .. @@
 export interface ConversionFactor {
   diameter: number;
   perfLength: number;
-  factor: number;
+  factor: number;
+  isLocked?: boolean;
 }
 
 // Define known conversion factors for specific diameter/perf length combinations
 export const DEFAULT_CONVERSION_FACTORS: ConversionFactor[] = [
-  { diameter: 105, perfLength: 120, factor: 23.53 },
-  { diameter: 112, perfLength: 124, factor: 23.99 }
+  { diameter: 105, perfLength: 120, factor: 23.53, isLocked: true },
+  { diameter: 112, perfLength: 124, factor: 23.99, isLocked: true }
 ];