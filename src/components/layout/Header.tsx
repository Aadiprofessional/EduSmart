import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiX, HiMenu, HiOutlineUserCircle } from 'react-icons/hi';
import IconComponent from '../ui/IconComponent';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../utils/AuthContext';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Database', href: '/database' },
    { name: 'Success Stories', href: '/case-studies' },
    { name: 'AI Courses', href: '/ai-courses' },
    { name: 'Resources', href: '/resources' },
    { name: 'Blog', href: '/blog' },
  ];

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

  const mobileMenuVariants = {
    hidden: { 
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.3,
        when: "afterChildren"
      }
    },
    visible: { 
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.05
      }
    }
  };

  const mobileNavItemVariants = {
    hidden: { 
      opacity: 0,
      x: -20
    },
    visible: { 
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
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

  return (
    <motion.header 
      className="bg-white shadow-sm"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <motion.div 
              variants={logoVariants}
              whileHover="hover"
            >
              <Link to="/" className="flex items-center">
                <span className="text-2xl font-bold text-teal-800">Edu<span className="text-orange-500">Smart</span></span>
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
                  <IconComponent icon={HiOutlineUserCircle} className="h-6 w-6 mr-1" />
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
          
          {/* Mobile menu button */}
          <motion.button
            type="button"
            className="md:hidden p-2 -mr-1 text-gray-500"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            whileTap={{ scale: 0.9 }}
          >
            {isMobileMenuOpen
              ? <IconComponent icon={HiX} className="h-6 w-6" />
              : <IconComponent icon={HiMenu} className="h-6 w-6" />
            }
          </motion.button>
        </div>
        
        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              className="md:hidden py-4 border-t border-gray-200 overflow-hidden"
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <nav className="flex flex-col space-y-4 pb-4">
                {navigation.map((item) => (
                  <motion.div
                    key={item.name}
                    variants={mobileNavItemVariants}
                  >
                    <Link
                      to={item.href}
                      className={`text-base font-medium ${
                        isActive(item.href)
                          ? 'text-orange-500'
                          : 'text-gray-700 hover:text-orange-500'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                ))}
              </nav>
              <motion.div 
                className="flex flex-col space-y-4 pt-4 border-t border-gray-200"
                variants={mobileNavItemVariants}
              >
                {user ? (
                  <>
                    <div className="flex items-center mb-2">
                      <IconComponent icon={HiOutlineUserCircle} className="h-6 w-6 mr-2 text-teal-600" />
                      <span className="font-medium text-gray-700 truncate">
                        {user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
                      </span>
                    </div>
                    <Link
                      to="/profile"
                      className="text-base text-gray-700 hover:text-orange-500"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Your Profile
                    </Link>
                    <Link
                      to="/application-tracker"
                      className="text-base text-gray-700 hover:text-orange-500"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Application Tracker
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="text-left text-base text-red-600 hover:text-red-700"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="text-base font-medium text-gray-700 hover:text-orange-500"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Link
                        to="/signup"
                        className="text-base font-medium bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 text-center block"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Sign Up
                      </Link>
                    </motion.div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

export default Header; 