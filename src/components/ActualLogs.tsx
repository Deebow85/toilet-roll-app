import React, { useState, useEffect } from 'react';
import { useProduct } from '../context/ProductContext';
import { useProductSettings } from '../context/ProductSettingsContext';
import { Eye, EyeOff, AlertCircle, Target, Users, Clock, BarChart3, Lock, Unlock, Copy } from 'lucide-react';
import { calculateRequiredSpeed } from '../utils/productionCalculator';

export default function ActualLogs() {
  const { tables, updateTableData, setTableActive } = useProduct();
  const { folders } = useProductSettings();
  const [globalTarget, setGlobalTarget] = useState(526);
  const [showSummary, setShowSummary] = useState(false);
  const [lockedHours, setLockedHours] = useState<{ [key: string]: number[] }>({});
  const [operatorTarget, setOperatorTarget] = useState(526);

  // Find active product
  const activeProduct = folders.reduce((active, folder) => {
    const foundProduct = folder.products.find(product => product.isActive);
    return foundProduct || active;
  }, null);

  // Convert current hour to shift hour (1-12)
  const getCurrentShiftHour = () => {
    const hour = new Date().getHours();
    // For day shift (5am to 5pm)
    if (hour >= 5 && hour < 17) {
      return hour - 4; // 5am = hour 1, 4pm = hour 12
    }
    // For night shift (5pm to 5am)
    if (hour >= 17) {
      return hour - 16; // 5pm = hour 1
    }
    // For midnight to 5am
    return hour + 8; // 12am = hour 7, 4am = hour 11, 5am starts new day shift
  };

  const formatShiftHour = (hour: number) => {
    // Determine if we're in the day shift (5am - 5pm) based on current time
    const isDayShift = new Date().getHours() >= 5 && new Date().getHours() < 17;
    
    if (isDayShift) {
      // Day shift hours (5am to 5pm)
      const startHour = hour + 4; // Hour 1 starts at 5am
      const endHour = startHour + 1;
      
      const formatHour = (h: number) => {
        if (h === 12) return '12';
        if (h > 12) return `${h - 12}`;
        return `${h}`;
      };
      
      const startPeriod = startHour < 12 ? 'am' : 'pm';
      const endPeriod = endHour < 12 ? 'am' : (endHour === 24 ? 'am' : 'pm');
      
      return `${formatHour(startHour)}${startPeriod}-${formatHour(endHour === 24 ? 12 : endHour)}${endPeriod}`;
    } else {
      // Night shift hours (5pm to 5am)
      const startHour = hour + 16; // Hour 1 starts at 5pm
      const endHour = startHour + 1;
      const normalizedStartHour = startHour >= 24 ? startHour - 24 : startHour;
      const normalizedEndHour = endHour >= 24 ? endHour - 24 : endHour;
      
      const formatHour = (h: number) => {
        if (h === 0) return '12';
        if (h > 12) return `${h - 12}`;
        return `${h}`;
      };
      
      const startPeriod = normalizedStartHour < 12 ? 'am' : 'pm';
      const endPeriod = normalizedEndHour < 12 ? 'am' : 'pm';
      
      return `${formatHour(normalizedStartHour)}${startPeriod}-${formatHour(normalizedEndHour)}${endPeriod}`;
    }
  };

  // Update currentHour state to use shift hours
  const [currentHour] = useState(getCurrentShiftHour());

  const handleInputChange = (tableId: string, hour: number, field: string, value: string) => {
    // Don't update if hour is locked
    if (lockedHours[tableId]?.includes(hour)) return;
    
    const newValue = value === '' ? 0 : Number(value);
    updateTableData(tableId, hour, field, newValue);
  };

  const applyGlobalTarget = (tableId: string) => {
    // Apply the global target to all unlocked hours
    Array.from({ length: 12 }, (_, i) => i + 1).forEach(hour => {
      if (!lockedHours[tableId]?.includes(hour)) {
        updateTableData(tableId, hour, 'target', globalTarget);
      }
    });
  };

  const applyOperatorTarget = (tableId: string) => {
    // Split operator target evenly across 12 hours
    const hourlyTarget = Math.floor(operatorTarget / 12);
    const remainder = operatorTarget % 12;
    
    Array.from({ length: 12 }, (_, i) => i + 1).forEach(hour => {
      if (!lockedHours[tableId]?.includes(hour)) {
        // Add 1 to first 'remainder' hours to distribute remainder evenly
        const target = hour <= remainder ? hourlyTarget + 1 : hourlyTarget;
        updateTableData(tableId, hour, 'target', target);
      }
    });
  };

  const toggleHourLock = (tableId: string, hour: number) => {
    setLockedHours(prev => {
      const tableHours = prev[tableId] || [];
      const isLocked = tableHours.includes(hour);
      
      if (isLocked) {
        // Unlock the hour
        return {
          ...prev,
          [tableId]: tableHours.filter(h => h !== hour)
        };
      } else {
        // Lock the hour
        return {
          ...prev,
          [tableId]: [...tableHours, hour]
        };
      }
    });
  };

  const isHourLocked = (tableId: string, hour: number) => {
    return lockedHours[tableId]?.includes(hour) || false;
  };

  const toggleTableActive = (tableId: string) => {
    setTableActive(tableId);
  };

  const getTableIcon = (type: 'actual' | 'target' | 'operator') => {
    switch (type) {
      case 'actual':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case 'target':
        return <Target className="w-5 h-5 text-green-500" />;
      case 'operator':
        return <Users className="w-5 h-5 text-purple-500" />;
    }
  };

  const getTableColor = (type: 'actual' | 'target' | 'operator') => {
    switch (type) {
      case 'actual':
        return 'bg-blue-50 border-blue-200';
      case 'target':
        return 'bg-green-50 border-green-200';
      case 'operator':
        return 'bg-purple-50 border-purple-200';
    }
  };

  const calculateTableStats = (table: any) => {
    const totalLogs = Object.values(table.hourData).reduce((sum: number, hour: any) => sum + (hour.logs || 0), 0);
    const totalTarget = Object.values(table.hourData).reduce((sum: number, hour: any) => sum + (hour.target || 0), 0);
    const currentHourLogs = table.hourData[currentHour]?.logs || 0;
    const currentHourTarget = table.hourData[currentHour]?.target || (table.type === 'operator' ? operatorTarget : globalTarget);
    const progress = totalTarget ? (totalLogs / totalTarget) * 100 : 0;
    const logsAboveTarget = totalLogs - totalTarget;

    // Calculate required logs as exact difference between target and actual
    const requiredLogs = Math.max(0, totalTarget - totalLogs);

    // Calculate required per hour including current hour
    let requiredPerHour = 0;
    if (requiredLogs > 0) {
      // Count remaining unlocked hours from current hour to end of shift
      const remainingHours = Array.from({ length: 13 - currentHour }, (_, i) => currentHour + i)
        .filter(hour => !lockedHours[table.id]?.includes(hour))
        .length;
      
      if (remainingHours > 0) {
        // Include current hour in the division
        requiredPerHour = Math.ceil(requiredLogs / remainingHours);
      }
    }

    // Convert required logs per hour to logs per minute for speed calculation
    const requiredLogsPerMinute = requiredPerHour / 60;

    // Calculate required speed based on required logs per minute
    const requiredSpeed = activeProduct?.settings.diameter && activeProduct?.settings.perfLength
      ? calculateRequiredSpeed(requiredLogsPerMinute, activeProduct.settings.diameter, activeProduct.settings.perfLength)
      : null;

    return {
      totalLogs,
      totalTarget,
      currentHourLogs,
      currentHourTarget,
      progress: Math.min(progress, 100),
      requiredLogs,
      requiredPerHour,
      logsAboveTarget,
      requiredSpeed
    };
  };

  const renderTableHeader = (table: any) => {
    const stats = calculateTableStats(table);
    
    return (
      <div className="flex flex-col space-y-2 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getTableIcon(table.type)}
            <div>
              <h3 className="font-semibold text-gray-900">{table.name}</h3>
              <p className="text-sm text-gray-500">{table.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {table.type === 'operator' && (
              <div className="flex items-center gap-2 mr-4">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500">Total Target</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={operatorTarget}
                      onChange={(e) => setOperatorTarget(Number(e.target.value))}
                      className="w-24 p-2 text-sm font-semibold text-center border rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="0"
                      step="1"
                    />
                    <button
                      onClick={() => applyOperatorTarget(table.id)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-100 hover:bg-purple-200 rounded transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Split</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => toggleTableActive(table.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                table.isActive
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {table.isActive ? (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Active</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>Inactive</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${stats.progress}%` }}
          />
        </div>
        <div className="text-sm text-gray-600 text-right">
          {stats.progress.toFixed(1)}%
        </div>
      </div>
    );
  };

  const renderTable = (table: any) => (
    <div className="overflow-x-auto">
      <table className="w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2 bg-white bg-opacity-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hour
            </th>
            <th className="px-4 py-2 bg-white bg-opacity-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Logs Produced
            </th>
            <th className="px-4 py-2 bg-white bg-opacity-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Target
            </th>
            {table.type !== 'actual' && (
              <th className="px-4 py-2 bg-white bg-opacity-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Required (per hour)
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: 12 }, (_, i) => {
            const hour = i + 1;
            const hourData = table.hourData[hour] || { logs: 0, target: 0 };
            const isCurrentHour = hour === currentHour;
            const hourLocked = isHourLocked(table.id, hour);
            const stats = calculateTableStats(table);

            return (
              <tr key={hour} className={`${isCurrentHour ? 'bg-blue-50' : ''} ${hourLocked ? 'bg-gray-50' : ''}`}>
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleHourLock(table.id, hour)}
                      className={`flex items-center gap-1 px-2 py-1 rounded ${
                        hourLocked 
                          ? 'text-amber-600 hover:bg-amber-50' 
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{hour}</span>
                        <span className="text-xs text-gray-500">{formatShiftHour(hour)}</span>
                      </div>
                      {hourLocked ? (
                        <Lock className="w-3.5 h-3.5" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100" />
                      )}
                    </button>
                    {isCurrentHour && (
                      <Clock className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <input
                    type="number"
                    value={hourData.logs || ''}
                    onChange={(e) => handleInputChange(table.id, hour, 'logs', e.target.value)}
                    placeholder="0"
                    className={`w-20 p-1 text-sm border rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      hourLocked ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    disabled={hourLocked}
                  />
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <input
                    type="number"
                    value={hourData.target === 0 ? '0' : hourData.target || ''}
                    onChange={(e) => handleInputChange(table.id, hour, 'target', e.target.value)}
                    placeholder={table.type === 'operator' ? operatorTarget.toString() : globalTarget.toString()}
                    className={`w-20 p-1 text-sm border rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      hourLocked ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    disabled={hourLocked}
                  />
                </td>
                {table.type !== 'actual' && (
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                    {hour >= currentHour && !hourLocked ? stats.requiredPerHour : 0}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-gray-50">
          {table.type === 'target' ? (
            <>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  Speed for logs required
                </td>
                <td colSpan={3} className="px-4 py-2 whitespace-nowrap text-sm font-medium text-blue-600">
                  {calculateTableStats(table).requiredSpeed ? (
                    <>
                      {calculateTableStats(table).requiredSpeed} MPM 
                      <span className="text-gray-500 ml-2">
                        ({(calculateTableStats(table).requiredPerHour / 60).toFixed(1)} logs/min)
                      </span>
                    </>
                  ) : 'N/A'}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total so far
                </td>
                <td colSpan={3} className="px-4 py-2 whitespace-nowrap text-sm font-medium text-indigo-600">
                  {calculateTableStats(table).totalLogs}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  Actual target
                </td>
                <td colSpan={3} className="px-4 py-2 whitespace-nowrap text-sm font-medium text-green-600">
                  {calculateTableStats(table).totalTarget}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  Required logs for target
                </td>
                <td colSpan={3} className="px-4 py-2 whitespace-nowrap text-sm font-medium text-amber-600">
                  {calculateTableStats(table).requiredLogs}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  Logs Above / Below Target
                </td>
                <td colSpan={3} className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                  <span className={calculateTableStats(table).logsAboveTarget >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {calculateTableStats(table).logsAboveTarget >= 0 ? '+' : ''}
                    {calculateTableStats(table).logsAboveTarget}
                  </span>
                </td>
              </tr>
            </>
          ) : table.type === 'operator' ? (
            <>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  Speed for logs required
                </td>
                <td colSpan={3} className="px-4 py-2 whitespace-nowrap text-sm font-medium text-purple-600">
                  {calculateTableStats(table).requiredSpeed ? (
                    <>
                      {calculateTableStats(table).requiredSpeed} MPM
                      <span className="text-gray-500 ml-2">
                        ({(calculateTableStats(table).requiredPerHour / 60).toFixed(1)} logs/min)
                      </span>
                    </>
                  ) : 'N/A'}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total logs produced
                </td>
                <td colSpan={3} className="px-4 py-2 whitespace-nowrap text-sm font-medium text-indigo-600">
                  {calculateTableStats(table).totalLogs}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  Operator target
                </td>
                <td colSpan={3} className="px-4 py-2 whitespace-nowrap text-sm font-medium text-green-600">
                  {calculateTableStats(table).totalTarget}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  Remaining for target
                </td>
                <td colSpan={3} className="px-4 py-2 whitespace-nowrap text-sm font-medium text-amber-600">
                  {calculateTableStats(table).requiredLogs}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  Logs Above / Below Target
                </td>
                <td colSpan={3} className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                  <span className={calculateTableStats(table).logsAboveTarget >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {calculateTableStats(table).logsAboveTarget >= 0 ? '+' : ''}
                    {calculateTableStats(table).logsAboveTarget}
                  </span>
                </td>
              </tr>
            </>
          ) : (
            <>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total so far
                </td>
                <td colSpan={2} className="px-4 py-2 whitespace-nowrap text-sm font-medium text-indigo-600">
                  {calculateTableStats(table).totalLogs}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  Actual target
                </td>
                <td colSpan={2} className="px-4 py-2 whitespace-nowrap text-sm font-medium text-green-600">
                  {calculateTableStats(table).totalTarget}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  Required logs for target
                </td>
                <td colSpan={2} className="px-4 py-2 whitespace-nowrap text-sm font-medium text-amber-600">
                  {calculateTableStats(table).requiredLogs}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  Logs Above / Below Target
                </td>
                <td colSpan={2} className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                  <span className={calculateTableStats(table).logsAboveTarget >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {calculateTableStats(table).logsAboveTarget >= 0 ? '+' : ''}
                    {calculateTableStats(table).logsAboveTarget}
                  </span>
                </td>
              </tr>
            </>
          )}
        </tfoot>
      </table>
    </div>
  );

  return (
    <div className="p-4">
      {/* Global Target Input Box */}
      <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-green-500" />
              <div>
                <h3 className="font-semibold text-gray-900">Global Target</h3>
                <p className="text-sm text-gray-500">Set default target for all hours</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={globalTarget}
                onChange={(e) => setGlobalTarget(Number(e.target.value))}
                className="w-24 p-2 text-lg font-semibold text-center border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                min="0"
                step="1"
              />
              <span className="text-sm text-gray-500">logs/hour</span>
            </div>
          </div>
          
          {/* Apply Target Buttons - Only for actual and target tables */}
          <div className="flex gap-2">
            {tables.filter(table => table.type !== 'operator').map(table => (
              <button
                key={table.id}
                onClick={() => applyGlobalTarget(table.id)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>Apply to {table.name}</span>
              </button>
            ))}
          </div>
          
          <p className="text-xs text-gray-500">
            Note: Individual hour targets can be overridden in the tables below. Locked hours will not be affected by the global target.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
        {tables.map((table) => (
          <div 
            key={table.id} 
            className={`rounded-lg border ${getTableColor(table.type)} ${
              table.isActive ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            {renderTableHeader(table)}
            {renderTable(table)}
          </div>
        ))}
      </div>
    </div>
  );
}