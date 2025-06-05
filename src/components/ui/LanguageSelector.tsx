import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineGlobal, AiOutlineDown } from 'react-icons/ai';
import { useLanguage } from '../../utils/LanguageContext';
import { Language } from '../../utils/i18n';
import IconComponent from './IconComponent';

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
}

const languageOptions: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh-CN', name: 'Simplified Chinese', nativeName: '简体中文' },
  { code: 'zh-TW', name: 'Traditional Chinese', nativeName: '繁體中文' },
];

const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languageOptions.find(lang => lang.code === language) || languageOptions[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (langCode: Language) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  const dropdownVariants = {
    hidden: {
      opacity: 0,
      y: -10,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: {
        duration: 0.15,
        ease: 'easeIn',
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors duration-200 rounded-lg hover:bg-gray-50"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label={t('languageSelector.title')}
      >
        <IconComponent icon={AiOutlineGlobal} className="h-5 w-5" />
        <span className="hidden lg:inline">{currentLanguage.nativeName}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <IconComponent icon={AiOutlineDown} className="h-4 w-4" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              {t('languageSelector.title')}
            </div>
            {languageOptions.map((option, index) => (
              <motion.button
                key={option.code}
                onClick={() => handleLanguageChange(option.code)}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-sm hover:bg-gray-50 transition-colors duration-150 ${
                  language === option.code
                    ? 'text-orange-500 bg-orange-50'
                    : 'text-gray-700'
                }`}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: 4 }}
                >
      
                <div className="flex flex-col items-start">
                  <span className="font-medium">{option.nativeName}</span>
                  <span className="text-xs text-gray-500">{option.name}</span>
                </div>
                {language === option.code && (
                  <motion.div
                    className="ml-auto w-2 h-2 bg-orange-500 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                  />
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSelector; 