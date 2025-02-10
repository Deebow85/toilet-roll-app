import React, { useState, useEffect, useRef } from 'react';
import { useProduct } from '../context/ProductContext';
import { useProductSettings } from '../context/ProductSettingsContext';
import { Gauge, Package, Circle, Target, Clock, ListChecks, Timer, Plus, X, AlertCircle, ChevronDown, Power } from 'lucide-react';
import { calculateLogsPerMinute, calculateRequiredSpeed, hasValidConversionFactor } from '../utils/productionCalculator';

type ReelDetail = 'diameter' | 'speed' | 'runtime' | 'expirytime' | 'break' | 'runtimetobreak' | 'timeuntilbreak' | 'enddiameter' | 'tissueMachine';

interface UnwindDetails {
  id: number;
  selectedDetails: ReelDetail[];
}

export default function SpeedProduction() {
  const { settings, calculations, unwinds, tables, updateTableData, updateSettings } = useProduct();
  const { folders, setProductActive } = useProductSettings();
  const [target, setTarget] = useState<string>('');
  const [currentHrLogs, setCurrentHrLogs] = useState<string>('');
  const [showDetailMenu, setShowDetailMenu] = useState<number | null>(null);
  const [remainingMinutes, setRemainingMinutes] = useState(0);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [unwindDetails, setUnwindDetails] = useState<UnwindDetails[]>([
    { id: 1, selectedDetails: ['expirytime', 'tissueMachine'] },
    { id: 2, selectedDetails: ['expirytime', 'tissueMachine'] }
  ]);

  // Find the active product across all folders
  const activeProduct = folders.reduce((active, folder) => {
    const foundProduct = folder.products.find(product => product.isActive);
    return foundProduct || active;
  }, null);

  // Calculate remaining minutes in the current hour
  useEffect(() => {
    const updateRemainingTime = () => {
      const now = new Date();
      setRemainingMinutes(60 - now.getMinutes());
    };

    updateRemainingTime();
    const interval = setInterval(updateRemainingTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const hasValidFactor = activeProduct 
    ? hasValidConversionFactor(activeProduct.settings.diameter, activeProduct.settings.perfLength)
    : false;

  // Calculate logs per minute based on current speed and active product settings
  const currentLogsPerMin = activeProduct?.settings.diameter && activeProduct?.settings.perfLength
    ? calculateLogsPerMinute(
        settings.lineSpeed, 
        activeProduct.settings.diameter,
        activeProduct.settings.perfLength
      )
    : null;

  const calculateRequiredLogs = () => {
    const targetNum = parseInt(target) || 0;
    const currentLogs = parseInt(currentHrLogs) || 0;
    return Math.max(0, targetNum - currentLogs);
  };

  // Calculate required speed based on target logs and remaining time
  const calculateRequiredSpeedForTime = () => {
    if (!hasValidFactor || !activeProduct) return null;

    const requiredLogs = calculateRequiredLogs();
    if (requiredLogs === 0 || remainingMinutes === 0) return 0;

    // Calculate required logs per minute based on remaining time
    const requiredLogsPerMin = requiredLogs / remainingMinutes;

    // Convert to required speed using the conversion factor
    return calculateRequiredSpeed(
      requiredLogsPerMin,
      activeProduct.settings.diameter,
      activeProduct.settings.perfLength
    );
  };

  const requiredSpeed = calculateRequiredSpeedForTime();

  const handleSpeedChange = (value: string) => {
    const speed = parseFloat(value);
    if (!isNaN(speed) && hasValidFactor) {
      updateSettings({ lineSpeed: speed });
    }
  };

  const handleLogsPerMinChange = (value: string) => {
    const logsPerMin = parseFloat(value);
    if (!isNaN(logsPerMin) && activeProduct?.settings.diameter && activeProduct?.settings.perfLength) {
      const speed = calculateRequiredSpeed(
        logsPerMin, 
        activeProduct.settings.diameter,
        activeProduct.settings.perfLength
      );
      if (speed !== null) {
        updateSettings({ lineSpeed: speed });
      }
    }
  };

  const handleTableInputChange = (tableId: string, hour: number, field: string, value: string) => {
    const newValue = value === '' ? 0 : Number(value);
    updateTableData(tableId, hour, field, newValue);
  };

  const handleProductSelect = (folderId: string, productId: string) => {
    setProductActive(folderId, productId);
    setShowProductSelector(false);
  };

  const activeTable = tables.find(table => table.isActive);
  const currentHour = new Date().getHours();

  const getCurrentHourData = (table: typeof activeTable) => {
    if (!table) return { logs: 0, target: 0, required: 0 };
    
    const hourData = table.hourData[currentHour] || { logs: 0, target: 0 };
    const required = Math.max(0, (hourData.target || 0) - (hourData.logs || 0));

    return { 
      logs: hourData.logs || 0, 
      target: hourData.target || 0,
      required
    };
  };

  const detailOptions: { value: ReelDetail; label: string }[] = [
    { value: 'diameter', label: 'Diameter' },
    { value: 'speed', label: 'Speed' },
    { value: 'runtime', label: 'Runtime' },
    { value: 'expirytime', label: 'Expiry Time' },
    { value: 'break', label: 'Break in Reel' },
    { value: 'runtimetobreak', label: 'Runtime to Break' },
    { value: 'timeuntilbreak', label: 'Time Until Break' },
    { value: 'enddiameter', label: 'End Diameter' },
    { value: 'tissueMachine', label: 'Tissue Machine' }
  ];

  const getDetailValue = (detail: ReelDetail, unwindId: number) => {
    const unwindData = unwindId === 1 ? unwinds.unwind1 : unwinds.unwind2;
    
    switch (detail) {
      case 'diameter':
        return `${unwindData.diameter} mm`;
      case 'speed':
        return `${unwindData.speed} m/min`;
      case 'runtime':
        return `${unwindData.runtime} min`;
      case 'expirytime':
        return unwindData.expirytime;
      case 'break':
        return `${unwindData.break} min`;
      case 'runtimetobreak':
        return `${unwindData.runtimetobreak} min`;
      case 'timeuntilbreak':
        return unwindData.timeuntilbreak;
      case 'enddiameter':
        return `${unwindData.enddiameter} mm`;
      case 'tissueMachine':
        return unwindData.paperMachine || 'Not Set';
      default:
        return '0';
    }
  };

  const addDetailToUnwind = (unwindId: number, detail: ReelDetail) => {
    setUnwindDetails(prev => prev.map(unwind => {
      if (unwind.id === unwindId) {
        return {
          ...unwind,
          selectedDetails: [...unwind.selectedDetails, detail]
        };
      }
      return unwind;
    }));
    setShowDetailMenu(null);
  };

  const removeDetailFromUnwind = (unwindId: number, detail: ReelDetail) => {
    setUnwindDetails(prev => prev.map(unwind => {
      if (unwind.id === unwindId) {
        return {
          ...unwind,
          selectedDetails: unwind.selectedDetails.filter(d => d !== detail)
        };
      }
      return unwind;
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Speed & Production Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Product */}
          <div 
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-shadow relative group"
            onClick={() => setShowProductSelector(true)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800">Product</h3>
              <Package className="w-6 h-6 text-blue-500" />
            </div>
            {activeProduct ? (
              <>
                <div className="text-2xl font-bold text-blue-600">
                  {activeProduct.name}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {activeProduct.settings.diameter}mm × {activeProduct.settings.perfLength}mm
                </div>
                <div className="absolute inset-0 bg-blue-600 bg-opacity-0 group-hover:bg-opacity-5 rounded-xl transition-all duration-200" />
              </>
            ) : (
              <>
                <div className="text-lg text-gray-500">
                  Click to select a product
                </div>
                <div className="absolute inset-0 bg-blue-600 bg-opacity-0 group-hover:bg-opacity-5 rounded-xl transition-all duration-200" />
              </>
            )}
          </div>

          {/* Log Specifications */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800">Log Specifications</h3>
              <Circle className="w-6 h-6 text-purple-500" />
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {activeProduct ? activeProduct.settings.diameter : 0} <span className="text-lg">mm</span>
                </div>
                <div className="text-sm text-gray-600">
                  Log diameter
                </div>
              </div>
              <div className="pt-1 border-t border-purple-100">
                <div className="text-xl font-bold text-purple-600">
                  {activeProduct ? activeProduct.settings.perfLength : 0} <span className="text-base">mm</span>
                </div>
                <div className="text-sm text-gray-600">
                  Perf length
                </div>
              </div>
            </div>
          </div>

          {/* Speed */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800">Speed (MPM)</h3>
              <Gauge className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              <input
                type="number"
                value={settings.lineSpeed || ''}
                onChange={(e) => handleSpeedChange(e.target.value)}
                placeholder="0"
                className="w-24 bg-transparent border-b border-green-200 focus:border-green-500 focus:ring-0 p-0 font-bold text-2xl"
                disabled={!hasValidFactor}
              />
              <span className="text-lg"> m/min</span>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {hasValidFactor 
                ? 'Current line speed'
                : 'Speed calculation not available for current specifications'}
            </div>
          </div>

          {/* Logs per Min */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800">Logs per Min</h3>
              <ListChecks className="w-6 h-6 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-600">
              <input
                type="number"
                value={currentLogsPerMin || ''}
                onChange={(e) => handleLogsPerMinChange(e.target.value)}
                placeholder="0"
                className="w-24 bg-transparent border-b border-amber-200 focus:border-amber-500 focus:ring-0 p-0 font-bold text-2xl"
                disabled={!hasValidFactor}
              />
              <span className="text-lg"> logs/min</span>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {hasValidFactor 
                ? 'Current production rate'
                : 'Production rate calculation not available for current specifications'}
            </div>
          </div>

          {/* Real Time Hourly Target */}
          <div className="col-span-full bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800">Real Time Hourly Target</h3>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">
                  {remainingMinutes} minutes remaining
                </span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Target</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Current HR Logs</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Required Logs</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Required Speed</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Required Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        placeholder="526"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={currentHrLogs}
                        onChange={(e) => setCurrentHrLogs(e.target.value)}
                        placeholder="0"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="p-2 bg-gray-100 rounded text-center font-medium">
                        {calculateRequiredLogs()}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="p-2 bg-gray-100 rounded text-center font-medium">
                        {requiredSpeed !== null ? `${requiredSpeed.toFixed(1)} MPM` : '-'}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="p-2 bg-gray-100 rounded text-center font-medium">
                        {remainingMinutes > 0 
                          ? `${(calculateRequiredLogs() / remainingMinutes).toFixed(1)} logs/min`
                          : '-'
                        }
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Status Indicator */}
            {hasValidFactor && currentLogsPerMin !== null && requiredSpeed !== null && (
              <div className={`mt-4 p-3 rounded-lg ${
                currentLogsPerMin >= (calculateRequiredLogs() / remainingMinutes)
                  ? 'bg-green-100 text-green-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  <span className="font-medium">
                    {currentLogsPerMin >= (calculateRequiredLogs() / remainingMinutes)
                      ? 'On track to meet target'
                      : 'Increase speed to meet target'
                    }
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Selector Modal */}
        {showProductSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Select Product</h3>
                <button
                  onClick={() => setShowProductSelector(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {folders.map(folder => (
                  <div key={folder.id} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 font-medium">
                      {folder.name}
                    </div>
                    <div className="divide-y">
                      {folder.products.map(product => (
                        <div
                          key={product.id}
                          className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleProductSelect(folder.id, product.id)}
                        >
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500">
                              {product.settings.diameter}mm × {product.settings.perfLength}mm
                            </div>
                          </div>
                          {product.isActive && (
                            <div className="flex items-center gap-2 text-green-600">
                              <Power className="w-4 h-4" />
                              <span className="text-sm font-medium">Active</span>
                            </div>
                          )}
                        </div>
                      ))}
                      {folder.products.length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          No products in this line
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reel Details Section */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Timer className="w-5 h-5 text-gray-700" />
              Reel Details
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {unwindDetails.map((unwind) => {
              const expectedPM = activeProduct?.settings.tissueMachine[`unwind${unwind.id}` as 'unwind1' | 'unwind2'];
              const currentPM = unwinds[`unwind${unwind.id}`].paperMachine;
              const pmMismatch = expectedPM && currentPM && expectedPM !== currentPM;

              return (
                <div key={unwind.id} className="bg-gray-50 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-800">Unwind {unwind.id}</h4>
                    <div className="relative">
                      <button
                        onClick={() => setShowDetailMenu(showDetailMenu === unwind.id ? null : unwind.id)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Detail</span>
                      </button>
                      
                      {showDetailMenu === unwind.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg py-1 z-10 border">
                          {detailOptions
                            .filter(option => !unwind.selectedDetails.includes(option.value))
                            .map((option) => (
                              <button
                                key={option.value}
                                onClick={() => addDetailToUnwind(unwind.id, option.value)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                              >
                                {option.label}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {unwind.selectedDetails.map((detail) => (
                      <div key={detail} className="flex items-center justify-between bg-white p-3 rounded-lg">
                        <div>
                          <span className="text-sm text-gray-600">
                            {detailOptions.find(opt => opt.value === detail)?.label}:
                          </span>
                          <span className="ml-2 font-medium">
                            {getDetailValue(detail, unwind.id)}
                          </span>
                          {detail === 'tissueMachine' && pmMismatch && (
                            <div className="mt-1 flex items-center gap-2 text-red-600 text-xs">
                              <AlertCircle className="w-4 h-4" />
                              <span>Expected: {expectedPM}</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeDetailFromUnwind(unwind.id, detail)}
                          className="p-1 hover:bg-gray-100 rounded-full"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}