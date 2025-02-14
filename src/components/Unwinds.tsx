import React, { useState, useEffect } from 'react';
import { useProduct } from '../context/ProductContext';
import { useProductSettings } from '../context/ProductSettingsContext';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

type UnwindField = 'diameter' | 'speed' | 'break' | 'enddiameter' | 'bulk';
type InputValues = Record<string, string>;

const MAX_DIAMETER_METERS = 3;
const DIAMETER_FIELDS: UnwindField[] = ['diameter', 'break', 'enddiameter'];

const END_DIAMETER_DEFAULTS = {
  'TM5': 570,
  'PM3': 350,
  'PM3-2PLY': 350
} as const;

const BULK_DEFAULTS = {
  'TM5': 0.150,
  'PM3': 0.150,
  'PM3-2PLY': 0.130
} as const;

// Convert mm to μm
const mmToMicrons = (mm: number) => mm * 1000;
// Convert μm to mm
const micronsToMm = (microns: number) => microns / 1000;

export default function Unwinds() {
  const { unwinds, updateUnwindData } = useProduct();
  const { folders } = useProductSettings();
  const [expandedUnwind, setExpandedUnwind] = useState<number | null>(null);
  const [inputValues, setInputValues] = useState<InputValues>({});

  // Find active product's tissue machine settings
  const activeProduct = folders.reduce((active, folder) => {
    const foundProduct = folder.products.find(product => product.isActive);
    return foundProduct || active;
  }, null);

  // Update end diameters and bulk values when tissue machine changes
  useEffect(() => {
    if (!activeProduct?.settings.tissueMachine) return;

    const { unwind1, unwind2 } = activeProduct.settings.tissueMachine;
    
    if (END_DIAMETER_DEFAULTS[unwind1 as keyof typeof END_DIAMETER_DEFAULTS]) {
      updateUnwindData(1, {
        enddiameter: END_DIAMETER_DEFAULTS[unwind1 as keyof typeof END_DIAMETER_DEFAULTS],
        bulk: BULK_DEFAULTS[unwind1 as keyof typeof BULK_DEFAULTS]
      });
    }

    if (END_DIAMETER_DEFAULTS[unwind2 as keyof typeof END_DIAMETER_DEFAULTS]) {
      updateUnwindData(2, {
        enddiameter: END_DIAMETER_DEFAULTS[unwind2 as keyof typeof END_DIAMETER_DEFAULTS],
        bulk: BULK_DEFAULTS[unwind2 as keyof typeof BULK_DEFAULTS]
      });
    }
  }, [activeProduct?.settings.tissueMachine, updateUnwindData]);

  const getInputKey = (unwindId: number, field: UnwindField) => `${unwindId}-${field}`;

  const getInputValue = (unwindId: number, field: UnwindField, contextValue: number) => {
    const key = getInputKey(unwindId, field);
    if (field === 'bulk') {
      // For bulk, convert mm to μm for display
      return inputValues[key] ?? mmToMicrons(contextValue).toString();
    }
    return inputValues[key] ?? contextValue.toString();
  };

  const handleDiameterInput = (unwindId: 1 | 2, field: UnwindField, value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      const key = getInputKey(unwindId, field);
      setInputValues(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  const handleDiameterBlur = (unwindId: 1 | 2, field: UnwindField) => {
    const key = getInputKey(unwindId, field);
    const value = inputValues[key];
    
    if (value !== undefined) {
      const numValue = value === '' ? 0 : parseFloat(value);
      
      let finalValue: number;
      if (numValue <= MAX_DIAMETER_METERS) {
        finalValue = numValue * 1000;
      } else {
        finalValue = numValue;
      }

      finalValue = Math.min(finalValue, MAX_DIAMETER_METERS * 1000);
      
      updateUnwindData(unwindId, {
        [field]: finalValue
      });
      
      setInputValues(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleInputChange = (unwindId: 1 | 2, field: UnwindField, value: string) => {
    if (DIAMETER_FIELDS.includes(field)) {
      handleDiameterInput(unwindId, field, value);
      return;
    }

    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      const key = getInputKey(unwindId, field);
      setInputValues(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  const handleInputBlur = (unwindId: 1 | 2, field: UnwindField) => {
    if (DIAMETER_FIELDS.includes(field)) {
      handleDiameterBlur(unwindId, field);
      return;
    }

    const key = getInputKey(unwindId, field);
    const value = inputValues[key];
    
    if (value !== undefined) {
      const numValue = value === '' ? 0 : parseFloat(value);
      
      // For bulk, convert μm input to mm before saving
      const finalValue = field === 'bulk' ? micronsToMm(numValue) : numValue;
      
      updateUnwindData(unwindId, {
        [field]: finalValue
      });
      
      setInputValues(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleIncrement = (unwindId: 1 | 2, field: UnwindField, contextValue: number, step: number = 1) => {
    if (field === 'bulk') {
      // For bulk, increment in μm
      const currentMicrons = mmToMicrons(contextValue);
      const newMicrons = currentMicrons + step;
      updateUnwindData(unwindId, {
        [field]: micronsToMm(newMicrons)
      });
    } else {
      const newValue = (parseFloat(getInputValue(unwindId, field, contextValue)) || 0) + step;
      updateUnwindData(unwindId, {
        [field]: newValue
      });
    }
  };

  const handleDecrement = (unwindId: 1 | 2, field: UnwindField, contextValue: number, step: number = 1) => {
    if (field === 'bulk') {
      // For bulk, decrement in μm
      const currentMicrons = mmToMicrons(contextValue);
      const newMicrons = Math.max(0, currentMicrons - step);
      updateUnwindData(unwindId, {
        [field]: micronsToMm(newMicrons)
      });
    } else {
      const newValue = Math.max(0, (parseFloat(getInputValue(unwindId, field, contextValue)) || 0) - step);
      updateUnwindData(unwindId, {
        [field]: newValue
      });
    }
  };

  const getFieldUnit = (field: UnwindField) => {
    switch (field) {
      case 'diameter':
      case 'break':
      case 'enddiameter':
        return 'mm';
      case 'speed':
        return 'MPM';
      case 'bulk':
        return 'μm';
      default:
        return '';
    }
  };

  const getFieldStep = (field: UnwindField) => {
    switch (field) {
      case 'bulk':
        return 1; // Step by 1 μm
      case 'speed':
        return 1;
      default:
        return 1;
    }
  };

  const renderInput = (unwindId: 1 | 2, field: UnwindField, contextValue: number, showUnit = false) => (
    <div className="flex flex-col">
      <div className="flex items-center gap-1">
        <div className="relative flex items-center">
          <input
            type="text"
            inputMode="decimal"
            value={getInputValue(unwindId, field, contextValue)}
            onChange={(e) => handleInputChange(unwindId, field, e.target.value)}
            onBlur={() => handleInputBlur(unwindId, field)}
            className="w-20 p-1 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-6"
            step={getFieldStep(field)}
          />
          <div className="absolute right-0 inset-y-0 flex flex-col border-l">
            <button
              onClick={() => handleIncrement(unwindId, field, contextValue, getFieldStep(field))}
              className="flex-1 px-1 hover:bg-gray-100 rounded-tr-lg"
            >
              <ChevronUp className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => handleDecrement(unwindId, field, contextValue, getFieldStep(field))}
              className="flex-1 px-1 hover:bg-gray-100 rounded-br-lg"
            >
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
        {(showUnit || field === 'speed' || field === 'bulk') && (
          <span className="text-sm text-gray-500">{getFieldUnit(field)}</span>
        )}
      </div>
      {field === 'bulk' && (
        <div className="text-xs text-gray-500 mt-0.5">
          {contextValue.toFixed(3)} mm
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Reel Expiry</h2>
        
        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Diameter (mm)
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Speed (MPM)
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bulk (mm)
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Runtime
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Time
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Break Diameter (mm)
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Runtime To Break
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time at Break DIA
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Diameter (mm)
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Length
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
                      {renderInput(unwindId as 1 | 2, 'bulk', unwinds[unwindKey].bulk)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{unwinds[unwindKey].runtime} min</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{unwinds[unwindKey].expirytime}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderInput(unwindId as 1 | 2, 'break', unwinds[unwindKey].break, true)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{unwinds[unwindKey].runtimetobreak} min</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{unwinds[unwindKey].timeuntilbreak}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderInput(unwindId as 1 | 2, 'enddiameter', unwinds[unwindKey].enddiameter, true)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{unwinds[unwindKey].length.toLocaleString()} m</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{unwinds[unwindKey].paperMachine}</span>
                        {pmMismatch && (
                          <div className="group relative">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-red-100 text-red-800 text-xs rounded shadow-lg">
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

        {/* Mobile View */}
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
                          Bulk (mm)
                        </label>
                        {renderInput(unwindId as 1 | 2, 'bulk', unwinds[unwindKey].bulk)}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Runtime
                        </label>
                        <div className="p-2 text-sm text-gray-500 bg-gray-50 rounded">
                          {unwinds[unwindKey].runtime} min
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry Time
                        </label>
                        <div className="p-2 text-sm text-gray-500 bg-gray-50 rounded">
                          {unwinds[unwindKey].expirytime}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Break Diameter (mm)
                        </label>
                        {renderInput(unwindId as 1 | 2, 'break', unwinds[unwindKey].break, true)}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Runtime to Break
                        </label>
                        <div className="p-2 text-sm text-gray-500 bg-gray-50 rounded">
                          {unwinds[unwindKey].runtimetobreak} min
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Time at Break DIA
                        </label>
                        <div className="p-2 text-sm text-gray-500 bg-gray-50 rounded">
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
                          Length
                        </label>
                        <div className="p-2 text-sm text-gray-500 bg-gray-50 rounded">
                          {unwinds[unwindKey].length.toLocaleString()} m
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tissue Machine
                        </label>
                        <div className="p-2 text-sm text-gray-500 bg-gray-50 rounded flex items-center gap-2">
                          <span>{unwinds[unwindKey].paperMachine}</span>
                          {pmMismatch && (
                            <div className="group relative">
                              <AlertCircle className="w-5 h-5 text-red-500" />
                              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-red-100 text-red-800 text-xs rounded shadow-lg">
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
      </div>
    </div>
  );
}