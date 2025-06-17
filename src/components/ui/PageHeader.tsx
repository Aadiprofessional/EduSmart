import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPageTheme } from '../../utils/pageThemes';

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
  height?: 'sm' | 'md' | 'lg' | 'xl';
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  children, 
  className = '',
  height = 'md'
}) => {
  const location = useLocation();
  const theme = getPageTheme(location.pathname);

  // Mobile-first height classes with more compact mobile design
  const heightClasses = {
    sm: 'h-[120px] sm:h-[160px] lg:h-[200px]',
    md: 'h-[140px] sm:h-[200px] lg:h-[280px] xl:h-[300px]',
    lg: 'h-[160px] sm:h-[240px] lg:h-[350px] xl:h-[400px]',
    xl: 'h-[180px] sm:h-[280px] lg:h-[400px] xl:h-[500px]'
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  // Fewer floating elements for mobile to reduce clutter
  const floatingElements = Array.from({ length: 3 }, (_, i) => (
    <motion.div
      key={i}
      className="absolute w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 bg-white/10 rounded-full"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
      animate={{
        y: [0, -15, 0],
        x: [0, Math.random() * 15 - 7.5, 0],
        opacity: [0.2, 0.6, 0.2],
      }}
      transition={{
        duration: 4 + Math.random() * 3,
        repeat: Infinity,
        delay: Math.random() * 2,
      }}
    />
  ));

  return (
    <div className={`relative overflow-hidden ${heightClasses[height]} mt-16 ${className}`}>
      {/* Mobile-optimized gradient background */}
      <div 
        className={`absolute inset-0 ${theme.gradient} ${theme.animationClass}`}
      />
      
      {/* Mobile-friendly overlay */}
      <div className="absolute inset-0 bg-black/30 sm:bg-black/20" />
      
      {/* Reduced floating elements for mobile */}
      <div className="absolute inset-0 hidden sm:block">
        {floatingElements}
      </div>
      
      {/* Smaller, mobile-optimized geometric shapes */}
      <motion.div
        className="absolute top-2 right-2 sm:top-6 sm:right-8 lg:top-10 lg:right-10 w-8 h-8 sm:w-12 sm:h-12 lg:w-20 lg:h-20 border border-white/20 sm:border-2 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute bottom-2 left-2 sm:bottom-6 sm:left-8 lg:bottom-10 lg:left-10 w-6 h-6 sm:w-10 sm:h-10 lg:w-16 lg:h-16 border border-white/20 sm:border-2 rotate-45"
        animate={{ rotate: [45, 405] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/4 w-4 h-4 sm:w-8 sm:h-8 lg:w-12 lg:h-12 bg-white/10 rounded-lg"
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360]
        }}
        transition={{ duration: 12, repeat: Infinity }}
      />
      
      {/* Mobile-optimized content */}
      <div className="relative z-10 flex items-center justify-center h-full w-full">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8 text-center h-full flex items-center justify-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto"
          >
            {title && (
              <motion.h1 
                variants={itemVariants}
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-2 sm:mb-3 lg:mb-4 drop-shadow-lg leading-tight px-2"
              >
                {title}
              </motion.h1>
            )}
            
            {subtitle && (
              <motion.p 
                variants={itemVariants}
                className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-white/90 mb-4 sm:mb-6 lg:mb-8 max-w-2xl mx-auto drop-shadow-md leading-relaxed px-4"
              >
                {subtitle}
              </motion.p>
            )}
            
            {children && (
              <motion.div 
                variants={itemVariants}
                className="px-2 sm:px-0"
              >
                {children}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    
    </div>
  );
};

export default PageHeader; 