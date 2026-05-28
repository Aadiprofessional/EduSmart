import React, { useState, useRef, useEffect } from 'react';
import { FaChevronRight, FaPlus, FaFolder, FaEllipsisH, FaPen, FaTrash } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { RenameModal, DeleteModal } from './DashboardModals';
import { useLanguage } from '../../utils/LanguageContext';

interface SidebarRightProps {
  className?: string;
  folders?: { id: string; name: string; count: number; color?: string }[];
  onCreateFolder?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  onMoveDocument?: (folderId: string | null, documentId: string) => void;
  selectedFolderId?: string | null;
  onSelectFolder?: (folderId: string | null) => void;
  onRenameFolder?: (folderId: string, newName: string) => void;
  onDeleteFolder?: (folderId: string) => void;
}

const SidebarRight: React.FC<SidebarRightProps> = ({ 
  className = '', 
  folders = [],
  onCreateFolder,
  isOpen = true,
  onClose,
  onMoveDocument,
  selectedFolderId = null,
  onSelectFolder,
  onRenameFolder,
  onDeleteFolder
}) => {
  const { t } = useLanguage();
  const [isFoldersOpen, setIsFoldersOpen] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  
  // Dropdown & Modal States
  const [activeDropdownFolderId, setActiveDropdownFolderId] = useState<string | null>(null);
  const [folderToRename, setFolderToRename] = useState<{ id: string, name: string } | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<{ id: string, name: string } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownFolderId(null);
      }
    };

    if (activeDropdownFolderId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdownFolderId]);

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    setDragOverFolderId(folderId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverFolderId(null);
  };

  const handleDrop = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    setDragOverFolderId(null);
    const documentId = e.dataTransfer.getData('documentId');
    if (documentId && onMoveDocument) {
      onMoveDocument(folderId, documentId);
    }
  };

  const handleRename = (newName: string) => {
    if (folderToRename && onRenameFolder) {
      onRenameFolder(folderToRename.id, newName);
      setFolderToRename(null);
    }
  };

  const handleDelete = () => {
    if (folderToDelete && onDeleteFolder) {
      onDeleteFolder(folderToDelete.id);
      setFolderToDelete(null);
    }
  };

  const colorVariants: Record<string, string> = {
    blue: 'text-blue-500 dark:text-blue-400',
    green: 'text-green-500 dark:text-green-400',
    purple: 'text-purple-500 dark:text-purple-400',
    orange: 'text-orange-500 dark:text-orange-400',
    red: 'text-red-500 dark:text-red-400',
    pink: 'text-pink-500 dark:text-pink-400',
    indigo: 'text-indigo-500 dark:text-indigo-400',
    teal: 'text-teal-500 dark:text-teal-400',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 288, opacity: 1 }} // 288px = w-72
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`bg-white dark:bg-[#111111] border-l border-gray-200 dark:border-white/10 p-6 flex flex-col h-full flex-shrink-0 overflow-hidden group text-gray-900 dark:text-white ${className}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex items-center justify-between mb-6 text-gray-500 dark:text-gray-400 overflow-hidden whitespace-nowrap">
             <span className="font-medium">{t('sidebar.folders')}</span>
             <button onClick={onClose} className="hover:text-gray-900 dark:hover:text-white" title={t('sidebar.closeSidebar')}>
                 <FaChevronRight size={16} />
             </button>
          </div>

          <div className="space-y-6 overflow-hidden">
                 <button 
                   onClick={onCreateFolder}
                   className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap shadow-sm"
                 >
                     <FaPlus size={12} />
                    <span>{t('sidebar.createNewFolder')}</span>
                 </button>

                 <div 
                  onClick={() => onSelectFolder?.(null)}
                  onDragOver={(e) => handleDragOver(e, 'all')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, null)}
                  className={`bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-gray-300 dark:hover:border-white/20 transition-colors whitespace-nowrap ${selectedFolderId === null ? 'ring-2 ring-inset ring-indigo-500' : ''} ${dragOverFolderId === 'all' ? 'bg-indigo-100 dark:bg-indigo-900/20 border-indigo-500' : ''}`}
                >
                    <FaFolder className="text-gray-400 flex-shrink-0" />
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{t('sidebar.allStudySets')}</p>
                    </div>
                </div>

                {folders.length === 0 ? (
                  <div className="text-center py-12">
                      <FaFolder size={48} className="text-gray-300 dark:text-[#333] mx-auto mb-4" />
                      <p className="text-sm text-gray-500 mb-1">{t('sidebar.noFoldersYet')}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-600">{t('sidebar.createFirstFolder')}</p>
                  </div>
                ) : (
                  <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-300px)] custom-scrollbar">
                    {folders.map(folder => (
                      <div 
                        key={folder.id} 
                        onClick={() => onSelectFolder?.(folder.id)}
                        onDragOver={(e) => handleDragOver(e, folder.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, folder.id)}
                        className={`group/folder relative flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap ${selectedFolderId === folder.id ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white' : ''} ${dragOverFolderId === folder.id ? 'bg-indigo-100 dark:bg-indigo-900/20' : ''}`}
                      >
                         <FaFolder className={`${folder.color ? colorVariants[folder.color] || 'text-gray-400' : 'text-gray-400'} flex-shrink-0`} />
                         <span className="text-sm flex-1 truncate">{folder.name}</span>
                         <span className="text-xs opacity-50 flex-shrink-0">{folder.count}</span>
                         
                         {/* Dropdown Trigger */}
                         <div className="relative" ref={activeDropdownFolderId === folder.id ? dropdownRef : undefined}>
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               setActiveDropdownFolderId(activeDropdownFolderId === folder.id ? null : folder.id);
                             }}
                             className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 ${activeDropdownFolderId === folder.id ? 'opacity-100' : 'opacity-0 group-hover/folder:opacity-100'} transition-opacity`}
                           >
                             <FaEllipsisH size={12} />
                           </button>

                           {/* Dropdown Menu */}
                           {activeDropdownFolderId === folder.id && (
                             <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-200 dark:border-white/10 py-1 z-50">
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setFolderToRename(folder);
                                   setActiveDropdownFolderId(null);
                                 }}
                                 className="w-full px-3 py-1.5 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-2"
                               >
                                 <FaPen size={10} />
                                 {t('sidebar.rename')}
                               </button>
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setFolderToDelete(folder);
                                   setActiveDropdownFolderId(null);
                                 }}
                                 className="w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                               >
                                 <FaTrash size={10} />
                                 {t('common.delete')}
                               </button>
                             </div>
                           )}
                         </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
        </motion.aside>
      )}

      {/* Rename Folder Modal */}
      {folderToRename && (
        <RenameModal
          isOpen={!!folderToRename}
          onClose={() => setFolderToRename(null)}
          onRename={handleRename}
          currentName={folderToRename.name}
          title={t('sidebar.renameFolder')}
        />
      )}

      {/* Delete Folder Modal */}
      {folderToDelete && (
        <DeleteModal
          isOpen={!!folderToDelete}
          onClose={() => setFolderToDelete(null)}
          onConfirm={handleDelete}
          title={t('sidebar.deleteFolder')}
          message={t('sidebar.deleteFolderMessage', { values: { folderName: folderToDelete.name } })}
        />
      )}
    </AnimatePresence>
  );
};

export default SidebarRight;
