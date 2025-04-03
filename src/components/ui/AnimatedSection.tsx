import React, { ReactNode } from 'react';
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
  return (
    <motion.div
      variants={fadeIn(direction, delay)}
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