import React, { useState, useRef, useEffect } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languageOptions.find(lang => lang.code === language) || languageOptions[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-white hover:text-orange-400 transition-colors duration-200 rounded-lg hover:bg-white/10"
      >
        <IconComponent icon={AiOutlineGlobal} className="h-4 w-4" />
        <span className="text-sm">{currentLanguage.nativeName}</span>
        <IconComponent icon={AiOutlineDown} className={`h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-56 bg-gray-900 rounded-lg shadow-xl border border-gray-700 py-2 z-[999999]"
        >
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700">
            {t('languageSelector.title')}
          </div>
          {languageOptions.map((option) => (
            <button
              key={option.code}
              onClick={() => handleLanguageChange(option.code)}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-gray-800 transition-colors duration-150 ${
                language === option.code
                  ? 'text-orange-400 bg-gray-800'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">{option.nativeName}</span>
                <span className="text-xs text-gray-500">{option.name}</span>
              </div>
              {language === option.code && (
                <div className="w-2 h-2 bg-orange-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector; 