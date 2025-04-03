import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as Hi from 'react-icons/hi';

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

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-teal-800">Edu<span className="text-orange-500">Smart</span></span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium ${
                  isActive(item.href)
                    ? 'text-orange-500'
                    : 'text-gray-700 hover:text-orange-500'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-700 hover:text-orange-500"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="text-sm font-medium bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
            >
              Sign Up
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 -mr-1 text-gray-500"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen
              ? <Hi.HiX className="h-6 w-6" />
              : <Hi.HiMenu className="h-6 w-6" />
            }
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4 pb-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
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
              ))}
            </nav>
            <div className="flex flex-col space-y-4 pt-4 border-t border-gray-200">
              <Link
                to="/login"
                className="text-base font-medium text-gray-700 hover:text-orange-500"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="text-base font-medium bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 text-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 