import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { AiOutlineHome, AiOutlineDatabase, AiOutlineTrophy, AiOutlineRobot, AiOutlineBook, AiOutlineRead, AiOutlineUser, AiOutlineBulb, AiOutlineMenu, AiOutlineClose, AiOutlineEdit } from 'react-icons/ai';
import IconComponent from '../ui/IconComponent';
import LanguageSelector from '../ui/LanguageSelector';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../utils/AuthContext';
import { useLanguage } from '../../utils/LanguageContext';
import eduLogo from '../../assets/edulogo.jpeg';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
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
    
    // Force header positioning
    const enforceHeaderPosition = () => {
      const header = document.querySelector('header');
      if (header) {
        header.style.position = 'fixed';
        header.style.top = '0px';
        header.style.left = '0px';
        header.style.right = '0px';
        header.style.width = '100vw';
        header.style.maxWidth = '100vw';
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

  return (
    <header 
      className={`header-fixed fixed top-0 left-0 right-0 z-[999999] transition-all duration-500 ease-out`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100vw',
        maxWidth: '100vw',
        zIndex: 999999,
        transform: 'translate3d(0, 0, 0)',
        WebkitTransform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
        backgroundColor: scrolled ? 'rgba(0, 0, 0, 0.8)' : 'transparent',
        background: scrolled 
          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(147, 51, 234, 0.95) 25%, rgba(236, 72, 153, 0.95) 50%, rgba(249, 115, 22, 0.95) 75%, rgba(34, 197, 94, 0.95) 100%)' 
          : 'transparent',
        backdropFilter: scrolled ? 'blur(20px) saturate(200%)' : 'none',
        boxShadow: scrolled 
          ? '0 8px 32px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset' 
          : 'none',
        borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(200%)' : 'none',
        backgroundSize: scrolled ? '300% 300%' : '100% 100%',
        animation: scrolled ? 'header-gradient 12s ease infinite' : 'none',
      }}
    >
      <div className="w-full max-w-none px-4 sm:px-6 lg:px-8">
        {/* Header with logo and navigation - improved spacing and alignment */}
        <div className="flex justify-between items-center py-3 min-h-[70px] max-w-[1600px] mx-auto">
          {/* Logo section - increased left margin */}
          <motion.div 
            className="flex items-center flex-shrink-0 mr-4 lg:mr-8"
            variants={logoVariants}
            whileHover="hover"
            data-magnetic
          >
            <Link to="/" className="flex items-center">
              <span className={`font-bold ${isMobile ? 'text-xl' : 'text-2xl lg:text-3xl'} bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent whitespace-nowrap`}>
                {isMobile ? 'ES' : 'EduSmart'}
              </span>
            </Link>
          </motion.div>
          
          {/* Desktop Navigation - improved spacing and responsive breakpoints */}
          <nav className="hidden lg:flex items-center justify-center flex-1 px-2">
            <div className="flex items-center space-x-0.5 xl:space-x-1 2xl:space-x-2">
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
                    className={`flex items-center space-x-1 px-2 lg:px-3 xl:px-4 py-2 rounded-xl text-xs lg:text-xs xl:text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/40 shadow-lg shadow-blue-500/25 backdrop-blur-sm'
                        : 'text-gray-300 hover:text-white hover:bg-white/5 hover:backdrop-blur-sm'
                    }`}
                  >
                    <IconComponent icon={item.icon} className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5 flex-shrink-0" />
                    <span className="text-xs lg:text-xs xl:text-sm font-medium hidden sm:inline">{item.name}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </nav>
          
          {/* Desktop auth buttons and language selector - improved spacing */}
          <div className="hidden lg:flex items-center space-x-2 xl:space-x-3 flex-shrink-0 ml-2">
            {/* Language Selector with better visibility */}
            <div className="px-2 xl:px-3 py-1.5 xl:py-2 bg-white backdrop-blur-sm rounded-full border border-white/10 hover:border-white/20 transition-all duration-300 flex-shrink-0">
              <LanguageSelector />
            </div>
            
            {user ? (
              <div className="relative flex-shrink-0">
                <motion.button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center px-3 xl:px-4 py-1.5 xl:py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-full border border-white/10 text-white hover:border-white/30 transition-all duration-300"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  data-magnetic
                >
                  <IconComponent icon={AiOutlineUser} className="h-4 w-4 xl:h-5 xl:w-5 mr-1.5 xl:mr-2 flex-shrink-0" />
                  <span className="max-w-[80px] xl:max-w-[120px] 2xl:max-w-[150px] truncate text-xs xl:text-sm font-medium">
                    {user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
                  </span>
                </motion.button>
                
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      className="absolute right-0 mt-2 w-48 bg-black/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                      variants={userMenuVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                    >
                      <div className="p-2">
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <IconComponent icon={AiOutlineUser} className="h-4 w-4 mr-3" />
                          Profile
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center px-4 py-3 text-gray-300 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all duration-200"
                        >
                          <IconComponent icon={AiOutlineEdit} className="h-4 w-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-1 xl:space-x-2 flex-shrink-0">
                <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                  <Link
                    to="/login"
                    className="px-3 xl:px-4 py-1.5 xl:py-2 text-gray-300 hover:text-white transition-all duration-300 rounded-full hover:bg-white/5 text-xs xl:text-sm font-medium whitespace-nowrap"
                    data-magnetic
                  >
                    Login
                  </Link>
                </motion.div>
                <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                  <Link
                    to="/signup"
                    className="px-3 xl:px-4 2xl:px-6 py-1.5 xl:py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-medium shadow-lg hover:shadow-blue-500/25 transition-all duration-300 text-xs xl:text-sm whitespace-nowrap"
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
              className="h-6 w-6" 
            />
          </motion.button>
        </div>
        
        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="lg:hidden bg-black/95 backdrop-blur-xl rounded-2xl border border-white/10 mt-4 overflow-hidden"
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="p-4 space-y-2">
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
                      <IconComponent icon={item.icon} className="h-5 w-5 mr-3" />
                      {item.name}
                    </Link>
                  </motion.div>
                ))}
                
                <div className="border-t border-white/20 pt-4 mt-4">
                  <div className="mb-4 p-3 bg-white rounded-xl">
                    <LanguageSelector />
                  </div>
                  
                  {user ? (
                    <div className="space-y-2">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <IconComponent icon={AiOutlineUser} className="h-5 w-5 mr-3" />
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          handleSignOut();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center px-4 py-3 text-gray-300 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all duration-200"
                      >
                        <IconComponent icon={AiOutlineEdit} className="h-5 w-5 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        to="/login"
                        className="block px-4 py-3 text-center text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Login
                      </Link>
                      <Link
                        to="/signup"
                        className="block px-4 py-3 text-center bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium transition-all duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Sign Up
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header; 