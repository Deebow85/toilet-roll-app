import React, { useState, useEffect } from 'react';
import { useProductSettings } from '../context/ProductSettingsContext';
import { useProduct } from '../context/ProductContext';
import { ProductSettings as IProductSettings, defaultProductSettings, PRESET_VALUES } from '../types/product';
import { Plus, X, Save, Edit, Eye, Power, Settings as SettingsIcon, Trash2, Folder, ChevronRight, ChevronDown, Calculator, Lock, Unlock } from 'lucide-react';
import { ConversionFactor, getStoredConversionFactors, saveConversionFactors } from '../utils/productionCalculator';

interface ProductFolder {
  id: string;
  name: string;
}

interface SampleData {
  speedMPM: number;
  logsPerMin: number;
}

export default function ProductSettings() {
  const { 
    folders, 
    addFolder, 
    deleteFolder, 
    addProduct, 
    updateProduct, 
    deleteProduct,
    setProductActive 
  } = useProductSettings();
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<ProductFolder | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newProduct, setNewProduct] = useState<Partial<IProductSettings>>(defaultProductSettings);
  const [editingProduct, setEditingProduct] = useState<IProductSettings | null>(null);
  const [showDeleteProductModal, setShowDeleteProductModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ folderId: string; productId: string } | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'view'>('edit');
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [conversionFactors, setConversionFactors] = useState<ConversionFactor[]>([]);
  const [newFactor, setNewFactor] = useState<ConversionFactor>({
    diameter: 0,
    perfLength: 0,
    factor: 0,
    isLocked: false
  });
  const [showDeleteFactorModal, setShowDeleteFactorModal] = useState(false);
  const [factorToDelete, setFactorToDelete] = useState<number | null>(null);
  const [showSampleCalculator, setShowSampleCalculator] = useState(false);
  const [sampleData, setSampleData] = useState<SampleData[]>(Array(6).fill({
    speedMPM: 0,
    logsPerMin: 0
  }));
  const [calculatedFactor, setCalculatedFactor] = useState<number | null>(null);

  const [useCustomValues, setUseCustomValues] = useState(false);
  const [customValues, setCustomValues] = useState({
    diameter: '',
    sheetWidth: '',
    perfLength: ''
  });

  useEffect(() => {
    setConversionFactors(getStoredConversionFactors());
  }, []);

  const handleAddConversionFactor = () => {
    if (newFactor.diameter && newFactor.perfLength && newFactor.factor) {
      const updated = [...conversionFactors, newFactor];
      setConversionFactors(updated);
      saveConversionFactors(updated);
      setNewFactor({ diameter: 0, perfLength: 0, factor: 0, isLocked: false });
    }
  };

  const handleDeleteFactor = () => {
    if (factorToDelete === null) return;
    const updated = conversionFactors.filter((_, i) => i !== factorToDelete);
    setConversionFactors(updated);
    saveConversionFactors(updated);
    setShowDeleteFactorModal(false);
    setFactorToDelete(null);
  };

  const toggleFactorLock = (index: number) => {
    const updated = conversionFactors.map((factor, i) => 
      i === index ? { ...factor, isLocked: !factor.isLocked } : factor
    );
    setConversionFactors(updated);
    saveConversionFactors(updated);
  };

  const exportFactors = () => {
    const dataStr = JSON.stringify(conversionFactors, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'conversion-factors.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importFactors = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported) && imported.every(factor => 
          typeof factor.diameter === 'number' &&
          typeof factor.perfLength === 'number' &&
          typeof factor.factor === 'number'
        )) {
          setConversionFactors(imported);
          saveConversionFactors(imported);
        } else {
          alert('Invalid file format');
        }
      } catch (error) {
        alert('Error importing file');
      }
    };
    reader.readAsText(file);
  };

  const handleSampleDataChange = (index: number, field: keyof SampleData, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    if (isNaN(numValue)) return;

    setSampleData(prev => {
      const newData = [...prev];
      newData[index] = {
        ...newData[index],
        [field]: numValue
      };
      return newData;
    });
  };

  const calculateAverageFactor = () => {
    const validSamples = sampleData.filter(sample => sample.speedMPM > 0 && sample.logsPerMin > 0);
    if (validSamples.length === 0) return;

    const factors = validSamples.map(sample => sample.speedMPM / sample.logsPerMin);
    const averageFactor = factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
    setCalculatedFactor(Number(averageFactor.toFixed(2)));
  };

  const applyCalculatedFactor = () => {
    if (calculatedFactor === null) return;
    setNewFactor(prev => ({
      ...prev,
      factor: calculatedFactor
    }));
    setShowSampleCalculator(false);
  };

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
      setNewFolderName('');
      setShowAddModal(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, folder: ProductFolder) => {
    e.stopPropagation();
    setFolderToDelete(folder);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (folderToDelete) {
      deleteFolder(folderToDelete.id);
      setShowDeleteModal(false);
      setFolderToDelete(null);
      if (expandedFolder === folderToDelete.id) {
        setExpandedFolder(null);
      }
    }
  };

  const handleAddProduct = () => {
    if (selectedFolder) {
      addProduct(selectedFolder, newProduct);
      setShowProductModal(false);
      setSelectedFolder(null);
      setNewProduct(defaultProductSettings);
    }
  };

  const handleProductClick = (folderId: string, product: IProductSettings) => {
    setSelectedFolder(folderId);
    setEditingProduct(product);
    setNewProduct(product);
    setViewMode('view');
    setShowProductModal(true);
  };

  const handleEditProduct = () => {
    setViewMode('edit');
  };

  const handleUpdateProduct = () => {
    if (selectedFolder && editingProduct) {
      updateProduct(selectedFolder, editingProduct.id, newProduct);
      setShowProductModal(false);
      setSelectedFolder(null);
      setEditingProduct(null);
      setNewProduct(defaultProductSettings);
      setViewMode('edit');
    }
  };

  const handleDeleteProduct = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.folderId, productToDelete.productId);
      setShowDeleteProductModal(false);
      setProductToDelete(null);
    }
  };

  const handleSetActive = (e: React.MouseEvent, folderId: string, productId: string) => {
    e.stopPropagation();
    setProductActive(folderId, productId);
  };

  const renderProductForm = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Product Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Product Name</label>
            <input
              type="text"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              disabled={viewMode === 'view'}
            />
          </div>

          {/* Toggle for custom values */}
          {viewMode !== 'view' && (
            <div className="md:col-span-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomValues}
                  onChange={(e) => setUseCustomValues(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">Use custom values</span>
              </label>
            </div>
          )}

          {/* Diameter Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Diameter (mm)</label>
            {useCustomValues && viewMode !== 'view' ? (
              <input
                type="number"
                value={customValues.diameter}
                onChange={(e) => {
                  setCustomValues(prev => ({ ...prev, diameter: e.target.value }));
                  setNewProduct({
                    ...newProduct,
                    settings: { ...newProduct.settings, diameter: Number(e.target.value) }
                  });
                }}
                placeholder="Enter diameter..."
                step="0.1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            ) : (
              <select
                value={newProduct.settings?.diameter}
                onChange={(e) => setNewProduct({
                  ...newProduct,
                  settings: { ...newProduct.settings, diameter: Number(e.target.value) }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                disabled={viewMode === 'view'}
              >
                {PRESET_VALUES.diameter.map(value => (
                  <option key={value} value={value}>{value}mm</option>
                ))}
              </select>
            )}
          </div>

          {/* Sheet Width Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Sheet Width (mm)</label>
            {useCustomValues && viewMode !== 'view' ? (
              <input
                type="number"
                value={customValues.sheetWidth}
                onChange={(e) => {
                  setCustomValues(prev => ({ ...prev, sheetWidth: e.target.value }));
                  setNewProduct({
                    ...newProduct,
                    settings: { ...newProduct.settings, sheetWidth: Number(e.target.value) }
                  });
                }}
                placeholder="Enter sheet width..."
                step="0.1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            ) : (
              <select
                value={newProduct.settings?.sheetWidth}
                onChange={(e) => setNewProduct({
                  ...newProduct,
                  settings: { ...newProduct.settings, sheetWidth: Number(e.target.value) }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                disabled={viewMode === 'view'}
              >
                {PRESET_VALUES.sheetWidth.map(value => (
                  <option key={value} value={value}>{value}mm</option>
                ))}
              </select>
            )}
          </div>

          {/* Perf Length Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Perf Length (mm)</label>
            {useCustomValues && viewMode !== 'view' ? (
              <input
                type="number"
                value={customValues.perfLength}
                onChange={(e) => {
                  setCustomValues(prev => ({ ...prev, perfLength: e.target.value }));
                  setNewProduct({
                    ...newProduct,
                    settings: { ...newProduct.settings, perfLength: Number(e.target.value) }
                  });
                }}
                placeholder="Enter perf length..."
                step="0.1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            ) : (
              <select
                value={newProduct.settings?.perfLength}
                onChange={(e) => setNewProduct({
                  ...newProduct,
                  settings: { ...newProduct.settings, perfLength: Number(e.target.value) }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                disabled={viewMode === 'view'}
              >
                {PRESET_VALUES.perfLength.map(value => (
                  <option key={value} value={value}>{value}mm</option>
                ))}
              </select>
            )}
          </div>

          {/* Tissue Machine */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Tissue Machine</label>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-600">Unwind 1</label>
                <select
                  value={newProduct.settings?.tissueMachine?.unwind1}
                  onChange={(e) => setNewProduct({
                    ...newProduct,
                    settings: {
                      ...newProduct.settings,
                      tissueMachine: {
                        ...newProduct.settings?.tissueMachine,
                        unwind1: e.target.value
                      }
                    }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  disabled={viewMode === 'view'}
                >
                  {PRESET_VALUES.tissueMachine.map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600">Unwind 2</label>
                <select
                  value={newProduct.settings?.tissueMachine?.unwind2}
                  onChange={(e) => setNewProduct({
                    ...newProduct,
                    settings: {
                      ...newProduct.settings,
                      tissueMachine: {
                        ...newProduct.settings?.tissueMachine,
                        unwind2: e.target.value
                      }
                    }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  disabled={viewMode === 'view'}
                >
                  {PRESET_VALUES.tissueMachine.map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <h2 className="text-xl font-semibold flex-shrink-0">Product Settings</h2>
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={() => setShowConversionModal(true)}
              className="flex items-center gap-1 px-2 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              <SettingsIcon className="w-4 h-4" />
              <span>Conversion Factors</span>
            </button>
            <button 
              onClick={() => {
                setShowAddModal(true);
                setViewMode('edit');
              }}
              className="flex items-center gap-1 px-2 py-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product Line</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {folders.map(folder => (
            <div key={folder.id} className="select-none">
              <div
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer group"
                onClick={() => setExpandedFolder(expandedFolder === folder.id ? null : folder.id)}
              >
                {expandedFolder === folder.id ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
                <Folder className="w-5 h-5 text-indigo-500" />
                <span className="text-gray-700 flex-grow">{folder.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFolder(folder.id);
                    setEditingProduct(null);
                    setNewProduct(defaultProductSettings);
                    setViewMode('edit');
                    setShowProductModal(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-indigo-100 rounded transition-opacity mr-2"
                >
                  <Plus className="w-4 h-4 text-indigo-500" />
                </button>
                <button
                  onClick={(e) => handleDeleteClick(e, folder)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
              {expandedFolder === folder.id && (
                <div className="ml-9 mt-2 pl-2 border-l-2 border-gray-200">
                  {folder.products.length > 0 ? (
                    folder.products.map(product => (
                      <div 
                        key={product.id} 
                        className="flex items-center justify-between py-2 px-2 hover:bg-gray-50 rounded group"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleSetActive(e, folder.id, product.id)}
                            className={`p-1 rounded ${
                              product.isActive 
                                ? 'bg-green-100 text-green-600' 
                                : 'hover:bg-gray-100 text-gray-400'
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <span 
                            className="text-sm text-gray-700 cursor-pointer"
                            onClick={() => handleProductClick(folder.id, product)}
                          >
                            {product.name}
                          </span>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2">
                          <button
                            onClick={() => handleProductClick(folder.id, product)}
                            className="p-1 hover:bg-blue-100 rounded"
                          >
                            <Eye className="w-4 h-4 text-blue-500" />
                          </button>
                          <button
                            onClick={() => {
                              setProductToDelete({ folderId: folder.id, productId: product.id });
                              setShowDeleteProductModal(true);
                            }}
                            className="p-1 hover:bg-red-100 rounded"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No products added yet</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Folder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Product Line</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter product line name"
              className="w-full p-2 border rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFolder}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                disabled={!newFolderName.trim()}
              >
                Add Product Line
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Delete Product Line</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="mb-4">
              Are you sure you want to delete "{folderToDelete?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingProduct ? (
                  viewMode === 'view' ? 'View Product' : 'Edit Product'
                ) : 'Add New Product'}
              </h3>
              <div className="flex items-center gap-2">
                {editingProduct && viewMode === 'view' && (
                  <button
                    onClick={handleEditProduct}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    setEditingProduct(null);
                    setNewProduct(defaultProductSettings);
                    setViewMode('edit');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {renderProductForm()}

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowProductModal(false);
                  setEditingProduct(null);
                  setNewProduct(defaultProductSettings);
                  setViewMode('edit');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              {viewMode === 'edit' && (
                <button
                  onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Save className="w-5 h-5" />
                  <span>{editingProduct ? 'Update' : 'Save'} Product</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Modal */}
      {showDeleteProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Delete Product</h3>
              <button
                onClick={() => setShowDeleteProductModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="mb-4">
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteProductModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conversion Factors Modal */}
      {showConversionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Manage Conversion Factors</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSampleCalculator(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg" 
                >
                  <Calculator className="w-4 h-4" />
                  <span>Factor Generator</span>
                </button>
                <button
                  onClick={() => setShowConversionModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Add new factor form */}
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Factor</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Diameter (mm)</label>
                  <input
                    type="number"
                    value={newFactor.diameter || ''}
                    onChange={(e) => setNewFactor({ ...newFactor, diameter: Number(e.target.value) })}
                    className="w-full p-2 border rounded"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Perf Length (mm)</label>
                  <input
                    type="number"
                    value={newFactor.perfLength || ''}
                    onChange={(e) => setNewFactor({ ...newFactor, perfLength: Number(e.target.value) })}
                    className="w-full p-2 border rounded"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Factor</label>
                  <input
                    type="number"
                    value={newFactor.factor || ''}
                    onChange={(e) => setNewFactor({ ...newFactor, factor: Number(e.target.value) })}
                    className="w-full p-2 border rounded"
                    step="0.01"
                  />
                </div>
              </div>
              <button
                onClick={handleAddConversionFactor}
                disabled={!newFactor.diameter || !newFactor.perfLength || !newFactor.factor}
                className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Factor
              </button>
            </div>

            {/* Existing factors table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Diameter (mm)</th>
                    <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Perf Length (mm)</th>
                    <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Factor</th>
                    <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {conversionFactors.map((factor, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2">{factor.diameter}</td>
                      <td className="px-4 py-2">{factor.perfLength}</td>
                      <td className="px-4 py-2">{factor.factor}</td>
                      <td className="px-4 py-2 flex items-center gap-2">
                        <button
                          onClick={() => toggleFactorLock(index)}
                          className={`p-1 rounded ${
                            factor.isLocked
                              ? 'hover:bg-amber-100 text-amber-600'
                              : 'hover:bg-gray-100 text-gray-400'
                          }`}
                          title={factor.isLocked ? 'Unlock factor' : 'Lock factor'}
                        >
                          {factor.isLocked ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            if (!factor.isLocked) {
                              setFactorToDelete(index);
                              setShowDeleteFactorModal(true);
                            }
                          }}
                          className={`p-1 rounded ${
                            factor.isLocked
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-red-100 text-red-500'
                          }`}
                          disabled={factor.isLocked}
                          title={factor.isLocked ? 'Unlock to delete' : 'Delete factor'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete Factor Confirmation Modal */}
      {showDeleteFactorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Delete Conversion Factor</h3>
              <button
                onClick={() => setShowDeleteFactorModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="mb-4">
              Are you sure you want to delete this conversion factor? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteFactorModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteFactor}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sample Calculator Modal */}
      {showSampleCalculator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Sample Calculator</h3>
              <button
                onClick={() => setShowSampleCalculator(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter real-world samples to calculate an average conversion factor.
              </p>

              <div className="grid gap-4">
                {sampleData.map((sample, index) => (
                  <div key={index} className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Speed (MPM)
                      </label>
                      <input
                        type="number"
                        value={sample.speedMPM || ''}
                        onChange={(e) => handleSampleDataChange(index, 'speedMPM', e.target.value)}
                        className="w-full p-2 border rounded"
                        step="0.1"
                        placeholder="Enter speed..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Logs per Minute
                      </label>
                      <input
                        type="number"
                        value={sample.logsPerMin || ''}
                        onChange={(e) => handleSampleDataChange(index, 'logsPerMin', e.target.value)}
                        className="w-full p-2 border rounded"
                        step="0.1"
                        placeholder="Enter logs/min..."
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <button
                  onClick={calculateAverageFactor}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Calculate Average Factor
                </button>
                {calculatedFactor !== null && (
                  <div className="flex items-center gap-4">
                    <div className="text-lg font-semibold">
                      Factor: {calculatedFactor}
                    </div>
                    <button
                      onClick={applyCalculatedFactor}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Apply Factor
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}