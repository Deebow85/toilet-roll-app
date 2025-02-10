import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useProductSettings } from './ProductSettingsContext';

type ProductSettings = {
  coreSize: number;
  rollSize: number;
  paperWeight: number;
  productGrade: string;
  lineSpeed: number;
};

interface UnwindData {
  diameter: number;
  speed: number;
  runtime: number;
  expirytime: string;
  break: number;
  runtimetobreak: number;
  timeuntilbreak: string;
  enddiameter: number;
  paperMachine: string;
}

interface HourData {
  logs?: number;
  target?: number;
}

interface TableData {
  id: string;
  name: string;
  type: 'actual' | 'target' | 'operator';
  description: string;
  isActive: boolean;
  hourData: { [hour: number]: HourData };
}

interface ProductContextType {
  settings: ProductSettings;
  calculations: SpeedCalculations;
  unwinds: {
    unwind1: UnwindData;
    unwind2: UnwindData;
  };
  tables: TableData[];
  updateSettings: (settings: Partial<ProductSettings>) => void;
  updateUnwindData: (unwindId: 1 | 2, data: Partial<UnwindData>) => void;
  updateTableData: (id: string, hour: number, field: string, value: number) => void;
  setTableActive: (id: string) => void;
}

type SpeedCalculations = {
  logSawSpeed: number;
  winderSpeed: number;
  downstreamSpeed: number;
};

const defaultSettings: ProductSettings = {
  coreSize: 0,
  rollSize: 0,
  paperWeight: 0,
  productGrade: '',
  lineSpeed: 0,
};

const defaultUnwindData: UnwindData = {
  diameter: 0,
  speed: 0,
  runtime: 0,
  expirytime: '00:00:00',
  break: 0,
  runtimetobreak: 0,
  timeuntilbreak: '00:00:00',
  enddiameter: 0,
  paperMachine: ''
};

const calculateSpeeds = (settings: ProductSettings): SpeedCalculations => {
  const logSawSpeed = settings.lineSpeed * 1.2;
  const winderSpeed = settings.lineSpeed * (settings.rollSize / settings.coreSize);
  const downstreamSpeed = settings.lineSpeed * 0.95;

  return {
    logSawSpeed,
    winderSpeed,
    downstreamSpeed,
  };
};

const ProductContext = createContext<ProductContextType>({
  settings: defaultSettings,
  calculations: calculateSpeeds(defaultSettings),
  unwinds: {
    unwind1: defaultUnwindData,
    unwind2: defaultUnwindData,
  },
  tables: [],
  updateSettings: () => {},
  updateUnwindData: () => {},
  updateTableData: () => {},
  setTableActive: () => {},
});

export const useProduct = () => useContext(ProductContext);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ProductSettings>(defaultSettings);
  const [calculations, setCalculations] = useState<SpeedCalculations>(calculateSpeeds(defaultSettings));
  const [unwinds, setUnwinds] = useState({
    unwind1: { ...defaultUnwindData },
    unwind2: { ...defaultUnwindData },
  });
  const [tables, setTables] = useState<TableData[]>([
    {
      id: 'table1',
      name: 'Actual Logs',
      type: 'actual',
      description: 'Track actual production logs per hour',
      isActive: false,
      hourData: {},
    },
    {
      id: 'table2',
      name: 'Target Logs',
      type: 'target',
      description: 'Set and monitor target production goals',
      isActive: false,
      hourData: {},
    },
    {
      id: 'table3',
      name: 'Operator Target',
      type: 'operator',
      description: 'Operator-specific production targets',
      isActive: false,
      hourData: {},
    },
  ]);

  const { folders } = useProductSettings();
  const clockIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<{[key: string]: string}>({});

  useEffect(() => {
    const activeProduct = folders.reduce((active, folder) => {
      const foundProduct = folder.products.find(product => product.isActive);
      return foundProduct || active;
    }, null);

    if (activeProduct?.settings.tissueMachine) {
      setUnwinds(prev => {
        if (
          prev.unwind1.paperMachine === activeProduct.settings.tissueMachine.unwind1 &&
          prev.unwind2.paperMachine === activeProduct.settings.tissueMachine.unwind2
        ) {
          return prev;
        }
        return {
          unwind1: {
            ...prev.unwind1,
            paperMachine: activeProduct.settings.tissueMachine.unwind1
          },
          unwind2: {
            ...prev.unwind2,
            paperMachine: activeProduct.settings.tissueMachine.unwind2
          }
        };
      });
    }
  }, [folders]);

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      const updates: {[key: string]: string} = {};

      [1, 2].forEach(id => {
        const unwind = unwinds[`unwind${id}` as keyof typeof unwinds];
        const expiry = new Date(now.getTime() + unwind.runtime * 60000);
        const breakTime = new Date(now.getTime() + unwind.runtimetobreak * 60000);
        
        const newExpiry = expiry.toLocaleTimeString();
        const newBreak = breakTime.toLocaleTimeString();
        
        const expiryKey = `expiry${id}`;
        const breakKey = `break${id}`;
        
        if (lastUpdateRef.current[expiryKey] !== newExpiry) {
          updates[expiryKey] = newExpiry;
        }
        if (lastUpdateRef.current[breakKey] !== newBreak) {
          updates[breakKey] = newBreak;
        }
      });

      if (Object.keys(updates).length > 0) {
        lastUpdateRef.current = { ...lastUpdateRef.current, ...updates };
        setUnwinds(prev => ({
          unwind1: {
            ...prev.unwind1,
            expirytime: updates.expiry1 || prev.unwind1.expirytime,
            timeuntilbreak: updates.break1 || prev.unwind1.timeuntilbreak
          },
          unwind2: {
            ...prev.unwind2,
            expirytime: updates.expiry2 || prev.unwind2.expirytime,
            timeuntilbreak: updates.break2 || prev.unwind2.timeuntilbreak
          }
        }));
      }
    };

    clockIntervalRef.current = setInterval(updateTimes, 1000);

    return () => {
      if (clockIntervalRef.current) {
        clearInterval(clockIntervalRef.current);
      }
    };
  }, [unwinds.unwind1.runtime, unwinds.unwind1.runtimetobreak, 
      unwinds.unwind2.runtime, unwinds.unwind2.runtimetobreak]);

  const updateSettings = useCallback((newSettings: Partial<ProductSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      setCalculations(calculateSpeeds(updated));
      return updated;
    });
  }, []);

  const updateUnwindData = useCallback((unwindId: 1 | 2, data: Partial<UnwindData>) => {
    setUnwinds(prev => {
      const unwindKey = `unwind${unwindId}` as keyof typeof prev;
      const currentUnwind = prev[unwindKey];
      
      const updatedUnwind = {
        ...currentUnwind,
        ...data
      };

      if (JSON.stringify(currentUnwind) === JSON.stringify(updatedUnwind)) {
        return prev;
      }

      return {
        ...prev,
        [unwindKey]: updatedUnwind
      };
    });
  }, []);

  const updateTableData = useCallback((id: string, hour: number, field: string, value: number) => {
    setTables(prev => {
      const tableIndex = prev.findIndex(t => t.id === id);
      if (tableIndex === -1) return prev;

      const newTables = [...prev];
      const table = { ...newTables[tableIndex] };
      
      table.hourData = {
        ...table.hourData,
        [hour]: {
          ...table.hourData[hour],
          [field]: value
        }
      };

      newTables[tableIndex] = table;
      return newTables;
    });
  }, []);

  const setTableActive = useCallback((id: string) => {
    setTables(prev => prev.map(table => ({
      ...table,
      isActive: table.id === id
    })));
  }, []);

  const contextValue = React.useMemo(() => ({
    settings,
    calculations,
    unwinds,
    tables,
    updateSettings,
    updateUnwindData,
    updateTableData,
    setTableActive,
  }), [settings, calculations, unwinds, tables, updateSettings, updateUnwindData, updateTableData, setTableActive]);

  return (
    <ProductContext.Provider value={contextValue}>
      {children}
    </ProductContext.Provider>
  );
};