import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

const MagneticCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Don't render cursor on mobile devices
    if (isMobile) return;
    
    const cursor = cursorRef.current;
    if (!cursor) return;

    // High-performance mouse tracking with immediate response
    const handleMouseMove = (e: MouseEvent) => {
      // Use requestAnimationFrame for smooth 60fps updates but immediate positioning
      requestAnimationFrame(() => {
        if (cursor) {
          cursor.style.left = `${e.clientX - 20}px`;
          cursor.style.top = `${e.clientY - 20}px`;
        }
      });
    };

    // Handle magnetic elements with reduced effect for better control
    const handleMagneticElements = () => {
      const magneticElements = document.querySelectorAll('[data-magnetic]');
      
      magneticElements.forEach((element) => {
        const handleMouseEnter = () => {
          setIsHovering(true);
          
          gsap.to(cursor, {
            scale: 1.2,
            duration: 0.15,
            ease: "power1.out"
          });
        };

        const handleMouseLeave = () => {
          setIsHovering(false);
          
          gsap.to(cursor, {
            scale: 1,
            duration: 0.15,
            ease: "power1.out"
          });

          gsap.to(element, {
            x: 0,
            y: 0,
            duration: 0.2,
            ease: "power1.out"
          });
        };

        const handleMouseMoveOnElement = (e: Event) => {
          const mouseEvent = e as MouseEvent;
          const rect = (element as HTMLElement).getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          
          const deltaX = (mouseEvent.clientX - centerX) * 0.1;
          const deltaY = (mouseEvent.clientY - centerY) * 0.1;

          gsap.to(element, {
            x: deltaX,
            y: deltaY,
            duration: 0.15,
            ease: "power1.out"
          });
        };

        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);
        element.addEventListener('mousemove', handleMouseMoveOnElement);
      });
    };

    // Handle clickable elements with subtle effects
    const handleClickableElements = () => {
      const clickableElements = document.querySelectorAll('button, a, [role="button"]');
      
      clickableElements.forEach((element) => {
        const handleMouseEnter = () => {
          setIsHovering(true);
          gsap.to(cursor, {
            scale: 1.1,
            duration: 0.1,
            ease: "power1.out"
          });
        };

        const handleMouseLeave = () => {
          setIsHovering(false);
          gsap.to(cursor, {
            scale: 1,
            duration: 0.1,
            ease: "power1.out"
          });
        };

        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);
      });
    };

    // Initialize with passive listeners for better performance
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    handleMagneticElements();
    handleClickableElements();

    // Hide default cursor
    document.body.style.cursor = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.body.style.cursor = 'auto';
    };
  }, [isMobile]);

  // Don't render cursor on mobile devices
  if (isMobile) {
    return null;
  }

  return (
    <div
      ref={cursorRef}
      className="fixed w-10 h-10 pointer-events-none z-[9999]"
      style={{
        background: 'transparent',
        borderRadius: '50%',
        backdropFilter: 'blur(0.5px) brightness(1.6) contrast(1.3) saturate(1.2)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 0 15px rgba(255, 255, 255, 0.3), inset 0 0 15px rgba(255, 255, 255, 0.15)',
        willChange: 'transform, left, top',
        transform: 'translateZ(0)',
      }}
    >
      {/* Magnifying glass lens effect */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.08) 45%, transparent 75%)',
          pointerEvents: 'none',
        }}
      />
      
      {/* Precision center dot */}
      <div
        className="absolute top-1/2 left-1/2 w-0.5 h-0.5 bg-white rounded-full opacity-70"
        style={{
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export default MagneticCursor; 