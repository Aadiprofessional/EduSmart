import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiX, FiCalendar, FiChevronRight } from 'react-icons/fi';
import SidebarLeft from '../components/dashboard/SidebarLeft';
import StudyPlannerComponent, { StudyPlannerComponentHandle, StudyPlannerHistory } from '../components/ui/StudyPlannerComponent';
import { supabase } from '../utils/supabase';
import { useAuth } from '../utils/AuthContext';
import IconComponent from '../components/ui/IconComponent';
import { useLanguage } from '../utils/LanguageContext';

const StudyPlannerPage: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  
  // History Sidebar State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<StudyPlannerHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const studyPlannerRef = useRef<StudyPlannerComponentHandle>(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsLeftSidebarOpen(false);
      } else {
        setIsLeftSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch History Function
  const fetchHistory = async () => {
    if (!user) return;
    try {
      setIsLoadingHistory(true);
      const { data, error } = await supabase
        .from('study_planner_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load history when sidebar opens
  useEffect(() => {
    if (isHistoryOpen) {
      fetchHistory();
    }
  }, [isHistoryOpen, user]);

  const handleHistoryItemClick = (item: StudyPlannerHistory) => {
    if (studyPlannerRef.current) {
      studyPlannerRef.current.loadHistoryItem(item);
      // On mobile, close sidebar after selection
      if (isMobile) {
        setIsHistoryOpen(false);
      }
    }
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-[#111111] text-gray-900 dark:text-white flex font-sans overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {(isLeftSidebarOpen && isMobile) && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsLeftSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <SidebarLeft 
        isOpen={isLeftSidebarOpen} 
        onClose={() => setIsLeftSidebarOpen(false)}
        className="fixed inset-y-0 left-0 z-50 lg:relative lg:z-0 shadow-2xl lg:shadow-none h-full"
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden transition-all duration-300">
        
        {/* Sidebar Toggle */}
        <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
            {!isLeftSidebarOpen && (
                <button 
                    onClick={() => setIsLeftSidebarOpen(true)} 
                    className="w-10 h-10 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center font-bold text-sm hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-sm lg:hidden"
                >
                    ME
                </button>
            )}
            {!isLeftSidebarOpen && (
                <button
                    onClick={() => setIsLeftSidebarOpen(true)}
                    className="hidden lg:flex p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-white/10 shadow-sm transition-colors"
                    title="Open sidebar"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/></svg>
                </button>
            )}
        </div>

        {/* Study Planner Content */}
        <div className="flex-1 overflow-y-auto w-full h-full">
            <StudyPlannerComponent 
              ref={studyPlannerRef}
              className="w-full min-h-full p-2 sm:p-4 lg:p-8 pb-24 lg:pb-8" 
              onToggleHistory={() => setIsHistoryOpen(true)}
              onRefreshHistory={() => {
                // Refresh history list if sidebar is open
                if (isHistoryOpen) fetchHistory();
              }}
            />
        </div>
      </main>

      {/* Right Sidebar - History Panel */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            {/* Backdrop for mobile */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsHistoryOpen(false)}
                className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm lg:hidden"
              />
            )}
            
            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={`fixed right-0 top-0 h-full bg-white dark:bg-[#111] border-l border-gray-200 dark:border-white/10 shadow-2xl z-[70] flex flex-col
                ${isMobile ? 'w-full max-w-sm' : 'w-96'}
              `}
            >
              <div className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-transparent">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <div className="p-2 rounded-lg bg-amber-500/10 mr-3">
                    <IconComponent icon={FiClock} className="h-5 w-5 text-amber-500" />
                  </div>
                  {t('studyPlannerPage.roadmapHistory')}
                </h2>
                <motion.button
                  onClick={() => setIsHistoryOpen(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <IconComponent icon={FiX} className="h-5 w-5" />
                </motion.button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
                {isLoadingHistory ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent"></div>
                  </div>
                ) : history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 border border-gray-200 dark:border-white/5">
                        <IconComponent icon={FiClock} className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium mb-1 text-lg">{t('studyPlannerPage.noHistory')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                        {t('studyPlannerPage.noHistoryDescription')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <motion.div
                        key={item.id}
                        className="p-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl hover:border-amber-500/50 dark:hover:border-amber-500/50 hover:shadow-lg dark:hover:bg-white/10 cursor-pointer transition-all group relative overflow-hidden"
                        onClick={() => handleHistoryItemClick(item)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-3xl -mr-2 -mt-2 transition-opacity opacity-0 group-hover:opacity-100" />
                        
                        <div className="flex justify-between items-start relative z-10">
                          <div className="flex-1 pr-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-lg group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
                              {item.title || t('studyPlannerPage.untitledRoadmap')}
                            </h3>
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                                <span className="flex items-center bg-gray-100 dark:bg-black/30 px-2 py-1 rounded-md">
                                    <IconComponent icon={FiCalendar} className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
                                    {new Date(item.created_at).toLocaleDateString(language, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                <span className="flex items-center bg-gray-100 dark:bg-black/30 px-2 py-1 rounded-md">
                                    <IconComponent icon={FiClock} className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
                                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                          </div>
                          <div className="bg-gray-100 dark:bg-white/5 p-2 rounded-full text-gray-400 group-hover:bg-amber-500 group-hover:text-white transition-all transform group-hover:rotate-45">
                             <IconComponent icon={FiChevronRight} className="h-5 w-5" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudyPlannerPage;
