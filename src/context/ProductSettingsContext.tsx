import React, { createContext, useContext, useState, useEffect } from 'react';
import { ProductFolder, ProductSettings, defaultProductSettings, productLineDefaults } from '../types/product';
import { deepMerge } from '../utils/helpers';

interface ProductSettingsContextType {
  folders: ProductFolder[];
  addFolder: (name: string) => void;
  deleteFolder: (id: string) => void;
  addProduct: (folderId: string, product: Partial<ProductSettings>) => void;
  updateProduct: (folderId: string, productId: string, updates: Partial<ProductSettings>) => void;
  deleteProduct: (folderId: string, productId: string) => void;
  setProductActive: (folderId: string, productId: string) => void;
}

const ProductSettingsContext = createContext<ProductSettingsContextType>({
  folders: [],
  addFolder: () => {},
  deleteFolder: () => {},
  addProduct: () => {},
  updateProduct: () => {},
  deleteProduct: () => {},
  setProductActive: () => {}
});

export const useProductSettings = () => useContext(ProductSettingsContext);

const STORAGE_KEY = 'productSettings';

const getInitialFolders = (): ProductFolder[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }

  // Default folders if no stored data
  return [
    {
      id: 'waitrose-essentials',
      name: 'Waitrose Essentials',
      products: [],
      defaultSettings: productLineDefaults['waitrose-essentials']
    },
    {
      id: 'waitrose-premium',
      name: 'Waitrose Premium',
      products: [],
      defaultSettings: productLineDefaults['waitrose-premium']
    },
    {
      id: 'andrex-complete',
      name: 'Andrex Complete Clean',
      products: [],
      defaultSettings: productLineDefaults['andrex-complete']
    }
  ];
};

export const ProductSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [folders, setFolders] = useState<ProductFolder[]>(getInitialFolders());

  // Save to localStorage whenever folders change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
  }, [folders]);

  const addFolder = (name: string) => {
    const id = name.toLowerCase().replace(/\s+/g, '-');
    setFolders(prev => [...prev, {
      id,
      name,
      products: [],
      defaultSettings: productLineDefaults[id] || {}
    }]);
  };

  const deleteFolder = (id: string) => {
    setFolders(prev => prev.filter(folder => folder.id !== id));
  };

  const addProduct = (folderId: string, productData: Partial<ProductSettings>) => {
    setFolders(prev => prev.map(folder => {
      if (folder.id === folderId) {
        const folderDefaults = folder.defaultSettings || {};
        const productId = `${folderId}-${Date.now()}`;
        const newProduct = deepMerge(
          defaultProductSettings,
          folderDefaults,
          { ...productData, id: productId }
        ) as ProductSettings;
        
        return {
          ...folder,
          products: [...folder.products, newProduct]
        };
      }
      return folder;
    }));
  };

  const updateProduct = (folderId: string, productId: string, updates: Partial<ProductSettings>) => {
    setFolders(prev => prev.map(folder => {
      if (folder.id === folderId) {
        return {
          ...folder,
          products: folder.products.map(product => 
            product.id === productId
              ? { ...deepMerge(product, updates), id: productId } as ProductSettings
              : product
          )
        };
      }
      return folder;
    }));
  };

  const deleteProduct = (folderId: string, productId: string) => {
    setFolders(prev => prev.map(folder => {
      if (folder.id === folderId) {
        return {
          ...folder,
          products: folder.products.filter(product => product.id !== productId)
        };
      }
      return folder;
    }));
  };

  const setProductActive = (folderId: string, productId: string) => {
    setFolders(prev => prev.map(folder => ({
      ...folder,
      products: folder.products.map(product => ({
        ...product,
        isActive: folder.id === folderId && product.id === productId
      }))
    })));
  };

  return (
    <ProductSettingsContext.Provider value={{
      folders,
      addFolder,
      deleteFolder,
      addProduct,
      updateProduct,
      deleteProduct,
      setProductActive
    }}>
      {children}
    </ProductSettingsContext.Provider>
  );
};