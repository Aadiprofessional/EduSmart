import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { AiOutlineHome, AiOutlineDatabase, AiOutlineTrophy, AiOutlineRobot, AiOutlineBook, AiOutlineRead, AiOutlineUser, AiOutlineBulb, AiOutlineMenu, AiOutlineClose, AiOutlineEdit, AiOutlineCrown, AiOutlineBell } from 'react-icons/ai';
import { FaClipboardList, FaBell, FaExclamationTriangle, FaClock } from 'react-icons/fa';
import IconComponent from '../ui/IconComponent';
import LanguageSelector from '../ui/LanguageSelector';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../utils/AuthContext';
import { useSubscription } from '../../utils/SubscriptionContext';
import { useLanguage } from '../../utils/LanguageContext';
import { useAppData } from '../../utils/AppDataContext';
import eduLogo from '../../assets/edulogo.jpeg';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [userMenuPosition, setUserMenuPosition] = useState({ top: 0, right: 0 });
  const [notificationMenuPosition, setNotificationMenuPosition] = useState({ top: 0, right: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isProUser, responsesRemaining } = useSubscription();
  const { t } = useLanguage();
  const { studyTasks, applications } = useAppData();
  
  // Refs for menu elements
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileUserMenuButtonRef = useRef<HTMLButtonElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);

  // Calculate notifications from study planner data
  const notifications = useMemo(() => {
    const now = new Date();
    const alerts: Array<{
      id: string;
      type: 'overdue' | 'due_soon' | 'reminder' | 'application_deadline' | 'essay_deadline' | 'interview_reminder';
      title: string;
      message: string;
      date: string;
      priority: 'high' | 'medium' | 'low';
      icon: any;
    }> = [];

    // Study task overdue alerts
    studyTasks.forEach(task => {
      if (!task.completed && new Date(task.date) < now) {
        const daysOverdue = Math.floor((now.getTime() - new Date(task.date).getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
          id: `overdue-${task.id}`,
          type: 'overdue',
          title: 'Overdue Task',
          message: `${task.task} (${task.subject}) - ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`,
          date: task.date,
          priority: 'high',
          icon: FaExclamationTriangle
        });
      }
    });

    // Study task due soon alerts (next 3 days)
    studyTasks.forEach(task => {
      if (!task.completed) {
        const taskDate = new Date(task.date);
        const daysUntil = Math.ceil((taskDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil >= 0 && daysUntil <= 3) {
          alerts.push({
            id: `due-soon-${task.id}`,
            type: 'due_soon',
            title: daysUntil === 0 ? 'Due Today' : `Due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`,
            message: `${task.task} (${task.subject})`,
            date: task.date,
            priority: daysUntil === 0 ? 'high' : task.priority === 'high' ? 'high' : 'medium',
            icon: FaClock
          });
        }
      }
    });

    // Study task reminders
    studyTasks.forEach(task => {
      if (task.reminder && task.reminderDate && !task.completed) {
        const reminderDate = new Date(task.reminderDate);
        const timeDiff = reminderDate.getTime() - now.getTime();
        const minutesUntil = Math.floor(timeDiff / (1000 * 60));
        
        // Show reminders that are due within the next 24 hours or overdue
        if (minutesUntil <= 1440 && minutesUntil >= -60) {
          let timeText = '';
          if (minutesUntil < 0) {
            timeText = `${Math.abs(minutesUntil)} minutes ago`;
          } else if (minutesUntil < 60) {
            timeText = `in ${minutesUntil} minutes`;
          } else {
            const hours = Math.floor(minutesUntil / 60);
            timeText = `in ${hours} hour${hours > 1 ? 's' : ''}`;
          }
          
          alerts.push({
            id: `reminder-${task.id}`,
            type: 'reminder',
            title: 'Task Reminder',
            message: `${task.task} (${task.subject}) - ${timeText}`,
            date: task.reminderDate,
            priority: minutesUntil < 0 ? 'high' : 'medium',
            icon: FaBell
          });
        }
      }
    });

    // Application deadline alerts (next 30 days)
    applications.forEach(app => {
      const appDeadline = new Date(app.deadline);
      const daysUntil = Math.ceil((appDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntil >= 0 && daysUntil <= 30) {
        alerts.push({
          id: `app-deadline-${app.id}`,
          type: 'application_deadline',
          title: daysUntil === 0 ? 'Application Due Today' : `Application Due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`,
          message: `${app.university} - ${app.program}`,
          date: app.deadline,
          priority: daysUntil <= 7 ? 'high' : daysUntil <= 14 ? 'medium' : 'low',
          icon: FaClipboardList
        });
      }
    });

    // Application task alerts (from application tasks)
    applications.forEach(app => {
      if (app.tasks && app.tasks.length > 0) {
        app.tasks.forEach(task => {
          if (task.dueDate && !task.completed) {
            const taskDeadline = new Date(task.dueDate);
            const daysUntil = Math.ceil((taskDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysUntil >= 0 && daysUntil <= 14) {
              alerts.push({
                id: `app-task-${app.id}-${task.id}`,
                type: 'due_soon',
                title: daysUntil === 0 ? 'Application Task Due Today' : `Application Task Due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`,
                message: `${task.task} (${app.university})`,
                date: task.dueDate,
                priority: daysUntil <= 3 ? 'high' : daysUntil <= 7 ? 'medium' : 'low',
                icon: FaClipboardList
              });
            }
          }
        });
      }
    });

    // Application reminder alerts
    applications.forEach(app => {
      if (app.reminder && app.reminderDate) {
        const reminderDate = new Date(app.reminderDate);
        const timeDiff = reminderDate.getTime() - now.getTime();
        const minutesUntil = Math.floor(timeDiff / (1000 * 60));
        
        // Show reminders that are due within the next 24 hours or overdue
        if (minutesUntil <= 1440 && minutesUntil >= -60) {
          let timeText = '';
          if (minutesUntil < 0) {
            timeText = `${Math.abs(minutesUntil)} minutes ago`;
          } else if (minutesUntil < 60) {
            timeText = `in ${minutesUntil} minutes`;
          } else {
            const hours = Math.floor(minutesUntil / 60);
            timeText = `in ${hours} hour${hours > 1 ? 's' : ''}`;
          }
          
          alerts.push({
            id: `app-reminder-${app.id}`,
            type: 'reminder',
            title: 'Application Reminder',
            message: `${app.university} - ${app.program} - ${timeText}`,
            date: app.reminderDate,
            priority: minutesUntil < 0 ? 'high' : 'medium',
            icon: FaBell
          });
        }
      }
    });

    // Sort by priority and date
    return alerts.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [studyTasks, applications]);

  const hasNotifications = notifications.length > 0;

  const navigation = [
    { name: t('nav.home'), href: '/', icon: AiOutlineHome },
    { name: t('nav.aiStudy'), href: '/ai-study', icon: AiOutlineBulb },
    { name: t('nav.aiCourses'), href: '/ai-courses', icon: AiOutlineRobot },
    { name: t('nav.database'), href: '/database', icon: AiOutlineDatabase },
    { name: t('nav.successStories'), href: '/case-studies', icon: AiOutlineTrophy },
    { name: t('nav.resources'), href: '/resources', icon: AiOutlineBook },
    { name: t('nav.blog'), href: '/blog', icon: AiOutlineRead },
  ];

  // Define pages where header should be visible - removed login and signup
  const headerVisiblePages = [
    '/',
    '/database',
    '/case-studies',
    '/ai-courses',
   
    '/ai-study',
    '/resources',
    '/blog',
    '/profile',
    '/subscription',
    '/dashboard',
    '/application-tracker',
 
    
  
  ];

  // Check if device is mobile and handle scroll
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    const handleScroll = () => {
      // Simplified scroll detection - just use window.scrollY
      const scrollPosition = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      setScrolled(scrollPosition > 10);
    };
    
    // Force header positioning with lower z-index than magnetic cursor
    const enforceHeaderPosition = () => {
      const header = document.querySelector('header');
      if (header) {
        header.style.position = 'fixed';
        header.style.top = '0px';
        header.style.left = '0px';
        header.style.right = '0px';
        header.style.width = '100vw';
        header.style.maxWidth = '100vw';
        // Lower z-index - below magnetic cursor but above content
        header.style.zIndex = '999999';
        header.style.transform = 'translate3d(0, 0, 0)';
        header.style.margin = '0';
        header.style.padding = '0';
        header.style.boxSizing = 'border-box';
      }
    };
    
    checkIfMobile();
    handleScroll();
    enforceHeaderPosition();
    
    // Enforce positioning on every scroll
    const combinedHandler = () => {
      handleScroll();
      enforceHeaderPosition();
    };
    
    window.addEventListener('resize', checkIfMobile);
    window.addEventListener('scroll', combinedHandler, { passive: true });
    
    // Also enforce on intervals to catch any CSS conflicts
    const interval = setInterval(enforceHeaderPosition, 1000);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
      window.removeEventListener('scroll', combinedHandler);
      clearInterval(interval);
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!isUserMenuOpen && !isNotificationMenuOpen) {
      return; // Don't add listener if menus are closed
    }

    const handleClickOutside = (event: Event) => {
      const target = event.target as Element;
      
      // Don't close if clicking on any menu related element
      if (target.closest('.user-menu-button') || 
          target.closest('.user-menu-dropdown') ||
          target.closest('.user-menu-container') ||
          target.closest('.notification-menu-button') ||
          target.closest('.notification-menu-dropdown') ||
          target.closest('.language-selector-container') || 
          target.closest('.language-dropdown')) {
        return;
      }
      
      // Close the menus
      setIsUserMenuOpen(false);
      setIsNotificationMenuOpen(false);
    };

    // Add a simple delay to ensure dropdown is rendered
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
      document.addEventListener('touchend', handleClickOutside, true);
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('touchend', handleClickOutside, true);
    };
  }, [isUserMenuOpen, isNotificationMenuOpen]);

  // Update user menu position when opened
  useEffect(() => {
    if (isUserMenuOpen) {
      // Try desktop button first, then mobile button
      const userButton = userMenuButtonRef.current || mobileUserMenuButtonRef.current;
      if (userButton) {
        const rect = userButton.getBoundingClientRect();
        
        // Calculate position below the button with explicit positioning
        const buttonBottom = rect.bottom;
        const gapBelowButton = 12; // 12px gap below button
        const topPosition = buttonBottom + gapBelowButton;
        
        // For right positioning, align dropdown's right edge with button's right edge
        const buttonRight = rect.right;
        const dropdownWidth = 208; // w-52 = 208px
        const rightPosition = window.innerWidth - buttonRight;
        
        // Ensure dropdown doesn't go off-screen on the right
        const minRightMargin = 16;
        const adjustedRightPosition = Math.max(minRightMargin, rightPosition);
        
        const newPosition = {
          top: topPosition,
          right: adjustedRightPosition,
        };
        
        console.log('User menu positioning:', {
          newPosition,
          buttonRect: rect,
          calculations: {
            buttonBottom,
            gapBelowButton,
            topPosition,
            buttonRight,
            dropdownWidth,
            rightPosition,
            adjustedRightPosition
          }
        });
        
        setUserMenuPosition(newPosition);
      } else {
        console.log('User button not found');
      }
    }
  }, [isUserMenuOpen]);

  // Update notification menu position when opened
  useEffect(() => {
    if (isNotificationMenuOpen) {
      const notificationButton = notificationButtonRef.current;
      if (notificationButton) {
        const rect = notificationButton.getBoundingClientRect();
        
        // Calculate position below the button
        const buttonBottom = rect.bottom;
        const gapBelowButton = 12;
        const topPosition = buttonBottom + gapBelowButton;
        
        // For right positioning, align dropdown's right edge with button's right edge
        const buttonRight = rect.right;
        const dropdownWidth = 320; // w-80 = 320px
        const rightPosition = window.innerWidth - buttonRight;
        
        // Ensure dropdown doesn't go off-screen
        const minRightMargin = 16;
        const adjustedRightPosition = Math.max(minRightMargin, rightPosition);
        
        setNotificationMenuPosition({
          top: topPosition,
          right: adjustedRightPosition,
        });
      }
    }
  }, [isNotificationMenuOpen]);

  // Check if header should be visible on current page
  const shouldShowHeader = headerVisiblePages.some(page => 
    location.pathname === page || 
    location.pathname.startsWith(page + '/') ||
    (page === '/courses' && location.pathname.includes('/course/')) ||
    (page === '/blog' && location.pathname.includes('/blog/'))
  );

  // Don't render header if it shouldn't be visible
  if (!shouldShowHeader) {
    return null;
  }

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  const handleUserMenuToggle = () => {
    setIsUserMenuOpen(prev => !prev);
  };

  const handleNotificationMenuToggle = () => {
    setIsNotificationMenuOpen(prev => !prev);
  };

  const logoVariants = {
    hover: {
      scale: 1.05,
      transition: { duration: 0.2 }
    }
  };

  const navItemVariants = {
    hover: {
      y: -2,
      scale: 1.05,
      transition: { duration: 0.2 }
    }
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.95
    }
  };

  const userMenuVariants = {
    hidden: { 
      opacity: 0,
      y: -5, // Small upward offset when hidden
      scale: 0.95
    },
    visible: { 
      opacity: 1,
      y: 0, // Natural position when visible
      scale: 1,
      transition: { duration: 0.2 }
    }
  };

  const mobileMenuVariants = {
    hidden: { 
      opacity: 0,
      height: 0,
      overflow: 'hidden'
    },
    visible: { 
      opacity: 1,
      height: 'auto',
      transition: { 
        duration: 0.4,
        staggerChildren: 0.05,
        when: "beforeChildren"
      }
    }
  };

  // User menu dropdown content with higher z-index
  const userMenuContent = isUserMenuOpen && typeof window !== 'undefined' ? (
    <motion.div
      className="user-menu-dropdown fixed w-52 bg-black/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
      variants={userMenuVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      style={{
        top: `${userMenuPosition.top}px`,
        right: `${userMenuPosition.right}px`,
        zIndex: 1000000, // Higher than header but lower than magnetic cursor
        transformOrigin: 'top right', // Animate from top-right corner
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()} // Prevent click bubbling
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div className="p-2">
        <Link
          to="/profile"
          className="flex items-center px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
          onClick={(e) => {
            e.stopPropagation(); // Prevent event bubbling
            setIsUserMenuOpen(false);
          }}
        >
          <IconComponent icon={AiOutlineUser} className="h-4 w-4 mr-3 flex-shrink-0" />
          <span className="whitespace-nowrap">Profile</span>
        </Link>
        <Link
          to="/application-tracker"
          className="flex items-center px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
          onClick={(e) => {
            e.stopPropagation(); // Prevent event bubbling
            setIsUserMenuOpen(false);
          }}
        >
          <IconComponent icon={FaClipboardList} className="h-4 w-4 mr-3 flex-shrink-0" />
          <span className="whitespace-nowrap">Application Tracker</span>
        </Link>
        {isProUser && (
          <Link
            to="/dashboard"
            className="flex items-center px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation(); // Prevent event bubbling
              setIsUserMenuOpen(false);
            }}
          >
            <IconComponent icon={AiOutlineCrown} className="h-4 w-4 mr-3 flex-shrink-0" />
            <span className="whitespace-nowrap">Dashboard</span>
          </Link>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent event bubbling
            handleSignOut();
          }}
          className="w-full flex items-center px-4 py-3 text-gray-300 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all duration-200"
        >
          <IconComponent icon={AiOutlineEdit} className="h-4 w-4 mr-3 flex-shrink-0" />
          <span className="whitespace-nowrap">Sign Out</span>
        </button>
      </div>
    </motion.div>
  ) : null;

  return (
    <header 
      className={`header-fixed fixed top-0 left-0 right-0 transition-all duration-500 ease-out`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100vw',
        maxWidth: '100vw',
        zIndex: 999999, // Consistent z-index - below magnetic cursor but above content
        transform: 'translate3d(0, 0, 0)',
        WebkitTransform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
        backgroundColor: (scrolled || isMobile) ? 'rgba(0, 0, 0, 0.95)' : 'transparent',
        background: (scrolled || isMobile)
          ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 25%, rgba(51, 65, 85, 0.98) 50%, rgba(71, 85, 105, 0.98) 75%, rgba(15, 23, 42, 0.98) 100%)' 
          : 'transparent',
        backdropFilter: (scrolled || isMobile) ? 'blur(20px) saturate(200%)' : 'none',
        boxShadow: (scrolled || isMobile)
          ? '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1) inset' 
          : 'none',
        borderBottom: (scrolled || isMobile) ? '1px solid rgba(255, 255, 255, 0.15)' : 'none',
        WebkitBackdropFilter: (scrolled || isMobile) ? 'blur(20px) saturate(200%)' : 'none',
        backgroundSize: (scrolled || isMobile) ? '300% 300%' : '100% 100%',
        animation: (scrolled || isMobile) ? 'header-gradient 15s ease infinite' : 'none',
      }}
    >
      <div className="w-full max-w-none px-3 sm:px-4 lg:px-6">
        {/* Header with logo and navigation - improved spacing and alignment */}
        <div className="relative flex justify-between items-center py-1 sm:py-2 min-h-[42px] sm:min-h-[49px] max-w-[1600px] mx-auto">
          
          {/* Mobile: Menu button on left */}
          <motion.button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-all duration-200 flex-shrink-0"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            data-magnetic
          >
            <IconComponent 
              icon={isMobileMenuOpen ? AiOutlineClose : AiOutlineMenu} 
              className="h-5 w-5" 
            />
          </motion.button>

          {/* Desktop: Logo section on left */}
          <motion.div 
            className="hidden lg:flex items-center flex-shrink-0 min-w-0"
            variants={logoVariants}
            whileHover="hover"
            data-magnetic
          >
            <Link to="/" className="flex items-center min-w-0">
              <span className="font-bold text-xl lg:text-2xl xl:text-3xl bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent whitespace-nowrap relative">
                MatrixEdu
              </span>
              {isProUser && (
                <motion.div
                  className="ml-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center flex-shrink-0"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                >
                  <IconComponent icon={AiOutlineCrown} className="w-3 h-3 mr-1" />
                  <span className="text-xs">PRO</span>
                </motion.div>
              )}
            </Link>
          </motion.div>

          {/* Mobile: Logo in center with fixed width containers */}
          <div className="lg:hidden flex-1 flex justify-center items-center relative">
            <motion.div 
              className="flex items-center"
              variants={logoVariants}
              whileHover="hover"
              data-magnetic
            >
              <Link to="/" className="flex items-center min-w-0">
                <span className="font-bold text-lg sm:text-xl bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent whitespace-nowrap relative">
                  ME
                </span>
                {isProUser && (
                  <motion.div
                    className="ml-1 sm:ml-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex items-center flex-shrink-0"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                  >
                    <IconComponent icon={AiOutlineCrown} className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                    <span className="text-xs">PRO</span>
                  </motion.div>
                )}
              </Link>
            </motion.div>
          </div>
          
          {/* Mobile: User profile/actions on right - fixed width */}
          <div className="lg:hidden flex items-center space-x-1 flex-shrink-0 w-[80px] justify-end">
            {user ? (
              <div className="relative flex-shrink-0 user-menu-container">
                <motion.button
                  ref={mobileUserMenuButtonRef}
                  onClick={handleUserMenuToggle}
                  className="user-menu-button flex items-center px-2 py-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-full border border-white/10 text-white hover:border-white/30 transition-all duration-300 min-w-0"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  data-magnetic
                >
                  <IconComponent icon={AiOutlineUser} className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="max-w-[60px] truncate text-sm font-medium">
                    {user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
                  </span>
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center space-x-1 flex-shrink-0">
                <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                  <Link
                    to="/login"
                    className="px-2 py-1 text-gray-300 hover:text-white transition-all duration-300 rounded-full hover:bg-white/5 text-sm font-medium whitespace-nowrap"
                    data-magnetic
                  >
                    Login
                  </Link>
                </motion.div>
              </div>
            )}
          </div>

          {/* Desktop Navigation - improved responsive design to prevent overflow */}
          <nav className="hidden lg:flex items-center justify-center flex-1 px-2 min-w-0">
            <div className="flex items-center space-x-0.5 xl:space-x-1 2xl:space-x-2 overflow-hidden">
              {navigation.map((item) => (
                <motion.div
                  key={item.name}
                  variants={navItemVariants}
                  whileHover="hover"
                  data-magnetic
                  className="flex-shrink-0"
                >
                  <Link
                    to={item.href}
                    className={`flex items-center space-x-1 px-1 lg:px-1.5 xl:px-2 py-1 lg:py-1.5 rounded-lg xl:rounded-xl text-xs lg:text-xs xl:text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/40 shadow-lg shadow-blue-500/25 backdrop-blur-sm'
                        : 'text-gray-300 hover:text-white hover:bg-white/5 hover:backdrop-blur-sm'
                    }`}
                  >
                    <IconComponent icon={item.icon} className="h-3 w-3 lg:h-4 lg:w-4 xl:h-4 xl:w-4 flex-shrink-0" />
                    <span className="text-xs lg:text-xs xl:text-sm font-medium hidden lg:inline truncate max-w-[80px] xl:max-w-none">{item.name}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </nav>
          
          {/* Desktop auth buttons and language selector - improved spacing and overflow handling */}
          <div className="hidden lg:flex items-center space-x-1 xl:space-x-2 flex-shrink-0 min-w-0">
            {/* Language Selector */}
            <div className="language-selector-container flex-shrink-0">
              <LanguageSelector />
            </div>
            
            {user ? (
              <>
                {/* Pro User Status and Addon Button */}
                {isProUser ? (
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    {/* Response Counter */}
                    <motion.div
                      className="flex items-center px-1 xl:px-1.5 py-0.5 xl:py-1 bg-gradient-to-r from-green-500/10 to-blue-500/10 backdrop-blur-sm rounded-full border border-green-500/30 text-green-400 flex-shrink-0"
                      variants={buttonVariants}
                      whileHover="hover"
                      data-magnetic
                    >
                      <IconComponent icon={AiOutlineCrown} className="h-3 w-3 xl:h-4 xl:w-4 mr-1 flex-shrink-0" />
                      <span className="text-xs xl:text-sm font-medium">
                        {responsesRemaining}
                      </span>
                    </motion.div>
                    
                    {/* Buy Addon Button for Low Responses */}
                    {responsesRemaining < 50 && (
                      <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap" className="flex-shrink-0">
                        <Link
                          to="/subscription"
                          className="flex items-center px-1 xl:px-1.5 py-0.5 xl:py-1 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full font-medium shadow-lg hover:shadow-orange-500/25 transition-all duration-300 text-xs xl:text-sm whitespace-nowrap"
                          data-magnetic
                        >
                          <span className="hidden xl:inline">Buy More</span>
                          <span className="xl:hidden">+</span>
                        </Link>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap" className="flex-shrink-0">
                    <Link
                      to="/subscription"
                      className="flex items-center px-1 xl:px-1.5 py-0.5 xl:py-1 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-full font-medium shadow-lg hover:shadow-orange-500/25 transition-all duration-300 text-xs xl:text-sm whitespace-nowrap"
                      data-magnetic
                    >
                      <IconComponent icon={AiOutlineCrown} className="h-3 w-3 xl:h-4 xl:w-4 mr-1 xl:mr-1.5 flex-shrink-0" />
                      <span className="hidden xl:inline">Upgrade</span>
                      <span className="xl:hidden">Pro</span>
                    </Link>
                  </motion.div>
                )}
                
                {/* Notification Button */}
                <div className="relative flex-shrink-0">
                  <motion.button
                    ref={notificationButtonRef}
                    onClick={handleNotificationMenuToggle}
                    className={`notification-menu-button relative flex items-center px-1 xl:px-1.5 py-0.5 xl:py-1 backdrop-blur-sm rounded-full border transition-all duration-300 ${
                      hasNotifications 
                        ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/30 text-red-400 hover:border-red-500/50' 
                        : 'bg-gradient-to-r from-slate-500/10 to-gray-500/10 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                    }`}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    data-magnetic
                  >
                    <IconComponent icon={AiOutlineBell} className="h-3 w-3 xl:h-4 xl:w-4 flex-shrink-0" />
                    {hasNotifications && (
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-[8px] text-white font-bold">
                          {notifications.length > 9 ? '9+' : notifications.length}
                        </span>
                      </div>
                    )}
                  </motion.button>
                </div>
                
                <div className="relative flex-shrink-0 user-menu-container">
                  <motion.button
                    ref={userMenuButtonRef}
                    onClick={handleUserMenuToggle}
                    className="user-menu-button flex items-center px-1 xl:px-1.5 py-0.5 xl:py-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-full border border-white/10 text-white hover:border-white/30 transition-all duration-300 min-w-0"
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    data-magnetic
                  >
                    <IconComponent icon={AiOutlineUser} className="h-3 w-3 xl:h-4 xl:w-4 mr-1 xl:mr-1.5 flex-shrink-0" />
                    <span className="max-w-[50px] xl:max-w-[70px] 2xl:max-w-[90px] truncate text-xs xl:text-sm font-medium">
                      {user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
                    </span>
                  </motion.button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-1 xl:space-x-2 flex-shrink-0">
                <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                  <Link
                    to="/login"
                    className="px-1 xl:px-1.5 py-0.5 xl:py-1 text-gray-300 hover:text-white transition-all duration-300 rounded-full hover:bg-white/5 text-xs xl:text-sm font-medium whitespace-nowrap"
                    data-magnetic
                  >
                    Login
                  </Link>
                </motion.div>
                <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                  <Link
                    to="/signup"
                    className="px-1 xl:px-1.5 2xl:px-2 py-0.5 xl:py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-medium shadow-lg hover:shadow-blue-500/25 transition-all duration-300 text-xs xl:text-sm whitespace-nowrap"
                    data-magnetic
                  >
                    Sign Up
                  </Link>
                </motion.div>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile Navigation - Improved with better spacing and visibility */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="lg:hidden bg-black/98 backdrop-blur-xl rounded-2xl border border-white/20 mt-3 overflow-hidden shadow-2xl"
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              style={{ zIndex: 1000000 }}
            >
              <div className="p-4 space-y-3 max-h-[80vh] overflow-y-auto">
                {/* Navigation Links */}
                <div className="space-y-2">
                  {navigation.map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        to={item.href}
                        className={`flex items-center px-4 py-3 rounded-xl transition-all duration-300 ${
                          isActive(item.href)
                            ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30'
                            : 'text-gray-300 hover:text-white hover:bg-white/5'
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <IconComponent icon={item.icon} className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
                
                {/* Divider */}
                <div className="border-t border-white/20 my-4"></div>
                
                {/* Language Selector */}
                <div className="mb-4">
                  <div className="px-2">
                    <LanguageSelector />
                  </div>
                </div>
                
                {/* User Section */}
                {user ? (
                  <div className="space-y-3">
                    {/* Pro Status or Upgrade Button for Mobile */}
                    {isProUser ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl border border-green-500/30">
                          <div className="flex items-center">
                            <IconComponent icon={AiOutlineCrown} className="h-5 w-5 mr-3 text-green-400 flex-shrink-0" />
                            <span className="text-green-400 font-medium">Pro Member</span>
                          </div>
                          <span className="text-green-400 text-sm font-medium">{responsesRemaining} left</span>
                        </div>
                        
                        {/* Buy Addon Button for Low Responses on Mobile */}
                        {responsesRemaining < 50 && (
                          <Link
                            to="/subscription"
                            className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <IconComponent icon={AiOutlineCrown} className="h-5 w-5 mr-3 flex-shrink-0" />
                            <span>Buy More Responses</span>
                          </Link>
                        )}
                      </div>
                    ) : (
                      <Link
                        to="/subscription"
                        className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <IconComponent icon={AiOutlineCrown} className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span>Upgrade to Pro</span>
                      </Link>
                    )}
                    
                    {/* User Menu Items */}
                    <div className="space-y-2">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <IconComponent icon={AiOutlineUser} className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span className="font-medium">Profile</span>
                      </Link>
                      
                      <Link
                        to="/application-tracker"
                        className="flex items-center px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <IconComponent icon={FaClipboardList} className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span className="font-medium whitespace-nowrap">Application Tracker</span>
                      </Link>
                      
                      {isProUser && (
                        <Link
                          to="/dashboard"
                          className="flex items-center px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <IconComponent icon={AiOutlineCrown} className="h-5 w-5 mr-3 flex-shrink-0" />
                          <span className="font-medium">Dashboard</span>
                        </Link>
                      )}
                      
                      <button
                        onClick={() => {
                          handleSignOut();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center px-4 py-3 text-gray-300 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all duration-200"
                      >
                        <IconComponent icon={AiOutlineEdit} className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span className="font-medium">Sign Out</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link
                      to="/login"
                      className="block px-4 py-3 text-center text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200 font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      className="block px-4 py-3 text-center bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Render user menu dropdown using portal to avoid affecting header layout */}
      {userMenuContent && createPortal(userMenuContent, document.body)}

      {/* Notification dropdown content with higher z-index */}
      {isNotificationMenuOpen && typeof window !== 'undefined' && createPortal(
        <motion.div
          className="notification-menu-dropdown fixed w-80 bg-black/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
          variants={userMenuVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          style={{
            top: `${notificationMenuPosition.top}px`,
            right: `${notificationMenuPosition.right}px`,
            zIndex: 1000000,
            transformOrigin: 'top right',
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <IconComponent icon={FaBell} className="h-5 w-5 mr-2 text-blue-400" />
                Notifications
              </h3>
              {hasNotifications && (
                <span className="text-xs text-gray-400">
                  {notifications.length} {notifications.length === 1 ? 'item' : 'items'}
                </span>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <IconComponent icon={FaBell} className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No notifications</p>
                  <p className="text-gray-500 text-xs mt-1">You're all caught up!</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const getNotificationIcon = (type: string) => {
                    switch (type) {
                      case 'overdue': return FaExclamationTriangle;
                      case 'deadline': return FaClock;
                      case 'reminder': return FaBell;
                      default: return FaBell;
                    }
                  };

                  const getNotificationColor = (type: string, priority: string) => {
                    switch (type) {
                      case 'overdue': return 'text-red-400 bg-red-500/10 border-red-500/20';
                      case 'deadline': 
                        return priority === 'high' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
                      case 'reminder': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
                      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
                    }
                  };

                  const formatDate = (dateStr: string) => {
                    const date = new Date(dateStr);
                    const today = new Date();
                    const diffTime = date.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays === 0) return 'Today';
                    if (diffDays === -1) return 'Yesterday';
                    if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
                    if (diffDays === 1) return 'Tomorrow';
                    if (diffDays <= 7) return `In ${diffDays} days`;
                    return date.toLocaleDateString();
                  };

                  return (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-xl border transition-all duration-200 hover:bg-white/5 ${getNotificationColor(notification.type, notification.priority)}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          notification.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                          notification.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          <IconComponent icon={notification.icon} className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium text-white truncate">{notification.title}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              notification.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                              notification.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {notification.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 mb-1">{notification.message}</p>
                          <p className="text-xs text-gray-500">{formatDate(notification.date)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {hasNotifications && (
              <div className="mt-4 pt-3 border-t border-white/10">
                <Link
                  to="/ai-study"
                  className="block w-full text-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-lg text-sm"
                  onClick={() => setIsNotificationMenuOpen(false)}
                >
                  View Study Planner
                </Link>
              </div>
            )}
          </div>
        </motion.div>,
        document.body
      )}
    </header>
  );
};

export default Header; 