import React, { ReactNode, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fadeIn } from '../../utils/animations';

interface AnimatedSectionProps {
  children: ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  className?: string;
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  direction = 'up',
  delay = 0,
  className = '',
}) => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Always use 'up' direction on mobile devices
  const effectiveDirection = isMobile ? 'up' : direction;
  
  return (
    <motion.div
      variants={fadeIn(effectiveDirection, delay)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      className={`reveal-on-scroll ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedSection; 