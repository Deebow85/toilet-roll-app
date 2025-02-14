import React, { useState } from 'react';
import { Search, Ruler, Plus, X, Save, Folder, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';

type ThreadType = 'M' | 'MF' | 'Pg' | 'Tr' | 'UNC' | 'UNF' | 'UNS' | 'NPT' | 'NPTF' | 'BSW' | 'BSF' | 'BSPT' | 'BSPP' | 'ACME';

interface ThreadTypeInfo {
  name: string;
  order: number;
}

const THREAD_TYPE_INFO: Record<ThreadType, ThreadTypeInfo> = {
  M: { name: 'ISO metric thread (M)', order: 1 },
  MF: { name: 'ISO metric fine thread (MF)', order: 2 },
  Pg: { name: 'Steel conduit thread (Pg)', order: 3 },
  Tr: { name: 'Trapezoidal thread (Tr)', order: 4 },
  UNC: { name: 'Unified National Coarse Thread (UNC)', order: 5 },
  UNF: { name: 'Unified National Fine Thread (UNF)', order: 6 },
  UNS: { name: 'Unified National Special Thread (UNS)', order: 7 },
  NPT: { name: 'National Taper Pipe (NPT)', order: 8 },
  NPTF: { name: 'National Taper Pipe Dryseal (NPTF)', order: 9 },
  BSW: { name: 'British Standard Whitworth Coarse (BSW/WW)', order: 10 },
  BSF: { name: 'British Standard Fine (BSF)', order: 11 },
  BSPT: { name: 'British Standard Pipe Taper (BSPT/R)', order: 12 },
  BSPP: { name: 'British Standard Pipe Parallel (BSPP)', order: 13 },
  ACME: { name: 'Trapezoidal Thread (ACME)', order: 14 }
};

interface ThreadData {
  id: string;
  size: string;
  type: ThreadType;
  tpi?: number;
  pitch?: number;
  majorDiameter: string;
  minorDiameter: string;
  tapDrill: string;
  clearanceDrill: string;
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
  parseSize: (size: string): number => {
    // Remove any non-numeric characters except decimal points and fractions
    if (size.includes('/')) {
      // Convert fractional inches to mm
      const [num, denom] = size.split('/').map(parseFloat); 
      return (num / denom) * 25.4;
    }
    // Convert string measurements to mm for comparison
    if (size.includes('"')) {
      return parseFloat(size) * 25.4;
    }
    // Already in mm
    return parseFloat(size);
  }
};

export default function Threads() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<ThreadType[]>([]);
  const [showMetric, setShowMetric] = useState(true);
  const [threads, setThreads] = useState<ThreadData[]>(() => {
    const stored = localStorage.getItem('threadData');
    return stored ? JSON.parse(stored) : [];
  });
  const [showIdentifier, setShowIdentifier] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchMode, setSearchMode] = useState<'major' | 'minor'>('major');
  const [newThread, setNewThread] = useState<Partial<ThreadData>>({
    type: 'Metric'
  });
  const [detectedThread, setDetectedThread] = useState<ThreadData | null>(null);
  const [measurementInput, setMeasurementInput] = useState({
    diameter: '',
    tpi: '',
    tpiTolerance: 2,
    tolerance: 0.5
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<ThreadData | null>(null);

  const handleDiameterInput = (value: string) => {
    setMeasurementInput(prev => ({
      ...prev,
      diameter: value
    }));
    
    // Auto-detect thread from diameter
    if (value) {
      const diameter = parseFloat(value);
      const tolerance = measurementInput.tolerance;
      const tpi = measurementInput.tpi ? parseFloat(measurementInput.tpi) : null;
      const tpiTolerance = measurementInput.tpiTolerance;
      
      // Find matching threads by diameter and optionally TPI
      const matches = threads.filter(thread => {
        try {
          // Get the relevant diameter based on search mode
          const threadDiameter = unitUtils.getDiameterValue(
            searchMode === 'minor' ? thread.minorDiameter : thread.majorDiameter
          );
          
          // Check if diameter is within tolerance
          const diameterMatch = Math.abs(threadDiameter - diameter) <= tolerance;
          
          if (!diameterMatch) return false;
          
          // If TPI is provided, check that too
          if (tpi !== null) {
            const threadTPI = thread.type === 'Metric'
              ? 25.4 / thread.pitch!
              : thread.tpi!;
            
            return Math.abs(threadTPI - tpi) <= tpiTolerance;
          }
          
          return true;
        } catch (e) {
          console.warn('Error parsing thread:', thread, e);
          return false;
        }
      });
      
      // Use the closest match if multiple are found
      if (matches.length > 0) {
        const closestMatch = matches.reduce((closest, current) => {
          const closestDia = unitUtils.getDiameterValue(
            searchMode === 'minor' ? closest.minorDiameter : closest.majorDiameter
          );
          const currentDia = unitUtils.getDiameterValue(
            searchMode === 'minor' ? current.minorDiameter : current.majorDiameter
          );
          
          const closestDiff = Math.abs(closestDia - diameter);
          const currentDiff = Math.abs(currentDia - diameter);
          
          return currentDiff < closestDiff ? current : closest;
        });
        
        setDetectedThread(closestMatch);
      } else {
        setDetectedThread(null);
      }
    }
  };

  // Handle TPI input changes
  const handleTPIInput = (value: string) => {
    setMeasurementInput(prev => ({
      ...prev,
      tpi: value
    }));
    
    // Re-run diameter detection with new TPI value
    if (measurementInput.diameter) {
      handleDiameterInput(measurementInput.diameter);
    }
  };

  // Save threads to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('threadData', JSON.stringify(threads));
  }, [threads]);

  const handleAddThread = () => {
    if (!newThread.size || !newThread.majorDiameter || !newThread.minorDiameter || !newThread.tapDrill || !newThread.clearanceDrill || (!newThread.pitch && !newThread.tpi)) {
      return;
    }

    // Convert TPI to pitch or vice versa if only one is provided
    let pitch = newThread.pitch;
    let tpi = newThread.tpi;
    
    if (pitch && !tpi) {
      tpi = Math.round(25.4 / pitch);
    } else if (tpi && !pitch) {
      pitch = Number((25.4 / tpi).toFixed(3));
    }

    const threadData: ThreadData = {
      id: `thread-${Date.now()}`,
      size: newThread.size,
      type: newThread.type as ThreadType,
      tpi,
      pitch,
      majorDiameter: newThread.majorDiameter,
      minorDiameter: newThread.minorDiameter,
      tapDrill: newThread.tapDrill,
      clearanceDrill: newThread.clearanceDrill,
      metricSize: newThread.metricSize
    };

    setThreads(prev => [...prev, threadData]);
    setNewThread({ type: 'Metric' });
    setShowAddModal(false);
  };

  const handleDeleteClick = (thread: ThreadData, e: React.MouseEvent) => {
    e.stopPropagation();
    setThreadToDelete(thread);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (threadToDelete) {
      setThreads(prev => prev.filter(t => t.id !== threadToDelete.id));
      setShowDeleteModal(false);
      setThreadToDelete(null);
    }
  };

  const filteredThreads = threads.filter(thread => {
    if (!searchQuery) return true;
    
    const searchTerms = searchQuery.toLowerCase().split(' ');
    const threadInfo = [
      thread.size.toLowerCase(),
      thread.type.toLowerCase(),
      thread.majorDiameter.toLowerCase(),
      thread.minorDiameter.toLowerCase(),
      thread.tapDrill.toLowerCase(),
      thread.metricSize?.toLowerCase() || '',
      thread.tpi?.toString() || '',
      thread.pitch?.toString() || ''
    ].join(' ');

    return searchTerms.every(term => threadInfo.includes(term));
  });

  // Group threads by type
  const threadsByType = filteredThreads.reduce((acc, thread) => {
    if (!acc[thread.type]) {
      acc[thread.type] = [];
    }
    acc[thread.type].push(thread);
    return acc;
  }, {} as Record<ThreadType, ThreadData[]>);

  // Sort thread types by their defined order
  const sortedThreadTypes = Object.entries(threadsByType).sort((a, b) => 
    (THREAD_TYPE_INFO[a[0] as ThreadType]?.order || 0) - (THREAD_TYPE_INFO[b[0] as ThreadType]?.order || 0)
  );

  const toggleFolder = (type: ThreadType) => {
    setExpandedFolders(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const renderThreadTable = (threads: ThreadData[]) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
            <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thread Spec</th>
            <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Major Ø</th>
            <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Minor Ø</th>
            <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tap Drill</th>
            <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clearance</th>
            <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {threads.map(thread => (
            <tr key={thread.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{thread.size}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {thread.type === 'Metric' ? (
                  <div>
                    <div className="font-medium">{thread.pitch?.toFixed(1)}mm pitch</div>
                    <div className="text-xs text-gray-400">
                      {thread.tpi} TPI
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="font-medium">{thread.tpi} TPI</div>
                    <div className="text-xs text-gray-400">
                      {thread.pitch?.toFixed(1)}mm pitch
                    </div>
                  </div>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {thread.type === 'Metric' ? (
                  <div>
                    <div className="font-medium">{thread.majorDiameter}</div>
                    {!showMetric && thread.majorDiameter.includes('mm') && (
                      <div className="text-xs text-gray-400">
                        ≈ {unitUtils.mmToInch(parseFloat(thread.majorDiameter)).toFixed(3)}"
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="font-medium">{thread.majorDiameter}</div>
                    {showMetric && (
                      <div className="text-xs text-gray-400">
                        {unitUtils.inchToMm(parseFloat(thread.majorDiameter))}mm
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {thread.type === 'Metric' ? (
                  <div>
                    <div className="font-medium">{thread.minorDiameter}</div>
                    {!showMetric && thread.minorDiameter.includes('mm') && (
                      <div className="text-xs text-gray-400">
                        ≈ {unitUtils.mmToInch(parseFloat(thread.minorDiameter)).toFixed(3)}"
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="font-medium">{thread.minorDiameter}</div>
                    {showMetric && (
                      <div className="text-xs text-gray-400">
                        {unitUtils.inchToMm(parseFloat(thread.minorDiameter))}mm
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{thread.tapDrill}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{thread.clearanceDrill}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <button
                  onClick={(e) => handleDeleteClick(thread, e)}
                  className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                  title="Delete thread"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-4">
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Thread Reference Guide</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-5 h-5" />
              <span>Add Thread</span>
            </button>
          </div>
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
                onClick={() => setShowMetric(!showMetric)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                <span>{showMetric ? 'Show Imperial' : 'Show Metric'}</span>
              </button>
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
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
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
                  {/* Diameter Input with Conversion */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">Diameter Tolerance: ±</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={measurementInput.tolerance}
                            onChange={(e) => setMeasurementInput(prev => ({
                              ...prev,
                              tolerance: Math.max(0.1, parseFloat(e.target.value))
                            }))}
                            className="w-16 p-1 border rounded text-center"
                            min="0.1"
                            step="0.1"
                          />
                          <span className="text-sm text-gray-500">mm</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        value={measurementInput.tolerance}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          setMeasurementInput(prev => ({
                            ...prev,
                            tolerance: value
                          }));
                          // Re-run detection with new tolerance
                          if (measurementInput.diameter) {
                            handleDiameterInput(measurementInput.diameter);
                          }
                        }}
                        min="0.1"
                        max="2"
                        step="0.1"
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>±0.1mm</span>
                        <span>±2.0mm</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Detected Thread Info */}
                  {searchMode === 'minor' && detectedThread && (
                    <div className="col-span-2 mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="text-sm font-medium text-green-800 mb-2">Detected Thread:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <span className="text-sm text-green-600">Size:</span>
                          <span className="ml-2 font-medium">{detectedThread.size}</span>
                        </div>
                        <div>
                          <span className="text-sm text-green-600">Type:</span>
                          <span className="ml-2 font-medium">{detectedThread.type}</span>
                        </div>
                        <div>
                          <span className="text-sm text-green-600">Thread Spec:</span>
                          <span className="ml-2 font-medium">
                            {detectedThread.type === 'Metric'
                              ? `${detectedThread.pitch}mm pitch`
                              : `${detectedThread.tpi} TPI`}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-green-600">Major Diameter:</span>
                          <span className="ml-2 font-medium">{detectedThread.majorDiameter}</span>
                        </div>
                        <div>
                          <span className="text-sm text-green-600">Minor Diameter:</span>
                          <span className="ml-2 font-medium">{detectedThread.minorDiameter}</span>
                        </div>
                        <div>
                          <span className="text-sm text-green-600">Tap Drill:</span>
                          <span className="ml-2 font-medium">{detectedThread.tapDrill}</span>
                        </div>
                        <div>
                          <span className="text-sm text-green-600">Clearance:</span>
                          <span className="ml-2 font-medium">{detectedThread.clearanceDrill}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TPI Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thread Pitch (optional)
                    </label>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input
                            type="number"
                            value={measurementInput.tpi}
                            onChange={(e) => handleTPIInput(e.target.value)}
                            placeholder="Enter TPI..."
                            className="w-full p-2 border rounded-lg"
                          />
                          <div className="mt-1 text-xs text-gray-500">
                            {measurementInput.tpi && `${(25.4 / parseFloat(measurementInput.tpi)).toFixed(2)}mm pitch`}
                          </div>
                        </div>
                        <div>
                          <input
                            type="number"
                            value={measurementInput.tpi ? (25.4 / parseFloat(measurementInput.tpi)).toFixed(2) : ''}
                            onChange={(e) => {
                              const pitch = parseFloat(e.target.value);
                              if (!isNaN(pitch) && pitch > 0) {
                                handleTPIInput((25.4 / pitch).toFixed(0));
                              }
                            }}
                            placeholder="Enter mm pitch..."
                            className="w-full p-2 border rounded-lg"
                            step="0.01"
                          />
                          <div className="mt-1 text-xs text-gray-500">
                            {measurementInput.tpi && `${measurementInput.tpi} TPI`}
                          </div>
                        </div>
                      </div>
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
                        <span className="text-sm text-gray-500">TPI (±{(25.4 / (parseFloat(measurementInput.tpi || '0') + measurementInput.tpiTolerance) - 25.4 / (parseFloat(measurementInput.tpi || '0') - measurementInput.tpiTolerance)).toFixed(2)}mm pitch)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Thread Folders */}
          {Object.entries(threadsByType).length > 0 && (
            <div className="mt-6 space-y-4">
              {sortedThreadTypes.map(([type, typeThreads]) => (
                <div key={type} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleFolder(type as ThreadType)}
                    className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <Folder className="w-5 h-5 text-indigo-500" />
                      <span className="font-medium">
                        {THREAD_TYPE_INFO[type as ThreadType]?.name || type}
                      </span>
                      <span className="text-sm text-gray-500">({typeThreads.length})</span>
                    </div>
                    {expandedFolders.includes(type as ThreadType) ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  {expandedFolders.includes(type as ThreadType) && (
                    <div className="p-4">
                      {renderThreadTable(typeThreads)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {filteredThreads.length === 0 && searchQuery && (
            <div className="mt-6 text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No threads found matching your search.</p>
            </div>
          )}

          {filteredThreads.length === 0 && !searchQuery && (
            <div className="mt-6 text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No threads added yet. Click "Add Thread" to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Thread Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Add New Thread</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thread Size
                </label>
                <input
                  type="text"
                  value={newThread.size || ''}
                  onChange={(e) => setNewThread(prev => ({ ...prev, size: e.target.value }))}
                  placeholder="e.g., M8, 1/4-20"
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thread Type
                </label>
                <select
                  value={newThread.type}
                  onChange={(e) => setNewThread(prev => ({ ...prev, type: e.target.value as ThreadType }))}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="M">M - ISO metric thread (M)</option>
                  <option value="MF">MF - ISO metric fine thread (MF)</option>
                  <option value="Pg">Pg - Steel conduit thread (Pg)</option>
                  <option value="Tr">Tr - Trapezoidal thread (Tr)</option>
                  <option value="UNC">UNC - Unified National Coarse Thread</option>
                  <option value="UNF">UNF - Unified National Fine Thread</option>
                  <option value="UNS">UNS - Unified National Special Thread</option>
                  <option value="NPT">NPT - National Taper Pipe</option>
                  <option value="NPTF">NPTF - National Taper Pipe Dryseal</option>
                  <option value="BSW">BSW - British Standard Whitworth Coarse</option>
                  <option value="BSF">BSF - British Standard Fine</option>
                  <option value="BSPT">BSPT - British Standard Pipe Taper</option>
                  <option value="BSPP">BSPP - British Standard Pipe Parallel</option>
                  <option value="ACME">ACME - Trapezoidal Thread</option>
                </select>
              </div>

              {(newThread.type === 'M' || newThread.type === 'MF' || newThread.type === 'Pg' || newThread.type === 'Tr') ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thread Pitch (mm) or TPI
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={newThread.pitch || ''}
                      onChange={(e) => {
                        const pitch = parseFloat(e.target.value);
                        setNewThread(prev => ({
                          ...prev,
                          pitch,
                          tpi: pitch ? Math.round(25.4 / pitch) : undefined
                        }));
                      }}
                      step="0.1"
                      placeholder="mm pitch (e.g., 1.0)"
                      className="w-full p-2 border rounded-lg"
                    />
                    <input
                      type="number"
                      value={newThread.tpi || ''}
                      onChange={(e) => {
                        const tpi = parseInt(e.target.value);
                        setNewThread(prev => ({
                          ...prev,
                          tpi,
                          pitch: tpi ? Number((25.4 / tpi).toFixed(3)) : undefined
                        }));
                      }}
                      placeholder="TPI (e.g., 20)"
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  {newThread.pitch && newThread.tpi && (
                    <div className="mt-1 text-xs text-gray-500 flex justify-between">
                      <span>{newThread.pitch.toFixed(1)}mm pitch</span>
                      <span>{newThread.tpi} TPI</span>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    TPI or Thread Pitch (mm)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={newThread.tpi || ''}
                      onChange={(e) => {
                        const tpi = parseInt(e.target.value);
                        setNewThread(prev => ({
                          ...prev,
                          tpi,
                          pitch: tpi ? Number((25.4 / tpi).toFixed(3)) : undefined
                        }));
                      }}
                      placeholder="TPI (e.g., 20)"
                      className="w-full p-2 border rounded-lg"
                    />
                    <input
                      type="number"
                      value={newThread.pitch || ''}
                      onChange={(e) => {
                        const pitch = parseFloat(e.target.value);
                        setNewThread(prev => ({
                          ...prev,
                          pitch,
                          tpi: pitch ? Math.round(25.4 / pitch) : undefined
                        }));
                      }}
                      step="0.1"
                      placeholder="mm pitch (e.g., 1.0)"
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  {newThread.pitch && newThread.tpi && (
                    <div className="mt-1 text-xs text-gray-500 flex justify-between">
                      <span>{newThread.tpi} TPI</span>
                      <span>{newThread.pitch.toFixed(1)}mm pitch</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Major Diameter
                </label>
                <input
                  type="text"
                  value={newThread.majorDiameter || ''}
                  onChange={(e) => setNewThread(prev => ({ ...prev, majorDiameter: e.target.value }))}
                  placeholder="e.g., 8mm or 0.250 inch"
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minor Diameter
                </label>
                <input
                  type="text"
                  value={newThread.minorDiameter || ''}
                  onChange={(e) => setNewThread(prev => ({ ...prev, minorDiameter: e.target.value }))}
                  placeholder="e.g., 6.647mm or 0.196 inch"
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tap Drill Size
                </label>
                <input
                  type="text"
                  value={newThread.tapDrill || ''}
                  onChange={(e) => setNewThread(prev => ({ ...prev, tapDrill: e.target.value }))}
                  placeholder="e.g., 6.8mm or #29"
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clearance Drill Size
                </label>
                <input
                  type="text"
                  value={newThread.clearanceDrill || ''}
                  onChange={(e) => setNewThread(prev => ({ ...prev, clearanceDrill: e.target.value }))}
                  placeholder="e.g., 8.5mm or 17/64 inch"
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              {!newThread.type.includes('Metric') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Metric Equivalent (optional)
                  </label>
                  <input
                    type="text"
                    value={newThread.metricSize || ''}
                    onChange={(e) => setNewThread(prev => ({ ...prev, metricSize: e.target.value }))}
                    placeholder="e.g., 6.35mm"
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddThread}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add Thread
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Delete Thread</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="mb-4">
              Are you sure you want to delete this thread? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}