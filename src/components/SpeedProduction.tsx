import React, { useState, useEffect } from 'react';
import { useProduct } from '../context/ProductContext';
import { useProductSettings } from '../context/ProductSettingsContext';
import { Package, Circle, Target, Clock, ListChecks, X, AlertCircle, ChevronDown, Power, Lock, Unlock, Gauge, Table, Wind } from 'lucide-react';
import { calculateLogsPerMinute, calculateRequiredSpeed, hasValidConversionFactor } from '../utils/productionCalculator';
import { NavigationContext } from './Layout';

const UNWIND_VISIBILITY_KEY = 'unwindVisibility';

const defaultVisibility = {
  diameter: true,
  speed: true,
  bulk: true,
  runtime: false,
  expirytime: false,
  break: false,
  runtimetobreak: false,
  timeuntilbreak: false,
  enddiameter: false,
  paperMachine: true,
  length: false
};

export default function SpeedProduction() {
  const { settings, calculations, unwinds, tables, updateTableData, updateSettings, setTableActive, updateUnwindData } = useProduct();
  const { folders, setProductActive, isProductLocked, setProductLocked } = useProductSettings();
  const { navigateToPage } = React.useContext(NavigationContext);
  const [target, setTarget] = useState<string>('');
  const [currentHrLogs, setCurrentHrLogs] = useState<string>('');
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState(0);
  const [unwindVisibility, setUnwindVisibility] = useState(() => {
    const stored = localStorage.getItem(UNWIND_VISIBILITY_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored unwind visibility:', e);
      }
    }
    return {
      unwind1: defaultVisibility,
      unwind2: defaultVisibility
    };
  });

  useEffect(() => {
    localStorage.setItem(UNWIND_VISIBILITY_KEY, JSON.stringify(unwindVisibility));
  }, [unwindVisibility]);

  useEffect(() => {
    const updateRemainingTime = () => {
      const now = new Date();
      setRemainingMinutes(60 - now.getMinutes());
    };

    updateRemainingTime();
    const interval = setInterval(updateRemainingTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const activeProduct = folders.reduce((active, folder) => {
    const foundProduct = folder.products.find(product => product.isActive);
    return foundProduct || active;
  }, null);

  const activeTable = tables.find(table => table.isActive);

  const hasValidFactor = activeProduct 
    ? hasValidConversionFactor(activeProduct.settings.diameter, activeProduct.settings.perfLength)
    : false;

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

  const requiredSpeed = (() => {
    if (!hasValidFactor || !activeProduct) return null;

    const requiredLogs = calculateRequiredLogs();
    if (requiredLogs === 0 || remainingMinutes === 0) return 0;

    const requiredLogsPerMin = requiredLogs / remainingMinutes;

    return calculateRequiredSpeed(
      requiredLogsPerMin,
      activeProduct.settings.diameter,
      activeProduct.settings.perfLength
    );
  })();

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

  const handleProductSelect = (folderId: string, productId: string) => {
    if (!isProductLocked) {
      setProductActive(folderId, productId);
      setShowProductSelector(false);
    }
  };

  const toggleProductLock = () => {
    if (activeProduct) {
      setProductLocked(!isProductLocked);
    }
  };

  const toggleUnwindField = (unwindId: 1 | 2, field: keyof typeof unwindVisibility.unwind1) => {
    setUnwindVisibility(prev => ({
      ...prev,
      [`unwind${unwindId}`]: {
        ...prev[`unwind${unwindId}`],
        [field]: !prev[`unwind${unwindId}`][field]
      }
    }));
  };

  const handleUnwindValueChange = (unwindId: 1 | 2, field: keyof UnwindData, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    if (!isNaN(numValue)) {
      updateUnwindData(unwindId, { [field]: numValue });
    }
  };

  const handleProductButtonClick = () => {
    if (!isProductLocked) {
      setShowProductSelector(true);
    }
  };

  const renderUnwindCard = (unwindId: 1 | 2) => {
    const unwindKey = `unwind${unwindId}` as keyof typeof unwinds;
    const unwindData = unwinds[unwindKey];
    const visibility = unwindVisibility[unwindKey];

    const renderField = (field: keyof typeof visibility, label: string, unit?: string) => {
      if (!visibility[field]) return null;

      return (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-gray-500 whitespace-nowrap">{label}</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={unwindData[field as keyof UnwindData] || ''}
              onChange={(e) => handleUnwindValueChange(unwindId, field as keyof UnwindData, e.target.value)}
              className="w-20 text-sm font-medium bg-transparent border-b border-blue-100 focus:border-blue-400 focus:ring-0 p-0.5 text-right"
            />
            {unit && <span className="text-xs text-gray-500">{unit}</span>}
          </div>
        </div>
      );
    };

    const renderReadOnlyField = (field: keyof typeof visibility, label: string, value: string) => {
      if (!visibility[field]) return null;

      return (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-gray-500 whitespace-nowrap">{label}</span>
          <span className="text-sm font-medium text-gray-800">{value}</span>
        </div>
      );
    };

    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-medium text-gray-800">Unwind {unwindId}</h3>
          </div>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const menu = document.getElementById(`unwind${unwindId}-menu`);
                const allMenus = document.querySelectorAll('[id$="-menu"]');
                allMenus.forEach(m => {
                  if (m.id !== `unwind${unwindId}-menu`) {
                    m.classList.add('hidden');
                  }
                });
                menu?.classList.toggle('hidden');
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
            >
              <span>View</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            <div
              id={`unwind${unwindId}-menu`}
              className="hidden absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-10 min-w-[180px]"
            >
              <div className="text-xs font-medium text-gray-500 px-2 py-1 uppercase tracking-wider">
                Visible Fields
              </div>
              {Object.entries(visibility).map(([field, isVisible]) => (
                <label
                  key={field}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => toggleUnwindField(unwindId, field as keyof typeof visibility)}
                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors">
                    {field.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 space-y-2">
          {renderField('diameter', 'Diameter', 'mm')}
          {renderField('speed', 'Speed', 'MPM')}
          {renderField('bulk', 'Bulk', 'μm')}
          {renderField('break', 'Break Diameter', 'mm')}
          {renderField('enddiameter', 'End Diameter', 'mm')}
          {renderReadOnlyField('runtime', 'Runtime', `${unwindData.runtime} min`)}
          {renderReadOnlyField('expirytime', 'Expiry Time', unwindData.expirytime)}
          {renderReadOnlyField('runtimetobreak', 'Runtime to Break', `${unwindData.runtimetobreak} min`)}
          {renderReadOnlyField('timeuntilbreak', 'Time at Break DIA', unwindData.timeuntilbreak)}
          {renderReadOnlyField('length', 'Length', `${unwindData.length.toLocaleString()} m`)}
          {renderReadOnlyField('paperMachine', 'Paper Machine', unwindData.paperMachine)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 relative">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 -ml-1">Speed & Production Overview</h2>
        
        {/* Product Lock Control */}
        {activeProduct && (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={toggleProductLock}
              className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
                isProductLocked 
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isProductLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Product */}
          <button
            onClick={handleProductButtonClick}
            disabled={isProductLocked}
            className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl p-3 sm:p-4 relative group text-left ${
              !isProductLocked ? 'hover:from-blue-100 hover:to-indigo-100' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base sm:text-lg font-medium text-gray-800">Product</h3>
              <Package className="w-6 h-6 text-blue-500" />
            </div>
            {activeProduct ? (
              <>
                <div className="text-lg sm:text-xl font-bold text-blue-600">
                  {activeProduct.name}
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  {activeProduct.settings.diameter}mm × {activeProduct.settings.perfLength}mm
                </div>
                {!isProductLocked && (
                  <div className="absolute inset-0 bg-blue-600 bg-opacity-0 group-hover:bg-opacity-5 rounded-xl transition-all duration-200" />
                )}
              </>
            ) : (
              <>
                <div className="text-base sm:text-lg text-gray-500">
                  Click to select a product
                </div>
                <div className="absolute inset-0 bg-blue-600 bg-opacity-0 group-hover:bg-opacity-5 rounded-xl transition-all duration-200" />
              </>
            )}
          </button>

          {/* Log Specifications */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base sm:text-lg font-medium text-gray-800">Log Specifications</h3>
              <Circle className="w-6 h-6 text-purple-500" />
            </div>
            <div className="flex justify-between items-start">
              <div>
                <div className="text-lg sm:text-xl font-bold text-purple-600">
                  {activeProduct ? activeProduct.settings.diameter : 0} <span className="text-lg">mm</span>
                </div>
                <div className="text-sm text-gray-600">
                  Log diameter
                </div>
              </div>
              <div className="border-l pl-4">
                <div className="text-base sm:text-lg font-bold text-purple-600">
                  {activeProduct ? activeProduct.settings.perfLength : 0} <span className="text-base">mm</span>
                </div>
                <div className="text-sm text-gray-600">
                  Perf length
                </div>
              </div>
            </div>
          </div>

          {/* Speed */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base sm:text-lg font-medium text-gray-800">Speed (MPM)</h3>
              <Gauge className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-green-600">
              <input
                type="number"
                value={settings.lineSpeed || ''}
                onChange={(e) => handleSpeedChange(e.target.value)}
                placeholder="0"
                className="w-20 sm:w-24 bg-transparent border-b border-green-200 focus:border-green-500 focus:ring-0 p-0 font-bold text-lg sm:text-xl"
                disabled={!hasValidFactor}
              />
              <span className="text-lg"> m/min</span>
            </div>
            <div className="mt-1 text-sm text-gray-600">
              {hasValidFactor 
                ? 'Current line speed'
                : 'Speed calculation not available for current specifications'}
            </div>
          </div>

          {/* Logs per Min */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base sm:text-lg font-medium text-gray-800">Logs per Min</h3>
              <ListChecks className="w-6 h-6 text-amber-500" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-amber-600">
              <input
                type="number"
                value={currentLogsPerMin || ''}
                onChange={(e) => handleLogsPerMinChange(e.target.value)}
                placeholder="0"
                className="w-20 sm:w-24 bg-transparent border-b border-amber-200 focus:border-amber-500 focus:ring-0 p-0 font-bold text-lg sm:text-xl"
                disabled={!hasValidFactor}
              />
              <span className="text-lg"> logs/min</span>
            </div>
            <div className="mt-1 text-sm text-gray-600">
              {hasValidFactor 
                ? 'Current production rate'
                : 'Production rate calculation not available for current specifications'}
            </div>
          </div>

          {/* Active Table Link */}
          <div className="col-span-full">
            <div className={`p-4 rounded-xl border-2 transition-colors ${
              activeTable
                ? 'bg-indigo-50 border-indigo-200'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Table className="w-5 h-5 text-indigo-500" />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {activeTable ? activeTable.name : 'No Active Table'}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {activeTable 
                        ? activeTable.description
                        : 'Click to select an active table for tracking production'
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (activeTable) {
                      navigateToPage('Tables', activeTable.id);
                    }
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
                >
                  Go To Table
                </button>
              </div>

              {activeTable && (
                <>
                  {/* Progress Bar */}
                  {(() => {
                    const totalLogs = Object.values(activeTable.hourData).reduce((sum, hour) => 
                      sum + (hour.logs || 0), 0
                    );
                    const totalTarget = Object.values(activeTable.hourData).reduce((sum, hour) => 
                      sum + (hour.target || 0), 0
                    );
                    const progress = totalTarget ? (totalLogs / totalTarget) * 100 : 0;
                    
                    return (
                      <>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-600 text-right mb-3">
                          {progress.toFixed(1)}%
                        </div>
                      </>
                    );
                  })()}

                  {/* Footer Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Total Logs</div>
                      <div className="text-base font-medium text-indigo-600">
                        {Object.values(activeTable.hourData).reduce((sum, hour) => 
                          sum + (hour.logs || 0), 0
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Target</div>
                      <div className="text-base font-medium text-green-600">
                        {Object.values(activeTable.hourData).reduce((sum, hour) => 
                          sum + (hour.target || 0), 0
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Required Logs</div>
                      <div className="text-base font-medium text-amber-600">
                        {Math.max(0, 
                          Object.values(activeTable.hourData).reduce((sum, hour) => 
                            sum + (hour.target || 0), 0
                          ) - 
                          Object.values(activeTable.hourData).reduce((sum, hour) => 
                            sum + (hour.logs || 0), 0
                          )
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Above/Below Target</div>
                      <div className={`text-base font-medium ${
                        Object.values(activeTable.hourData).reduce((sum, hour) => 
                          sum + (hour.logs || 0), 0
                        ) >= 
                        Object.values(activeTable.hourData).reduce((sum, hour) => 
                          sum + (hour.target || 0), 0
                        )
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {(() => {
                          const diff = Object.values(activeTable.hourData).reduce((sum, hour) => 
                            sum + (hour.logs || 0), 0
                          ) - 
                          Object.values(activeTable.hourData).reduce((sum, hour) => 
                            sum + (hour.target || 0), 0
                          );
                          return `${diff >= 0 ? '+' : ''}${diff}`;
                        })()}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Real Time Hourly Target */}
          <div className="col-span-full bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-gray-800">Real Time Hourly Target</h3>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">
                  {remainingMinutes} minutes remaining
                </span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Target</label>
                  <div>
                      <input
                        type="number"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        placeholder="526"
                        className="w-full p-1.5 border rounded focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                      />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Current HR Logs</label>
                  <div>
                      <input
                        type="number"
                        value={currentHrLogs}
                        onChange={(e) => setCurrentHrLogs(e.target.value)}
                        placeholder="0"
                        className="w-full p-1.5 border rounded focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                      />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Required Logs</label>
                  <div className="p-1.5 bg-gray-100 rounded text-center font-medium text-sm">
                        {calculateRequiredLogs()}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Required Speed</label>
                  <div className="p-1.5 bg-gray-100 rounded text-center font-medium text-sm">
                        {requiredSpeed !== null ? `${requiredSpeed.toFixed(1)} MPM` : '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Required Rate</label>
                  <div className="p-1.5 bg-gray-100 rounded text-center font-medium text-sm">
                        {remainingMinutes > 0 
                          ? `${(calculateRequiredLogs() / remainingMinutes).toFixed(1)} logs/min`
                          : '-'
                        }
                  </div>
                </div>
              </div>
            </div>

            {/* Status Indicator */}
            {hasValidFactor && currentLogsPerMin !== null && requiredSpeed !== null && (
              <div className={`mt-2 p-1.5 rounded ${
                currentLogsPerMin >= (calculateRequiredLogs() / remainingMinutes)
                  ? 'bg-green-100 text-green-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                <div className="flex items-start gap-2">
                  <Target className="w-4 h-4" />
                  <span className="font-medium text-sm leading-4">
                    {currentLogsPerMin >= (calculateRequiredLogs() / remainingMinutes)
                      ? 'On track to meet target'
                      : 'Increase speed to meet target'
                    }
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Unwinds Section */}
          <div className="col-span-full mt-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Unwind Details</h3>
            <div className="space-y-4">
              {renderUnwindCard(1)}
              {renderUnwindCard(2)}
            </div>
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
                          className={`px-4 py-3 flex items-center justify-between ${
                            !isProductLocked ? 'hover:bg-gray-50 cursor-pointer' : ''
                          }`}
                          onClick={() => handleProductSelect(folder.id, product.id)}
                        >
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500">
                              <span className="inline-flex items-center">
                                Diameter: <span className="font-medium ml-1">{product.settings.diameter}mm</span>
                              </span>
                              <span className="mx-2">•</span>
                              <span className="inline-flex items-center">
                                Perf Length: <span className="font-medium ml-1">{product.settings.perfLength}mm</span>
                              </span>
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
      </div>
    </div>
  );
}