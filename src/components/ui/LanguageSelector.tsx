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
      
      if (isMobile) {
        // On mobile, position relative to button but allow it to move with header scroll
        setDropdownPosition({
          top: rect.bottom + 12, // More gap on mobile
          right: Math.max(16, window.innerWidth - rect.left - 280), // Center with min 16px margin
        });
      } else {
        // On desktop, align to right edge of button
        setDropdownPosition({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right,
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
    console.log('Language change clicked:', langCode);
    setLanguage(langCode);
    setIsOpen(false);
  };

  const handleToggle = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('Language toggle clicked, current state:', isOpen);
    setIsOpen(!isOpen);
  };

  const dropdownContent = isOpen ? (
    <div
      className={`language-dropdown fixed bg-black/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 py-3 ${
        isMobile ? 'w-72' : 'w-56'
      }`}
      style={{
        top: `${dropdownPosition.top}px`,
        right: `${dropdownPosition.right}px`,
        zIndex: 1000001, // Higher than header and user menu but lower than magnetic cursor
      }}
      onMouseDown={(e) => e.stopPropagation()} // Prevent mousedown bubbling
      onClick={(e) => e.stopPropagation()} // Prevent click bubbling
    >
      <div className={`px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-white/10 ${
        isMobile ? 'text-center' : ''
      }`}>
        {t('languageSelector.title')}
      </div>
      <div className="py-2">
        {languageOptions.map((option) => (
          <button
            key={option.code}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Language option mousedown:', option.code);
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Language option clicked:', option.code);
              handleLanguageChange(option.code);
            }}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-white/5 transition-all duration-200 rounded-xl mx-2 ${
              language === option.code
                ? 'text-orange-400 bg-white/5'
                : 'text-gray-300 hover:text-white'
            } ${isMobile ? 'py-4' : ''}`} // Larger touch targets on mobile
          >
            <div className="flex flex-col items-start">
              <span className={`font-medium ${isMobile ? 'text-base' : 'text-sm'}`}>
                {option.nativeName}
              </span>
              {/* Only show English name if it's different from native name */}
              {option.nativeName !== option.name && (
                <span className={`text-gray-500 ${isMobile ? 'text-sm' : 'text-xs'}`}>
                  {option.name}
                </span>
              )}
            </div>
            {language === option.code && (
              <div className={`bg-orange-400 rounded-full ${isMobile ? 'w-3 h-3' : 'w-2 h-2'}`} />
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
          e.stopPropagation(); // Prevent header click handlers
        }}
        className={`flex items-center space-x-2 text-white hover:text-orange-400 transition-all duration-200 rounded-lg hover:bg-white/10 ${
          isMobile 
            ? 'px-3 py-2.5 text-base' // Larger touch target on mobile
            : 'px-2 py-1.5 text-sm'
        }`}
      >
        <IconComponent icon={AiOutlineGlobal} className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
        <span className={`font-medium ${isMobile ? 'text-base' : 'text-sm'}`}>
          {isMobile ? currentLanguage.nativeName.split(' ')[0] : currentLanguage.nativeName}
        </span>
        <IconComponent 
          icon={AiOutlineDown} 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${
            isMobile ? 'h-4 w-4' : 'h-3 w-3'
          }`} 
        />
      </button>

      {/* Render dropdown using portal to avoid affecting header layout */}
      {typeof window !== 'undefined' && dropdownContent && createPortal(dropdownContent, document.body)}
    </div>
  );
};

export default LanguageSelector; 