import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube, FaPhone, FaEnvelope } from 'react-icons/fa';
import IconComponent from '../ui/IconComponent';
import { motion } from 'framer-motion';
import { useLanguage } from '../../utils/LanguageContext';
import matrixLogo from '../../assets/matrixedu.jpeg';

const Footer: React.FC = () => {
  const { t } = useLanguage();
  
  const socialVariants = {
    hover: { 
      scale: 1.2, 
      rotate: 5, 
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
    <footer className="relative text-gray-900 dark:text-white overflow-hidden bg-white dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-white/10">
      
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16 relative z-10">
        {/* Mobile Layout */}
        <div className="block lg:hidden">
          <motion.div 
            className="text-center mb-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {/* Logo */}
            <motion.div variants={itemVariants} className="mb-4 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2">
                <img src={matrixLogo} alt="MatrixEdu Logo" className="w-8 h-8 rounded-xl object-cover" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                  MatrixEdu
                </h3>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2 font-medium">
                Matrix AI Company Limited
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed max-w-sm mx-auto">
                {t('footer.aiEducation')}
              </p>
            </motion.div>
            
            {/* Social Media - Compact */}
            <motion.div variants={itemVariants} className="flex justify-center space-x-3 mb-6">
              {[
                { icon: FaFacebook, href: "#", color: "text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white" },
                { icon: FaTwitter, href: "#", color: "text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white" },
                { icon: FaInstagram, href: "#", color: "text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white" },
                { icon: FaLinkedin, href: "#", color: "text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white" },
                { icon: FaYoutube, href: "#", color: "text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white" }
              ].map((social, index) => (
                <motion.a 
                  key={index}
                  href={social.href} 
                  className={`p-1.5 bg-gray-100 dark:bg-white/5 rounded-full border border-gray-200 dark:border-white/10 ${social.color} transition-all duration-300 hover:border-indigo-600/30 dark:hover:border-white/30 hover:bg-gray-200 dark:hover:bg-white/10`}
                  variants={socialVariants} 
                  whileHover="hover"
                >
                  <IconComponent icon={social.icon} className="text-xs" />
                </motion.a>
              ))}
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 mb-6">
              <Link 
                to="/courses" 
                className="bg-gray-100 dark:bg-white text-gray-900 dark:text-black px-3 py-2.5 rounded-lg font-bold text-xs transition-all duration-300 hover:bg-gray-200 dark:hover:bg-gray-200"
              >
                {t('footer.browseCourses')}
              </Link>
              <Link 
                to="/scholarships" 
                className="bg-black dark:bg-[#1a1a1a] text-white border border-gray-800 dark:border-white/10 px-3 py-2.5 rounded-lg font-bold text-xs transition-all duration-300 hover:bg-gray-800 dark:hover:bg-white/10"
              >
                {t('footer.findScholarships')}
              </Link>
            </motion.div>

            {/* Mobile Contact */}
            <div className="space-y-2 mb-6 text-left">
                <div className="border-b border-gray-200 dark:border-white/10">
                    <div className="w-full py-3 flex items-center justify-between text-sm font-bold text-gray-900 dark:text-white">
                        {t('footer.contactUs')}
                    </div>
                    <div className="pb-3 space-y-3 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                            <IconComponent icon={FaPhone} className="mr-2 text-blue-600 dark:text-blue-400" />
                            <span>{t('footer.contactInfo.phone')}</span>
                        </div>
                        <div className="flex items-center">
                            <IconComponent icon={FaEnvelope} className="mr-2 text-purple-600 dark:text-purple-400" />
                            <a href={`mailto:${t('footer.contactInfo.email')}`} className="text-purple-600 dark:text-purple-400">
                                {t('footer.contactInfo.email')}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
          </motion.div>
        </div>

          {/* Desktop Layout */}
        <motion.div 
          className="hidden lg:grid lg:grid-cols-2 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {/* About */}
          <motion.div variants={itemVariants}>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <img src={matrixLogo} alt="MatrixEdu Logo" className="w-10 h-10 rounded-xl object-cover" />
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                  MatrixEdu
                </h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-medium">
                Matrix AI Company Limited
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                {t('footer.about')}
              </p>
            </div>
            
            <div className="flex space-x-4">
              {[
                { icon: FaFacebook, href: "#", color: "hover:text-indigo-600 dark:hover:text-white" },
                { icon: FaTwitter, href: "#", color: "hover:text-indigo-600 dark:hover:text-white" },
                { icon: FaInstagram, href: "#", color: "hover:text-indigo-600 dark:hover:text-white" },
                { icon: FaLinkedin, href: "#", color: "hover:text-indigo-600 dark:hover:text-white" },
                { icon: FaYoutube, href: "#", color: "hover:text-indigo-600 dark:hover:text-white" }
              ].map((social, index) => (
                <motion.a 
                  key={index}
                  href={social.href} 
                  className={`p-3 bg-gray-100 dark:bg-white/5 rounded-full border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 ${social.color} transition-all duration-300 hover:border-indigo-600/30 dark:hover:border-white/30 hover:bg-gray-200 dark:hover:bg-white/10`}
                  variants={socialVariants} 
                  whileHover="hover"
                  data-magnetic
                >
                  <IconComponent icon={social.icon} size={20} />
                </motion.a>
              ))}
            </div>
          </motion.div>
          
          {/* Contact */}
          <motion.div variants={itemVariants}>
            <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">{t('footer.contactUs')}</h3>
            <div className="space-y-6 text-gray-600 dark:text-gray-300">
              {/* Hong Kong Office */}
              <div className="p-4 bg-gray-50 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/10 hover:border-indigo-500/30 dark:hover:border-white/20 transition-all duration-300">
                <p className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full mr-2"></span>
                  {t('footer.hongKongOffice')}
                </p>
                <p className="text-sm leading-relaxed">{t('footer.contactAddresses.hongKongLine1')}<br />
                {t('footer.contactAddresses.hongKongLine2')}<br />
                <span className="text-blue-600 dark:text-blue-400">{t('footer.contactPhones.hongKong')}</span></p>
              </div>
              
              {/* Shenzhen Office */}
              <div className="p-4 bg-gray-50 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/10 hover:border-indigo-500/30 dark:hover:border-white/20 transition-all duration-300">
                <p className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                  <span className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full mr-2"></span>
                  {t('footer.shenzhenOffice')}
                </p>
                <p className="text-sm leading-relaxed">{t('footer.contactAddresses.shenzhenLine1')}<br />
                {t('footer.contactAddresses.shenzhenLine2')}<br />
                <span className="text-purple-600 dark:text-purple-400">{t('footer.contactPhones.shenzhen')}</span></p>
              </div>
              
              {/* Email */}
              <div className="p-4 bg-gray-50 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/10 hover:border-indigo-500/30 dark:hover:border-white/20 transition-all duration-300">
                <p className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                  <span className="w-2 h-2 bg-pink-500 dark:bg-pink-400 rounded-full mr-2"></span>
                  {t('footer.email')}
                </p>
                <p className="text-sm">
                  <a href={`mailto:${t('footer.contactInfo.email')}`} className="text-pink-600 dark:text-pink-400 hover:text-pink-500 dark:hover:text-pink-300 transition-colors duration-300">
                    {t('footer.contactInfo.email')}
                  </a>
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Bottom Section */}
        <motion.div 
          className="border-t border-gray-200 dark:border-white/10 mt-8 sm:mt-12 pt-6 sm:pt-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-4 sm:mb-0">
              {t('footer.copyright')}
            </p>
            <div className="flex flex-wrap justify-center sm:justify-end gap-4 sm:gap-6 text-xs sm:text-sm">
              <Link to="/privacy" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white transition-colors duration-300">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white transition-colors duration-300">
                Terms of Service
              </Link>
              <Link to="/cookies" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white transition-colors duration-300">
                {t('footer.cookiePolicy')}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
