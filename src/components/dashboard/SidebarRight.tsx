import React, { useState } from 'react';
import { FaChevronRight, FaPlus, FaFolder, FaChevronLeft } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarRightProps {
  className?: string;
  folders?: { id: string; name: string; count: number; color?: string }[];
  onCreateFolder?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const SidebarRight: React.FC<SidebarRightProps> = ({ 
  className = '', 
  folders = [],
  onCreateFolder,
  isOpen = true,
  onClose
}) => {
  const [isFoldersOpen, setIsFoldersOpen] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 288, opacity: 1 }} // 288px = w-72
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`bg-white dark:bg-[#111111] border-l border-gray-200 dark:border-white/10 p-6 flex flex-col h-screen flex-shrink-0 relative group text-gray-900 dark:text-white ${className}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Close Button (Visible on Hover) */}
          <button
            onClick={onClose}
            className={`absolute top-4 left-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            title="Close Sidebar"
          >
            <FaChevronLeft className="transform rotate-180" />
          </button>

          <div className="flex items-center justify-between mb-6 text-gray-500 dark:text-gray-400 overflow-hidden whitespace-nowrap">
             <span className="font-medium">Folders</span>
             <button onClick={() => setIsFoldersOpen(!isFoldersOpen)} className="hover:text-gray-900 dark:hover:text-white">
                 <FaChevronRight className={`transform transition-transform ${isFoldersOpen ? 'rotate-90' : ''}`} />
             </button>
          </div>

          {isFoldersOpen && (
             <div className="space-y-6 overflow-hidden">
                 <button 
                   onClick={onCreateFolder}
                   className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap shadow-sm"
                 >
                     <FaPlus size={12} />
                     <span>Create New Folder</span>
                 </button>

                 <div className="bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-gray-300 dark:hover:border-white/20 transition-colors whitespace-nowrap">
                     <FaFolder className="text-gray-400 flex-shrink-0" />
                     <div className="flex-1 overflow-hidden">
                         <p className="text-sm font-medium truncate text-gray-900 dark:text-white">All Study Sets</p>
                         <p className="text-xs text-gray-500 truncate">1 study set total</p>
                     </div>
                 </div>

                 {folders.length === 0 ? (
                   <div className="text-center py-12">
                       <FaFolder size={48} className="text-gray-200 dark:text-[#1a1a1a] mx-auto mb-4" />
                       <p className="text-sm text-gray-500 mb-1">No folders yet</p>
                       <p className="text-xs text-gray-400 dark:text-gray-600">Create your first folder to organize your study sets</p>
                   </div>
                 ) : (
                   <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-300px)] custom-scrollbar">
                     {folders.map(folder => (
                       <div key={folder.id} className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap">
                          <FaFolder className={`${folder.color ? folder.color.replace('bg-', 'text-') : ''} flex-shrink-0`} />
                          <span className="text-sm flex-1 truncate">{folder.name}</span>
                          <span className="text-xs opacity-50 flex-shrink-0">{folder.count}</span>
                       </div>
                     ))}
                   </div>
                 )}
             </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default SidebarRight;
