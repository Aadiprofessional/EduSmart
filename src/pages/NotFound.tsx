import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { motion } from 'framer-motion';
import { useLanguage } from '../utils/LanguageContext';

const NotFound: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center bg-gray-50 relative overflow-hidden">
        {/* Background animated elements */}
        <motion.div 
          className="absolute w-96 h-96 bg-teal-600 rounded-full opacity-5" 
          style={{ filter: 'blur(80px)', top: '10%', right: '5%' }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div 
          className="absolute w-64 h-64 bg-orange-500 rounded-full opacity-5" 
          style={{ filter: 'blur(60px)', bottom: '10%', left: '10%' }}
          animate={{
            scale: [1, 1.1, 1],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        
        <div className="text-center px-4 py-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h1 
              className="text-9xl font-bold text-teal-700"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {t('notFound.title')}
            </motion.h1>
            <motion.h2 
              className="text-3xl font-semibold text-gray-700 mb-4"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {t('notFound.subtitle')}
            </motion.h2>
            <motion.p 
              className="text-gray-600 mb-8"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {t('notFound.description')}
            </motion.p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Link to="/">
                <motion.button 
                  className="inline-block bg-gradient-to-r from-teal-700 to-teal-800 text-white py-3 px-8 rounded-lg hover:shadow-lg transition-all"
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t('notFound.returnHome')}
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Animated floating elements */}
        <motion.div
          className="absolute w-8 h-8 rounded bg-teal-200 opacity-70"
          style={{ top: '30%', left: '15%' }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 45, 0]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div
          className="absolute w-5 h-5 rounded-full bg-orange-300 opacity-70"
          style={{ bottom: '25%', right: '20%' }}
          animate={{
            y: [0, 20, 0],
            x: [0, -10, 0]
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div
          className="absolute w-10 h-10 rounded-full border-2 border-teal-300 opacity-60"
          style={{ bottom: '40%', left: '30%' }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      </main>
      <Footer />
    </div>
  );
};

export default NotFound; 