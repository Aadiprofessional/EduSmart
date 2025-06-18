import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8, // 8px gap below button
        right: window.innerWidth - rect.right, // Align to right edge of button
      });
    }
  }, [isOpen]);

  const handleLanguageChange = (langCode: Language) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const dropdownContent = isOpen ? (
    <div
      className="fixed w-56 bg-gray-900 rounded-lg shadow-xl border border-gray-700 py-2 z-[1000001]"
      style={{
        top: `${dropdownPosition.top}px`,
        right: `${dropdownPosition.right}px`,
      }}
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
            {/* Only show English name if it's different from native name */}
            {option.nativeName !== option.name && (
              <span className="text-xs text-gray-500">{option.name}</span>
            )}
          </div>
          {language === option.code && (
            <div className="w-2 h-2 bg-orange-400 rounded-full" />
          )}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="flex items-center space-x-2 px-2 py-1.5 text-white hover:text-orange-400 transition-colors duration-200 rounded-lg hover:bg-white/10"
      >
        <IconComponent icon={AiOutlineGlobal} className="h-4 w-4" />
        <span className="text-sm">{currentLanguage.nativeName}</span>
        <IconComponent icon={AiOutlineDown} className={`h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Render dropdown using portal to avoid affecting header layout */}
      {typeof window !== 'undefined' && dropdownContent && createPortal(dropdownContent, document.body)}
    </div>
  );
};

export default LanguageSelector; 