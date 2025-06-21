import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { AiOutlineHome, AiOutlineDatabase, AiOutlineTrophy, AiOutlineRobot, AiOutlineBook, AiOutlineRead, AiOutlineUser, AiOutlineBulb, AiOutlineMenu, AiOutlineClose, AiOutlineEdit, AiOutlineCrown } from 'react-icons/ai';
import { FaClipboardList } from 'react-icons/fa';
import IconComponent from '../ui/IconComponent';
import LanguageSelector from '../ui/LanguageSelector';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../utils/AuthContext';
import { useSubscription } from '../../utils/SubscriptionContext';
import { useLanguage } from '../../utils/LanguageContext';
import eduLogo from '../../assets/edulogo.jpeg';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userMenuPosition, setUserMenuPosition] = useState({ top: 0, right: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isProUser, responsesRemaining } = useSubscription();
  const { t } = useLanguage();
  
  const navigation = [
    { name: t('nav.home'), href: '/', icon: AiOutlineHome },
    { name: t('nav.database'), href: '/database', icon: AiOutlineDatabase },
    { name: t('nav.successStories'), href: '/case-studies', icon: AiOutlineTrophy },
    { name: t('nav.aiCourses'), href: '/ai-courses', icon: AiOutlineRobot },
    { name: t('nav.aiStudy'), href: '/ai-study', icon: AiOutlineBulb },
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
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Check if click is inside user menu dropdown or its button
      const userMenuDropdown = document.querySelector('.user-menu-dropdown');
      const userMenuButton = document.querySelector('.user-menu-button');
      const languageSelector = document.querySelector('.language-selector-container');
      const languageDropdown = document.querySelector('.language-dropdown');
      
      // Don't close user menu if clicking inside user menu elements
      const isInsideUserMenu = target.closest('.user-menu-dropdown') ||
                               target.closest('.user-menu-button') ||
                               userMenuDropdown?.contains(target) ||
                               userMenuButton?.contains(target);
      
      // Don't close user menu if clicking inside language selector or its dropdown
      const isInsideLanguageSelector = target.closest('.language-selector-container') ||
                                       target.closest('.language-dropdown') ||
                                       languageSelector?.contains(target) ||
                                       languageDropdown?.contains(target);
      
      // Only close user menu if clicking outside both user menu and language selector
      if (!isInsideUserMenu && !isInsideLanguageSelector) {
        setIsUserMenuOpen(false);
      }
    };

    // Use capture phase to handle clicks before other handlers, but with lower priority for language selector
    document.addEventListener('mousedown', handleClickOutside, false);
    return () => document.removeEventListener('mousedown', handleClickOutside, false);
  }, []);

  // Update user menu position when opened
  useEffect(() => {
    if (isUserMenuOpen) {
      const userButton = document.querySelector('.user-menu-button') as HTMLElement;
      if (userButton) {
        const rect = userButton.getBoundingClientRect();
        const newPosition = {
          top: rect.bottom + 8, // 8px gap below button
          right: window.innerWidth - rect.right, // Align to right edge of button
        };
        console.log('User menu positioning:', newPosition, 'Button rect:', rect);
        setUserMenuPosition(newPosition);
      } else {
        console.log('User button not found');
      }
    }
  }, [isUserMenuOpen]);

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
    console.log('User menu toggle clicked, current state:', isUserMenuOpen);
    setIsUserMenuOpen(!isUserMenuOpen);
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
      y: -10,
      scale: 0.95
    },
    visible: { 
      opacity: 1,
      y: 0,
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
      }}
      onClick={(e) => e.stopPropagation()} // Prevent click bubbling
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

  console.log('User menu state:', { isUserMenuOpen, userMenuContent: !!userMenuContent, userMenuPosition });

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
        <div className="flex justify-between items-center py-1 sm:py-2 min-h-[42px] sm:min-h-[49px] max-w-[1600px] mx-auto">
          {/* Logo section - improved responsive sizing */}
          <motion.div 
            className="flex items-center flex-shrink-0 min-w-0"
            variants={logoVariants}
            whileHover="hover"
            data-magnetic
          >
            <Link to="/" className="flex items-center min-w-0">
              <span className={`font-bold ${isMobile ? 'text-lg sm:text-xl' : 'text-xl lg:text-2xl xl:text-3xl'} bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent whitespace-nowrap relative`}>
                {isMobile ? 'ME' : 'MatrixEdu'}
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
            {/* Language Selector without background */}
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
                
                <div className="relative flex-shrink-0 user-menu-container">
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent event bubbling
                      handleUserMenuToggle();
                    }}
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
          
          {/* Mobile menu button */}
          <motion.button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-all duration-200 flex-shrink-0 ml-2"
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
    </header>
  );
};

export default Header; 