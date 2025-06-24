import { en } from './locales/en';
import { zhCN } from './locales/zh-CN';
import { zhTW } from './locales/zh-TW';

export type Language = 'en' | 'zh-CN' | 'zh-TW';

export const translations = {
  en,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
};

export type TranslationKey = keyof typeof en;

export const getTranslation = (language: Language, key: string): string => {
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
          return `Missing translation: ${key}`;
        }
      }
      break;
    }
  }
  
  return typeof value === 'string' ? value : `Missing translation: ${key}`;
};

export const t = (key: string, language: Language = 'en'): string => {
  return getTranslation(language, key);
};

// Helper function to get all available languages
export const getAvailableLanguages = (): { code: Language; name: string }[] => [
  { code: 'en', name: 'English' },
  { code: 'zh-CN', name: '简体中文' },
  { code: 'zh-TW', name: '繁體中文' },
];

// Helper function to detect browser language
export const detectLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en';
  
  const browserLang = navigator.language || navigator.languages?.[0];
  
  if (browserLang?.startsWith('zh')) {
    // Check for traditional Chinese variants
    if (browserLang.includes('TW') || browserLang.includes('HK') || browserLang.includes('MO')) {
      return 'zh-TW';
    }
    // Default to simplified Chinese for other zh variants
    return 'zh-CN';
  }
  
  // Default to English for all other languages
  return 'en';
}; 