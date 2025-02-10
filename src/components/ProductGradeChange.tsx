import React, { useState, useMemo } from 'react';
import { Folder, FolderPlus, File, FileText, FileSpreadsheet, Image, X, Plus, ChevronRight, ChevronDown, Trash2, Search, Camera, Upload, Filter, CheckSquare, Check, Square } from 'lucide-react';

type FileType = 'doc' | 'excel' | 'image' | 'note' | 'checklist';

interface ChecklistItem {
  task: string;
  value: string;
  done: boolean;
}

interface FileItem {
  id: string;
  name: string;
  type: FileType;
  content?: string;
  checklist?: ChecklistItem[];
  url?: string;
}

interface Folder {
  id: string;
  name: string;
  subfolders: Folder[];
  files: FileItem[];
}

export default function ProductGradeChange() {
  const [folders, setFolders] = useState<Folder[]>([
    {
      id: '1',
      name: 'Grade Change Procedures',
      subfolders: [
        { id: '1-1', name: 'Standard Grades', subfolders: [], files: [] },
        { id: '1-2', name: 'Special Grades', subfolders: [], files: [] }
      ],
      files: []
    },
    {
      id: '2',
      name: 'Product Settings',
      subfolders: [
        { id: '2-1', name: 'Core Sizes', subfolders: [], files: [] },
        { id: '2-2', name: 'Roll Sizes', subfolders: [], files: [] }
      ],
      files: []
    },
    {
      id: '3',
      name: 'Quality Standards',
      subfolders: [
        { id: '3-1', name: 'Specifications', subfolders: [], files: [] },
        { id: '3-2', name: 'Testing Procedures', subfolders: [], files: [] }
      ],
      files: []
    }
  ]);

  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<FileType>('note');
  const [newFileContent, setNewFileContent] = useState('');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'folder' | 'file' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string | 'all'>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [editingChecklist, setEditingChecklist] = useState<ChecklistItem[]>([]);
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;

    const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 0);
    const results: { folderId: string; item: FileItem; matchType: 'title' | 'content' | 'both' }[] = [];

    const searchInFolder = (folder: Folder) => {
      if (selectedFolderFilter !== 'all' && !folder.id.startsWith(selectedFolderFilter)) {
        return;
      }

      folder.files.forEach(file => {
        const titleMatch = searchTerms.some(term => file.name.toLowerCase().includes(term));
        const contentMatch = file.content && searchTerms.some(term => file.content?.toLowerCase().includes(term));

        if (titleMatch || contentMatch) {
          results.push({
            folderId: folder.id,
            item: file,
            matchType: titleMatch && contentMatch ? 'both' : titleMatch ? 'title' : 'content'
          });
        }
      });

      folder.subfolders.forEach(subfolder => searchInFolder(subfolder));
    };

    folders.forEach(folder => searchInFolder(folder));
    return results;
  }, [folders, searchQuery, selectedFolderFilter]);

  const getFolderPath = (folderId: string): string => {
    const parts: string[] = [];
    
    const findFolder = (folders: Folder[], targetId: string): boolean => {
      for (const folder of folders) {
        if (folder.id === targetId) {
          parts.unshift(folder.name);
          return true;
        }
        if (findFolder(folder.subfolders, targetId)) {
          parts.unshift(folder.name);
          return true;
        }
      }
      return false;
    };

    folders.forEach(folder => findFolder([folder], folderId));
    return parts.join(' / ');
  };

  const handleMobileFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    let fileType: FileType = 'note';
    if (file.type.startsWith('image/')) fileType = 'image';
    else if (file.type.includes('sheet')) fileType = 'excel';
    else if (file.type.includes('document')) fileType = 'doc';

    setNewFileType(fileType);
    setNewFileName(file.name);
    setShowNewFileModal(true);
    setIsUploading(true);

    setTimeout(() => {
      setIsUploading(false);
    }, 1000);
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev =>
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const handleAddMainFolder = () => {
    const newFolder: Folder = {
      id: `main-${folders.length + 1}`,
      name: newFolderName.trim(),
      subfolders: [],
      files: []
    };
    setFolders([...folders, newFolder]);
    setNewFolderName('');
    setShowNewFolderModal(false);
  };

  const handleAddFolder = () => {
    if (!selectedFolderId || !newFolderName.trim()) return;

    const updateFolders = (folders: Folder[]): Folder[] => {
      return folders.map(folder => {
        if (folder.id === selectedFolderId) {
          return {
            ...folder,
            subfolders: [
              ...folder.subfolders,
              {
                id: `${folder.id}-${folder.subfolders.length + 1}`,
                name: newFolderName.trim(),
                subfolders: [],
                files: []
              }
            ]
          };
        }
        return {
          ...folder,
          subfolders: updateFolders(folder.subfolders)
        };
      });
    };

    setFolders(updateFolders(folders));
    setNewFolderName('');
    setShowNewFolderModal(false);
  };

  const handleAddFile = () => {
    if (!selectedFolderId || !newFileName.trim()) return;

    const updateFolders = (folders: Folder[]): Folder[] => {
      return folders.map(folder => {
        if (folder.id === selectedFolderId) {
          return {
            ...folder,
            files: [
              ...folder.files,
              {
                id: `file-${folder.files.length + 1}`,
                name: newFileName.trim(),
                type: newFileType,
                content: newFileType === 'checklist' ? JSON.stringify(checklistItems) : newFileContent,
                checklist: newFileType === 'checklist' ? checklistItems : undefined
              }
            ]
          };
        }
        return {
          ...folder,
          subfolders: updateFolders(folder.subfolders)
        };
      });
    };

    setFolders(updateFolders(folders));
    setNewFileName('');
    setNewFileType('note');
    setNewFileContent('');
    setChecklistItems([]);
    setShowNewFileModal(false);
  };

  const handleAddChecklistItem = () => {
    setChecklistItems(prev => [...prev, { task: '', value: '', done: false }]);
  };

  const handleUpdateChecklistItem = (index: number, field: keyof ChecklistItem, value: string | boolean) => {
    setChecklistItems(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklistItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleDelete = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'folder') {
      if (itemToDelete.id.startsWith('main-')) {
        setFolders(folders.filter(f => f.id !== itemToDelete.id));
      } else {
        const updateFolders = (folders: Folder[]): Folder[] => {
          return folders.map(folder => ({
            ...folder,
            subfolders: folder.subfolders
              .filter(sf => sf.id !== itemToDelete.id)
              .map(sf => ({
                ...sf,
                subfolders: updateFolders(sf.subfolders)
              }))
          }));
        };
        setFolders(updateFolders(folders));
      }
    } else {
      const updateFolders = (folders: Folder[]): Folder[] => {
        return folders.map(folder => ({
          ...folder,
          files: folder.files.filter(f => f.id !== itemToDelete.id),
          subfolders: updateFolders(folder.subfolders)
        }));
      };
      setFolders(updateFolders(folders));
    }

    setShowDeleteConfirmModal(false);
    setItemToDelete(null);
  };

  const getFileIcon = (type: FileType) => {
    switch (type) {
      case 'doc':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'excel':
        return <FileSpreadsheet className="w-4 h-4 text-green-500" />;
      case 'image':
        return <Image className="w-4 h-4 text-purple-500" />;
      case 'checklist':
        return <CheckSquare className="w-4 h-4 text-amber-500" />;
      case 'note':
        return <File className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'checklist') {
      setSelectedFile(file);
      setEditingChecklist(file.checklist || []);
      setShowChecklistModal(true);
      setIsEditingExisting(true);
    }
  };

  const handleSaveExistingChecklist = () => {
    if (!selectedFile) return;

    const updateFolders = (folders: Folder[]): Folder[] => {
      return folders.map(folder => ({
        ...folder,
        files: folder.files.map(file => 
          file.id === selectedFile.id
            ? {
                ...file,
                checklist: editingChecklist,
                content: JSON.stringify(editingChecklist)
              }
            : file
        ),
        subfolders: updateFolders(folder.subfolders)
      }));
    };

    setFolders(updateFolders(folders));
    setShowChecklistModal(false);
    setSelectedFile(null);
    setEditingChecklist([]);
    setIsEditingExisting(false);
  };

  const handleResetChecklist = () => {
    if (!selectedFile?.checklist) return;
    
    setEditingChecklist(selectedFile.checklist.map(item => ({ ...item, done: false })));
  };

  const handleToggleChecklistItem = (index: number) => {
    setEditingChecklist(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, done: !item.done } : item
      )
    );
  };

  const renderFolder = (folder: Folder, level: number = 0) => {
    const isExpanded = expandedFolders.includes(folder.id);

    return (
      <div key={folder.id} className="select-none">
        <div
          className={`flex items-center space-x-1 p-1.5 hover:bg-gray-100 rounded cursor-pointer ${
            level > 0 ? 'ml-4' : ''
          }`}
          onClick={() => toggleFolder(folder.id)}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
          <Folder className="w-4 h-4 text-indigo-500" />
          <span className="text-sm">{folder.name}</span>
          <div className="flex-grow" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFolderId(folder.id);
              setShowNewFolderModal(true);
            }}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <FolderPlus className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFolderId(folder.id);
              setShowNewFileModal(true);
            }}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <Plus className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setItemToDelete({ id: folder.id, type: 'folder' });
              setShowDeleteConfirmModal(true);
            }}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
        {isExpanded && (
          <div className="ml-4">
            {folder.files.map(file => (
              <div
                key={file.id}
                className="flex items-center space-x-2 p-1.5 hover:bg-gray-100 rounded cursor-pointer group"
                onClick={() => handleFileClick(file)}
              >
                {getFileIcon(file.type)}
                <span className="text-sm">{file.name}</span>
                <div className="flex-grow" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setItemToDelete({ id: file.id, type: 'file' });
                    setShowDeleteConfirmModal(true);
                  }}
                  className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}
            {folder.subfolders.map(subfolder => renderFolder(subfolder, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-md">
        {/* Search Section */}
        <div className="p-3 border-b">
          <div className="flex flex-col space-y-2">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search files..."
                  className="w-full pl-10 pr-4 py-3 border rounded-lg text-base focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilterModal(true)}
                className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 touch-manipulation"
              >
                <Filter className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults && searchResults.length > 0 && (
            <div className="mt-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Results ({searchResults.length})</h3>
              <div className="space-y-2">
                {searchResults.map(({ folderId, item, matchType }) => (
                  <div
                    key={item.id}
                    className="p-3 bg-gray-50 rounded-lg active:bg-gray-200 touch-manipulation"
                  >
                    <div className="flex items-start space-x-3">
                      {getFileIcon(item.type)}
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-medium truncate">{item.name}</div>
                        <div className="text-sm text-gray-500 truncate">{getFolderPath(folderId)}</div>
                        {matchType !== 'title' && item.content && (
                          <div className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {item.content}
                          </div>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {matchType === 'title' && (
                            <span className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">Title match</span>
                          )}
                          {matchType === 'content' && (
                            <span className="px-2 py-1 text-sm bg-green-100 text-green-800 rounded-full">Content match</span>
                          )}
                          {matchType === 'both' && (
                            <span className="px-2 py-1 text-sm bg-purple-100 text-purple-800 rounded-full">Title & Content</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchQuery && searchResults && searchResults.length === 0 && (
            <div className="mt-4 p-4 text-base text-gray-500 text-center bg-gray-50 rounded-lg">
              No results found for "{searchQuery}"
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="p-3 border-b">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                setSelectedFolderId(null);
                setShowNewFolderModal(true);
              }}
              className="flex flex-col items-center p-3 bg-indigo-50 rounded-lg active:bg-indigo-100 touch-manipulation"
            >
              <FolderPlus className="w-6 h-6 text-indigo-600 mb-1" />
              <span className="text-xs text-center">New Folder</span>
            </button>

            <label className="flex flex-col items-center p-3 bg-green-50 rounded-lg active:bg-green-100 touch-manipulation">
              <Upload className="w-6 h-6 text-green-600 mb-1" />
              <span className="text-xs text-center">Upload</span>
              <input
                type="file"
                onChange={handleMobileFileUpload}
                className="hidden"
                accept="image/*,.doc,.docx,.xls,.xlsx,.pdf,text/*"
              />
            </label>

            <button
              onClick={() => {
                setNewFileType('image');
                setShowNewFileModal(true);
              }}
              className="flex flex-col items-center p-3 bg-purple-50 rounded-lg active:bg-purple-100 touch-manipulation"
            >
              <Camera className="w-6 h-6 text-purple-600 mb-1" />
              <span className="text-xs text-center">Camera</span>
            </button>
          </div>
        </div>

        {/* Folder Structure */}
        <div className="p-3">
          {folders.map(folder => renderFolder(folder))}
        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-40">
          <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Search Filters</h3>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <select
              value={selectedFolderFilter}
              onChange={(e) => {
                setSelectedFolderFilter(e.target.value);
                setShowFilterModal(false);
              }}
              className="w-full p-3 border rounded-xl text-base mb-4"
            >
              <option value="all">All Folders</option>
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>{folder.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {selectedFolderId ? 'New Subfolder' : 'New Main Folder'}
              </h3>
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={selectedFolderId ? handleAddFolder : handleAddMainFolder}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New File Modal */}
      {showNewFileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">New File</h3>
              <button
                onClick={() => setShowNewFileModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="File name"
              className="w-full p-2 border rounded mb-4"
            />
            <select
              value={newFileType}
              onChange={(e) => setNewFileType(e.target.value as FileType)}
              className="w-full p-2 border rounded mb-4"
            >
              <option value="note">Note</option>
              <option value="doc">Word Document</option>
              <option value="excel">Excel Spreadsheet</option>
              <option value="image">Image</option>
              <option value="checklist">Checklist</option>
            </select>
            
            {newFileType === 'note' && (
              <textarea
                value={newFileContent}
                onChange={(e) => setNewFileContent(e.target.value)}
                placeholder="Note content"
                className="w-full h-32 p-2 border rounded mb-4 resize-none"
              />
            )}

            {newFileType === 'checklist' && (
              <div className="mb-4">
                <div className="space-y-3">
                  {checklistItems.map((item, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={item.task}
                          onChange={(e) => handleUpdateChecklistItem(index, 'task', e.target.value)}
                          placeholder="Task description"
                          className="w-full p-2 border rounded text-sm"
                        />
                        <input
                          type="text"
                          value={item.value}
                          onChange={(e) => handleUpdateChecklistItem(index, 'value', e.target.value)}
                          placeholder="Value"
                          className="w-full p-2 border rounded text-sm"
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveChecklistItem(index)}
                        className="p-1 hover:bg-red-100 rounded"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleAddChecklistItem}
                  className="mt-3 w-full p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Checklist Item</span>
                </button>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowNewFileModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFile}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Confirm Delete</h3>
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="mb-4">
              Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
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

      {/* Checklist View/Edit Modal */}
      {showChecklistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {selectedFile?.name || 'Checklist'}
              </h3>
              <div className="flex items-center space-x-2">
                {isEditingExisting && (
                  <button
                    onClick={handleResetChecklist}
                    className="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                                    Reset All
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowChecklistModal(false);
                    setSelectedFile(null);
                    setEditingChecklist([]);
                    setIsEditingExisting(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {editingChecklist.map((item, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <button
                    onClick={() => handleToggleChecklistItem(index)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {item.done ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <div className="flex-1 space-y-1">
                    <div className="font-medium">{item.task}</div>
                    <div className="text-sm text-gray-600">Value: {item.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {isEditingExisting && (
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleSaveExistingChecklist}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}