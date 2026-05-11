import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRegEdit, FaHistory, FaBars } from 'react-icons/fa';
import SidebarLeft from '../components/dashboard/SidebarLeft';
import CheckMistakesComponent from '../components/ui/CheckMistakesComponent';
import { useLanguage } from '../utils/LanguageContext';
import { useAuth } from '../utils/AuthContext';
import { getMistakeCheckHistory, type MistakeCheckHistoryItem } from '../utils/mistakeCheckAPI';

const MistakeCheckerPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [checkerInstanceKey, setCheckerInstanceKey] = useState(0);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<MistakeCheckHistoryItem | null>(null);
  const [historyItems, setHistoryItems] = useState<MistakeCheckHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [historyOffset, setHistoryOffset] = useState(0);
  const HISTORY_LIMIT = 5;

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

  const fetchHistory = async (offset = 0, append = false) => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const result = await getMistakeCheckHistory(user, session, HISTORY_LIMIT, offset);
      if (result.success) {
        const nextItems = result.history || [];
        setHistoryItems((prev) => (append ? [...prev, ...nextItems] : nextItems));
        setHasMoreHistory(nextItems.length === HISTORY_LIMIT);
        setHistoryOffset(offset);
      } else {
        if (!append) {
          setHistoryItems([]);
        }
        setHasMoreHistory(false);
        setHistoryError(result.error || 'Failed to load history');
      }
    } catch (error) {
      if (!append) {
        setHistoryItems([]);
      }
      setHasMoreHistory(false);
      setHistoryError(error instanceof Error ? error.message : 'Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(0, false);
  }, [user, session]);

  const handleOpenHistory = () => {
    const next = !isHistoryOpen;
    setIsHistoryOpen(next);
    if (next) {
      fetchHistory(0, false);
    }
  };

  const handleLoadMoreHistory = () => {
    if (!historyLoading && hasMoreHistory) {
      fetchHistory(historyOffset + HISTORY_LIMIT, true);
    }
  };

  const handleSelectHistoryItem = (item: MistakeCheckHistoryItem) => {
    setSelectedHistoryItem(item);
    setIsHistoryOpen(false);
  };

  const handleNewCheckerSession = () => {
    setSelectedHistoryItem(null);
    setCheckerInstanceKey(prev => prev + 1);
    setIsHistoryOpen(false);
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-[#111111] text-gray-900 dark:text-white flex font-sans overflow-hidden relative">
      {(isLeftSidebarOpen && isMobile) && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsLeftSidebarOpen(false)}
        />
      )}

      <SidebarLeft
        isOpen={isLeftSidebarOpen}
        onClose={() => setIsLeftSidebarOpen(false)}
        className="fixed inset-y-0 left-0 z-50 lg:relative lg:z-0 shadow-2xl lg:shadow-none h-full"
      />

      <div className="flex-1 flex relative w-full">
        <main className={`flex-1 flex flex-col relative transition-all duration-300 w-full ${isHistoryOpen ? 'mr-0' : 'mr-0'}`}>
          <div className="absolute top-6 left-6 z-20 flex items-center gap-4">
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
                <FaBars size={16} />
              </button>
            )}
            <button
              onClick={handleNewCheckerSession}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title={t('solvePage.newChat')}
            >
              <FaRegEdit size={22} />
            </button>
          </div>

          <button
            onClick={handleOpenHistory}
            className={`absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors z-20 ${isHistoryOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            title={t('solvePage.history')}
          >
            <FaHistory size={22} />
          </button>

          <div className="flex-1 w-full overflow-y-auto px-6 pt-20 pb-6">
            <CheckMistakesComponent
              key={checkerInstanceKey}
              className="w-full"
              variant="solve"
              selectedHistoryItem={selectedHistoryItem}
              onHistoryRefresh={() => fetchHistory(0, false)}
            />
          </div>
        </main>

        <div
          className={`
            fixed top-0 right-0 h-full w-80 bg-white dark:bg-[#0c0c0c] border-l border-gray-200 dark:border-white/5 transform transition-transform duration-300 ease-in-out z-30
            ${isHistoryOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('mistakeChecker.title')}</h2>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center text-sm font-medium">
                  <span className="mr-1 text-lg">»</span>
                </div>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {historyError && (
                <div className="border border-red-200 dark:border-red-500/40 rounded-xl p-3 mb-4 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 text-xs">
                  {historyError}
                </div>
              )}
              {historyLoading && historyItems.length === 0 && (
                <div className="flex justify-center items-center py-8">
                  <div className="w-5 h-5 border-2 border-[#ff5500] border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              {!historyLoading && historyItems.length === 0 && (
                <div className="border border-gray-200 dark:border-white/10 rounded-xl p-4 mb-4 bg-gray-50 dark:bg-[#111111]">
                  <p className="text-sm text-gray-600 dark:text-gray-300">{t('mistakeChecker.subtitle')}</p>
                </div>
              )}
              {historyItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectHistoryItem(item)}
                  className="group cursor-pointer mb-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-white/5"
                >
                  <div className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center">
                      <span className="text-[#ff5500] text-[10px] font-bold uppercase">
                        {item.fileType?.includes('pdf') ? 'PDF' : item.fileType?.includes('image') ? 'IMG' : 'TXT'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[#ff5500] text-[10px] font-bold uppercase tracking-wider">
                          {item.selectedMarkingStandard || 'standard'}
                        </span>
                        <span className="text-gray-500 dark:text-gray-600 text-[10px]">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-gray-900 dark:text-gray-200 text-sm font-medium truncate mb-1">
                        {item.fileName || t('solvePage.untitledChat')}
                      </h3>
                      <p className="text-gray-500 text-xs truncate">
                        {item.mistakes?.length || 0} mistake{(item.mistakes?.length || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {hasMoreHistory && (
                <button
                  onClick={handleLoadMoreHistory}
                  disabled={historyLoading}
                  className="w-full px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors mb-4 disabled:opacity-50"
                >
                  {historyLoading ? 'Loading...' : 'Load More'}
                </button>
              )}
              <button
                onClick={() => {
                  handleNewCheckerSession();
                }}
                className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-gray-900 text-white dark:bg-[#27272a] dark:text-white hover:bg-black dark:hover:bg-[#333] transition-colors mb-3"
              >
                {t('solvePage.newChat')}
              </button>
              <button
                onClick={() => {
                  setIsHistoryOpen(false);
                  navigate('/solve');
                }}
                className="w-full px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                {t('sidebar.solve')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MistakeCheckerPage;
