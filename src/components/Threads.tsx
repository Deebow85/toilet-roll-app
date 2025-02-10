import React, { useState } from 'react';
import { Search, ChevronDown, Ruler, Gauge, Minus, Plus } from 'lucide-react';

type ThreadType = 'UNC' | 'UNF' | 'Metric' | 'BSP' | 'BSPT' | 'BSPP' | 'BSF' | 'BSW' | 'NPTF' | 'NPT' | 'UNS';

interface ThreadData {
  size: string;
  tpi?: number;
  pitch?: number;
  majorDiameter: string;
  minorDiameter: string;
  tapDrill: string;
  type: ThreadType;
  metricSize?: string;
}

// Unit conversion utilities
const unitUtils = {
  mmToInch: (mm: number): number => mm / 25.4,
  inchToMm: (inch: string | number): string | number => {
    if (typeof inch === 'string' && inch.includes('"')) {
      const value = parseFloat(inch);
      return `${(value * 25.4).toFixed(2)}mm`;
    }
    if (typeof inch === 'number') {
      return inch * 25.4;
    }
    return inch;
  },
  getDiameterValue: (diameter: string): number => {
    if (diameter.includes('"')) {
      return parseFloat(diameter) * 25.4;
    }
    return parseFloat(diameter);
  }
};

export default function Threads() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedType, setExpandedType] = useState<ThreadType | null>(null);
  const [showIdentifier, setShowIdentifier] = useState(false);
  const [searchMode, setSearchMode] = useState<'major' | 'minor'>('major');
  const [measurementInput, setMeasurementInput] = useState({
    diameter: '',
    tpi: '',
    tpiTolerance: 2,
    tolerance: 0.5
  });

  // Handle diameter input with automatic unit conversion
  const handleDiameterInput = (value: string) => {
    setMeasurementInput(prev => ({
      ...prev,
      diameter: value
    }));
  };

  // Handle tolerance input steps
  const handleToleranceStep = (e: React.WheelEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>) => {
    const isWheel = 'deltaY' in e;
    const direction = isWheel ? (e as React.WheelEvent).deltaY > 0 ? -1 : 1 : 
                               (e as React.KeyboardEvent).key === 'ArrowUp' ? 1 : -1;
    
    setMeasurementInput(prev => ({
      ...prev,
      tolerance: Math.max(0.1, prev.tolerance + (direction * 0.1))
    }));
  };

  // Handle tolerance button clicks
  const handleToleranceButton = (increase: boolean) => {
    setMeasurementInput(prev => ({
      ...prev,
      tolerance: Math.max(0.1, prev.tolerance + (increase ? 0.5 : -0.5))
    }));
  };

  const findSimilarThreads = (diameter: number): ThreadData[] => {
    const searchDiameterMm = parseFloat(diameter.toString());
    const searchDiameterInch = unitUtils.mmToInch(searchDiameterMm);
    
    return threadData.filter(thread => {
      const threadDiameter = unitUtils.getDiameterValue(searchMode === 'major' ? thread.majorDiameter : thread.minorDiameter);
      const isWithinTolerance = Math.abs(threadDiameter - searchDiameterMm) <= measurementInput.tolerance;

      if (!measurementInput.tpi) return isWithinTolerance;

      const searchTpi = parseFloat(measurementInput.tpi);
      
      if (thread.type === 'Metric') {
        // Convert metric pitch to TPI for comparison
        const threadTpi = 25.4 / thread.pitch!;
        return isWithinTolerance && Math.abs(threadTpi - searchTpi) <= measurementInput.tpiTolerance;
      } else {
        // For imperial threads, compare TPI directly
        return isWithinTolerance && Math.abs((thread.tpi || 0) - searchTpi) <= measurementInput.tpiTolerance;
      }
    });
  };

  const threadData: ThreadData[] = [
    // UNC (Unified National Coarse)
    { type: 'UNC', size: '#4-40', tpi: 40, majorDiameter: '0.112"', minorDiameter: '0.0813"', tapDrill: '#43 (0.089")', metricSize: '2.84mm' },
    { type: 'UNC', size: '#6-32', tpi: 32, majorDiameter: '0.138"', minorDiameter: '0.0997"', tapDrill: '#36 (0.1065")', metricSize: '3.51mm' },
    { type: 'UNC', size: '#8-32', tpi: 32, majorDiameter: '0.164"', minorDiameter: '0.1257"', tapDrill: '#29 (0.136")', metricSize: '4.17mm' },
    { type: 'UNC', size: '#10-24', tpi: 24, majorDiameter: '0.190"', minorDiameter: '0.1389"', tapDrill: '#25 (0.1495")', metricSize: '4.83mm' },
    { type: 'UNC', size: '1/4-20', tpi: 20, majorDiameter: '0.250"', minorDiameter: '0.1887"', tapDrill: '#7 (0.201")', metricSize: '6.35mm' },
    { type: 'UNC', size: '5/16-18', tpi: 18, majorDiameter: '0.3125"', minorDiameter: '0.2443"', tapDrill: 'F (0.257")', metricSize: '7.94mm' },
    { type: 'UNC', size: '3/8-16', tpi: 16, majorDiameter: '0.375"', minorDiameter: '0.2983"', tapDrill: '5/16" (0.3125")', metricSize: '9.53mm' },
    { type: 'UNC', size: '1/2-13', tpi: 13, majorDiameter: '0.500"', minorDiameter: '0.4001"', tapDrill: '27/64" (0.4219")', metricSize: '12.70mm' },

    // UNF (Unified National Fine)
    { type: 'UNF', size: '#4-48', tpi: 48, majorDiameter: '0.112"', minorDiameter: '0.0864"', tapDrill: '#42 (0.0935")', metricSize: '2.84mm' },
    { type: 'UNF', size: '#6-40', tpi: 40, majorDiameter: '0.138"', minorDiameter: '0.1073"', tapDrill: '#33 (0.113")', metricSize: '3.51mm' },
    { type: 'UNF', size: '#8-36', tpi: 36, majorDiameter: '0.164"', minorDiameter: '0.1299"', tapDrill: '#29 (0.136")', metricSize: '4.17mm' },
    { type: 'UNF', size: '#10-32', tpi: 32, majorDiameter: '0.190"', minorDiameter: '0.1517"', tapDrill: '#21 (0.159")', metricSize: '4.83mm' },
    { type: 'UNF', size: '1/4-28', tpi: 28, majorDiameter: '0.250"', minorDiameter: '0.2062"', tapDrill: '#3 (0.213")', metricSize: '6.35mm' },
    { type: 'UNF', size: '5/16-24', tpi: 24, majorDiameter: '0.3125"', minorDiameter: '0.2614"', tapDrill: 'I (0.272")', metricSize: '7.94mm' },
    { type: 'UNF', size: '3/8-24', tpi: 24, majorDiameter: '0.375"', minorDiameter: '0.3239"', tapDrill: 'Q (0.332")', metricSize: '9.53mm' },
    { type: 'UNF', size: '1/2-20', tpi: 20, majorDiameter: '0.500"', minorDiameter: '0.4387"', tapDrill: '29/64" (0.4531")', metricSize: '12.70mm' },

    // Metric
    { type: 'Metric', size: 'M3', pitch: 0.5, majorDiameter: '3.00mm', minorDiameter: '2.39mm', tapDrill: '2.5mm' },
    { type: 'Metric', size: 'M4', pitch: 0.7, majorDiameter: '4.00mm', minorDiameter: '3.24mm', tapDrill: '3.3mm' },
    { type: 'Metric', size: 'M5', pitch: 0.8, majorDiameter: '5.00mm', minorDiameter: '4.13mm', tapDrill: '4.2mm' },
    { type: 'Metric', size: 'M6', pitch: 1.0, majorDiameter: '6.00mm', minorDiameter: '4.92mm', tapDrill: '5.0mm' },
    { type: 'Metric', size: 'M8', pitch: 1.25, majorDiameter: '8.00mm', minorDiameter: '6.65mm', tapDrill: '6.8mm' },
    { type: 'Metric', size: 'M10', pitch: 1.5, majorDiameter: '10.00mm', minorDiameter: '8.38mm', tapDrill: '8.5mm' },
    { type: 'Metric', size: 'M12', pitch: 1.75, majorDiameter: '12.00mm', minorDiameter: '10.11mm', tapDrill: '10.2mm' },
    { type: 'Metric', size: 'M16', pitch: 2.0, majorDiameter: '16.00mm', minorDiameter: '13.84mm', tapDrill: '14.0mm' },

    // BSPP (British Standard Pipe Parallel)
    { type: 'BSPP', size: 'G1/8" BSPP', tpi: 28, majorDiameter: '9.728mm', minorDiameter: '8.566mm', tapDrill: '8.8mm' },
    { type: 'BSPP', size: 'G1/4" BSPP', tpi: 19, majorDiameter: '13.157mm', minorDiameter: '11.445mm', tapDrill: '11.8mm' },
    { type: 'BSPP', size: 'G3/8" BSPP', tpi: 19, majorDiameter: '16.662mm', minorDiameter: '14.950mm', tapDrill: '15.2mm' },
    { type: 'BSPP', size: 'G1/2" BSPP', tpi: 14, majorDiameter: '20.955mm', minorDiameter: '18.631mm', tapDrill: '19.0mm' },
    { type: 'BSPP', size: 'G3/4" BSPP', tpi: 14, majorDiameter: '26.441mm', minorDiameter: '24.117mm', tapDrill: '24.5mm' },
    { type: 'BSPP', size: 'G1" BSPP', tpi: 11, majorDiameter: '33.249mm', minorDiameter: '30.291mm', tapDrill: '30.5mm' },
    { type: 'BSPP', size: 'G1-1/4" BSPP', tpi: 11, majorDiameter: '41.910mm', minorDiameter: '38.952mm', tapDrill: '39.0mm' },
    { type: 'BSPP', size: 'G1-1/2" BSPP', tpi: 11, majorDiameter: '47.803mm', minorDiameter: '44.845mm', tapDrill: '45.0mm' },
    { type: 'BSPP', size: 'G2" BSPP', tpi: 11, majorDiameter: '59.614mm', minorDiameter: '56.656mm', tapDrill: '57.0mm' },
    { type: 'BSPP', size: 'G2-1/2" BSPP', tpi: 11, majorDiameter: '75.184mm', minorDiameter: '72.226mm', tapDrill: '72.5mm' },
    { type: 'BSPP', size: 'G3" BSPP', tpi: 11, majorDiameter: '87.884mm', minorDiameter: '84.926mm', tapDrill: '85.0mm' },
    { type: 'BSPP', size: 'G4" BSPP', tpi: 11, majorDiameter: '113.030mm', minorDiameter: '110.072mm', tapDrill: '110.0mm' },

    // BSPT (British Standard Pipe Taper)
    { type: 'BSPT', size: 'R1/8" BSPT', tpi: 28, majorDiameter: '9.728mm', minorDiameter: '8.566mm', tapDrill: '8.6mm' },
    { type: 'BSPT', size: 'R1/4" BSPT', tpi: 19, majorDiameter: '13.157mm', minorDiameter: '11.445mm', tapDrill: '11.6mm' },
    { type: 'BSPT', size: 'R3/8" BSPT', tpi: 19, majorDiameter: '16.662mm', minorDiameter: '14.950mm', tapDrill: '15.0mm' },
    { type: 'BSPT', size: 'R1/2" BSPT', tpi: 14, majorDiameter: '20.955mm', minorDiameter: '18.631mm', tapDrill: '18.8mm' },
    { type: 'BSPT', size: 'R3/4" BSPT', tpi: 14, majorDiameter: '26.441mm', minorDiameter: '24.117mm', tapDrill: '24.3mm' },
    { type: 'BSPT', size: 'R1" BSPT', tpi: 11, majorDiameter: '33.249mm', minorDiameter: '30.291mm', tapDrill: '30.3mm' },
    { type: 'BSPT', size: 'R1-1/4" BSPT', tpi: 11, majorDiameter: '41.910mm', minorDiameter: '38.952mm', tapDrill: '39.0mm' },
    { type: 'BSPT', size: 'R1-1/2" BSPT', tpi: 11, majorDiameter: '47.803mm', minorDiameter: '44.845mm', tapDrill: '45.0mm' },
    { type: 'BSPT', size: 'R2" BSPT', tpi: 11, majorDiameter: '59.614mm', minorDiameter: '56.656mm', tapDrill: '57.0mm' },
    { type: 'BSPT', size: 'R2-1/2" BSPT', tpi: 11, majorDiameter: '75.184mm', minorDiameter: '72.226mm', tapDrill: '72.5mm' },
    { type: 'BSPT', size: 'R3" BSPT', tpi: 11, majorDiameter: '87.884mm', minorDiameter: '84.926mm', tapDrill: '85.0mm' },
    { type: 'BSPT', size: 'R4" BSPT', tpi: 11, majorDiameter: '113.030mm', minorDiameter: '110.072mm', tapDrill: '110.0mm' },
    { type: 'BSPT', size: 'R5" BSPT', tpi: 11, majorDiameter: '138.430mm', minorDiameter: '135.472mm', tapDrill: '135.5mm' },
    { type: 'BSPT', size: 'R6" BSPT', tpi: 11, majorDiameter: '163.830mm', minorDiameter: '160.872mm', tapDrill: '161.0mm' }
  ];

  const threadTypes: ThreadType[] = ['UNC', 'UNF', 'UNS', 'Metric', 'BSPP', 'BSPT', 'BSF', 'BSW', 'NPTF', 'NPT'];

  const filteredThreads = threadData.filter(thread => {
    const searchTerms = searchQuery.toLowerCase().split(' ');
    const threadInfo = [
      thread.size.toLowerCase(),
      thread.majorDiameter.toLowerCase(),
      thread.minorDiameter.toLowerCase(),
      thread.type.toLowerCase(),
      thread.metricSize?.toLowerCase() || '',
      thread.type === 'Metric' 
        ? `${thread.pitch}mm pitch`
        : `${thread.tpi} tpi ${(25.4 / (thread.tpi || 1)).toFixed(2)}mm pitch`,
      thread.tapDrill.toLowerCase()
    ].join(' ');

    return searchTerms.every(term => threadInfo.includes(term));
  });

  const renderThreadTable = (threads: ThreadData[]) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
            <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thread Spec</th>
            <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Major Ø</th>
            {threads[0]?.type !== 'Metric' && (
              <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Major Ø (Metric)</th>
            )}
            <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Minor Ø</th>
            <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tap Drill</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {threads.map((thread, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{thread.size}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {thread.type === 'Metric' ? (
                  <div>
                    <div className="font-medium">{thread.pitch}mm pitch</div>
                    <div className="text-xs text-gray-400">
                      {(25.4 / thread.pitch!).toFixed(1)} TPI
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="font-medium">{thread.tpi} TPI</div>
                    <div className="text-xs text-gray-400">
                      {(25.4 / thread.tpi!).toFixed(2)}mm pitch
                    </div>
                  </div>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{thread.majorDiameter}</td>
              {thread.type !== 'Metric' && (
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{thread.metricSize}</td>
              )}
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{thread.minorDiameter}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{thread.tapDrill}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-4">
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold mb-4">Thread Reference Guide</h2>
          <div className="flex flex-col space-y-4">
            {/* Regular Search */}
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search threads..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-base focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowIdentifier(!showIdentifier)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <Ruler className="w-5 h-5" />
                <span>Thread Identifier</span>
              </button>
            </div>

            {/* Thread Identifier Tool */}
            {showIdentifier && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">Thread Identifier</h3>
                
                {/* Search Mode Toggle */}
                <div className="flex space-x-2 mb-4">
                  <button
                    onClick={() => setSearchMode('major')}
                    className={`flex-1 py-2 px-4 rounded-lg ${
                      searchMode === 'major'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Male Thread (Major Ø)
                  </button>
                  <button
                    onClick={() => setSearchMode('minor')}
                    className={`flex-1 py-2 px-4 rounded-lg ${
                      searchMode === 'minor'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Female Thread (Minor Ø)
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Diameter Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {searchMode === 'major' ? 'Major' : 'Minor'} Diameter (mm)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={measurementInput.diameter}
                        onChange={(e) => handleDiameterInput(e.target.value)}
                        placeholder="Enter diameter in mm"
                        className="w-full p-2 border rounded-lg"
                        step="0.1"
                      />
                      {measurementInput.diameter && (
                        <div className="absolute right-0 top-full mt-1 text-sm text-gray-500">
                          ≈ {unitUtils.mmToInch(parseFloat(measurementInput.diameter)).toFixed(3)}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* TPI Input with Tolerance */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      TPI (optional)
                    </label>
                    <div className="space-y-2">
                      <input
                        type="number"
                        value={measurementInput.tpi}
                        onChange={(e) => setMeasurementInput(prev => ({
                          ...prev,
                          tpi: e.target.value
                        }))}
                        placeholder="Enter TPI..."
                        className="w-full p-2 border rounded-lg"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">TPI Tolerance: ±</span>
                        <input
                          type="number"
                          value={measurementInput.tpiTolerance}
                          onChange={(e) => setMeasurementInput(prev => ({
                            ...prev,
                            tpiTolerance: Math.max(0, parseInt(e.target.value))
                          }))}
                          className="w-16 p-1 border rounded text-center"
                          min="0"
                          step="1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tolerance Control */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diameter Tolerance (mm)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToleranceButton(false)}
                      className="p-1 rounded-lg hover:bg-gray-200"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <input
                      type="number"
                      value={measurementInput.tolerance}
                      onChange={(e) => setMeasurementInput(prev => ({
                        ...prev,
                        tolerance: Math.max(0.1, parseFloat(e.target.value))
                      }))}
                      onWheel={handleToleranceStep}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                          e.preventDefault();
                          handleToleranceStep(e);
                        }
                      }}
                      step="0.1"
                      className="w-20 p-2 border rounded-lg text-center"
                    />
                    <button
                      onClick={() => handleToleranceButton(true)}
                      className="p-1 rounded-lg hover:bg-gray-200"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    Use arrow keys or scroll for ±0.1mm, buttons for ±0.5mm
                  </div>
                </div>

                {/* Results */}
                {measurementInput.diameter && (
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Possible Matches:</h4>
                    {renderThreadTable(findSimilarThreads(parseFloat(measurementInput.diameter)))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4">
          <div className="space-y-4">
            {threadTypes.map(type => {
              const typeThreads = filteredThreads.filter(thread => thread.type === type);
              if (searchQuery && typeThreads.length === 0) return null;
              
              return (
                <div key={type} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedType(expandedType === type ? null : type)}
                    className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100"
                  >
                    <span className="font-medium">
                      {type === 'BSPT' ? 'British Pipe Thread (Whitworth Form) -- Taper (BSPT)' : 
                       type === 'BSPP' ? 'British Pipe Thread (Whitworth Form) -- Parallel (BSPP)' :
                       type === 'BSF' ? 'BSF Threads - (Fine)' :
                       type === 'BSW' ? 'British Standard Whitworth Coarse (BSW/WW)' :
                       type === 'NPTF' ? 'National Taper Pipe Dryseal (NPTF)' :
                       type === 'NPT' ? 'National Taper Pipe (NPT)' :
                       type === 'UNS' ? 'Unified National Special Thread (UNS)' :
                       `${type} Threads`}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 transform transition-transform ${
                        expandedType === type ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {expandedType === type && (
                    <div className="p-4">
                      {renderThreadTable(typeThreads)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}