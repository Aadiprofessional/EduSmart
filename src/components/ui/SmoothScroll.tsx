import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface SmoothScrollProps {
  children: React.ReactNode;
}

const SmoothScroll: React.FC<SmoothScrollProps> = ({ children }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx: gsap.Context;

    const initSmoothScroll = () => {
      if (!scrollRef.current) return;

      ctx = gsap.context(() => {
        // Create smooth scrolling effect
        gsap.registerPlugin();
        
        // Set up smooth scroll behavior
        const scrollContainer = scrollRef.current;
        if (scrollContainer) {
          let currentY = 0;
          let targetY = 0;
          const ease = 0.08;

          const updateScroll = () => {
            targetY = window.scrollY;
            currentY += (targetY - currentY) * ease;
            
            if (Math.abs(targetY - currentY) < 0.1) {
              currentY = targetY;
            }

            scrollContainer.style.transform = `translateY(${-currentY}px)`;
            requestAnimationFrame(updateScroll);
          };

          updateScroll();

          // Update body height to match content
          const updateHeight = () => {
            document.body.style.height = `${scrollContainer.offsetHeight}px`;
          };

          updateHeight();
          window.addEventListener('resize', updateHeight);

          return () => {
            window.removeEventListener('resize', updateHeight);
            document.body.style.height = 'auto';
          };
        }
      }, scrollRef);
    };

    // Initialize after a short delay to ensure DOM is ready
    const timer = setTimeout(initSmoothScroll, 100);

    return () => {
      clearTimeout(timer);
      if (ctx) ctx.revert();
    };
  }, []);

  return (
    <div 
      ref={scrollRef}
      className="fixed top-0 left-0 w-full will-change-transform"
      style={{ transform: 'translateY(0px)' }}
    >
      {children}
    </div>
  );
};

export default SmoothScroll; 