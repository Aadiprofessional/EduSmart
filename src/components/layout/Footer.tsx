import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube } from 'react-icons/fa';
import IconComponent from '../ui/IconComponent';
import { motion } from 'framer-motion';
import { useLanguage } from '../../utils/LanguageContext';
import { getFooterTheme } from '../../utils/pageThemes';

const Footer: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const theme = getFooterTheme(location.pathname);

  const socialVariants = {
    hover: { scale: 1.2, rotate: 5, transition: { duration: 0.2 } }
  };

  const linkVariants = {
    hover: { x: 5, color: '#f97316', transition: { duration: 0.2 } }
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
    <footer className={`${theme.bg} text-white relative overflow-hidden`}>
      {/* Background decoration */}
      <motion.div 
        className={`absolute w-96 h-96 rounded-full ${theme.accent}`}
        style={{ top: '-15%', right: '-10%', filter: 'blur(80px)', opacity: 0.4 }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.4, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
        }}
      />
      <motion.div 
        className={`absolute w-64 h-64 rounded-full ${theme.secondary}`}
        style={{ bottom: '-5%', left: '-5%', filter: 'blur(60px)', opacity: 0.2 }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {/* About */}
          <motion.div variants={itemVariants}>
            <h3 className="text-xl font-bold mb-4">{t('footer.quickLinks.about')}</h3>
            <p className="text-gray-300 mb-4">
              {t('footer.description')}
            </p>
            <div className="flex space-x-4">
              <motion.a href="#" className="text-gray-300 hover:text-orange-500" variants={socialVariants} whileHover="hover">
                <IconComponent icon={FaFacebook} size={20} />
              </motion.a>
              <motion.a href="#" className="text-gray-300 hover:text-orange-500" variants={socialVariants} whileHover="hover">
                <IconComponent icon={FaTwitter} size={20} />
              </motion.a>
              <motion.a href="#" className="text-gray-300 hover:text-orange-500" variants={socialVariants} whileHover="hover">
                <IconComponent icon={FaInstagram} size={20} />
              </motion.a>
              <motion.a href="#" className="text-gray-300 hover:text-orange-500" variants={socialVariants} whileHover="hover">
                <IconComponent icon={FaLinkedin} size={20} />
              </motion.a>
              <motion.a href="#" className="text-gray-300 hover:text-orange-500" variants={socialVariants} whileHover="hover">
                <IconComponent icon={FaYoutube} size={20} />
              </motion.a>
            </div>
          </motion.div>
          
          {/* Quick Links */}
          <motion.div variants={itemVariants}>
            <h3 className="text-xl font-bold mb-4">{t('footer.quickLinks.title')}</h3>
            <ul className="space-y-2">
              <li>
                <motion.div variants={linkVariants} whileHover="hover">
                  <Link to="/" className="text-gray-300 inline-block">{t('nav.home')}</Link>
                </motion.div>
              </li>
              <li>
                <motion.div variants={linkVariants} whileHover="hover">
                  <Link to="/database" className="text-gray-300 inline-block">{t('nav.database')}</Link>
                </motion.div>
              </li>
              <li>
                <motion.div variants={linkVariants} whileHover="hover">
                  <Link to="/case-studies" className="text-gray-300 inline-block">{t('nav.successStories')}</Link>
                </motion.div>
              </li>
              <li>
                <motion.div variants={linkVariants} whileHover="hover">
                  <Link to="/ai-courses" className="text-gray-300 inline-block">{t('nav.aiCourses')}</Link>
                </motion.div>
              </li>
              <li>
                <motion.div variants={linkVariants} whileHover="hover">
                  <Link to="/blog" className="text-gray-300 inline-block">{t('nav.blog')}</Link>
                </motion.div>
              </li>
            </ul>
          </motion.div>
          
          {/* Resources */}
          <motion.div variants={itemVariants}>
            <h3 className="text-xl font-bold mb-4">{t('footer.programs.title')}</h3>
            <ul className="space-y-2">
              <li>
                <motion.div variants={linkVariants} whileHover="hover">
                  <Link to="/scholarship-finder" className="text-gray-300 inline-block">{t('footer.quickLinks.scholarships')}</Link>
                </motion.div>
              </li>
              <li>
                <motion.div variants={linkVariants} whileHover="hover">
                  <Link to="/application-tracker" className="text-gray-300 inline-block">{t('nav.applicationTracker')}</Link>
                </motion.div>
              </li>
              <li>
                <motion.div variants={linkVariants} whileHover="hover">
                  <Link to="/privacy" className="text-gray-300 inline-block">{t('footer.support.privacy')}</Link>
                </motion.div>
              </li>
              <li>
                <motion.div variants={linkVariants} whileHover="hover">
                  <Link to="/terms" className="text-gray-300 inline-block">{t('footer.support.terms')}</Link>
                </motion.div>
              </li>
              <li>
                <motion.div variants={linkVariants} whileHover="hover">
                  <Link to="/faq" className="text-gray-300 inline-block">{t('footer.support.faq')}</Link>
                </motion.div>
              </li>
            </ul>
          </motion.div>
          
          {/* Contact */}
          <motion.div variants={itemVariants}>
            <h3 className="text-xl font-bold mb-4">{t('footer.support.contactUs')}</h3>
            <div className="space-y-4 text-gray-300">
              {/* Hong Kong Office */}
              <div>
                <p className="font-semibold text-white mb-1">Hong Kong Office:</p>
                <p className="text-sm">Unit G1, 35/F, Legend Tower</p>
                <p className="text-sm">7 Shing Yip Street, Kwun Tong, KLN</p>
                <p className="text-sm">Phone: +852 66359879</p>
              </div>
              
              {/* Shenzhen Office */}
              <div>
                <p className="font-semibold text-white mb-1">深圳办公室:</p>
                <p className="text-sm">前海桂湾三路深港青年夢工場</p>
                <p className="text-sm">香港大學青年科創學院4樓</p>
                <p className="text-sm">Phone: +86 13266989879</p>
              </div>
              
              {/* Email */}
              <div>
                <p className="text-sm">Email: info@edusmart.com</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="mb-4 md:mb-0">
            <span className="text-gray-300">{t('footer.copyright')}</span>
            <br />
            <span className="text-gray-300">Powered by <a href="https://www.matrixai.asia" className="text-gray-300 hover:text-orange-500">MatrixAI</a> X <a href="https://www.smarteducation.asia" className="text-gray-300 hover:text-orange-500">Smart Education</a></span>
          </div>
          <div className="flex space-x-6">
            <motion.div variants={linkVariants} whileHover="hover">
              <Link to="/privacy" className="text-gray-300 text-sm inline-block">
                {t('footer.support.privacy')}
              </Link>
            </motion.div>
            <motion.div variants={linkVariants} whileHover="hover">
              <Link to="/terms" className="text-gray-300 text-sm inline-block">
                {t('footer.support.terms')}
              </Link>
            </motion.div>
            <motion.div variants={linkVariants} whileHover="hover">
              <Link to="/cookies" className="text-gray-300 text-sm inline-block">
                Cookie Policy
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;