import React, { useState, useCallback } from 'react';
import { useProduct } from '../context/ProductContext';
import { useProductSettings } from '../context/ProductSettingsContext';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

export default function Unwinds() {
  const { unwinds, updateUnwindData } = useProduct();
  const { folders } = useProductSettings();
  const [expandedUnwind, setExpandedUnwind] = useState<number | null>(null);
  const [inputValues, setInputValues] = useState<{[key: string]: string}>({});

  // Find active product's tissue machine settings
  const activeProduct = folders.reduce((active, folder) => {
    const foundProduct = folder.products.find(product => product.isActive);
    return foundProduct || active;
  }, null);

  const handleUnwindChange = useCallback((
    unwindId: 1 | 2,
    field: keyof typeof unwinds.unwind1,
    value: string
  ) => {
    // Update local state immediately for smooth typing
    setInputValues(prev => ({
      ...prev,
      [`${unwindId}-${field}`]: value
    }));
  }, []);

  const handleBlur = useCallback((
    unwindId: 1 | 2,
    field: keyof typeof unwinds.unwind1,
    value: string
  ) => {
    // On blur, ensure the value is valid and update context
    const numValue = parseFloat(value) || 0;
    updateUnwindData(unwindId, {
      [field]: numValue
    });
    // Clear local state
    setInputValues(prev => {
      const newValues = { ...prev };
      delete newValues[`${unwindId}-${field}`];
      return newValues;
    });
  }, [updateUnwindData]);

  const getInputValue = useCallback((
    unwindId: 1 | 2,
    field: keyof typeof unwinds.unwind1,
    contextValue: number
  ): string => {
    const key = `${unwindId}-${field}`;
    return inputValues[key] !== undefined ? inputValues[key] : contextValue.toString();
  }, [inputValues]);

  const renderInput = useCallback((
    unwindId: 1 | 2, 
    field: keyof typeof unwinds.unwind1,
    value: number,
    showUnit = false
  ) => (
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={getInputValue(unwindId, field, value)}
        onChange={(e) => handleUnwindChange(unwindId, field, e.target.value)}
        onBlur={(e) => handleBlur(unwindId, field, e.target.value)}
        className="w-20 p-1 text-sm border rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        step="any"
      />
      {showUnit && <span className="text-sm text-gray-500">mm</span>}
    </div>
  ), [getInputValue, handleUnwindChange, handleBlur]);

  // Desktop view
  const DesktopView = () => (
    <div className="hidden lg:block overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Diameter (mm)
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Speed (MPM)
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Runtime
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Expiry Time
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Diameter Break in Reel (mm)
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Runtime To Break
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time Until Break
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              End Diameter (mm)
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tissue Machine
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {[1, 2].map((unwindId) => {
            const unwindKey = `unwind${unwindId}` as keyof typeof unwinds;
            const expectedPM = activeProduct?.settings.tissueMachine[`unwind${unwindId}` as 'unwind1' | 'unwind2'];
            const currentPM = unwinds[unwindKey].paperMachine;
            const pmMismatch = expectedPM && currentPM && expectedPM !== currentPM;

            return (
              <tr key={unwindId}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Unwind {unwindId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {renderInput(unwindId as 1 | 2, 'diameter', unwinds[unwindKey].diameter, true)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {renderInput(unwindId as 1 | 2, 'speed', unwinds[unwindKey].speed)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="w-20 p-1 text-sm text-gray-500">
                    {unwinds[unwindKey].runtime}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="w-24 p-1 text-sm text-gray-500">
                    {unwinds[unwindKey].expirytime}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {renderInput(unwindId as 1 | 2, 'break', unwinds[unwindKey].break, true)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="w-20 p-1 text-sm text-gray-500">
                    {unwinds[unwindKey].runtimetobreak}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="w-24 p-1 text-sm text-gray-500">
                    {unwinds[unwindKey].timeuntilbreak}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {renderInput(unwindId as 1 | 2, 'enddiameter', unwinds[unwindKey].enddiameter, true)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="w-24 p-1 text-sm text-gray-500">
                    {unwinds[unwindKey].paperMachine}
                    {pmMismatch && (
                      <div className="group relative inline-block ml-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 bg-red-100 text-red-800 text-xs p-2 rounded">
                          Expected {expectedPM} for current product
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // Mobile view
  const MobileView = () => (
    <div className="lg:hidden space-y-6">
      {[1, 2].map((unwindId) => {
        const unwindKey = `unwind${unwindId}` as keyof typeof unwinds;
        const expectedPM = activeProduct?.settings.tissueMachine[`unwind${unwindId}` as 'unwind1' | 'unwind2'];
        const currentPM = unwinds[unwindKey].paperMachine;
        const pmMismatch = expectedPM && currentPM && expectedPM !== currentPM;

        return (
          <div key={unwindId} className="bg-white rounded-lg shadow">
            <button
              onClick={() => setExpandedUnwind(expandedUnwind === unwindId ? null : unwindId)}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 rounded-t-lg"
            >
              <span className="font-medium">Unwind {unwindId}</span>
              {expandedUnwind === unwindId ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            
            {expandedUnwind === unwindId && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Diameter (mm)
                    </label>
                    {renderInput(unwindId as 1 | 2, 'diameter', unwinds[unwindKey].diameter, true)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Speed (MPM)
                    </label>
                    {renderInput(unwindId as 1 | 2, 'speed', unwinds[unwindKey].speed)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Runtime
                    </label>
                    <div className="w-full p-2 text-sm text-gray-500 bg-gray-50 rounded">
                      {unwinds[unwindKey].runtime}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Time
                    </label>
                    <div className="w-full p-2 text-sm text-gray-500 bg-gray-50 rounded">
                      {unwinds[unwindKey].expirytime}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Diameter Break in Reel (mm)
                    </label>
                    {renderInput(unwindId as 1 | 2, 'break', unwinds[unwindKey].break, true)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Runtime to Break
                    </label>
                    <div className="w-full p-2 text-sm text-gray-500 bg-gray-50 rounded">
                      {unwinds[unwindKey].runtimetobreak}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time Until Break
                    </label>
                    <div className="w-full p-2 text-sm text-gray-500 bg-gray-50 rounded">
                      {unwinds[unwindKey].timeuntilbreak}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Diameter (mm)
                    </label>
                    {renderInput(unwindId as 1 | 2, 'enddiameter', unwinds[unwindKey].enddiameter, true)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tissue Machine
                    </label>
                    <div className="w-full p-2 text-sm text-gray-500 bg-gray-50 rounded flex items-center gap-2">
                      {unwinds[unwindKey].paperMachine}
                      {pmMismatch && (
                        <div className="group relative inline-block">
                          <AlertCircle className="w-5 h-5 text-red-500" />
                          <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 bg-red-100 text-red-800 text-xs p-2 rounded">
                            Expected {expectedPM} for current product
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Reel Expiry</h2>
        <DesktopView />
        <MobileView />
      </div>
    </div>
  );
}