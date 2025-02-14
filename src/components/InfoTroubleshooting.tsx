import React, { useState, useMemo } from 'react';
import { Folder, FolderPlus, File, FileText, FileSpreadsheet, Image, X, Plus, ChevronRight, ChevronDown, Trash2, Search, Camera, Upload, Filter } from 'lucide-react';

const STORAGE_KEY = 'infoTroubleshootingData';

type FileType = 'doc' | 'excel' | 'image' | 'note';

interface FileItem {
  id: string;
  name: string;
  type: FileType;
  content?: string;
  url?: string;
}

interface Folder {
  id: string;
  name: string;
  subfolders: Folder[];
  files: FileItem[];
}

export default function InfoTroubleshooting() {
  const [folders, setFolders] = useState<Folder[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

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
  const [showNoteViewModal, setShowNoteViewModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<FileItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  // Search functionality
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
                content: newFileContent
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
    setShowNewFileModal(false);
  };

  const handleDelete = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'folder') {
      // Delete main folder
      if (itemToDelete.id.startsWith('main-')) {
        setFolders(folders.filter(f => f.id !== itemToDelete.id));
      } else {
        // Delete subfolder
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
      // Delete file
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
      case 'note':
        return <File className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'note') {
      setSelectedNote(file);
      setEditedContent(file.content || '');
      setShowNoteViewModal(true);
    }
  };

  const handleSaveEdit = () => {
    if (!selectedNote) return;

    const updateFolders = (folders: Folder[]): Folder[] => {
      return folders.map(folder => ({
        ...folder,
        files: folder.files.map(file => 
          file.id === selectedNote.id
            ? { ...file, content: editedContent }
            : file
        ),
        subfolders: updateFolders(folder.subfolders)
      }));
    };

    setFolders(updateFolders(folders));
    setIsEditing(false);
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
                  onClick={() => {
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
                      {item.type === 'doc' && <FileText className="w-5 h-5 text-blue-500 mt-1" />}
                      {item.type === 'excel' && <FileSpreadsheet className="w-5 h-5 text-green-500 mt-1" />}
                      {item.type === 'image' && <Image className="w-5 h-5 text-purple-500 mt-1" />}
                      {item.type === 'note' && <File className="w-5 h-5 text-gray-500 mt-1" />}
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
            </select>
            {newFileType === 'note' && (
              <textarea
                value={newFileContent}
                onChange={(e) => setNewFileContent(e.target.value)}
                placeholder="Note content"
                className="w-full h-32 p-2 border rounded mb-4 resize-none"
              />
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

      {/* Note View Modal */}
      {showNoteViewModal && selectedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold">{selectedNote.name}</h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                  >
                    Edit Note
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isEditing && (
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Save Changes
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowNoteViewModal(false);
                    setSelectedNote(null);
                    setIsEditing(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-96 p-4 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap h-96 overflow-y-auto">
                {selectedNote.content}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}