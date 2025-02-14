import React, { useState, useMemo } from 'react';
import { ArrowDown, ArrowRight, Settings, Wind, X } from 'lucide-react';

interface TensionPoint {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'tension' | 'speed' | 'spreader' | 'dancer';
  showDataBox?: boolean;
  mpm?: number;
  percentage?: number;
  showMpmOnly?: boolean;
  kg?: number;
  showKg?: boolean;
  isReference?: boolean;
}

interface TensionIndicator {
  startPoint: TensionPoint;
  endPoint: TensionPoint;
  difference: number;
}

export default function TensionVisualization() {
  const [tensionPoints, setTensionPoints] = useState<TensionPoint[]>([
    // Outfeed section
    { id: 'outfeed', name: 'Outfeed Draw Roll', x: 100, y: 200, type: 'tension', showDataBox: true, mpm: 450, percentage: 95 },
    { id: 'infeed', name: 'Infeed Draw Roll', x: 180, y: 200, type: 'tension', showDataBox: true, mpm: 450, percentage: 95 },
    
    // Post-marriage section
    { id: 'rewind_spreader', name: 'Rewind Spreader', x: 260, y: 200, type: 'spreader', showDataBox: true, mpm: 450, percentage: 95, isReference: true },
    { id: 'coater_draw', name: 'Coater Draw', x: 340, y: 200, type: 'tension', showDataBox: true, mpm: 450, percentage: 95 },
    { id: 'coater_spreader', name: 'Coater Spreader', x: 420, y: 200, type: 'spreader', showDataBox: true, mpm: 450, percentage: 95, isReference: true },
    { id: 'upper_feed_draw', name: 'Upper Feed Draw', x: 500, y: 200, type: 'tension', showDataBox: true, mpm: 450, percentage: 95 },
    
    // Marriage section
    { id: 'marriage', name: 'Marriage Roll', x: 580, y: 200, type: 'speed', showDataBox: false, isReference: true },
    
    // Pre-marriage section - Top row
    { id: 'steel_top', name: 'Upper Steel Roll', x: 660, y: 100, type: 'speed', showDataBox: true, mpm: 450, showMpmOnly: true },
    { id: 'spreader_top', name: 'Upper Spreader', x: 740, y: 100, type: 'spreader', showDataBox: true, mpm: 450, percentage: 95, isReference: true },
    { id: 'draw_top', name: 'Top Draw Roll', x: 820, y: 100, type: 'tension', showDataBox: true, mpm: 450, percentage: 95, kg: 2.5, showKg: true },
    { id: 'dancer_top', name: 'Top Dancer', x: 900, y: 100, type: 'dancer', showDataBox: true, kg: 2.5, isReference: true },
    { id: 'unwind1', name: 'Unwind 2', x: 980, y: 100, type: 'tension', showDataBox: true, mpm: 450, percentage: 95 },
    
    // Pre-marriage section - Bottom row
    { id: 'steel_bottom', name: 'Lower Steel Roll', x: 660, y: 300, type: 'speed', showDataBox: true, mpm: 450, showMpmOnly: true },
    { id: 'spreader_bottom', name: 'Lower Spreader', x: 740, y: 300, type: 'spreader', showDataBox: true, mpm: 450, percentage: 95, isReference: true },
    { id: 'draw_bottom', name: 'Bottom Draw Roll', x: 820, y: 300, type: 'tension', showDataBox: true, mpm: 450, percentage: 95, kg: 2.5, showKg: true },
    { id: 'dancer_bottom', name: 'Bottom Dancer', x: 900, y: 300, type: 'dancer', showDataBox: true, kg: 2.5, isReference: true },
    { id: 'unwind2', name: 'Unwind 1', x: 980, y: 300, type: 'tension', showDataBox: true, mpm: 450, percentage: 95 }
  ]);

  const [selectedDataBox, setSelectedDataBox] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ mpm?: number; percentage?: number; kg?: number }>({});

  const handlePointClick = (e: React.MouseEvent, point: TensionPoint) => {
    e.stopPropagation();
    setSelectedDataBox(point.id);
    setEditValues({
      mpm: point.mpm,
      percentage: point.percentage,
      kg: point.kg
    });
  };

  const handleDataBoxValueChange = (field: 'mpm' | 'percentage' | 'kg', value: string) => {
    const newValue = value === '' ? 0 : parseFloat(value);
    if (isNaN(newValue)) return;

    setEditValues(prev => ({
      ...prev,
      [field]: newValue
    }));
  };

  const handleSaveChanges = () => {
    if (!selectedDataBox) return;

    setTensionPoints(points =>
      points.map(p =>
        p.id === selectedDataBox
          ? { 
              ...p, 
              ...(p.type === 'dancer' 
                ? { kg: editValues.kg }
                : { 
                    mpm: editValues.mpm, 
                    percentage: editValues.percentage,
                    ...(p.showKg ? { kg: editValues.kg } : {})
                  }
              )
            }
          : p
      )
    );
    setSelectedDataBox(null);
  };

  const getPointIcon = (type: TensionPoint['type']) => {
    switch (type) {
      case 'tension':
      case 'dancer':
        return <Wind className="w-5 h-5" />;
      case 'speed':
        return <ArrowRight className="w-5 h-5" />;
      case 'spreader':
        return <ArrowDown className="w-5 h-5" />;
    }
  };

  const getDataBoxPosition = (point: TensionPoint) => {
    if (point.y === 200) {
      return { x: 0, y: -55 };
    }
    if (point.y === 100) {
      return { x: 0, y: -45 };
    }
    if (point.y === 300) {
      return { x: 0, y: 55 };
    }
    return { x: 0, y: 0 };
  };

  const getComponentNamePosition = (point: TensionPoint) => {
    if (point.name === 'Marriage Roll') {
      return { x: 30, y: 0 }; // Position text to the right of the symbol
    }
    if (point.name === 'Lower Steel Roll' || point.name === 'Bottom Draw Roll') {
      return { y: -45 };
    }
    const specialCases = ['Unwind 1', 'Bottom Dancer', 'Lower Spreader'];
    if (specialCases.includes(point.name)) {
      return { y: -40 };
    }
    return { y: 30 };
  };

  const tensionIndicators = useMemo(() => {
    const indicators: TensionIndicator[] = [];
    
    // Helper function to find connected points
    const findConnectedPoints = () => {
      // Top path (Unwind 2 to Upper Feed Draw)
      const topPath = [
        { start: 'unwind1', end: 'draw_top' },
        { start: 'draw_top', end: 'steel_top' },
        { start: 'steel_top', end: 'upper_feed_draw' }
      ];

      // Bottom path (Unwind 1 to Upper Feed Draw)
      const bottomPath = [
        { start: 'unwind2', end: 'draw_bottom' },
        { start: 'draw_bottom', end: 'steel_bottom' },
        { start: 'steel_bottom', end: 'upper_feed_draw' }
      ];

      // Main path (Upper Feed Draw to Outfeed)
      const mainPath = [
        { start: 'upper_feed_draw', end: 'coater_draw' },
        { start: 'coater_draw', end: 'infeed' },
        { start: 'infeed', end: 'outfeed' }
      ];

      return [...topPath, ...bottomPath, ...mainPath];
    };

    // Create tension indicators for each connection
    findConnectedPoints().forEach(connection => {
      const startPoint = tensionPoints.find(p => p.id === connection.start);
      const endPoint = tensionPoints.find(p => p.id === connection.end);

      if (startPoint?.mpm && endPoint?.mpm) {
        indicators.push({
          startPoint,
          endPoint,
          difference: endPoint.mpm - startPoint.mpm
        });
      }
    });

    return indicators;
  }, [tensionPoints]);

  const getTensionLineStyle = (difference: number) => {
    const absValue = Math.abs(difference);
    const maxDiff = 50; // Maximum expected difference for scaling
    const normalizedThickness = Math.min(absValue / maxDiff * 3, 3); // Scale thickness up to 3px
    
    return {
      stroke: difference > 0 ? '#22c55e' : '#ef4444', // green for tension, red for slack
      strokeWidth: Math.max(normalizedThickness, 0.5),
      strokeDasharray: 'none', // Remove minimum difference check for dashed lines
      opacity: Math.min(Math.max(absValue / maxDiff, 0.3), 0.8) // Opacity based on difference
    };
  };

  const getTensionLabelPosition = (start: TensionPoint, end: TensionPoint) => {
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    
    // Special handling for bottom row connections
    if (
      (start.id === 'unwind2' && end.id === 'draw_bottom') ||
      (start.id === 'draw_bottom' && end.id === 'steel_bottom')
    ) {
      return { x: midX, y: midY + 35 }; // Position below the symbols
    }
    
    // Default positioning for other connections
    let yOffset = -10;
    
    if (start.y === 200 || end.y === 200) {
      yOffset = -25;
    } else if (start.y === 100 && end.y === 100) {
      yOffset = -20;
    } else if (start.y === 300 && end.y === 300) {
      yOffset = -20;
    } else {
      yOffset = -30;
    }
    
    return { x: midX, y: midY + yOffset };
  };

  const renderConnectionPaths = () => {
    const paths = [
      // Top path (Unwind 2 to Upper Feed Draw)
      'M980,100 H900 H820 H740 H660 L580,200',
      
      // Bottom path (Unwind 1 to Upper Feed Draw)
      'M980,300 H900 H820 H740 H660 L580,200',
      
      // Main path (Upper Feed Draw to Outfeed)
      'M580,200 H500 H420 H340 H260 H180 H100'
    ];

    return paths.map((d, i) => (
      <path
        key={`connection-${i}`}
        d={d}
        stroke="#94a3b8"
        strokeWidth="2"
        fill="none"
        strokeDasharray="4 2"
        className="opacity-50"
      />
    ));
  };

  return (
    <div className="relative w-full overflow-x-auto">
      <div className="min-w-[1050px]">
        <svg
          width="1050"
          height="400"
          viewBox="0 0 1050 400"
          className="border rounded-lg bg-white"
        >
          {/* Connection Paths */}
          {renderConnectionPaths()}

          {/* Tension Indicators */}
          {tensionIndicators.map((indicator, index) => {
            const style = getTensionLineStyle(indicator.difference);
            const labelPos = getTensionLabelPosition(indicator.startPoint, indicator.endPoint);
            const isTension = indicator.difference > 0;
            
            return (
              <g key={`tension-${index}`} className="tension-indicator">
                <path
                  d={`M${indicator.startPoint.x},${indicator.startPoint.y} L${indicator.endPoint.x},${indicator.endPoint.y}`}
                  stroke={style.stroke}
                  strokeWidth={style.strokeWidth}
                  strokeDasharray={style.strokeDasharray}
                  opacity={style.opacity}
                  fill="none"
                />
                {/* Show values for all differences */}
                <rect
                  x={labelPos.x - 35}
                  y={labelPos.y - 8}
                  width="70"
                  height="16"
                  fill="white"
                  opacity="0.9"
                  rx="3"
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  className={`text-[10px] font-medium ${
                    isTension ? 'fill-green-600' : 'fill-red-600'
                  }`}
                >
                  {isTension ? '+' : ''}{indicator.difference} MPM {isTension ? 'T' : 'S'}
                </text>
              </g>
            );
          })}

          {/* Perforating line */}
          <line
            x1="140"
            y1="160"
            x2="140"
            y2="240"
            stroke="#ef4444"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          
          {/* Bedroll/Winding arrow */}
          <path
            d="M80,200 H50"
            stroke="#22c55e"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
            fill="none"
          />
          
          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="180"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
            </marker>
          </defs>
          
          {/* Labels */}
          <text x="65" y="190" textAnchor="end" className="text-xs fill-green-600">
            Bedroll
          </text>

          {/* Points and Data Boxes */}
          {tensionPoints.map(point => (
            <g key={point.id}>
              {/* Data Box */}
              {point.showDataBox && (
                <g 
                  transform={`translate(${point.x + getDataBoxPosition(point).x}, ${point.y + getDataBoxPosition(point).y})`}
                >
                  <rect
                    x="-40"
                    y={point.showKg ? "-25" : "-15"}
                    width="80"
                    height={point.showKg ? "45" : "25"}
                    rx="4"
                    fill={selectedDataBox === point.id ? '#e0e7ff' : '#f8fafc'}
                    stroke={selectedDataBox === point.id ? '#6366f1' : '#e2e8f0'}
                  />
                  {/* Value display */}
                  {point.type === 'dancer' ? (
                    <text
                      x="0"
                      y="0"
                      textAnchor="middle"
                      className="text-[11px] fill-gray-700 font-medium"
                    >
                      {point.kg} KG
                    </text>
                  ) : (
                    <>
                      <text
                        x="0"
                        y="-10"
                        textAnchor="middle"
                        className="text-[11px] fill-gray-700 font-medium"
                      >
                        {point.mpm} MPM
                      </text>
                      {!point.showMpmOnly && point.percentage && (
                        <text
                          x="0"
                          y="5"
                          textAnchor="middle"
                          className="text-[11px] fill-gray-700 font-medium"
                        >
                          {point.percentage}%
                        </text>
                      )}
                      {point.showKg && (
                        <text
                          x="0"
                          y="20"
                          textAnchor="middle"
                          className="text-[11px] fill-gray-700 font-medium"
                        >
                          {point.kg} KG
                        </text>
                      )}
                    </>
                  )}
                </g>
              )}

              {/* Point Circle and Icon */}
              <g transform={`translate(${point.x},${point.y})`}>
                {/* Component name with updated positioning */}
                {point.name.split(' ').map((word, i, arr) => {
                  const position = getComponentNamePosition(point);
                  return (
                    <text
                      key={i}
                      x={position.x || 0}
                      y={position.y + i * 12}
                      textAnchor={position.x ? "start" : "middle"}
                      className={`text-[10px] ${point.isReference ? 'fill-amber-600' : 'fill-gray-600'}`}
                    >
                      {word}
                    </text>
                  );
                })}

                {/* Background circle */}
                <circle
                  r="16"
                  fill={point.isReference ? '#fef3c7' : '#f1f5f9'}
                  stroke={point.isReference ? '#d97706' : '#94a3b8'}
                  strokeWidth="2"
                  className="cursor-pointer"
                  onClick={(e) => handlePointClick(e, point)}
                />
                
                {/* Icon */}
                <foreignObject 
                  x="-10" 
                  y="-10" 
                  width="20" 
                  height="20" 
                  className="cursor-pointer"
                  onClick={(e) => handlePointClick(e, point)}
                >
                  <div className={`flex items-center justify-center w-full h-full ${
                    point.isReference ? 'text-amber-600' : 'text-gray-600'
                  }`}>
                    {getPointIcon(point.type)}
                  </div>
                </foreignObject>
              </g>
            </g>
          ))}
        </svg>
      </div>

      {/* Control Panel Modal */}
      {selectedDataBox && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5" />
                {tensionPoints.find(p => p.id === selectedDataBox)?.name} Settings
              </h3>
              <button
                onClick={() => setSelectedDataBox(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {tensionPoints.find(p => p.id === selectedDataBox)?.type === 'dancer' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (KG)
                  </label>
                  <input
                    type="number"
                    value={editValues.kg || 0}
                    onChange={(e) => handleDataBoxValueChange('kg', e.target.value)}
                    className="w-full p-2 border rounded-lg"
                    step="0.1"
                    min="0"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Speed (MPM)
                    </label>
                    <input
                      type="number"
                      value={editValues.mpm || 0}
                      onChange={(e) => handleDataBoxValueChange('mpm', e.target.value)}
                      className="w-full p-2 border rounded-lg"
                      step="1"
                      min="0"
                    />
                  </div>

                  {!tensionPoints.find(p => p.id === selectedDataBox)?.showMpmOnly && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Percentage (%)
                      </label>
                      <input
                        type="number"
                        value={editValues.percentage || 0}
                        onChange={(e) => handleDataBoxValueChange('percentage', e.target.value)}
                        className="w-full p-2 border rounded-lg"
                        step="1"
                        min="0"
                        max="100"
                      />
                    </div>
                  )}

                  {tensionPoints.find(p => p.id === selectedDataBox)?.showKg && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Weight (KG)
                      </label>
                      <input
                        type="number"
                        value={editValues.kg || 0}
                        onChange={(e) => handleDataBoxValueChange('kg', e.target.value)}
                        className="w-full p-2 border rounded-lg"
                        step="0.1"
                        min="0"
                      />
                    </div>
                  )}
                </>
              )}

              <div className="pt-4 flex justify-end space-x-2">
                <button
                  onClick={() => setSelectedDataBox(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}