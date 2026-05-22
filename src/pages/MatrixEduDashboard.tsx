import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLeft from '../components/dashboard/SidebarLeft';
import SidebarRight from '../components/dashboard/SidebarRight';
import ActionCards from '../components/dashboard/ActionCards';
import StudySetList from '../components/dashboard/StudySetList';
import { UploadModal, PasteModal, URLModal, TextModal, RecordModal, CreateFolderModal, MoveDocumentModal } from '../components/dashboard/DashboardModals';
import { useAuth } from '../utils/AuthContext';
import { FaBars, FaFolder } from 'react-icons/fa';
import { supabase } from '../utils/supabase';
import { StudySet } from '../components/dashboard/StudySetCard';
import { useLanguage } from '../utils/LanguageContext';
import { useResponseCheck, ResponseUpgradeModal } from '../utils/responseChecker';
import CoinPanel from '../components/ads/CoinPanel';
import AdBanner from '../components/ads/AdBanner';

const MatrixEduDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { checkAndUseResponse } = useResponseCheck();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const studySetListRef = useRef<HTMLDivElement>(null);
  
  // Modal States
  const [activeModal, setActiveModal] = useState<'upload' | 'url' | 'text' | 'paste' | 'record' | 'createFolder' | 'moveDocument' | null>(null);
  const [documentToMove, setDocumentToMove] = useState<StudySet | null>(null);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(window.innerWidth >= 1280);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const [upgradeCtaType, setUpgradeCtaType] = useState<'coins' | 'subscription'>('subscription');

  const handleOpenActionModal = async (modal: 'upload' | 'url' | 'text' | 'paste' | 'record') => {
    const responseCheck = await checkAndUseResponse({
      responseType: 'dashboard_upload_access',
      queryData: { action: modal },
      consumeCredits: false,
      requireCoins: true,
      noCoinsMessage: 'Please buy more coins to continue.'
    });
    if (!responseCheck.canProceed) {
      if (responseCheck.showUpgradeModal) {
        setUpgradeMessage(responseCheck.message || 'You need an active subscription or coins to continue.');
        setUpgradeCtaType(responseCheck.ctaType || 'subscription');
        setShowUpgradeModal(true);
      }
      return;
    }
    setActiveModal(modal);
  };

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
    document_ids: string[];
  }
  
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const ITEMS_PER_PAGE = 10;
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StudySet[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchFolders = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      setFolders(data.map((f: any) => ({
        ...f,
        count: f.document_ids ? f.document_ids.length : 0,
        document_ids: f.document_ids || []
      })));
    }
  };

  useEffect(() => {
    fetchFolders();
  }, [user]);

  const fetchTotalCount = async () => {
    if (!user) return;
    let query = supabase
      .from('upload_document')
      .select('*', { count: 'exact', head: true })
      .eq('uid', user.id);
    if (selectedFolderId) {
      const folder = folders.find((f: any) => f.id === selectedFolderId);
      if (folder && folder.document_ids.length > 0) {
        query = query.in('document_id', folder.document_ids);
      }
    }
    const { count } = await query;
    setTotalCount(count ?? 0);
  };

  useEffect(() => {
    fetchTotalCount();
  }, [user, selectedFolderId, folders]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      if (!user) return;
      setIsSearching(true);
      let query = supabase
        .from('upload_document')
        .select('*')
        .eq('uid', user.id)
        .ilike('document_name', `%${searchQuery.trim()}%`)
        .order('created_at', { ascending: false });
      if (selectedFolderId) {
        const folder = folders.find((f: any) => f.id === selectedFolderId);
        if (folder && folder.document_ids.length > 0) {
          query = query.in('document_id', folder.document_ids);
        }
      }
      const { data } = await query;
      if (active && data) {
        const mapped: StudySet[] = data.map((doc: any) => ({
          id: doc.document_id,
          title: doc.document_name || t('matrixDashboard.untitledStudySet'),
          stats: { unfamiliar: 0, learning: 0, mastered: 0 },
          progress: 0,
          totalCards: 0,
          ...doc,
        }));
        setSearchResults(mapped);
      }
      if (active) setIsSearching(false);
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [searchQuery, user, selectedFolderId]);

  const enrichStudySetsWithStats = async (sets: StudySet[]): Promise<StudySet[]> => {
    if (!user) return sets;

    const enrichedSets = await Promise.all(sets.map(async (set) => {
      let unfamiliar = 0;
      let learning = 0;
      let mastered = 0;
      let total = 0;

      // 1. Flashcards
      if (set.flashcards) {
        const { data } = await supabase
          .from('flashcard_documents')
          .select('flashcards_data')
          .eq('document_id', set.id)
          .eq('uid', user.id)
          .maybeSingle();
        
        if (data?.flashcards_data && Array.isArray(data.flashcards_data)) {
           data.flashcards_data.forEach((item: any) => {
             total++;
             if (item.status === 'mastered') mastered++;
             else if (item.status === 'learning') learning++;
             else unfamiliar++;
           });
        }
      }

      // 2. Multiple Choice
      if (set.multiple_choice) {
        const { data } = await supabase
          .from('mcq_documents')
          .select('mcq_data')
          .eq('document_id', set.id)
          .eq('uid', user.id)
          .maybeSingle();

        if (data?.mcq_data && Array.isArray(data.mcq_data)) {
           data.mcq_data.forEach((item: any) => {
             total++;
             if (item.status === 'mastered') mastered++;
             else if (item.status === 'learning') learning++;
             else unfamiliar++;
           });
        }
      }

      // 3. Fill in the Blanks
      if (set.fill_in_the_blanks) {
         const { data } = await supabase
          .from('fill_in_blank_documents')
          .select('generated_json')
          .eq('document_id', set.id)
          .eq('uid', user.id)
          .maybeSingle();

         if (data?.generated_json && Array.isArray(data.generated_json)) {
           data.generated_json.forEach((item: any) => {
             total++;
             if (item.status === 'mastered') mastered++;
             else if (item.status === 'learning') learning++;
             else unfamiliar++;
           });
        }
      }

      // 4. Written Tests
      if (set.written_tests) {
         const { data } = await supabase
          .from('written_test_documents')
          .select('test_data')
          .eq('document_id', set.id)
          .eq('uid', user.id)
          .maybeSingle();

         if (data?.test_data && Array.isArray(data.test_data)) {
           data.test_data.forEach((item: any) => {
             total++;
             if (item.status === 'submitted') mastered++;
             else unfamiliar++;
           });
        }
      }

      // Calculate progress
      const progress = total > 0 ? Math.round(((mastered + (learning * 0.5)) / total) * 100) : 0;

      return {
        ...set,
        stats: {
          unfamiliar,
          learning,
          mastered
        },
        progress,
        totalCards: total
      };
    }));

    return enrichedSets;
  };

  const fetchStudySets = async (pageNumber = 0) => {
      if (!user) return;
      setLoading(true);
      
      try {
          const from = pageNumber * ITEMS_PER_PAGE;
          const to = from + ITEMS_PER_PAGE - 1;

          let query = supabase
              .from('upload_document')
              .select('*')
              .eq('uid', user.id) 
              .order('created_at', { ascending: false });

          if (selectedFolderId) {
            const folder = folders.find(f => f.id === selectedFolderId);
            if (folder) {
                 if (folder.document_ids.length > 0) {
                     query = query.in('document_id', folder.document_ids);
                 } else {
                     setStudySets([]);
                     setLoading(false);
                     return;
                 }
            }
          }
              
          const { data, error } = await query.range(from, to);
              
          if (error) throw error;
          
          if (data) {
              const mappedSets: StudySet[] = data.map((doc: any) => ({
                  id: doc.document_id,
                  title: doc.document_name || (doc.document_type ? doc.document_type.charAt(0).toUpperCase() + doc.document_type.slice(1) : t('matrixDashboard.untitledStudySet')),
                  stats: {
                      unfamiliar: 0,
                      learning: 0,
                      mastered: 0
                  },
                  progress: 0,
                  totalCards: 0,
                  ...doc // Keep original fields
              }));

              const enrichedSets = await enrichStudySetsWithStats(mappedSets);

              setStudySets(enrichedSets);
          }
      } catch (error) {
          console.error('Error fetching study sets:', error);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    setPage(0);
  }, [user, selectedFolderId]);

  useEffect(() => {
    fetchStudySets(page);
  }, [page, user, selectedFolderId]);

  const handlePageChange = (nextPage: number) => {
    if (nextPage === page) return;
    setPage(nextPage);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateFolder = async (name: string, color: string) => {
      if (!user) return;
      const { data, error } = await supabase
        .from('folders')
        .insert([{ name, color, user_id: user.id, document_ids: [] }])
        .select()
        .single();

      if (data) {
        setFolders(prev => [{...data, count: 0, document_ids: []}, ...prev]);
        setActiveModal(null);
      }
  };

  const handleRenameStudySet = async (set: StudySet, newName: string) => {
    if (!user) return;

    // Optimistic update
    setStudySets(prev => prev.map(s => s.id === set.id ? { ...s, title: newName } : s));

    const { error } = await supabase
      .from('upload_document')
      .update({ document_name: newName })
      .eq('document_id', set.id)
      .eq('uid', user.id);

    if (error) {
      console.error('Error renaming study set:', error);
      // Revert if error
      setStudySets(prev => prev.map(s => s.id === set.id ? { ...s, title: set.title } : s));
    }
  };

  const handleDeleteStudySet = async (set: StudySet) => {
    if (!user) return;

    // Optimistic update
    setStudySets(prev => prev.filter(s => s.id !== set.id));

    const { error } = await supabase
      .from('upload_document')
      .delete()
      .eq('document_id', set.id)
      .eq('uid', user.id);

    if (error) {
      console.error('Error deleting study set:', error);
      fetchStudySets(0); 
    }
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    if (!user) return;

    // Optimistic update
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name: newName } : f));

    const { error } = await supabase
      .from('folders')
      .update({ name: newName })
      .eq('id', folderId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error renaming folder:', error);
      fetchFolders(); // Revert/Refresh
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!user) return;

    // Optimistic update
    setFolders(prev => prev.filter(f => f.id !== folderId));
    if (selectedFolderId === folderId) {
      setSelectedFolderId(null);
    }

    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting folder:', error);
      fetchFolders(); // Revert/Refresh
    }
  };

  const handleMoveDocument = async (targetFolderId: string | null, documentId: string) => {
    if (!user) return;

    const currentFolders = folders.filter(f => f.document_ids.includes(documentId));
    const removePromises = currentFolders.map(f => 
      supabase.from('folders').update({ 
        document_ids: f.document_ids.filter(id => id !== documentId) 
      }).eq('id', f.id)
    );
    await Promise.all(removePromises);

    if (targetFolderId) {
      const targetFolder = folders.find(f => f.id === targetFolderId);
      if (targetFolder) {
        const newIds = Array.from(new Set([...targetFolder.document_ids, documentId]));
        await supabase.from('folders').update({ 
          document_ids: newIds 
        }).eq('id', targetFolderId);
      }
    }

    fetchFolders();
    // Refresh study sets to reflect changes if currently filtering by folder
    if (selectedFolderId) {
      fetchStudySets(0);
    }
  };

  const handleMoveClick = (set: StudySet) => {
    setDocumentToMove(set);
    setActiveModal('moveDocument');
  };

  const handleMoveConfirm = async (folderId: string | null) => {
    if (documentToMove) {
      await handleMoveDocument(folderId, String(documentToMove.id));
      setActiveModal(null);
      setDocumentToMove(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, set: StudySet) => {
      e.dataTransfer.setData('documentId', set.id.toString());
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#111] overflow-hidden">
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
            <div className={`sticky top-0 z-40 transition-all duration-300 w-full ${isScrolled ? 'bg-white/95 dark:bg-[#111]/95 backdrop-blur-md border-b border-gray-200 dark:border-white/5 py-2 shadow-sm' : 'bg-transparent border-b border-transparent py-2'}`}>
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
                                   onUpload={() => handleOpenActionModal('upload')}
                                   onUrl={() => handleOpenActionModal('url')}
                                   onText={() => handleOpenActionModal('text')}
                                   onRecord={() => handleOpenActionModal('record')}
                                   isCompact={true}
                                />
                            )}
                        </div>

                        <div className="">
                            {!isRightSidebarOpen && (
                                <button onClick={() => setIsRightSidebarOpen(true)} className="flex items-center gap-2 px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none transition-colors">
                                    <FaFolder size={16} />
                                    <span className="text-sm font-medium hidden sm:inline">{t('sidebar.folders')}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Hero Section (Scrolls away) */}
            <div className="w-full mx-auto px-4 md:px-8 lg:px-12 relative mb-8">
                {/* Header Title */}
                <div className={`text-center transition-all duration-300 overflow-hidden ${isScrolled ? 'opacity-0 h-0 margin-0' : 'opacity-100 h-auto mb-4 md:mb-6'}`}>
                    <h1 className="text-2xl md:text-4xl font-bold mb-3 text-gray-900 dark:text-white">{t('matrixDashboard.heroTitle', { values: { name: user?.email?.split('@')[0] || t('sidebar.user') } })}</h1>
                    <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 px-4">{t('matrixDashboard.heroSubtitle')}</p>
                </div>

                {/* Inline coin panel for lite mode */}
                <div className="mb-4 flex justify-center">
                  <CoinPanel variant="inline" onUpgradeClick={() => navigate('/pricing')} />
                </div>

                {/* Expanded Action Cards */}
                <div className={`transition-all duration-300 ${isScrolled ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-auto'}`}>
                    <ActionCards 
                       onUpload={() => handleOpenActionModal('upload')}
                       onUrl={() => handleOpenActionModal('url')}
                       onText={() => handleOpenActionModal('text')}
                       onRecord={() => handleOpenActionModal('record')}
                       isCompact={false}
                    />
                </div>
            </div>

            {/* AdSense leaderboard between hero and study sets */}
            <div className="px-4 md:px-8 lg:px-12 mb-6">
              <AdBanner size="responsive" />
            </div>

            {/* Scrollable Study Sets Section */}
            <div 
                ref={studySetListRef}
                className="px-4 md:px-8 lg:px-12 pb-24 w-full mx-auto min-h-screen"
            >
                <StudySetList 
                  studySets={searchQuery.trim() ? searchResults : studySets} 
                  loading={loading || (searchQuery.trim() ? isSearching : false)}
                  totalCount={totalCount}
                  itemsPerPage={ITEMS_PER_PAGE}
                  currentPage={page}
                  onPageChange={handlePageChange}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onSetClick={(set) => navigate(`/study-set/${set.id}`)}
                  onDragStart={handleDragStart}
                  onMove={handleMoveClick}
                  onRename={handleRenameStudySet}
                  onDelete={handleDeleteStudySet}
                />
                
                {!searchQuery.trim() && loading && (
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
        onMoveDocument={handleMoveDocument}
        selectedFolderId={selectedFolderId}
        onSelectFolder={setSelectedFolderId}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
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
      <URLModal
         isOpen={activeModal === 'url'}
         onClose={() => setActiveModal(null)}
         onNext={(payload) => {
            setActiveModal(null);
            navigate('/study-set/1/selection', { state: { uploadPayload: payload } });
         }}
      />
      <TextModal
         isOpen={activeModal === 'text'}
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
      <MoveDocumentModal 
         isOpen={activeModal === 'moveDocument'} 
         onClose={() => {
            setActiveModal(null);
            setDocumentToMove(null);
         }}
         folders={folders}
         onMove={handleMoveConfirm}
         documentTitle={documentToMove?.title}
      />
      <ResponseUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        message={upgradeMessage}
        ctaType={upgradeCtaType}
      />
    </div>
  );
};

export default MatrixEduDashboard;
