import React, { useState, useEffect } from 'react';
import { useProductSettings } from '../context/ProductSettingsContext';
import { Scissors, X, Plus, Save, Power, Trash2 } from 'lucide-react';

type OSXConfig = {
  id: string;
  name: string;
  rolls: number;
  ppm: number;
};

type RollConfig425 = {
  id: string;
  name: string;
  rolls: number;
  ppm: number;
};

const DEFAULT_OSX_CONFIGS: OSXConfig[] = [
  { id: 'not-running-osx', name: 'Not Running', rolls: 0, ppm: 0 },
  { id: '9-roll', name: '9 Roll', rolls: 9, ppm: 0 },
  { id: '6-roll', name: '6 Roll', rolls: 6, ppm: 0 },
  { id: '12-roll', name: '12 Roll', rolls: 12, ppm: 0 }
];

const DEFAULT_425_CONFIGS: RollConfig425[] = [
  { id: 'not-running-425', name: 'Not Running', rolls: 0, ppm: 0 },
  { id: '9-roll-425', name: '9 Roll', rolls: 9, ppm: 0 },
  { id: '6-roll-425', name: '6 Roll', rolls: 6, ppm: 0 },
  { id: '4-roll-425', name: '4 Roll', rolls: 4, ppm: 0 }
];

export default function Downstream() {
  const { folders } = useProductSettings();
  const [showOSXModal, setShowOSXModal] = useState(false);
  const [show425Modal, setShow425Modal] = useState(false);
  const [osxConfigs, setOSXConfigs] = useState<OSXConfig[]>(() => {
    const stored = localStorage.getItem('osxConfigs');
    return stored ? JSON.parse(stored) : DEFAULT_OSX_CONFIGS;
  });
  const [configs425, setConfigs425] = useState<RollConfig425[]>(() => {
    const stored = localStorage.getItem('425Configs');
    return stored ? JSON.parse(stored) : DEFAULT_425_CONFIGS;
  });
  const [selectedOSX, setSelectedOSX] = useState<OSXConfig | null>(null);
  const [selected425, setSelected425] = useState<RollConfig425 | null>(null);
  const [showAddConfig, setShowAddConfig] = useState(false);
  const [showAdd425Config, setShowAdd425Config] = useState(false);
  const [newConfig, setNewConfig] = useState<Partial<OSXConfig>>({});
  const [new425Config, setNew425Config] = useState<Partial<RollConfig425>>({});
  const [osxPPM, setOSXPPM] = useState<string>(() => {
    const stored = localStorage.getItem('osxPPM');
    return stored || '0';
  });
  const [ppm425, setPPM425] = useState<string>(() => {
    const stored = localStorage.getItem('425PPM');
    return stored || '0';
  });
  const [activeCalculation, setActiveCalculation] = useState<'winder' | 'accumulator' | null>(null);
  const [showCPMInput, setShowCPMInput] = useState(false);
  const [cpmValue, setCPMValue] = useState('0');
  const [calculatedLPM, setCalculatedLPM] = useState<number | null>(null);
  const [showWinderInput, setShowWinderInput] = useState(false);
  const [requiredSawSpeed, setRequiredSawSpeed] = useState<number | null>(null);
  const [winderLPM, setWinderLPM] = useState<string>('0');
  const [rollsPerHour, setRollsPerHour] = useState<number | null>(null);
  const [autoCalculating, setAutoCalculating] = useState<'osx' | '425' | null>(null);

  // Find active product
  const activeProduct = folders.reduce((active, folder) => {
    const foundProduct = folder.products.find(product => product.isActive);
    return foundProduct || active;
  }, null);

  // Save configs to localStorage when they change
  React.useEffect(() => {
    localStorage.setItem('osxConfigs', JSON.stringify(osxConfigs));
  }, [osxConfigs]);

  React.useEffect(() => {
    localStorage.setItem('425Configs', JSON.stringify(configs425));
  }, [configs425]);

  // Save PPM values to localStorage
  useEffect(() => {
    localStorage.setItem('osxPPM', osxPPM);
  }, [osxPPM]);

  useEffect(() => {
    localStorage.setItem('425PPM', ppm425);
  }, [ppm425]);

  // Calculate LPM when CPM changes or accumulator is active
  useEffect(() => {
    if (activeCalculation === 'accumulator' && activeProduct) {
      const cpm = parseFloat(cpmValue);
      if (!isNaN(cpm)) {
        // Get cuts per log based on sheet width
        const cutsPerLog = activeProduct.settings.sheetWidth === 99 ? 27 : 24;
        
        // Calculate LPM = (CPM / cuts per log) x logs per cycle 
        const lpm = (cpm / cutsPerLog) * 4;
        setCalculatedLPM(lpm);
        
        // Only show required speed if LPM isn't a whole number
        if (lpm % 1 !== 0) {
          // Calculate required saw speed for next whole number LPM
          const nextWholeLPM = Math.ceil(lpm);
          const requiredCPM = Math.floor((nextWholeLPM * cutsPerLog) / 4);
          setRequiredSawSpeed(requiredCPM);
        } else {
          setRequiredSawSpeed(null);
        }
      }
    } else {
      setCalculatedLPM(null);
      setRequiredSawSpeed(null);
    }
  }, [activeCalculation, cpmValue, activeProduct]);

  // Calculate rolls per hour when winder LPM changes
  useEffect(() => {
    if (activeProduct && winderLPM !== '0') {
      const lpm = parseFloat(winderLPM);
      if (!isNaN(lpm)) {
        // Calculate logs per hour (LPM * 60)
        const logsPerHour = lpm * 60;
        // Calculate rolls per hour based on sheet width
        const logsPerRoll = activeProduct.settings.sheetWidth === 99 ? 25 : 22;
        const rolls = logsPerHour * logsPerRoll;
        setRollsPerHour(Math.round(rolls));
      }
    } else {
      setRollsPerHour(null);
    }
  }, [winderLPM, activeProduct]);

  // Auto-calculate PPM values when rolls per hour changes
  useEffect(() => {
    if (!rollsPerHour || !selectedOSX || !selected425) return;

    const rollsPerMin = rollsPerHour / 60;

    // If one machine has 0 rolls, send all to the other
    if (selectedOSX.rolls === 0) {
      if (selected425.rolls > 0) {
        setPPM425(Math.round(rollsPerMin / selected425.rolls).toString());
      }
      setOSXPPM('0');
      return;
    }
    if (selected425.rolls === 0) {
      if (selectedOSX.rolls > 0) {
        setOSXPPM(Math.round(rollsPerMin / selectedOSX.rolls).toString());
      }
      setPPM425('0');
      return;
    }
    
    // If we're manually adjusting one machine's speed, calculate the other
    if (autoCalculating === 'osx') {
      const osxRolls = selectedOSX.rolls * parseFloat(osxPPM);
      const remainingRolls = rollsPerMin - osxRolls;
      setPPM425(Math.max(0, Math.round(remainingRolls / selected425.rolls)).toString());
    } else if (autoCalculating === '425') {
      const rolls425 = selected425.rolls * parseFloat(ppm425);
      const remainingRolls = rollsPerMin - rolls425;
      setOSXPPM(Math.max(0, Math.round(remainingRolls / selectedOSX.rolls)).toString());
    } else {
      // Do 50/50 split
      const totalRolls = rollsPerMin;
      const halfRolls = totalRolls / 2;
      
      setOSXPPM(Math.round(halfRolls / selectedOSX.rolls).toString());
      setPPM425(Math.round(halfRolls / selected425.rolls).toString());
    }
  }, [rollsPerHour, selectedOSX, selected425, autoCalculating, osxPPM, ppm425]);

  // Calculate winder LPM when active calculation is 'winder'
  useEffect(() => {
    if (activeCalculation === 'winder' && activeProduct) {
      // Convert base value to string
      const lpm = activeProduct.settings.sheetWidth === 99 ? '25' : '22';
      setWinderLPM(lpm); 
    } else {
      setWinderLPM('0');
    }
  }, [activeCalculation, activeProduct]);

  const handleAddConfig = () => {
    if (!newConfig.rolls) return;

    const name = newConfig.rolls === 0 ? 'Not Running' : `${newConfig.rolls} Roll${newConfig.rolls > 1 ? 's' : ''}`;
    const config: OSXConfig = {
      id: `custom-${Date.now()}`,
      name,
      rolls: newConfig.rolls,
      ppm: 0
    };

    setOSXConfigs(prev => [...prev, config]);
    setNewConfig({});
    setShowAddConfig(false);
  };

  const handleAdd425Config = () => {
    if (!new425Config.rolls) return;

    const name = new425Config.rolls === 0 ? 'Not Running' : `${new425Config.rolls} Roll${new425Config.rolls > 1 ? 's' : ''}`;
    const config: RollConfig425 = {
      id: `425-custom-${Date.now()}`,
      name,
      rolls: new425Config.rolls,
      ppm: 0
    };

    setConfigs425(prev => [...prev, config]);
    setNew425Config({});
    setShowAdd425Config(false);
  };

  const handleDeleteOSXConfig = (configId: string) => {
    setOSXConfigs(prev => prev.filter(config => config.id !== configId));
    if (selectedOSX?.id === configId) {
      setSelectedOSX(null);
    }
  };

  const handleDelete425Config = (configId: string) => {
    setConfigs425(prev => prev.filter(config => config.id !== configId));
    if (selected425?.id === configId) {
      setSelected425(null);
    }
  };

  const handleOSXClick = () => {
    // If no configuration is selected, select the first one by default
    if (!selectedOSX && osxConfigs.length > 0) {
      const config = osxConfigs[0];
      setSelectedOSX(config);
      if (config.rolls === 0) {
        setOSXPPM('0');
      }
    }
    setShowOSXModal(true);
  };

  const handle425Click = () => {
    // If no configuration is selected, select the first one by default
    if (!selected425 && configs425.length > 0) {
      const config = configs425[0];
      setSelected425(config);
      if (config.rolls === 0) {
        setPPM425('0');
      }
    }
    setShow425Modal(true);
  };
  
  // Calculate rolls consumed per minute for OSX
  const calculateOSXRollsConsumed = () => {
    if (!selectedOSX) return 0;
    if (selectedOSX.rolls === 0) return 0;
    return selectedOSX.rolls * parseFloat(osxPPM);
  };

  // Calculate rolls consumed per minute for 425
  const calculate425RollsConsumed = () => {
    if (!selected425) return 0;
    if (selected425.rolls === 0) return 0;
    return selected425.rolls * parseFloat(ppm425);
  };

  // Calculate required 425 PPM based on remaining rolls
  const calculateRequired425PPM = () => {
    if (!selected425 || !rollsPerHour) return 0;
    if (selected425.rolls === 0) return 0;
    const rollsPerMin = rollsPerHour / 60;
    const osxRollsConsumed = calculateOSXRollsConsumed();
    const remainingRolls = rollsPerMin - osxRollsConsumed;
    return Math.round(remainingRolls / selected425.rolls);
  };

  return (
    <div className="p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold">Downstream</h2>
          {(activeCalculation === 'accumulator' || activeCalculation === 'winder') && activeProduct && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-2 shadow-sm">
              <div className="text-sm font-medium text-green-800">{activeProduct.name}</div>
              <div className="text-xs text-green-600">
                Sheet Width: {activeProduct.settings.sheetWidth}mm
                <br />
                Logs per Roll: {activeProduct.settings.sheetWidth === 99 ? 25 : 22}
              </div>
            </div>
          )}
        </div>
        
        {/* Flow Diagram */}
        <div className="relative w-full max-w-2xl mx-auto h-[300px]">
          {/* Logsaw Box */}
          <div className="absolute right-1/2 top-1/2 translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-gray-800 rounded-lg flex items-center justify-center bg-white shadow-lg">
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setShowCPMInput(true)}
                className={`font-semibold ${
                  activeCalculation === 'accumulator' ? 'text-green-600' : 'text-gray-800'
                } hover:text-indigo-600 transition-colors`}
              >
                CPM
              </button>
              <div className="flex flex-col items-center gap-1">
                {cpmValue !== '0' && (
                  <div className="text-sm text-gray-600">{cpmValue} cuts/min</div>
                )}
                {calculatedLPM !== null && (
                  <div className="text-sm text-gray-600">
                    {calculatedLPM.toFixed(1)} LPM
                  </div>
                )}
                {activeCalculation === 'winder' && rollsPerHour !== null && (
                  <div className="text-sm text-gray-600">
                    {Math.round(rollsPerHour / 60)} Rolls/min
                  </div>
                )}
                {requiredSawSpeed !== null && (
                  <div className="text-sm text-red-600">
                    Next LPM: {requiredSawSpeed} CPM
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Rolls per Hour Display */}
          {rollsPerHour !== null && (
            <div className="absolute left-[calc(50%+64px)] top-1/2 -translate-y-1/2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 shadow-sm">
              <div className="text-xs font-medium text-blue-800">Rolls/hr</div>
              <div className="text-base font-bold text-blue-600">{rollsPerHour.toLocaleString()}</div>
            </div>
          )}

          {/* CPM Input Modal */}
          {showCPMInput && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Enter CPM Value</h3>
                  <button
                    onClick={() => setShowCPMInput(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cuts Per Minute (CPM)
                    </label>
                    <input
                      type="number"
                      value={cpmValue}
                      onChange={(e) => setCPMValue(e.target.value)}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter CPM..."
                    />
                  </div>
                  {activeProduct && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">
                        Sheet Width: {activeProduct.settings.sheetWidth}mm
                        <br />
                        Cuts per Log: {activeProduct.settings.sheetWidth === 99 ? 27 : 24}
                        <br />
                        Logs per Cycle: 4
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowCPMInput(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setShowCPMInput(false);
                      }}
                      className={`px-4 py-2 text-white rounded ${
                        activeCalculation === 'accumulator'
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {activeCalculation === 'accumulator' ? 'Calculate' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Forward Line */}
          <div className="absolute right-[calc(50%+64px)] top-1/2 w-[32px] h-0.5 bg-gray-800 -translate-y-1/2" />

          {/* Vertical Line to Accumulator */}
          <div className="absolute right-1/2 bottom-[calc(50%+64px)] w-0.5 h-[16px] bg-gray-800 translate-x-1/2" />

          {/* Vertical Line to Winder */}
          <div className="absolute right-1/2 top-[calc(50%+64px)] w-0.5 h-[32px] bg-gray-800 translate-x-1/2" />

          {/* Branching Lines */}
          <div className="absolute right-[calc(50%+80px)] top-[calc(50%-64px)] w-0.5 h-32 bg-gray-800" />
          <div className="absolute right-[calc(50%+80px)] top-[calc(50%-64px)] w-[40px] h-0.5 bg-gray-800" />
          <div className="absolute right-[calc(50%+80px)] top-[calc(50%+64px)] w-[40px] h-0.5 bg-gray-800" />

          {/* Labels */}
          <div
            className="absolute right-[calc(50%+100px)] top-[calc(50%-100px)] text-lg font-medium text-gray-800 hover:text-indigo-600 transition-colors"
          >
            <div className="flex flex-col items-start gap-1">
              <button
                onClick={handleOSXClick}
                className="text-lg font-medium text-gray-800 hover:text-indigo-600 transition-colors"
              >
                OSX
              </button>
              {selectedOSX && (
                <div className="flex flex-col items-start gap-1">
                  <span className="text-sm text-gray-500">{selectedOSX.name}</span>
                  {selectedOSX.rolls > 0 && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={osxPPM}
                        onChange={(e) => {
                          setAutoCalculating('osx');
                          setOSXPPM(e.target.value);
                        }}
                        className="w-14 p-1 text-sm border rounded text-right"
                        placeholder="PPM"
                      />
                      <span className="text-xs text-gray-500">PPM</span>
                      {calculateOSXRollsConsumed() > 0 && (
                        <span className="text-xs text-gray-500">
                          ({calculateOSXRollsConsumed()} rolls/min)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="absolute right-[calc(50%+100px)] top-[calc(50%+72px)] text-lg font-medium text-gray-800">
            <button
              onClick={handle425Click}
              className="text-lg font-medium text-gray-800 hover:text-indigo-600 transition-colors"
            >
              <div className="flex flex-col items-start gap-1">
                <span>425</span>
              </div>
            </button>
            {selected425 && (
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-sm text-gray-500">{selected425.name}</span>
                    {selected425.rolls > 0 && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          onClick={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          value={ppm425}
                          onChange={(e) => {
                            setAutoCalculating('425');
                            setPPM425(e.target.value);
                          }}
                          className="w-14 p-1 text-sm border rounded text-right"
                          placeholder="PPM"
                        />
                        <span className="text-xs text-gray-500">PPM</span>
                        {calculate425RollsConsumed() > 0 && (
                          <span className="text-xs text-gray-500">
                            ({calculate425RollsConsumed()} rolls/min)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
            )}
          </div>
          <div className="absolute right-1/2 top-[calc(50%-128px)] text-lg font-medium text-gray-800 translate-x-1/2">
            <div className="flex items-center gap-2">
              <div className={`flex flex-col items-center ${
                activeCalculation === 'accumulator' ? 'text-green-600' : ''
              }`}>
                Accumulator
                {calculatedLPM !== null && (
                  <div className="text-sm">{calculatedLPM.toFixed(1)} LPM</div>
                )}
              </div>
              <button
                onClick={() => setActiveCalculation(prev => 
                  prev === 'accumulator' ? null : 'accumulator'
                )}
                className={`p-1.5 rounded-lg transition-colors ${
                  activeCalculation === 'accumulator'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Power className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="absolute right-1/2 top-[calc(50%+112px)] text-lg font-medium text-gray-800 translate-x-1/2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveCalculation('winder');
                  setShowWinderInput(true);
                  if (activeProduct) {
                    setWinderLPM(activeProduct.settings.sheetWidth === 99 ? '25' : '22');
                  }
                }}
                className={`flex items-center transition-colors ${
                  activeCalculation === 'winder' ? 'text-green-600' : ''
                }`}
              >
                <span>Winder</span>
                {winderLPM !== '0' && activeCalculation === 'winder' && (
                  <span className="ml-2 text-sm">({winderLPM} LPM)</span>
                )}
              </button>
              <button
                onClick={() => setActiveCalculation(prev => 
                  prev === 'winder' ? null : 'winder'
                )}
                className={`p-1.5 rounded-lg transition-colors ${
                  activeCalculation === 'winder'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Power className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Winder Input Modal */}
          {showWinderInput && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Enter Winder LPM</h3>
                  <button
                    onClick={() => setShowWinderInput(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Logs Per Minute (LPM)
                    </label>
                    <input
                      type="number"
                      value={winderLPM}
                      onChange={(e) => setWinderLPM(e.target.value)}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter LPM..."
                    />
                  </div>
                  {activeProduct && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">
                        Logs per Hour: {(parseFloat(winderLPM) || 0) * 60}
                        <br />
                        Logs per Roll: {activeProduct.settings.sheetWidth === 99 ? 25 : 22}
                        <br />
                        Total Rolls per Hour: {rollsPerHour?.toLocaleString() || 0}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setActiveCalculation(null);
                        setShowWinderInput(false);
                      }}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setShowWinderInput(false)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OSX Modal */}
          {showOSXModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">OSX Configuration</h3>
                  <button
                    onClick={() => setShowOSXModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* OSX Options */}
                <div className="space-y-4 mb-6">
                  {osxConfigs.map(config => (
                    <div
                      key={config.id}
                      className={`p-4 border rounded-lg ${
                        selectedOSX?.id === config.id 
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{config.name}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedOSX(config);
                              if (config.rolls === 0) {
                                setOSXPPM('0');
                              }
                              setShowOSXModal(false);
                            }}
                            className={`px-3 py-1.5 rounded text-sm ${
                              selectedOSX?.id === config.id
                                ? 'bg-indigo-600 text-white'
                                : 'text-indigo-600 hover:bg-indigo-50'
                            }`}
                          >
                            {selectedOSX?.id === config.id ? 'Selected' : 'Select'}
                          </button>
                          <button
                            onClick={() => handleDeleteOSXConfig(config.id)}
                            className="p-1 hover:bg-red-100 rounded text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Add New Configuration */}
                {showAddConfig ? (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4">Add New Configuration</h4>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Number of Rolls</label>
                      <input
                        type="number"
                        value={newConfig.rolls || ''}
                        onChange={(e) => setNewConfig(prev => ({ ...prev, rolls: Number(e.target.value) }))}
                        className="w-full p-2 border rounded"
                        placeholder="e.g., 12"
                      />
                    </div>
                    <div className="flex justify-end mt-4 space-x-2">
                      <button
                        onClick={() => setShowAddConfig(false)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddConfig}
                        disabled={!newConfig.rolls}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        Add Configuration
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddConfig(true)}
                    className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded w-full justify-center"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add New Configuration</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 425 Modal */}
          {show425Modal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">425 Configuration</h3>
                  <button
                    onClick={() => setShow425Modal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* 425 Options */}
                <div className="space-y-4 mb-6">
                  {configs425.map(config => (
                    <div
                      key={config.id}
                      className={`p-4 border rounded-lg ${
                        selected425?.id === config.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{config.name}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelected425(config);
                              if (config.rolls === 0) {
                                setPPM425('0');
                              }
                              setShow425Modal(false);
                            }}
                            className={`px-3 py-1.5 rounded text-sm ${
                              selected425?.id === config.id
                                ? 'bg-indigo-600 text-white'
                                : 'text-indigo-600 hover:bg-indigo-50'
                            }`}
                          >
                            {selected425?.id === config.id ? 'Selected' : 'Select'}
                          </button>
                          <button
                            onClick={() => handleDelete425Config(config.id)}
                            className="p-1 hover:bg-red-100 rounded text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add New 425 Configuration */}
                {showAdd425Config ? (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4">Add New Configuration</h4>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Number of Rolls</label>
                      <input
                        type="number"
                        value={new425Config.rolls || ''}
                        onChange={(e) => setNew425Config(prev => ({ ...prev, rolls: Number(e.target.value) }))}
                        className="w-full p-2 border rounded"
                        placeholder="e.g., 12"
                      />
                    </div>
                    <div className="flex justify-end mt-4 space-x-2">
                      <button
                        onClick={() => setShowAdd425Config(false)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAdd425Config}
                        disabled={!new425Config.rolls}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        Add Configuration
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAdd425Config(true)}
                    className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded w-full justify-center"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add New Configuration</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}