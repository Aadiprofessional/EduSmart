import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations, getTranslation } from './i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
  tArray: (key: string) => string[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Get language from localStorage or default to English
    const savedLanguage = localStorage.getItem('matrixedu-language') as Language;
    return savedLanguage && ['en', 'zh-CN', 'zh-TW'].includes(savedLanguage) ? savedLanguage : 'en';
  });

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('matrixedu-language', newLanguage);
    
    // Update document language attribute for accessibility
    document.documentElement.lang = newLanguage === 'zh-CN' ? 'zh-Hans' : 
                                   newLanguage === 'zh-TW' ? 'zh-Hant' : 'en';
  };

  const t = (key: string): string => {
    return getTranslation(language, key);
  };

  const tArray = (key: string): string[] => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if key not found
        value = translations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return []; // Return empty array if not found in fallback
          }
        }
        break;
      }
    }
    
    return Array.isArray(value) ? value : [];
  };

  useEffect(() => {
    // Set initial document language
    document.documentElement.lang = language === 'zh-CN' ? 'zh-Hans' : 
                                   language === 'zh-TW' ? 'zh-Hant' : 'en';
  }, []);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    tArray,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 