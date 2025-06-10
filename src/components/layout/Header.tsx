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

  // Define pages where header should be visible
  const headerVisiblePages = [
    '/',
    '/database',
    '/case-studies',
    '/ai-courses',
    '/ai-study',
    '/resources',
    '/blog',
    '/about',
    '/courses',
    '/login',
    '/signup',
    '/profile',
    '/application-tracker',
    '/chatbot',
    '/scholarships'
  ];

  // Check if device is mobile and handle scroll
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    
    checkIfMobile();
    handleScroll();
    
    window.addEventListener('resize', checkIfMobile);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
      window.removeEventListener('scroll', handleScroll);
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-2xl' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        {/* Header with logo and navigation */}
        <div className="flex justify-between items-center py-4">
          {/* Logo section */}
          <motion.div 
            className="flex items-center"
            variants={logoVariants}
            whileHover="hover"
            data-magnetic
            data-cursor-text="Home"
          >
            <Link to="/" className="flex items-center">
              <span className={`font-bold ${isMobile ? 'text-2xl' : 'text-3xl'} bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent`}>
                {isMobile ? 'ES' : 'EduSmart'}
              </span>
            </Link>
          </motion.div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            {navigation.map((item) => (
              <motion.div
                key={item.name}
                variants={navItemVariants}
                whileHover="hover"
                data-magnetic
                data-cursor-text={item.name}
              >
                <Link
                  to={item.href}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30 shadow-lg shadow-blue-500/25'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <IconComponent icon={item.icon} className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </nav>
          
          {/* Desktop auth buttons and language selector */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Language Selector with better visibility */}
            <div className="px-3 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 hover:border-white/20 transition-all duration-300">
              <LanguageSelector />
            </div>
            
            {user ? (
              <div className="relative">
                <motion.button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-full border border-white/10 text-white hover:border-white/30 transition-all duration-300"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  data-magnetic
                  data-cursor-text="Profile"
                >
                  <IconComponent icon={AiOutlineUser} className="h-5 w-5 mr-2" />
                  <span className="max-w-[150px] truncate text-sm font-medium">
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
              <div className="flex items-center space-x-2">
                <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-gray-300 hover:text-white transition-all duration-300 rounded-full hover:bg-white/5"
                    data-magnetic
                    data-cursor-text="Login"
                  >
                    Login
                  </Link>
                </motion.div>
                <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                  <Link
                    to="/signup"
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-medium shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                    data-magnetic
                    data-cursor-text="Sign Up"
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
            className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-all duration-200"
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
              className="md:hidden bg-black/95 backdrop-blur-xl rounded-2xl border border-white/10 mt-4 overflow-hidden"
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
                
                <div className="border-t border-white/10 pt-4 mt-4">
                  <div className="mb-4 p-3 bg-white/5 rounded-xl">
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