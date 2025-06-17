import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import IconComponent from '../ui/IconComponent';
import { motion } from 'framer-motion';
import { useLanguage } from '../../utils/LanguageContext';
import { getPageTheme } from '../../utils/pageThemes';

const Footer: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const theme = getPageTheme(location.pathname);

  const socialVariants = {
    hover: { 
      scale: 1.2, 
      rotate: 5, 
      transition: { duration: 0.2 } 
    }
  };

  const linkVariants = {
    hover: { 
      x: 5, 
      scale: 1.05,
      transition: { duration: 0.2 } 
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <footer className={`relative ${theme.footerBg} text-white overflow-hidden`}>
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className={`absolute top-10 left-10 w-96 h-96 ${theme.footerAccent} rounded-full mix-blend-multiply filter blur-3xl animate-pulse`}></div>
        <div className={`absolute bottom-10 right-10 w-96 h-96 ${theme.footerSecondary} rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000`}></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 ${theme.footerAccent} rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-500`}></div>
      </div>
      
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
      
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16 relative z-10">
        {/* Mobile Layout */}
        <div className="block lg:hidden">
          <motion.div 
            className="text-center mb-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {/* Logo */}
            <motion.div variants={itemVariants} className="mb-6">
              <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-3">
                MatrixEdu
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed max-w-sm mx-auto">
                AI-powered education for the future
              </p>
            </motion.div>
            
            {/* Social Media */}
            <motion.div variants={itemVariants} className="flex justify-center space-x-4 mb-8">
              {[
                { icon: FaFacebook, href: "#", color: "text-blue-400" },
                { icon: FaTwitter, href: "#", color: "text-sky-400" },
                { icon: FaInstagram, href: "#", color: "text-pink-400" },
                { icon: FaLinkedin, href: "#", color: "text-blue-500" },
                { icon: FaYoutube, href: "#", color: "text-red-500" }
              ].map((social, index) => (
                <motion.a 
                  key={index}
                  href={social.href} 
                  className={`p-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 ${social.color} transition-all duration-300 hover:border-white/30 hover:bg-white/10`}
                  variants={socialVariants} 
                  whileHover="hover"
                >
                  <IconComponent icon={social.icon} className="text-sm" />
                </motion.a>
              ))}
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 mb-8">
              <Link 
                to="/courses" 
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 hover:scale-105"
              >
                Browse Courses
              </Link>
              <Link 
                to="/scholarships" 
                className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 hover:scale-105"
              >
                Find Scholarships
              </Link>
            </motion.div>

            {/* Contact Info */}
            <motion.div variants={itemVariants} className="space-y-3 mb-8">
              <div className="flex items-center justify-center text-sm text-gray-300">
                <IconComponent icon={FaPhone} className="mr-2 text-blue-400" />
                <span>+852 66359879</span>
              </div>
              <div className="flex items-center justify-center text-sm text-gray-300">
                <IconComponent icon={FaEnvelope} className="mr-2 text-purple-400" />
                <a href="mailto:info@matrixedu.com" className="text-purple-400">
                  info@matrixedu.com
                </a>
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-2 text-sm">
              {[
                { name: 'Home', href: '/' },
                { name: 'About', href: '/about' },
                { name: 'Privacy', href: '/privacy' },
                { name: 'Terms', href: '/terms' }
              ].map((link, index) => (
                <Link 
                  key={index}
                  to={link.href} 
                  className="text-gray-400 hover:text-white transition-colors duration-300 py-2"
                >
                  {link.name}
                </Link>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Desktop Layout */}
        <motion.div 
          className="hidden lg:grid lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {/* About */}
          <motion.div variants={itemVariants}>
            <div className="mb-6">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
                MatrixEdu
              </h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Revolutionizing education through AI-powered learning experiences and cutting-edge technology.
              </p>
            </div>
            
            <div className="flex space-x-4">
              {[
                { icon: FaFacebook, href: "#", color: "hover:text-blue-400" },
                { icon: FaTwitter, href: "#", color: "hover:text-sky-400" },
                { icon: FaInstagram, href: "#", color: "hover:text-pink-400" },
                { icon: FaLinkedin, href: "#", color: "hover:text-blue-500" },
                { icon: FaYoutube, href: "#", color: "hover:text-red-500" }
              ].map((social, index) => (
                <motion.a 
                  key={index}
                  href={social.href} 
                  className={`p-3 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 text-gray-400 ${social.color} transition-all duration-300 hover:border-white/30 hover:bg-white/10`}
                  variants={socialVariants} 
                  whileHover="hover"
                  data-magnetic
                >
                  <IconComponent icon={social.icon} size={20} />
                </motion.a>
              ))}
            </div>
          </motion.div>
          
          {/* Quick Links */}
          <motion.div variants={itemVariants}>
            <h3 className="text-xl font-bold mb-6 text-white">Quick Links</h3>
            <ul className="space-y-3">
              {[
                { name: t('nav.home'), href: '/' },
                { name: t('nav.database'), href: '/database' },
                { name: t('nav.successStories'), href: '/case-studies' },
                { name: t('nav.aiCourses'), href: '/ai-courses' },
                { name: t('nav.blog'), href: '/blog' }
              ].map((link, index) => (
                <li key={index}>
                  <motion.div variants={linkVariants} whileHover="hover">
                    <Link 
                      to={link.href} 
                      className="text-gray-300 hover:text-white inline-flex items-center group transition-all duration-300"
                      data-magnetic
                    >
                      <span className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                      {link.name}
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
          </motion.div>
          
          {/* Resources */}
          <motion.div variants={itemVariants}>
            <h3 className="text-xl font-bold mb-6 text-white">Resources</h3>
            <ul className="space-y-3">
              {[
                { name: 'Scholarships', href: '/scholarship-finder' },
                { name: 'Application Tracker', href: '/application-tracker' },
                { name: 'Privacy Policy', href: '/privacy' },
                { name: 'Terms of Service', href: '/terms' },
                { name: 'FAQ', href: '/faq' }
              ].map((link, index) => (
                <li key={index}>
                  <motion.div variants={linkVariants} whileHover="hover">
                    <Link 
                      to={link.href} 
                      className="text-gray-300 hover:text-white inline-flex items-center group transition-all duration-300"
                      data-magnetic
                    >
                      <span className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                      {link.name}
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
          </motion.div>
          
          {/* Contact */}
          <motion.div variants={itemVariants}>
            <h3 className="text-xl font-bold mb-6 text-white">Contact Us</h3>
            <div className="space-y-6 text-gray-300">
              {/* Hong Kong Office */}
              <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300">
                <p className="font-semibold text-white mb-2 flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                  Hong Kong Office
                </p>
                <p className="text-sm leading-relaxed">Unit G1, 35/F, Legend Tower<br />
                7 Shing Yip Street, Kwun Tong, KLN<br />
                <span className="text-blue-400">+852 66359879</span></p>
              </div>
              
              {/* Shenzhen Office */}
              <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300">
                <p className="font-semibold text-white mb-2 flex items-center">
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                  深圳办公室
                </p>
                <p className="text-sm leading-relaxed">前海桂湾三路深港青年夢工場<br />
                香港大學青年科創學院4樓<br />
                <span className="text-purple-400">+86 13266989879</span></p>
              </div>
              
              {/* Email */}
              <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300">
                <p className="font-semibold text-white mb-2 flex items-center">
                  <span className="w-2 h-2 bg-pink-400 rounded-full mr-2"></span>
                  Email
                </p>
                <p className="text-sm">
                  <a href="mailto:info@matrixedu.com" className="text-pink-400 hover:text-pink-300 transition-colors duration-300">
                    info@matrixedu.com
                  </a>
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Bottom Section */}
        <motion.div 
          className="border-t border-white/10 mt-8 sm:mt-12 pt-6 sm:pt-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
            <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-0">
              © 2024 MatrixEdu. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center sm:justify-end gap-4 sm:gap-6 text-xs sm:text-sm">
              <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors duration-300">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-white transition-colors duration-300">
                Terms of Service
              </Link>
              <Link to="/cookies" className="text-gray-400 hover:text-white transition-colors duration-300">
                Cookie Policy
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;