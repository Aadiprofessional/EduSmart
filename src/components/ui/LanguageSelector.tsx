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
  shortLabel: string;
}

interface LanguageSelectorProps {
  compactMobile?: boolean;
}

const languageOptions: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', shortLabel: 'EN' },
  { code: 'zh-CN', name: 'Simplified Chinese', nativeName: '简体中文', shortLabel: '简中' },
  { code: 'zh-TW', name: 'Chinese Traditional', nativeName: '繁體中文', shortLabel: 'TW' },
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ compactMobile = false }) => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentLanguage = languageOptions.find(lang => lang.code === language) || languageOptions[0];

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Function to update dropdown position
  const updateDropdownPosition = () => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = isMobile ? (compactMobile ? 240 : 280) : 224;
      
      if (isMobile) {
        setDropdownPosition({
          top: rect.bottom + 12,
          right: Math.max(16, window.innerWidth - rect.left - dropdownWidth),
        });
      } else {
        setDropdownPosition({
          top: rect.bottom + 8,
          right: Math.max(0, window.innerWidth - rect.right - 8),
        });
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Only close if clicking outside and not on language dropdown items
      if (containerRef.current && !containerRef.current.contains(target)) {
        const languageDropdown = document.querySelector('.language-dropdown');
        if (languageDropdown && !languageDropdown.contains(target)) {
          setIsOpen(false);
        }
      }
    };

    // Add scroll listener to update position when scrolling - CRITICAL for mobile
    const handleScroll = () => {
      if (isOpen) {
        // Update position immediately on scroll to follow header
        updateDropdownPosition();
      }
    };

    // Add resize listener to update position when window resizes
    const handleResize = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    // Add event listeners when dropdown is open
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Use capture phase for scroll to get it before other handlers
      window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
      window.addEventListener('resize', handleResize, { passive: true });
      
      // Also listen to scroll events on document and body for better compatibility
      document.addEventListener('scroll', handleScroll, { passive: true });
      document.body.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('scroll', handleScroll);
      document.body.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen]);

  useEffect(() => {
    updateDropdownPosition();
  }, [isOpen, isMobile]);

  const handleLanguageChange = (langCode: Language) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  const handleToggle = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsOpen(!isOpen);
  };

  const dropdownContent = isOpen ? (
    <div
      className={`language-dropdown fixed bg-white/95 dark:bg-[#050505]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-indigo-100 dark:border-white/15 py-3 ${
        isMobile ? (compactMobile ? 'w-60' : 'w-72') : 'w-56'
      }`}
      style={{
        top: `${dropdownPosition.top}px`,
        right: `${dropdownPosition.right}px`,
        zIndex: 1000001, // Higher than header and user menu but lower than magnetic cursor
      }}
      onMouseDown={(e) => e.stopPropagation()} // Prevent mousedown bubbling
      onClick={(e) => e.stopPropagation()} // Prevent click bubbling
    >
      <div className={`px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-indigo-100 dark:border-white/10 ${
        isMobile ? 'text-center' : ''
      }`}>
        {t('languageSelector.title')}
      </div>
      <div className="py-2 px-2">
        {languageOptions.map((option) => (
          <button
            key={option.code}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleLanguageChange(option.code);
            }}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-indigo-50 dark:hover:bg-white/5 transition-all duration-200 rounded-xl ${
              language === option.code
                ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            } ${isMobile ? 'py-4' : ''}`} // Larger touch targets on mobile
          >
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center justify-center rounded-md border px-2 py-1 font-semibold tracking-wide ${
                isMobile ? 'text-xs' : 'text-[10px]'
              } ${
                language === option.code
                  ? 'border-indigo-300 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-200'
                  : 'border-indigo-200 dark:border-white/20 bg-indigo-50 dark:bg-white/5 text-gray-600 dark:text-gray-300'
              }`}>
                {option.shortLabel}
              </span>
              <div className="flex flex-col items-start">
                <span className={`font-medium ${isMobile ? 'text-base' : 'text-sm'}`}>
                  {option.nativeName}
                </span>
                {option.nativeName !== option.name && (
                  <span className={`text-gray-500 dark:text-gray-500 ${isMobile ? 'text-sm' : 'text-xs'}`}>
                    {option.name}
                  </span>
                )}
              </div>
            </div>
            {language === option.code && (
              <div className={`bg-indigo-400 rounded-full ${isMobile ? 'w-3 h-3' : 'w-2 h-2'}`} />
            )}
          </button>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <div className="relative language-selector-container" ref={containerRef}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        className={`group flex items-center rounded-full border transition-all duration-200 ${
          isMobile
            ? compactMobile
              ? 'gap-1.5 px-2.5 py-2 border-indigo-200 dark:border-white/20 bg-white dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-white/10 hover:border-indigo-300 dark:hover:border-white/30'
              : 'gap-2 px-3 py-2.5 border-indigo-200 dark:border-white/20 bg-white dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-white/10 hover:border-indigo-300 dark:hover:border-white/30'
            : 'gap-2 px-3 py-1.5 border-indigo-200 dark:border-white/15 bg-white dark:bg-white/[0.04] hover:bg-indigo-50 dark:hover:bg-white/10 hover:border-indigo-300 dark:hover:border-white/30'
        }`}
        aria-label={t('languageSelector.title')}
      >
        <span className={`inline-flex items-center justify-center rounded-md border border-indigo-200 dark:border-white/20 bg-indigo-50 dark:bg-white/5 font-semibold text-gray-700 dark:text-white/90 tracking-wide ${
          isMobile ? (compactMobile ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs') : 'px-2 py-1 text-[10px]'
        }`}>
          {currentLanguage.shortLabel}
        </span>
        {!(isMobile && compactMobile) && (
          <span className={`font-medium text-gray-700 dark:text-white/80 group-hover:text-gray-900 dark:group-hover:text-white ${isMobile ? 'text-sm' : 'text-xs'}`}>{currentLanguage.nativeName}</span>
        )}
        <IconComponent icon={AiOutlineGlobal} className={`${isMobile ? 'h-4 w-4' : 'h-3.5 w-3.5'} text-indigo-600 dark:text-indigo-300`} />
        <IconComponent 
          icon={AiOutlineDown} 
          className={`transition-transform duration-200 text-gray-500 dark:text-white/70 ${isOpen ? 'rotate-180' : ''} ${
            isMobile ? 'h-4 w-4' : 'h-3 w-3'
          }`} 
        />
      </button>

      {typeof window !== 'undefined' && dropdownContent && createPortal(dropdownContent, document.body)}
    </div>
  );
};

export default LanguageSelector; 
