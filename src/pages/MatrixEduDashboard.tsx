import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLeft from '../components/dashboard/SidebarLeft';
import SidebarRight from '../components/dashboard/SidebarRight';
import ActionCards from '../components/dashboard/ActionCards';
import StudySetList from '../components/dashboard/StudySetList';
import { UploadModal, PasteModal, RecordModal, CreateFolderModal } from '../components/dashboard/DashboardModals';
import { useAuth } from '../utils/AuthContext';
import { FaBars, FaFolder } from 'react-icons/fa';

const MatrixEduDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Modal States
  const [activeModal, setActiveModal] = useState<'upload' | 'paste' | 'record' | 'createFolder' | null>(null);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  // Mock Data
  interface Folder {
    id: string;
    name: string;
    count: number;
    color?: string;
  }
  
  const [folders, setFolders] = useState<Folder[]>([]);

  const [studySets] = useState([
    {
      id: 1,
      title: "System Architecture Diagram",
      stats: {
        unfamiliar: 100,
        learning: 0,
        familiar: 0,
        mastered: 0
      },
      progress: 0,
      totalCards: 100
    }
  ]);

  const handleCreateFolder = (name: string, color: string) => {
      setFolders([...folders, { id: Date.now().toString(), name, count: 0, color }]);
      setActiveModal(null);
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-[#111111] text-gray-900 dark:text-white flex font-sans overflow-hidden">
      {/* Left Sidebar */}
      <SidebarLeft isOpen={isLeftSidebarOpen} onClose={() => setIsLeftSidebarOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden transition-all duration-300">
        {/* Fixed Header Section */}
        <div className="flex-shrink-0 p-8 lg:p-12 pb-6 max-w-4xl mx-auto w-full relative">
            
            {/* Top Navigation Toggles */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-center pointer-events-none">
                <div className="pointer-events-auto">
                    {!isLeftSidebarOpen && (
                        <button onClick={() => setIsLeftSidebarOpen(true)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none transition-colors">
                            <FaBars size={20} />
                        </button>
                    )}
                </div>
                <div className="pointer-events-auto">
                    {!isRightSidebarOpen && (
                        <button onClick={() => setIsRightSidebarOpen(true)} className="flex items-center gap-2 px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none transition-colors">
                            <FaFolder size={16} />
                            <span className="text-sm font-medium">Folders</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Header */}
            <div className="text-center mb-12 mt-8">
                <h1 className="text-4xl font-bold mb-3">Hey {user?.email?.split('@')[0] || 'AI'}, what do you wanna master?</h1>
                <p className="text-gray-500 dark:text-gray-400">Upload anything and get interactive notes, flashcards, quizzes, and more</p>
            </div>

            {/* Action Cards */}
            <ActionCards 
               onUpload={() => setActiveModal('upload')}
               onPaste={() => setActiveModal('paste')}
               onRecord={() => setActiveModal('record')}
            />
        </div>

        {/* Scrollable Study Sets Section */}
        <div className="flex-1 overflow-y-auto px-8 lg:px-12 pb-12 custom-scrollbar">
            <div className="max-w-4xl mx-auto">
                <StudySetList studySets={studySets} />
            </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <SidebarRight 
        folders={folders} 
        onCreateFolder={() => setActiveModal('createFolder')}
        isOpen={isRightSidebarOpen} 
        onClose={() => setIsRightSidebarOpen(false)}
      />

      {/* Modals */}
      <UploadModal 
         isOpen={activeModal === 'upload'} 
         onClose={() => setActiveModal(null)} 
         onNext={() => {
            setActiveModal(null);
            navigate('/study-set/1/selection');
         }}
      />
      <PasteModal 
         isOpen={activeModal === 'paste'} 
         onClose={() => setActiveModal(null)} 
         onNext={() => {
            setActiveModal(null);
            navigate('/study-set/1/selection');
         }}
      />
      <RecordModal 
         isOpen={activeModal === 'record'} 
         onClose={() => setActiveModal(null)} 
         onNext={() => {
            setActiveModal(null);
            navigate('/study-set/1/selection');
         }}
      />
      <CreateFolderModal 
         isOpen={activeModal === 'createFolder'} 
         onClose={() => setActiveModal(null)} 
         onCreate={handleCreateFolder}
      />
    </div>
  );
};

export default MatrixEduDashboard;
