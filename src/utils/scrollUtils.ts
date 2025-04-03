import { useEffect } from 'react';

// Hook to enable smooth scrolling across the entire application
export const useSmoothScroll = () => {
  useEffect(() => {
    // Update CSS for smooth scrolling
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Cleanup function to revert changes
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);
};

// Scroll to specific section with offset
export const scrollToSection = (elementId: string, offset: number = 0) => {
  const element = document.getElementById(elementId);
  if (element) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
};

// Reveal elements on scroll
export const useScrollReveal = () => {
  useEffect(() => {
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    
    const revealOnScroll = () => {
      for (let i = 0; i < revealElements.length; i++) {
        const windowHeight = window.innerHeight;
        const elementTop = revealElements[i].getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < windowHeight - elementVisible) {
          revealElements[i].classList.add('active');
        } else {
          revealElements[i].classList.remove('active');
        }
      }
    };
    
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Check on initial load
    
    return () => window.removeEventListener('scroll', revealOnScroll);
  }, []);
}; 