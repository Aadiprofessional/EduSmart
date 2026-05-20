import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaLayerGroup, 
  FaBullseye, 
  FaFileAlt, 
  FaSignOutAlt, 
  FaSun, 
  FaMoon, 
  FaChevronDown,
  FaChevronUp,
  FaChevronRight,
  FaHistory,
  FaCalendarAlt,
  FaPenNib,
  FaUserCheck,
  FaChevronLeft,
  FaCheckCircle,
  FaGlobe,
  FaTrash,
  FaExclamationTriangle,
  FaCommentAlt,
  FaCog,
  FaBolt,
  FaCoins
} from 'react-icons/fa';
import { useAuth } from '../../utils/AuthContext';
import { useLanguage } from '../../utils/LanguageContext';
import { useTheme } from '../../utils/ThemeContext';
import matrixLogo from '../../assets/logoround.png';
import LogoWithText from '../ui/LogoWithText';
import CoinPanel from '../ads/CoinPanel';
import SubscriptionBadge from '../ads/SubscriptionBadge';
import { subscriptionAPI } from '../../utils/subscriptionAPI';

interface SidebarLeftProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const SidebarLeft: React.FC<SidebarLeftProps> = ({ className = '', isOpen = true, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, session, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<0 | 1 | 2>(0);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    setIsMenuOpen(false);
    await signOut();
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmStep === 0) {
      setDeleteConfirmStep(1);
      return;
    }
    if (deleteConfirmStep === 1) {
      setDeleteConfirmStep(2);
      return;
    }
    // Step 2 - actually delete
    setIsDeletingAccount(true);
    try {
      const result = await subscriptionAPI.deleteAccount(session);
      if (result.success) {
        await signOut();
      } else {
        alert(result.error || 'Failed to delete account. Please try again.');
        setDeleteConfirmStep(0);
      }
    } catch {
      alert('Failed to delete account. Please try again.');
      setDeleteConfirmStep(0);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const languageOptions = [
    { code: 'en' as const, label: t('languageSelector.english') },
    { code: 'zh-CN' as const, label: t('languageSelector.simplifiedChinese') },
    { code: 'zh-TW' as const, label: t('languageSelector.traditionalChinese') },
  ];

  const currentLangLabel = languageOptions.find(l => l.code === language)?.label || language;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 256, opacity: 1 }} // 256px = w-64
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`bg-white dark:bg-[#111111] border-r border-gray-200 dark:border-white/10 flex min-h-0 flex-col h-full p-4 flex-shrink-0 group text-gray-900 dark:text-white ${className}`}
          style={{ height: '100dvh', maxHeight: '100dvh' }}
        >
          <div className="flex-1 overflow-y-auto overflow-x-hidden whitespace-nowrap min-h-0">
            {/* Logo */}
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                <LogoWithText size={28} maxTextWidth={120} title="MatrixEdu" showSubtitle={false} />
              </div>

              <button onClick={onClose} className="hover:text-gray-900 dark:hover:text-white text-gray-400" title={t('sidebar.closeSidebar')}>
                  <FaChevronLeft size={16} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              <NavItem 
                icon={<FaCalendarAlt />} 
                label={t('sidebar.studyPlanner')}
                active={isActive('/study-planner')} 
                onClick={() => navigate('/study-planner')}
              />
              <NavItem 
                icon={<FaLayerGroup />} 
                label={t('sidebar.studySets')}
                active={isActive('/dashboard')} 
                onClick={() => navigate('/dashboard')}
              />
            
              <NavItem 
                icon={<FaBullseye />} 
                label={t('sidebar.solve')}
                active={isActive('/solve')}
                onClick={() => navigate('/solve')} 
              />
              <NavItem 
                icon={<FaCheckCircle />} 
                label={t('aiStudy.mistakeChecker')}
                active={isActive('/mistake-checker')}
                onClick={() => navigate('/mistake-checker')} 
              />
              <NavItem 
                icon={<FaFileAlt />} 
                label={t('sidebar.paperGrader')}
                active={isActive('/paper-grader')}
                onClick={() => navigate('/paper-grader')} 
              />
              <NavItem 
                icon={<FaPenNib />} 
                label={t('sidebar.contentWriter')}
                active={isActive('/content-writer')}
                onClick={() => navigate('/content-writer')} 
              />
              <NavItem 
                icon={<FaUserCheck />} 
                label={t('sidebar.humanizer')}
                active={isActive('/humanizer')}
                onClick={() => navigate('/humanizer')} 
              />
            </nav>
          </div>

          {/* Bottom Controls */}
          <div className="mt-auto flex-shrink-0 space-y-2 overflow-hidden whitespace-nowrap">
            {/* Coin Panel — shown for Lite Mode users */}
            <CoinPanel variant="sidebar" onUpgradeClick={() => navigate('/pricing')} />

            {/* Collapsible Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-1 border-t border-gray-200 dark:border-white/5 pt-2 overflow-y-auto" style={{ maxHeight: '52vh' }}>
                            {/* Buy More Coins */}
                            <button onClick={() => navigate('/subscription')} className="w-full flex items-center gap-3 px-2 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg transition-colors text-sm border border-indigo-200 dark:border-indigo-500/20">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
                                    <FaBolt size={13} className="text-white" />
                                </div>
                                <div className="flex-1 text-left overflow-hidden">
                                    <p className="font-medium text-indigo-700 dark:text-indigo-300 text-sm truncate">Buy More Coins</p>
                                    <p className="text-xs text-indigo-500 dark:text-indigo-400 truncate">Top up your coin balance</p>
                                </div>
                                <FaChevronRight size={10} className="text-indigo-400 flex-shrink-0" />
                            </button>

                            {/* Transactions */}
                            <button onClick={() => navigate('/transaction-history')} className="w-full flex items-center gap-3 px-2 py-2.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-sm">
                                <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                                    <FaHistory size={13} className="text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div className="flex-1 text-left overflow-hidden">
                                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">Transactions</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Coin history</p>
                                </div>
                                <FaChevronRight size={10} className="text-gray-400 flex-shrink-0" />
                            </button>

                            {/* Feedback & Help */}
                            <button onClick={() => navigate('/feedback')} className="w-full flex items-center gap-3 px-2 py-2.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-sm">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                    <FaCommentAlt size={13} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1 text-left overflow-hidden">
                                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">Feedback & Help</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Report a bug or ask for help</p>
                                </div>
                                <FaChevronRight size={10} className="text-gray-400 flex-shrink-0" />
                            </button>

                            {/* Settings */}
                            <button onClick={() => navigate('/settings')} className="w-full flex items-center gap-3 px-2 py-2.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-sm">
                                <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                                    <FaCog size={13} className="text-teal-600 dark:text-teal-400" />
                                </div>
                                <div className="flex-1 text-left overflow-hidden">
                                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">Settings</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Manage your account and support</p>
                                </div>
                                <FaChevronRight size={10} className="text-gray-400 flex-shrink-0" />
                            </button>

                            {/* Dark Mode Toggle */}
                            <div className="flex items-center gap-3 px-2 py-2.5 rounded-lg border-t border-gray-200 dark:border-white/5 mt-2 pt-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-500/20 flex items-center justify-center flex-shrink-0">
                                    <FaMoon size={13} className="text-slate-600 dark:text-slate-400" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">Dark Mode</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{theme === 'dark' ? 'Switch to light' : 'Switch to dark'}</p>
                                </div>
                                <button
                                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                    className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                >
                                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${theme === 'dark' ? 'left-5' : 'left-1'}`} />
                                </button>
                            </div>

                            {/* Log Out */}
                            <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-2 py-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors text-sm">
                                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                    <FaSignOutAlt size={13} className="text-red-500 dark:text-red-400" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-medium text-red-600 dark:text-red-400 text-sm">Log Out</p>
                                </div>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* User Profile - Toggle Trigger */}
            <div 
                className="flex items-center gap-3 px-2 pt-2 border-t border-gray-200 dark:border-white/5 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 rounded p-2 transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
                <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {user?.email?.substring(0, 2).toUpperCase() || 'AI'}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{user?.email?.split('@')[0] || t('sidebar.user')}</p>
                  <SubscriptionBadge className="mt-0.5" />
                </div>
                {isMenuOpen ? <FaChevronUp size={12} className="text-gray-500 flex-shrink-0" /> : <FaChevronDown size={12} className="text-gray-500 flex-shrink-0" />}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active = false, badge, onClick }) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm group ${
        active 
          ? 'bg-indigo-50 text-indigo-600 dark:bg-white/10 dark:text-white' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5'
      }`}
    >
        <div className="flex items-center gap-3">
            <span className={active ? 'text-indigo-600 dark:text-white' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}>{icon}</span>
            <span>{label}</span>
        </div>
        {badge && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold">{badge}</span>}
    </button>
);

export default SidebarLeft;
