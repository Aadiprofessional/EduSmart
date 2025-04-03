import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HiX, HiMenu } from 'react-icons/hi';
import IconComponent from '../ui/IconComponent';
import { motion, AnimatePresence } from 'framer-motion';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  
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
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

export default Header; 