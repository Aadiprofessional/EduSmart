import React, { useState } from 'react';
import { FaChevronRight, FaPlus, FaFolder } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarRightProps {
  className?: string;
  folders?: { id: string; name: string; count: number; color?: string }[];
  onCreateFolder?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  onMoveDocument?: (folderId: string | null, documentId: string) => void;
  selectedFolderId?: string | null;
  onSelectFolder?: (folderId: string | null) => void;
}

const SidebarRight: React.FC<SidebarRightProps> = ({ 
  className = '', 
  folders = [],
  onCreateFolder,
  isOpen = true,
  onClose,
  onMoveDocument,
  selectedFolderId = null,
  onSelectFolder
}) => {
  const [isFoldersOpen, setIsFoldersOpen] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 288, opacity: 1 }} // 288px = w-72
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`bg-white dark:bg-[#111111] border-l border-gray-200 dark:border-white/10 p-6 flex flex-col h-full flex-shrink-0 group text-gray-900 dark:text-white ${className}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex items-center justify-between mb-6 text-gray-500 dark:text-gray-400 overflow-hidden whitespace-nowrap">
             <span className="font-medium">Folders</span>
             <button onClick={onClose} className="hover:text-gray-900 dark:hover:text-white" title="Close Sidebar">
                 <FaChevronRight size={16} />
             </button>
          </div>

          <div className="space-y-6 overflow-hidden">
                 <button 
                   onClick={onCreateFolder}
                   className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap shadow-sm"
                 >
                     <FaPlus size={12} />
                     <span>Create New Folder</span>
                 </button>

                 <div 
                   onClick={() => onSelectFolder?.(null)}
                   onDragOver={(e) => handleDragOver(e, 'all')}
                   onDragLeave={handleDragLeave}
                   onDrop={(e) => handleDrop(e, null)}
                   className={`bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-gray-300 dark:hover:border-white/20 transition-colors whitespace-nowrap ${selectedFolderId === null ? 'ring-2 ring-blue-500' : ''} ${dragOverFolderId === 'all' ? 'bg-blue-100 dark:bg-blue-900/20 border-blue-500' : ''}`}
                 >
                     <FaFolder className="text-gray-400 flex-shrink-0" />
                     <div className="flex-1 overflow-hidden">
                         <p className="text-sm font-medium truncate text-gray-900 dark:text-white">All Study Sets</p>
                     </div>
                 </div>

                 {folders.length === 0 ? (
                   <div className="text-center py-12">
                       <FaFolder size={48} className="text-gray-300 dark:text-[#333] mx-auto mb-4" />
                       <p className="text-sm text-gray-500 mb-1">No folders yet</p>
                       <p className="text-xs text-gray-400 dark:text-gray-600">Create your first folder to organize your study sets</p>
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
                         className={`flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap ${selectedFolderId === folder.id ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white' : ''} ${dragOverFolderId === folder.id ? 'bg-blue-100 dark:bg-blue-900/20' : ''}`}
                       >
                          <FaFolder className={`${folder.color ? `text-${folder.color}-500 dark:text-${folder.color}-400` : 'text-gray-400'} flex-shrink-0`} />
                          <span className="text-sm flex-1 truncate">{folder.name}</span>
                          <span className="text-xs opacity-50 flex-shrink-0">{folder.count}</span>
                       </div>
                     ))}
                   </div>
                 )}
             </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default SidebarRight;
