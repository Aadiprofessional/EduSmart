import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../utils/LanguageContext';
import { useModelPosition } from '../../utils/ModelPositionContext';

const Hero3D: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const sectionRef = useRef<HTMLElement>(null);
  const { registerComponent, unregisterComponent } = useModelPosition();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Register component for 3D models
  useEffect(() => {
    if (sectionRef.current) {
      registerComponent('hero', sectionRef.current, {
        pencil: {
          x: 400, // 400px to the right of component center
          y: 0,   // Same vertical level as component center
          z: 3,
          scale: 2.2,
          rotation: { x: 0.3, y: 0.5, z: 0.2 },
          visible: true
        },
        eraser: {
          x: -750, // 300px to the left of component center
          y: 350,  // 100px below component center
          z: 2,
          scale: 1.0,
          visible: true // Hidden in hero section
        },
        sharpener: {
          x: -600,  // 300px to the right of component center
          y: -200,  // 100px below component center
          z: 0,
          scale: 0.03,
          visible: true // Hidden in hero section
        }
      });
    }

    return () => {
      unregisterComponent('hero');
    };
  }, [registerComponent, unregisterComponent]);

  // Navigation handlers
  const handleStartLearning = () => {
    navigate('/ai-courses');
  };

  const handleExploreFeatures = () => {
    navigate('/about');
  };

  // Text content with responsive length
  const fullText = t('hero.subtitle') || 'MatrixEdu leverages AI to provide personalized, expert-level tutoring, making quality education accessible for all students and fostering efficient learning and confident growth. We also offer comprehensive study abroad support, including AI-driven university matching, customized application strategies, essay optimization, and visa guidance to boost admission success.';
  
  const mobileText = fullText.length > 100 ? fullText.substring(0, 100) + '...' : fullText;

  return (
    <section 
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full"
          style={{
            backgroundSize: '50px 50px',
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="max-w-5xl mx-auto"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent leading-tight">
            MatrixEdu
          </h1>
          
          {/* Responsive Text - Mobile shows truncated, Desktop shows full */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-8 text-gray-300 max-w-4xl mx-auto leading-relaxed px-4">
            <span className="block sm:hidden">{mobileText}</span>
            <span className="hidden sm:block">{fullText}</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="flex flex-row gap-3 sm:gap-6 justify-center items-center max-w-2xl mx-auto"
        >
          <motion.button
            onClick={handleStartLearning}
            className="flex-1 sm:flex-none px-4 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white font-semibold text-sm sm:text-base lg:text-lg shadow-2xl hover:shadow-blue-500/25 transition-all duration-300"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)"
            }}
            whileTap={{ scale: 0.95 }}
            style={{
              transform: `translate(${mousePosition.x * 10}px, ${mousePosition.y * 10}px)`
            }}
          >
            <span className="hidden sm:inline">Start Learning</span>
            <span className="sm:hidden">Learn</span>
          </motion.button>
          
          <motion.button
            onClick={handleExploreFeatures}
            className="flex-1 sm:flex-none px-4 sm:px-8 py-3 sm:py-4 border-2 border-white/30 rounded-full text-white font-semibold text-sm sm:text-base lg:text-lg backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
            whileHover={{ 
              scale: 1.05,
              backgroundColor: "rgba(255, 255, 255, 0.1)"
            }}
            whileTap={{ scale: 0.95 }}
            style={{
              transform: `translate(${-mousePosition.x * 5}px, ${-mousePosition.y * 5}px)`
            }}
          >
            <span className="hidden sm:inline">About Us</span>
            <span className="sm:hidden">About</span>
          </motion.button>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          {[
            { title: "AI-Powered Learning", desc: "Personalized tutoring" },
            { title: "University Matching", desc: "Smart recommendations" },
            { title: "24/7 Support", desc: "Always available" }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.8 + index * 0.2 }}
              className="p-6 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2"></div>
        </div>
      </motion.div>
    </section>
  );
};

export default Hero3D; 