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
  FaChevronLeft
} from 'react-icons/fa';
import { useAuth } from '../../utils/AuthContext';
import { useLanguage } from '../../utils/LanguageContext';

import { useTheme } from '../../utils/ThemeContext';

import matrixLogo from '../../assets/matrixedu.png';

interface SidebarLeftProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const SidebarLeft: React.FC<SidebarLeftProps> = ({ className = '', isOpen = true, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    setIsMenuOpen(false);
    await signOut();
  };

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
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                    <img src={matrixLogo} alt={t('sidebar.logoAlt')} className="w-5 h-5" />
                </div>
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl font-bold text-indigo-600 dark:text-indigo-500"
                >
                  MatrixEdu
                </motion.span>
              </div>

              <button onClick={onClose} className="hover:text-gray-900 dark:hover:text-white text-gray-400" title={t('sidebar.closeSidebar')}>
                  <FaChevronLeft size={16} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
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
                <NavItem 
                icon={<FaCalendarAlt />} 
                label={t('sidebar.studyPlanner')}
                active={isActive('/study-planner')} 
                onClick={() => navigate('/study-planner')}
              />
            </nav>
          </div>

          {/* Bottom Controls */}
          <div className="space-y-4 overflow-hidden whitespace-nowrap">
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
