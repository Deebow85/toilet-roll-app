import React, { useState, useEffect } from 'react';
import { Plus, X, Save, Edit, Copy, Trash2, Search, Filter, ChevronDown } from 'lucide-react';

interface SettingField {
  id: string;
  name: string;
  type: 'number' | 'text' | 'select';
  unit?: string;
  options?: string[];
}

interface SettingValue {
  fieldId: string;
  value: string | number;
}

interface SettingsTemplate {
  id: string;
  name: string;
  folderId?: string;
  fields: SettingField[];
}

interface SettingsFolder {
  id: string;
  name: string;
  createdAt: string;
}

interface SavedSettings {
  id: string;
  templateId: string;
  folderId?: string;
  title: string;
  date: string;
  values: SettingValue[];
}

const STORAGE_KEY_TEMPLATES = 'settingsTemplates';
const STORAGE_KEY_SETTINGS = 'savedSettings';
const STORAGE_KEY_FOLDERS = 'settingsFolders';

export default function BestSettings() {
  const [templates, setTemplates] = useState<SettingsTemplate[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_TEMPLATES);
    return stored ? JSON.parse(stored) : [];
  });

  const [folders, setFolders] = useState<SettingsFolder[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_FOLDERS);
    return stored ? JSON.parse(stored) : [];
  });

  const [savedSettings, setSavedSettings] = useState<SavedSettings[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
    return stored ? JSON.parse(stored) : [];
  });

  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SettingsTemplate | null>(null);
  const [newField, setNewField] = useState<Partial<SettingField>>({});
  const [templateFields, setTemplateFields] = useState<SettingField[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [settingsValues, setSettingsValues] = useState<SettingValue[]>([]);
  const [settingsTitle, setSettingsTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateFilter, setSelectedTemplateFilter] = useState<string>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'template' | 'settings' | 'folder' } | null>(null);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates));
  }, [templates]);
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(savedSettings));
  }, [savedSettings]);

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      const newFolder: SettingsFolder = {
        id: `folder-${Date.now()}`,
        name: newFolderName.trim(),
        createdAt: new Date().toISOString()
      };
      setFolders(prev => [...prev, newFolder]);
      setNewFolderName('');
      setShowFolderModal(false);
    }
  };

  const handleAddField = () => {
    if (newField.name && newField.type) {
      const field: SettingField = {
        id: `field-${Date.now()}`,
        name: newField.name,
        type: newField.type as 'number' | 'text' | 'select',
        unit: newField.unit,
        options: newField.type === 'select' ? newField.options : undefined
      };
      setTemplateFields([...templateFields, field]);
      setNewField({});
    }
  };

  const handleSaveTemplate = () => {
    if (templateName && templateFields.length > 0) {
      const template: SettingsTemplate = {
        id: `template-${Date.now()}`,
        name: templateName,
        folderId: selectedFolder === 'all' ? undefined : selectedFolder,
        fields: templateFields
      };
      setTemplates([...templates, template]);
      setShowTemplateModal(false);
      setTemplateName('');
      setTemplateFields([]);
    }
  };

  const handleSaveSettings = () => {
    if (selectedTemplate && settingsTitle && settingsValues.length > 0) {
      const settings: SavedSettings = {
        id: `settings-${Date.now()}`,
        templateId: selectedTemplate.id,
        folderId: selectedFolder === 'all' ? undefined : selectedFolder,
        title: settingsTitle,
        date: new Date().toISOString(),
        values: settingsValues
      };
      setSavedSettings([...savedSettings, settings]);
      setShowSettingsModal(false);
      setSettingsTitle('');
      setSettingsValues([]);
      setSelectedTemplate(null);
    }
  };

  const handleDelete = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'template') {
      // Delete template and its settings
      setTemplates(prev => prev.filter(t => t.id !== itemToDelete.id));
      // Also delete all settings using this template
      setSavedSettings(prev => prev.filter(s => s.templateId !== itemToDelete.id));
    } else if (itemToDelete.type === 'folder') {
      // Delete folder, its templates, and settings
      setFolders(prev => prev.filter(f => f.id !== itemToDelete.id));
      setTemplates(prev => prev.filter(t => t.folderId !== itemToDelete.id));
      setSavedSettings(prev => prev.filter(s => s.folderId !== itemToDelete.id));
    } else {
      setSavedSettings(prev => prev.filter(s => s.id !== itemToDelete.id));
    }

    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const handleDuplicate = (settings: SavedSettings) => {
    const duplicate: SavedSettings = {
      ...settings,
      id: `settings-${Date.now()}`,
      date: new Date().toISOString(),
      title: `${settings.title} (Copy)`
    };
    setSavedSettings([...savedSettings, duplicate]);
  };

  const filteredSettings = savedSettings.filter(settings => {
    if (selectedTemplateFilter !== 'all' && settings.templateId !== selectedTemplateFilter) {
      return false;
    }
    
    if (selectedFolder !== 'all') {
      const template = templates.find(t => t.id === settings.templateId);
      if (settings.folderId !== selectedFolder) {
        return false;
      }
    }

    if (!searchQuery) return true;

    const template = templates.find(t => t.id === settings.templateId);
    const searchTerms = searchQuery.toLowerCase().split(' ');

    return searchTerms.every(term => 
      settings.title.toLowerCase().includes(term) ||
      template?.name.toLowerCase().includes(term) ||
      settings.values.some(v => {
        const field = template?.fields.find(f => f.id === v.fieldId);
        return field?.name.toLowerCase().includes(term) ||
               v.value.toString().toLowerCase().includes(term);
      })
    );
  });

  return (
    <div className="p-4">
      <div className="grid grid-cols-4 gap-6">
        {/* Folders Sidebar */}
        <div className="col-span-1 bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700">Folders</h3>
            <button
              onClick={() => setShowFolderModal(true)}
              className="p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          <div className="space-y-1">
            <button
              onClick={() => setSelectedFolder('all')}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-sm ${
                selectedFolder === 'all'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span>All Folders</span>
            </button>
            {folders.map(folder => (
              <div key={folder.id} className="group">
                <div
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                    selectedFolder === folder.id
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  } cursor-pointer`}
                >
                  <span>{folder.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setItemToDelete({ id: folder.id, type: 'folder' });
                      setShowDeleteModal(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-3 bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Best Settings</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTemplateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="w-5 h-5" />
                <span>New Template</span>
              </button>
              <button
                onClick={() => {
                  if (templates.length === 0) {
                    alert('Please create a template first');
                    return;
                  }
                  setShowSettingsModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Save className="w-5 h-5" />
                <span>Save Settings</span>
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="mb-6">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search settings..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-base focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilterModal(true)}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <Filter className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Settings List */}
          <div className="space-y-4">
            {filteredSettings.map(settings => {
              const template = templates.find(t => t.id === settings.templateId);
              if (!template) return null;

              return (
                <div
                  key={settings.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{settings.title}</h3>
                      <p className="text-sm text-gray-500">
                        Template: {template.name} • Saved: {new Date(settings.date).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDuplicate(settings)}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => {
                          setItemToDelete({ id: settings.id, type: 'settings' });
                          setShowDeleteModal(true);
                        }}
                        className="p-1 hover:bg-red-100 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {settings.values.map(value => {
                      const field = template.fields.find(f => f.id === value.fieldId);
                      if (!field) return null;

                      return (
                        <div key={field.id} className="bg-gray-50 p-3 rounded">
                          <div className="text-sm text-gray-500">{field.name}</div>
                          <div className="font-medium">
                            {value.value}
                            {field.unit && <span className="text-gray-500 ml-1">{field.unit}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {filteredSettings.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No settings found. {templates.length === 0 ? 'Create a template to get started!' : 'Save some settings!'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create New Folder</h3>
              <button
                onClick={() => setShowFolderModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter folder name..."
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowFolderModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Create New Template</h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Template Name */}
              <div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Enter template name..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Folder (Optional)
                    </label>
                    <select
                      value={selectedFolder}
                      onChange={(e) => setSelectedFolder(e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="all">No Folder</option>
                      {folders.map(folder => (
                        <option key={folder.id} value={folder.id}>{folder.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Add Field Form */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Field</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Field Name</label>
                    <input
                      type="text"
                      value={newField.name || ''}
                      onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                      className="w-full p-2 border rounded"
                      placeholder="Enter field name..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Field Type</label>
                    <select
                      value={newField.type || ''}
                      onChange={(e) => setNewField({ ...newField, type: e.target.value as any })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select type...</option>
                      <option value="number">Number</option>
                      <option value="text">Text</option>
                      <option value="select">Select</option>
                    </select>
                  </div>
                  {newField.type === 'number' && (
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Unit (optional)</label>
                      <input
                        type="text"
                        value={newField.unit || ''}
                        onChange={(e) => setNewField({ ...newField, unit: e.target.value })}
                        className="w-full p-2 border rounded"
                        placeholder="e.g., mm, kg, etc."
                      />
                    </div>
                  )}
                  {newField.type === 'select' && (
                    <div className="col-span-2">
                      <label className="block text-sm text-gray-600 mb-1">Options (comma-separated)</label>
                      <input
                        type="text"
                        value={newField.options?.join(', ') || ''}
                        onChange={(e) => setNewField({
                          ...newField,
                          options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        })}
                        className="w-full p-2 border rounded"
                        placeholder="Option 1, Option 2, Option 3..."
                      />
                    </div>
                  )}
                </div>
                <button
                  onClick={handleAddField}
                  disabled={!newField.name || !newField.type}
                  className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Field
                </button>
              </div>

              {/* Fields List */}
              {templateFields.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Template Fields</h4>
                  <div className="space-y-2">
                    {templateFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded"
                      >
                        <div>
                          <div className="font-medium">{field.name}</div>
                          <div className="text-sm text-gray-500">
                            Type: {field.type}
                            {field.unit && ` • Unit: ${field.unit}`}
                            {field.options && ` • Options: ${field.options.join(', ')}`}
                          </div>
                        </div>
                        <button
                          onClick={() => setTemplateFields(prev => prev.filter((_, i) => i !== index))}
                          className="p-1 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={!templateName || templateFields.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Save Settings</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Template
                </label>
                <select
                  value={selectedTemplate?.id || ''}
                  onChange={(e) => {
                    const template = templates.find(t => t.id === e.target.value);
                    setSelectedTemplate(template || null);
                    setSettingsValues([]);
                  }}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select a template...</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTemplate && (
                <>
                  {/* Settings Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Settings Title
                    </label>
                    <input
                      type="text"
                      value={settingsTitle}
                      onChange={(e) => setSettingsTitle(e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Enter a title for these settings..."
                    />
                  </div>

                  {/* Fields */}
                  <div className="space-y-4">
                    {selectedTemplate.fields.map(field => (
                      <div key={field.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.name}
                        </label>
                        {field.type === 'select' ? (
                          <select
                            value={settingsValues.find(v => v.fieldId === field.id)?.value || ''}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              setSettingsValues(prev => {
                                const existing = prev.find(v => v.fieldId === field.id);
                                if (existing) {
                                  return prev.map(v => v.fieldId === field.id ? { ...v, value: newValue } : v);
                                }
                                return [...prev, { fieldId: field.id, value: newValue }];
                              });
                            }}
                            className="w-full p-2 border rounded"
                          >
                            <option value="">Select...</option>
                            {field.options?.map(option => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="relative">
                            <input
                              type={field.type}
                              value={settingsValues.find(v => v.fieldId === field.id)?.value || ''}
                              onChange={(e) => {
                                const newValue = field.type === 'number' 
                                  ? parseFloat(e.target.value) || 0
                                  : e.target.value;
                                setSettingsValues(prev => {
                                  const existing = prev.find(v => v.fieldId === field.id);
                                  if (existing) {
                                    return prev.map(v => v.fieldId === field.id ? { ...v, value: newValue } : v);
                                  }
                                  return [...prev, { fieldId: field.id, value: newValue }];
                                });
                              }}
                              className="w-full p-2 border rounded"
                              placeholder={`Enter ${field.name.toLowerCase()}...`}
                            />
                            {field.unit && (
                              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                {field.unit}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={!selectedTemplate || !settingsTitle || settingsValues.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Filter Settings</h3>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <select
              value={selectedTemplateFilter}
              onChange={(e) => {
                setSelectedTemplateFilter(e.target.value);
                setShowFilterModal(false);
              }}
              className="w-full p-3 border rounded-xl text-base mb-4"
            >
              <option value="all">All Templates</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Delete {itemToDelete?.type.charAt(0).toUpperCase() + itemToDelete?.type.slice(1)}
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="mb-4">
              Are you sure you want to delete this {itemToDelete?.type}? 
              {itemToDelete?.type === 'folder' && ' This will also delete all templates and settings in this folder.'}
              {itemToDelete?.type === 'template' && ' This will also delete all settings using this template.'}
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}