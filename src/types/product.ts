import { ConversionFactor } from './productionCalculator';

export interface ProductSettings {
  id: string;
  name: string;
  isActive?: boolean;
  settings: {
    diameter: number;
    sheetWidth: number;
    perfLength: number;
    tissueMachine: {
      unwind1: string;
      unwind2: string;
    };
  };
}

export interface ProductFolder {
  id: string;
  name: string;
  products: ProductSettings[];
  defaultSettings?: Partial<ProductSettings>;
}

export const PRESET_VALUES = {
  diameter: [105, 112],
  sheetWidth: [99, 110],
  perfLength: [120, 124],
  tissueMachine: ['TM5', 'PM3', 'PM3-2PLY']
} as const;

export const defaultProductSettings: ProductSettings = {
  id: '',
  name: '',
  isActive: false,
  settings: {
    diameter: PRESET_VALUES.diameter[0],
    sheetWidth: PRESET_VALUES.sheetWidth[0],
    perfLength: PRESET_VALUES.perfLength[0],
    tissueMachine: {
      unwind1: PRESET_VALUES.tissueMachine[0],
      unwind2: PRESET_VALUES.tissueMachine[0]
    }
  }
};

export const productLineDefaults: Record<string, Partial<ProductSettings>> = {
  'waitrose-essentials': {
    settings: {
      diameter: 105,
      sheetWidth: 99,
      perfLength: 120,
      tissueMachine: {
        unwind1: 'TM5',
        unwind2: 'TM5'
      }
    }
  },
  'waitrose-premium': {
    settings: {
      diameter: 112,
      sheetWidth: 110,
      perfLength: 124,
      tissueMachine: {
        unwind1: 'PM3',
        unwind2: 'PM3'
      }
    }
  },
  'andrex-complete': {
    settings: {
      diameter: 112,
      sheetWidth: 110,
      perfLength: 124,
      tissueMachine: {
        unwind1: 'PM3-2PLY',
        unwind2: 'PM3-2PLY'
      }
    }
  }
};