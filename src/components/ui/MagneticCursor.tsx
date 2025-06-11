import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

const MagneticCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const cursor = cursorRef.current;
    const cursorDot = cursorDotRef.current;
    
    if (!cursor || !cursorDot) return;

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    // Animation loop
    const animateCursor = () => {
      const speed = 0.15;
      
      cursorX += (mouseX - cursorX) * speed;
      cursorY += (mouseY - cursorY) * speed;

      if (cursor && cursorDot) {
        cursor.style.transform = `translate(${cursorX - 20}px, ${cursorY - 20}px)`;
        cursorDot.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`;
      }

      requestAnimationFrame(animateCursor);
    };

    // Handle magnetic elements
    const handleMagneticElements = () => {
      const magneticElements = document.querySelectorAll('[data-magnetic]');
      
      magneticElements.forEach((element) => {
        const handleMouseEnter = () => {
          setIsHovering(true);
          
          gsap.to(cursor, {
            scale: 2,
            duration: 0.3,
            ease: "power2.out"
          });
        };

        const handleMouseLeave = () => {
          setIsHovering(false);
          
          gsap.to(cursor, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
          });

          gsap.to(element, {
            x: 0,
            y: 0,
            duration: 0.5,
            ease: "power2.out"
          });
        };

        const handleMouseMoveOnElement = (e: Event) => {
          const mouseEvent = e as MouseEvent;
          const rect = (element as HTMLElement).getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          
          const deltaX = (mouseEvent.clientX - centerX) * 0.2;
          const deltaY = (mouseEvent.clientY - centerY) * 0.2;

          gsap.to(element, {
            x: deltaX,
            y: deltaY,
            duration: 0.3,
            ease: "power2.out"
          });
        };

        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);
        element.addEventListener('mousemove', handleMouseMoveOnElement);
      });
    };

    // Handle clickable elements
    const handleClickableElements = () => {
      const clickableElements = document.querySelectorAll('button, a, [role="button"]');
      
      clickableElements.forEach((element) => {
        const handleMouseEnter = () => {
          setIsHovering(true);
          gsap.to(cursor, {
            scale: 1.5,
            backgroundColor: 'rgba(59, 130, 246, 0.3)',
            duration: 0.3,
            ease: "power2.out"
          });
        };

        const handleMouseLeave = () => {
          setIsHovering(false);
          gsap.to(cursor, {
            scale: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            duration: 0.3,
            ease: "power2.out"
          });
        };

        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);
      });
    };

    // Initialize
    document.addEventListener('mousemove', handleMouseMove);
    animateCursor();
    handleMagneticElements();
    handleClickableElements();

    // Hide default cursor
    document.body.style.cursor = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.body.style.cursor = 'auto';
    };
  }, []);

  return (
    <>
      {/* Main cursor */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-10 h-10 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      />

      {/* Cursor dot */}
      <div
        ref={cursorDotRef}
        className="fixed top-0 left-0 w-2 h-2 bg-white rounded-full pointer-events-none z-[9999] mix-blend-difference"
      />
    </>
  );
};

export default MagneticCursor; 