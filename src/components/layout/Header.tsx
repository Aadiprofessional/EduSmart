import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { AiOutlineHome, AiOutlineDatabase, AiOutlineTrophy, AiOutlineRobot, AiOutlineBook, AiOutlineRead, AiOutlineUser, AiOutlineBulb, AiOutlineMenu, AiOutlineClose, AiOutlineEdit } from 'react-icons/ai';
import IconComponent from '../ui/IconComponent';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../utils/AuthContext';
import eduLogo from '../../assets/edulogo.jpeg';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  const navigation = [
    { name: 'Home', href: '/', icon: AiOutlineHome },
    { name: 'Database', href: '/database', icon: AiOutlineDatabase },
    { name: 'Success Stories', href: '/case-studies', icon: AiOutlineTrophy },
    { name: 'AI Courses', href: '/ai-courses', icon: AiOutlineRobot },
    { name: 'AI Study', href: '/ai-study', icon: AiOutlineBulb },
    { name: 'Resources', href: '/resources', icon: AiOutlineBook },
    { name: 'Blog', href: '/blog', icon: AiOutlineRead },
  ];

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

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
      color: '#f97316',
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
  
  const getAnimationVariant = () => {
    return isMobile 
      ? { 
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 }
        }
      : {
          hidden: { opacity: 0, x: location.pathname === '/' ? -20 : 20 },
          visible: { opacity: 1, x: 0 }
        };
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

  const expandButtonVariants = {
    initial: { rotate: 0 },
    expanded: { rotate: 180 }
  };

  // Items to show in the single row (first 4)
  const visibleItems = navigation.slice(0, 4);
  // Items to show when expanded
  const expandedItems = navigation.slice(4);

  // Function to toggle expanded state
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-0">
        {/* Header with logo and navigation */}
        <div className="flex justify-between items-center py-2">
          {/* Logo section - centered on mobile */}
          <div className={`flex items-start ${isMobile ? 'ml-2' : ''}`}>
  {/* Only apply animation variants on non-mobile */}
  <div className={isMobile ? '' : 'motion-safe:hover:scale-105 transition-transform duration-200'}>
    <Link to="/" className="flex items-center">
      {/* Conditional text based on screen size */}
      {isMobile ? (
        <span className="text-2xl font-bold text-teal-800 mr-2 ml-2">
        E<span className="text-orange-500">S</span>
      </span>
      ) : (
        <span className="text-2xl font-bold text-teal-800 mr-2 ml-2">
          Edu<span className="text-orange-500">Smart</span>
        </span>
      )}
      
    </Link>
  </div>
</div>

          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <motion.div
                key={item.name}
                animate={isActive(item.href) ? { y: [0, -2, 0], transition: { duration: 0.5 } } : {}}
                whileHover={{ y: -2, color: '#f97316', transition: { duration: 0.2 } }}
              >
                <Link
                  to={item.href}
                  className={`text-sm font-medium ${
                    isActive(item.href)
                      ? 'text-orange-500'
                      : 'text-gray-700'
                  }`}
                >
                  {item.name}
                </Link>
              </motion.div>
            ))}
          </nav>
          
          {/* Desktop auth buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <motion.button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center text-sm font-medium text-gray-700 focus:outline-none"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <IconComponent icon={AiOutlineUser} className="h-6 w-6 mr-1" />
                  <span className="max-w-[150px] truncate">
                    {user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
                  </span>
                </motion.button>
                
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10"
                      variants={userMenuVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                    >
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Your Profile
                      </Link>
                      <Link
                        to="/application-tracker"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Application Tracker
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <motion.div
                  animate={isActive('/login') ? { y: [0, -2, 0], transition: { duration: 0.5 } } : {}}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                >
                  <Link
                    to="/login"
                    className="text-sm font-medium text-gray-700"
                  >
                    Login
                  </Link>
                </motion.div>
                <motion.div
                  animate={isActive('/signup') ? { scale: [1, 1.05, 1], transition: { duration: 0.5 } } : {}}
                  whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/signup"
                    className="text-sm font-medium bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
                  >
                    Sign Up
                  </Link>
                </motion.div>
              </>
            )}
          </div>
          
          {/* Mobile auth buttons */}
          <div className="md:hidden flex items-center absolute right-4">
            {user ? (
              <div className="relative">
                <motion.button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center text-sm font-medium text-gray-700 focus:outline-none"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <IconComponent icon={AiOutlineUser} className="h-6 w-6" />
                </motion.button>
                
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10"
                      variants={userMenuVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                    >
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Your Profile
                      </Link>
                      <Link
                        to="/application-tracker"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Application Tracker
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link
                  to="/login"
                  className="text-xs font-medium text-gray-700 border border-gray-300 px-2 py-1 rounded"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="text-xs font-medium bg-orange-500 text-white px-2 py-1 rounded"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* New Mobile Navigation with Expandable Menu */}
        <div className="md:hidden bg-gradient-to-r from-teal-700 to-teal-900 text-white relative">
          {/* Single row of navigation items - always visible */}
          <div className="flex justify-between items-center py-3 px-2">
            <div className="flex justify-between w-full px-1">
              {visibleItems.map((item, index) => (
                <div
                  key={item.name}
                  className="flex flex-col items-center"
                >
                  <Link
                    to={item.href}
                    className="flex flex-col items-center"
                  >
                    <motion.div 
                      className={`flex items-center justify-center w-12 h-12 rounded-full shadow-md mb-1 bg-white ${
                        isActive(item.href)
                          ? 'text-orange-500 border-2 border-orange-500'
                          : 'text-gray-700 border border-gray-300'
                      }`}
                      animate={isActive(item.href) ? { scale: [1, 1.1, 1] } : {}}
                      transition={isActive(item.href) ? { duration: 0.5 } : {}}
                    >
                      <IconComponent icon={item.icon} className="h-6 w-6" />
                    </motion.div>
                    <span className={`text-xs font-medium mt-1 ${
                      isActive(item.href)
                        ? 'text-orange-300'
                        : 'text-white'
                    }`}>
                      {item.name}
                    </span>
                  </Link>
                </div>
              ))}
              
              {/* Expand button */}
              <div className="flex flex-col items-center">
                <button
                  onClick={toggleExpand}
                  className="bg-orange-500 w-12 h-12 rounded-full flex items-center justify-center shadow-lg mb-1"
                  style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
                >
                  <IconComponent 
                    icon={isExpanded ? AiOutlineClose : AiOutlineMenu} 
                    className="h-6 w-6 text-white" 
                  />
                </button>
                <span className="text-xs font-medium mt-1 text-white">More</span>
              </div>
            </div>
          </div>
          
          {/* Expandable section */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                className="border-t border-teal-600"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-4 gap-3 py-4 px-2">
                  {expandedItems.map((item, index) => (
                    <div
                      key={item.name}
                      className="flex flex-col items-center"
                    >
                      <Link
                        to={item.href}
                        className="flex flex-col items-center"
                        onClick={() => setIsExpanded(false)}
                      >
                        <motion.div 
                          className={`flex items-center justify-center w-12 h-12 rounded-full shadow-md mb-1 bg-white ${
                            isActive(item.href)
                              ? 'text-orange-500 border-2 border-orange-500'
                              : 'text-gray-700 border border-gray-300'
                          }`}
                          animate={isActive(item.href) ? { scale: [1, 1.1, 1] } : {}}
                          transition={isActive(item.href) ? { duration: 0.5 } : {}}
                        >
                          <IconComponent icon={item.icon} className="h-6 w-6" />
                        </motion.div>
                        <span className={`text-xs font-medium mt-1 ${
                          isActive(item.href)
                            ? 'text-orange-300'
                            : 'text-white'
                        }`}>
                          {item.name}
                        </span>
                      </Link>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header; 