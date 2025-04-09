import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { AiOutlineHome, AiOutlineDatabase, AiOutlineTrophy, AiOutlineRobot, AiOutlineBook, AiOutlineRead, AiOutlineUser, AiOutlineBulb } from 'react-icons/ai';
import IconComponent from '../ui/IconComponent';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../utils/AuthContext';
import eduLogo from '../../assets/edulogo.jpeg';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
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

  // Split navigation for mobile rows - 4 items in first row, 3 in second
  const mobileFirstRow = navigation.slice(0, 4);
  const mobileSecondRow = navigation.slice(4);

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
      className="bg-white shadow-sm"
    >
      <div className="container mx-auto px-0">
        <div className="flex justify-between items-center ">
          <div className="flex items-center">
            <motion.div 
              variants={logoVariants}
              whileHover="hover"
            >
              <Link to="/" className="flex items-center">
                <span className="text-2xl font-bold text-teal-800 mr-2 ml-2">Edu<span className="text-orange-500">Smart</span></span>
                <div className="w-40 h-12 mr-2 overflow-hidden" style={{ aspectRatio: '1/4' }}>
                  <img 
                    alt="EduSmart Logo" 
                    src={eduLogo} 
                    className="w-full h-full object-contain"
                  />
                </div>
              </Link>
            </motion.div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <motion.div
                key={item.name}
                variants={navItemVariants}
                whileHover="hover"
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
                  variants={navItemVariants}
                  whileHover="hover"
                >
                  <Link
                    to="/login"
                    className="text-sm font-medium text-gray-700"
                  >
                    Login
                  </Link>
                </motion.div>
                <motion.div
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
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
          
          {/* User menu button for mobile */}
          <div className="md:hidden flex items-center">
            {user && (
              <div className="relative">
                <motion.button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center text-sm font-medium text-gray-700 focus:outline-none ml-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <IconComponent icon={AiOutlineUser} className="h-6 w-6 mr-4" />
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
            )}
          </div>
        </div>
        
        {/* Mobile Navigation with Circles and Icons */}
        <div className="md:hidden bg-gradient-to-r from-teal-700 to-teal-900 text-white">
          {/* First row of navigation items - 4 items */}
          <div className="grid grid-cols-4 gap-3 py-3 px-2 border-t border-gray-200">
            {mobileFirstRow.map((item, index) => (
              <motion.div
                key={item.name}
                className="flex flex-col items-center"
                variants={getAnimationVariant()}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Link
                  to={item.href}
                  className="flex flex-col items-center"
                >
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full shadow-md mb-1 bg-white ${
                    isActive(item.href)
                      ? 'text-orange-500 border-2 border-orange-500'
                      : 'text-gray-700 border border-gray-300'
                  }`}>
                    <IconComponent icon={item.icon} className="h-6 w-6" />
                  </div>
                  <span className={`text-xs font-medium mt-1 ${
                    isActive(item.href)
                      ? 'text-orange-300'
                      : 'text-white'
                  }`}>
                    {item.name}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
          
          {/* Second row - remaining items in a row with equal spacing */}
          <div className="grid grid-cols-4 gap-3 py-3 px-2 border-t border-gray-200">
            {mobileSecondRow.map((item, index) => (
              <motion.div
                key={item.name}
                className="flex flex-col items-center"
                variants={getAnimationVariant()}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.3, delay: 0.4 + (index * 0.1) }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Link
                  to={item.href}
                  className="flex flex-col items-center"
                >
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full shadow-md mb-1 bg-white ${
                    isActive(item.href)
                      ? 'text-orange-500 border-2 border-orange-500'
                      : 'text-gray-700 border border-gray-300'
                  }`}>
                    <IconComponent icon={item.icon} className="h-6 w-6" />
                  </div>
                  <span className={`text-xs font-medium mt-1 ${
                    isActive(item.href)
                      ? 'text-orange-300'
                      : 'text-white'
                  }`}>
                    {item.name}
                  </span>
                </Link>
              </motion.div>
            ))}
            
            {/* Add login/signup in the same row if not logged in */}
            {!user && (
              <>
                <motion.div
                  className="flex flex-col items-center"
                  variants={getAnimationVariant()}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.3, delay: 0.6 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Link
                    to="/login"
                    className="flex flex-col items-center"
                  >
                    <div className="w-12 h-12 rounded-full shadow-md flex items-center justify-center mb-1 bg-white border border-gray-300">
                      <IconComponent icon={AiOutlineUser} className="h-6 w-6 text-gray-700" />
                    </div>
                    <span className="text-xs font-medium mt-1 text-white">Login</span>
                  </Link>
                </motion.div>
                <motion.div
                  className="flex flex-col items-center"
                  variants={getAnimationVariant()}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.3, delay: 0.7 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Link
                    to="/signup"
                    className="flex flex-col items-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center mb-1 shadow-md">
                      <IconComponent icon={AiOutlineUser} className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-medium mt-1 text-orange-300">Sign Up</span>
                  </Link>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header; 