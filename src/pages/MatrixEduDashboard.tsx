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
  const studySetListRef = useRef<HTMLDivElement>(null);
  
  // Modal States
  const [activeModal, setActiveModal] = useState<'upload' | 'paste' | 'record' | 'createFolder' | null>(null);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(window.innerWidth >= 1280);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = e.currentTarget.scrollTop;
      
      // Check if study set list touches top border
      if (studySetListRef.current) {
          const containerTop = e.currentTarget.getBoundingClientRect().top;
          const listTop = studySetListRef.current.getBoundingClientRect().top;
          const relativeTop = listTop - containerTop;
          
          // Check if study set list touches top border (plus offset for sticky header)
          const stickyHeaderHeight = 80; // Approximate height of sticky header
          const threshold = stickyHeaderHeight + 20;
          
          if (relativeTop <= threshold && !isScrolled) {
              setIsScrolled(true);
          } else if (relativeTop > threshold && isScrolled) {
              setIsScrolled(false);
          }
      }

      const { scrollHeight, clientHeight } = e.currentTarget;
      if (scrollHeight - scrollTop <= clientHeight + 100 && hasMore && !loadingMore) {
          handleLoadMore();
      }
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
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 12;

  const fetchStudySets = async (pageNumber = 0, isLoadMore = false) => {
      if (!user) return;
      if (isLoadMore) setLoadingMore(true);
      
      try {
          const from = pageNumber * ITEMS_PER_PAGE;
          const to = from + ITEMS_PER_PAGE - 1;

          const { data, error } = await supabase
              .from('upload_document')
              .select('*')
              .eq('uid', user.id) 
              .order('created_at', { ascending: false })
              .range(from, to);
              
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

              if (data.length < ITEMS_PER_PAGE) {
                  setHasMore(false);
              }

              if (isLoadMore) {
                  setStudySets(prev => [...prev, ...mappedSets]);
              } else {
                  setStudySets(mappedSets);
              }
          }
      } catch (error) {
          console.error('Error fetching study sets:', error);
      } finally {
          if (isLoadMore) setLoadingMore(false);
      }
  };

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchStudySets(0, false);
  }, [user]);

  const handleLoadMore = () => {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchStudySets(nextPage, true);
  };

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
            {/* Sticky Navigation Header */}
            <div className={`sticky top-0 z-40 transition-all duration-300 w-full border-b ${isScrolled ? 'bg-white/95 dark:bg-[#111]/95 backdrop-blur-md border-gray-200 dark:border-white/5 py-2 shadow-sm' : 'bg-gray-50/95 dark:bg-[#111111]/95 border-transparent py-4'}`}>
                <div className="w-full mx-auto px-4 md:px-8 lg:px-12 relative flex flex-col justify-center min-h-[60px]">
                    
                    {/* Top Row: Nav Toggles + (Optional) Compact Actions */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            {!isLeftSidebarOpen && (
                                <button 
                                    onClick={() => setIsLeftSidebarOpen(true)} 
                                    className="w-10 h-10 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center font-bold text-sm hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-sm md:hidden"
                                >
                                    ME
                                </button>
                            )}
                            
                            {/* Desktop/Tablet Menu Trigger */}
                            {!isLeftSidebarOpen && (
                                <button 
                                    onClick={() => setIsLeftSidebarOpen(true)} 
                                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none transition-colors hidden md:block"
                                >
                                    <FaBars size={20} />
                                </button>
                            )}
                        </div>

                        {/* Compact Action Cards (Visible only when scrolled) */}
                        <div className={`flex-1 mx-4 transition-all duration-300 ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none absolute left-0 right-0'}`}>
                            {isScrolled && (
                                <ActionCards 
                                   onUpload={() => setActiveModal('upload')}
                                   onPaste={() => setActiveModal('paste')}
                                   onRecord={() => setActiveModal('record')}
                                   isCompact={true}
                                />
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
                </div>
            </div>

            {/* Hero Section (Scrolls away) */}
            <div className="w-full mx-auto px-4 md:px-8 lg:px-12 relative mb-8">
                {/* Header Title */}
                <div className={`text-center transition-all duration-300 overflow-hidden ${isScrolled ? 'opacity-0 h-0 margin-0' : 'opacity-100 h-auto mb-8 md:mb-12 mt-4'}`}>
                    <h1 className="text-2xl md:text-4xl font-bold mb-3 text-gray-900 dark:text-white">Hey {user?.email?.split('@')[0] || 'AI'}, what do you wanna master?</h1>
                    <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 px-4">Upload anything and get interactive notes, flashcards, quizzes, and more</p>
                </div>

                {/* Expanded Action Cards */}
                <div className={`transition-all duration-300 ${isScrolled ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-auto'}`}>
                    <ActionCards 
                       onUpload={() => setActiveModal('upload')}
                       onPaste={() => setActiveModal('paste')}
                       onRecord={() => setActiveModal('record')}
                       isCompact={false}
                    />
                </div>
            </div>

            {/* Scrollable Study Sets Section */}
            <div 
                ref={studySetListRef}
                className="px-4 md:px-8 lg:px-12 pb-24 w-full mx-auto min-h-screen"
            >
                <StudySetList 
                    studySets={studySets} 
                    onSetClick={(set: any) => {
                        navigate(`/study-set/${set.id}`, { state: { studySetData: set } });
                    }}
                />
                
                {loadingMore && (
                    <div className="flex justify-center mt-8 mb-8">
                        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
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
