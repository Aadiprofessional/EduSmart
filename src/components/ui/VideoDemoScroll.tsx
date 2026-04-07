import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FaPlay } from 'react-icons/fa';
import { useLanguage } from '../../utils/LanguageContext';

const VideoDemoScroll: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"]
  });

  // Transform values for the 3D effect
  // Starts tilted backward (positive rotateX) and smaller
  // Ends flat (0 rotateX) and full scale
  const rotateX = useTransform(scrollYProgress, [0, 1], [45, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [0.5, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [100, 0]);

  return (
    <section className="py-24 bg-gray-50 dark:bg-[#050505] overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-permanent-marker mb-6 text-gray-900 dark:text-white">
            {t('videoDemo.title')}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('videoDemo.subtitle')}
          </p>
        </div>

        <div ref={containerRef} className="relative h-[60vh] md:h-[80vh] flex items-center justify-center" style={{ perspective: "1000px" }}>
          <motion.div
            style={{
              rotateX: rotateX,
              scale: scale,
              y: y,
              opacity: opacity,
              transformStyle: "preserve-3d",
            }}
            className="w-full max-w-6xl aspect-video mx-auto bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 relative group"
          >
            {/* Browser/App Header Bar Simulation */}
            <div className="absolute top-0 left-0 right-0 h-12 bg-slate-100/90 dark:bg-gray-800/80 backdrop-blur-md flex items-center px-4 border-b border-gray-200 dark:border-gray-700 z-20">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="mx-auto bg-white dark:bg-gray-700/50 px-4 py-1 rounded-full text-xs text-gray-500 dark:text-gray-300 font-mono border border-gray-200 dark:border-transparent">
                    {t('videoDemo.demoUrl')}
                </div>
            </div>

            {/* Video Content */}
            <div className="absolute inset-0 pt-12 bg-slate-50 dark:bg-black flex items-center justify-center overflow-hidden">
                {/* Simulated UI Content if no video */}
                <div className="w-full h-full relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-200/40 via-white/50 to-purple-200/40 dark:from-indigo-900/20 dark:via-transparent dark:to-purple-900/20 z-10"></div>
                    
                    {/* Grid Pattern */}
                    <div className="absolute inset-0 opacity-30 dark:opacity-20" 
                        style={{ 
                            backgroundImage: 'linear-gradient(rgba(99,102,241,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.25) 1px, transparent 1px)', 
                            backgroundSize: '40px 40px' 
                        }}>
                    </div>

                    {/* Central Play Button / Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                        <div className="w-24 h-24 rounded-full bg-white/90 dark:bg-white/10 backdrop-blur-md border border-indigo-200 dark:border-white/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 cursor-pointer">
                            <FaPlay className="text-indigo-700 dark:text-white text-3xl ml-2" />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('videoDemo.interactiveTitle')}</h3>
                        <p className="text-gray-500 dark:text-gray-400">{t('videoDemo.clickToStart')}</p>
                    </div>

                    {/* Animated UI Elements simulating the app */}
                    <motion.div 
                        animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-1/4 left-1/4 w-64 h-40 bg-white/90 dark:bg-gray-800/80 rounded-xl border border-indigo-100 dark:border-gray-700 p-4 shadow-xl backdrop-blur-sm hidden md:block"
                    >
                        <div className="h-4 w-3/4 bg-indigo-200 dark:bg-gray-600 rounded mb-3"></div>
                        <div className="space-y-2">
                            <div className="h-2 w-full bg-indigo-100 dark:bg-gray-700 rounded"></div>
                            <div className="h-2 w-5/6 bg-indigo-100 dark:bg-gray-700 rounded"></div>
                            <div className="h-2 w-4/6 bg-indigo-100 dark:bg-gray-700 rounded"></div>
                        </div>
                    </motion.div>

                    <motion.div 
                        animate={{ x: [0, -20, 0], y: [0, 15, 0] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute bottom-1/4 right-1/4 w-56 h-64 bg-white/90 dark:bg-gray-800/80 rounded-xl border border-indigo-100 dark:border-gray-700 p-4 shadow-xl backdrop-blur-sm hidden md:block"
                    >
                        <div className="flex gap-2 mb-4">
                            <div className="w-8 h-8 rounded-full bg-indigo-500"></div>
                            <div className="h-8 flex-1 bg-indigo-100 dark:bg-gray-700 rounded-lg"></div>
                        </div>
                        <div className="space-y-3">
                            <div className="p-2 bg-indigo-100/80 dark:bg-gray-700/50 rounded-lg h-16"></div>
                            <div className="p-2 bg-indigo-100/80 dark:bg-gray-700/50 rounded-lg h-16"></div>
                        </div>
                    </motion.div>
                </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default VideoDemoScroll;
