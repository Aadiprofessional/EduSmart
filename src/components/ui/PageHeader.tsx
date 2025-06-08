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

  const heightClasses = {
    sm: 'h-[200px]',
    md: 'h-[300px]',
    lg: 'h-[400px]',
    xl: 'h-[500px]'
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

  const floatingElements = Array.from({ length: 6 }, (_, i) => (
    <motion.div
      key={i}
      className="absolute w-4 h-4 bg-white/10 rounded-full"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
      animate={{
        y: [0, -20, 0],
        x: [0, Math.random() * 20 - 10, 0],
        opacity: [0.3, 0.7, 0.3],
      }}
      transition={{
        duration: 3 + Math.random() * 4,
        repeat: Infinity,
        delay: Math.random() * 2,
      }}
    />
  ));

  return (
    <div className={`relative overflow-hidden ${heightClasses[height]} ${className}`}>
      {/* Animated Gradient Background */}
      <div 
        className={`absolute inset-0 ${theme.gradient} ${theme.animationClass}`}
      />
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Floating Elements */}
      <div className="absolute inset-0">
        {floatingElements}
      </div>
      
      {/* Geometric Shapes */}
      <motion.div
        className="absolute top-10 right-10 w-20 h-20 border-2 border-white/20 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute bottom-10 left-10 w-16 h-16 border-2 border-white/20 rotate-45"
        animate={{ rotate: [45, 405] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/4 w-12 h-12 bg-white/10 rounded-lg"
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360]
        }}
        transition={{ duration: 12, repeat: Infinity }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full w-full">
        <div className="container mx-auto px-4 text-center h-full flex items-center justify-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto"
          >
            {title && (
              <motion.h1 
                variants={itemVariants}
                className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg"
              >
                {title}
              </motion.h1>
            )}
            
            {subtitle && (
              <motion.p 
                variants={itemVariants}
                className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-md"
              >
                {subtitle}
              </motion.p>
            )}
            
            {children && (
              <motion.div variants={itemVariants}>
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