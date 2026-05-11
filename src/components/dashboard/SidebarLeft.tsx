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
  FaHistory,
  FaCalendarAlt,
  FaPenNib,
  FaUserCheck,
  FaChevronLeft,
  FaCheckCircle,
  FaGlobe,
  FaTrash,
  FaExclamationTriangle
} from 'react-icons/fa';
import { useAuth } from '../../utils/AuthContext';
import { useLanguage } from '../../utils/LanguageContext';
import { useTheme } from '../../utils/ThemeContext';
import matrixLogo from '../../assets/matrixedu.jpeg';
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
          className={`bg-white dark:bg-[#111111] border-r border-gray-200 dark:border-white/10 flex flex-col justify-between h-full p-4 flex-shrink-0 group text-gray-900 dark:text-white ${className}`}
        >
          <div className="overflow-hidden whitespace-nowrap">
            {/* Logo */}
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                <LogoWithText size={28} maxTextWidth={120} title="MatrixEdu" subtitle="MatrixAI Company Limited" />
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
          <div className="space-y-4 overflow-hidden whitespace-nowrap">
            {/* Coin Panel — shown for Lite Mode users */}
            <CoinPanel variant="sidebar" onUpgradeClick={() => navigate('/pricing')} />

            {/* Theme Toggle */}
            <div className="bg-gray-100 dark:bg-[#1a1a1a] p-1 rounded-lg flex justify-between border border-gray-200 dark:border-white/5">
                <button 
                  onClick={() => setTheme('light')}
                  className={`flex-1 p-1.5 rounded flex justify-center transition-colors ${theme === 'light' ? 'bg-white shadow text-gray-900' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10'}`}
                  title={t('sidebar.lightMode')}
                >
                  <FaSun size={14} />
                </button>
                <button 
                   onClick={() => setTheme('dark')}
                   className={`flex-1 p-1.5 rounded flex justify-center transition-colors ${theme === 'dark' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10'}`}
                   title={t('sidebar.darkMode')}
                >
                  <FaMoon size={14} />
                </button>
            </div>

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
                        <div className="space-y-1 border-t border-gray-200 dark:border-white/5 pt-4">
                            <NavItem icon={<FaHistory />} label={t('sidebar.transactionHistory')} onClick={() => navigate('/transaction-history')} />

                            {/* Language Selector */}
                            <div className="relative">
                              <button
                                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                                className="w-full flex items-center gap-3 px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-sm"
                              >
                                <FaGlobe size={13} />
                                <span className="flex-1 text-left">{currentLangLabel}</span>
                                <FaChevronDown size={10} className={`transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
                              </button>
                              <AnimatePresence>
                                {isLangDropdownOpen && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="overflow-hidden pl-8"
                                  >
                                    {languageOptions.map(opt => (
                                      <button
                                        key={opt.code}
                                        onClick={() => { setLanguage(opt.code); setIsLangDropdownOpen(false); }}
                                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${language === opt.code ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 font-semibold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                      >
                                        {language === opt.code && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />}
                                        {opt.label}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Delete Account */}
                            {deleteConfirmStep === 0 && (
                              <button
                                onClick={handleDeleteAccount}
                                className="w-full flex items-center gap-3 px-3 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors text-sm"
                              >
                                <FaTrash size={12} />
                                <span>Delete Account</span>
                              </button>
                            )}
                            {deleteConfirmStep === 1 && (
                              <div className="px-3 py-2 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-500/20">
                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-semibold mb-2">
                                  <FaExclamationTriangle size={12} />
                                  <span>Delete your account?</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">All your data will be permanently deleted. This cannot be undone.</p>
                                <div className="flex gap-2">
                                  <button onClick={() => setDeleteConfirmStep(0)} className="flex-1 py-1.5 text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                                  <button onClick={handleDeleteAccount} className="flex-1 py-1.5 text-xs text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors font-semibold">Continue</button>
                                </div>
                              </div>
                            )}
                            {deleteConfirmStep === 2 && (
                              <div className="px-3 py-2 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-500/20">
                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-semibold mb-2">
                                  <FaExclamationTriangle size={12} />
                                  <span>Final confirmation</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Are you absolutely sure? This action is irreversible.</p>
                                <div className="flex gap-2">
                                  <button onClick={() => setDeleteConfirmStep(0)} className="flex-1 py-1.5 text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                                  <button onClick={handleDeleteAccount} disabled={isDeletingAccount} className="flex-1 py-1.5 text-xs text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-semibold disabled:opacity-60">
                                    {isDeletingAccount ? 'Deleting...' : 'Delete Forever'}
                                  </button>
                                </div>
                              </div>
                            )}

                            <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-sm">
                                <FaSignOutAlt />
                                <span>{t('nav.logout')}</span>
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
