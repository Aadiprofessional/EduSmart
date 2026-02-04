import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLeft from '../components/dashboard/SidebarLeft';
import SidebarRight from '../components/dashboard/SidebarRight';
import ActionCards from '../components/dashboard/ActionCards';
import StudySetList from '../components/dashboard/StudySetList';
import { UploadModal, PasteModal, RecordModal, CreateFolderModal } from '../components/dashboard/DashboardModals';
import { useAuth } from '../utils/AuthContext';
import { FaBars, FaFolder, FaGraduationCap } from 'react-icons/fa';
import { supabase } from '../utils/supabase';
import { StudySet } from '../components/dashboard/StudySetCard';

const MatrixEduDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Modal States
  const [activeModal, setActiveModal] = useState<'upload' | 'paste' | 'record' | 'createFolder' | null>(null);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(window.innerWidth >= 1280);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = e.currentTarget.scrollTop;
      setIsScrolled(scrollTop > 0);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsLeftSidebarOpen(false);
      } else {
        setIsLeftSidebarOpen(true);
      }
      if (window.innerWidth < 1280) {
        setIsRightSidebarOpen(false);
      } else {
        setIsRightSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mock Data
  interface Folder {
    id: string;
    name: string;
    count: number;
    color?: string;
  }
  
  const [folders, setFolders] = useState<Folder[]>([]);

  const [studySets, setStudySets] = useState<StudySet[]>([]);

  useEffect(() => {
    const fetchStudySets = async () => {
        // We fetch even if user is not fully loaded? Usually user is null initially.
        // Assuming user object has id or uid.
        // The auth context might provide user.id or user.sub depending on provider.
        // Let's assume user.id works as per other files.
        // If user is null, we can't fetch user specific docs.
        
        // However, for testing purpose if user is not logged in, we might want to skip or show empty.
        // The auth context provides 'user' which is Supabase user usually.
        
        if (!user) return;
        
        try {
            const { data, error } = await supabase
                .from('upload_document')
                .select('*')
                // .eq('uid', user.id) // Filter by user if needed. User requested "show all the items from the table" but implied context. 
                                      // Usually we only show user's items. 
                                      // The response example has "uid": "5f21c714-a255-4bab-864e-a36c63466a95".
                                      // I will filter by user.id if available, otherwise fetch all (or limit).
                                      // To be safe and follow standard practice, I'll filter by user.id.
                .eq('uid', user.id) 
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            
            if (data) {
                const mappedSets: StudySet[] = data.map((doc: any) => ({
                    id: doc.document_id,
                    title: doc.document_type ? doc.document_type.charAt(0).toUpperCase() + doc.document_type.slice(1) : (doc.title || 'Untitled Study Set'),
                    stats: {
                        unfamiliar: 0,
                        learning: 0,
                        familiar: 0,
                        mastered: 0
                    },
                    progress: 0,
                    totalCards: 0,
                    ...doc // Keep original fields
                }));
                setStudySets(mappedSets);
            }
        } catch (error) {
            console.error('Error fetching study sets:', error);
        }
    };
    
    fetchStudySets();
  }, [user]);

  const handleCreateFolder = (name: string, color: string) => {
      setFolders([...folders, { id: Date.now().toString(), name, count: 0, color }]);
      setActiveModal(null);
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-[#111111] text-gray-900 dark:text-white flex font-sans overflow-hidden relative">
      {/* Mobile Sidebar Overlays */}
      {(isLeftSidebarOpen && window.innerWidth < 1024) && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsLeftSidebarOpen(false)}
        />
      )}
      {(isRightSidebarOpen && window.innerWidth < 1280) && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 xl:hidden"
          onClick={() => setIsRightSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <SidebarLeft 
        isOpen={isLeftSidebarOpen} 
        onClose={() => setIsLeftSidebarOpen(false)} 
        className="fixed inset-y-0 left-0 z-50 lg:relative lg:z-0 shadow-2xl lg:shadow-none h-full"
      />

      {/* Main Content */}
      <main className="flex-1 h-full relative overflow-hidden transition-all duration-300 w-full">
        <div 
            className="h-full overflow-y-auto custom-scrollbar scroll-smooth" 
            onScroll={handleScroll} 
            ref={scrollRef}
        >
            {/* Sticky Header Section */}
            <div className={`sticky top-0 z-30 transition-all duration-300 w-full ${isScrolled ? 'bg-white/95 dark:bg-[#111]/95 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-white/5 py-2' : 'bg-transparent py-4 md:py-8 lg:py-12'}`}>
                <div className="max-w-4xl mx-auto px-4 md:px-8 lg:px-12 relative">
                    
                    {/* Top Navigation Toggles + Logo */}
                    <div className={`flex justify-between items-center ${isScrolled ? 'mb-2' : 'mb-4 md:mb-8'}`}>
                        <div className="flex items-center gap-3">
                            {!isLeftSidebarOpen && (
                                <button 
                                    onClick={() => setIsLeftSidebarOpen(true)} 
                                    className="w-10 h-10 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center font-bold text-sm hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-sm md:hidden"
                                >
                                    ME
                                </button>
                            )}
                            
                            {/* Desktop/Tablet Menu Trigger (Hidden on Mobile) */}
                            {!isLeftSidebarOpen && (
                                <button 
                                    onClick={() => setIsLeftSidebarOpen(true)} 
                                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none transition-colors hidden md:block"
                                >
                                    <FaBars size={20} />
                                </button>
                            )}
                        </div>
                        <div className="">
                            {!isRightSidebarOpen && (
                                <button onClick={() => setIsRightSidebarOpen(true)} className="flex items-center gap-2 px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none transition-colors">
                                    <FaFolder size={16} />
                                    <span className="text-sm font-medium hidden sm:inline">Folders</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Header Title - Collapses on scroll */}
                    <div className={`text-center transition-all duration-300 overflow-hidden ${isScrolled ? 'h-0 opacity-0 mb-0' : 'h-auto opacity-100 mb-8 md:mb-12 mt-4'}`}>
                        <h1 className="text-2xl md:text-4xl font-bold mb-3 text-gray-900 dark:text-white">Hey {user?.email?.split('@')[0] || 'AI'}, what do you wanna master?</h1>
                        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 px-4">Upload anything and get interactive notes, flashcards, quizzes, and more</p>
                    </div>

                    {/* Action Cards */}
                    <ActionCards 
                       onUpload={() => setActiveModal('upload')}
                       onPaste={() => setActiveModal('paste')}
                       onRecord={() => setActiveModal('record')}
                       isCompact={isScrolled}
                    />
                </div>
            </div>

            {/* Scrollable Study Sets Section */}
            <div className="px-4 md:px-8 lg:px-12 pb-24 max-w-4xl mx-auto">
                <StudySetList 
                    studySets={studySets} 
                    onSetClick={(set: any) => {
                        navigate(`/study-set/${set.id}`, { state: { studySetData: set } });
                    }}
                />
            </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <SidebarRight 
        folders={folders} 
        onCreateFolder={() => setActiveModal('createFolder')}
        isOpen={isRightSidebarOpen} 
        onClose={() => setIsRightSidebarOpen(false)}
        className="fixed inset-y-0 right-0 z-50 xl:relative xl:z-0 shadow-2xl xl:shadow-none h-full"
      />

      {/* Modals */}
      <UploadModal 
         isOpen={activeModal === 'upload'} 
         onClose={() => setActiveModal(null)} 
         onNext={(payload) => {
            setActiveModal(null);
            navigate('/study-set/1/selection', { state: { uploadPayload: payload } });
         }}
      />
      <PasteModal 
         isOpen={activeModal === 'paste'} 
         onClose={() => setActiveModal(null)} 
         onNext={(payload) => {
            setActiveModal(null);
            navigate('/study-set/1/selection', { state: { uploadPayload: payload } });
         }}
      />
      <RecordModal 
         isOpen={activeModal === 'record'} 
         onClose={() => setActiveModal(null)} 
         onNext={(payload) => {
            setActiveModal(null);
            navigate('/study-set/1/selection', { state: { uploadPayload: payload } });
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
