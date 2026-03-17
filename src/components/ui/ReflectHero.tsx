import React from 'react';
import { motion } from 'framer-motion';
import { FaMagic } from 'react-icons/fa';
import MatrixEduNavbar from '../layout/MatrixEduNavbar';
import { useLanguage } from '../../utils/LanguageContext';

const ReflectHero: React.FC = () => {
  const { t } = useLanguage();
  // Animation for the "black hole" particles
  const particles = Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2,
  }));

  return (
    <div className="relative min-h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-purple-500 selection:text-white">
      {/* Navbar */}
      <MatrixEduNavbar />

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen pt-20 pb-0 text-center px-4">

        
        {/* Badge */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-purple-200 backdrop-blur-md hover:bg-white/10 transition-colors cursor-pointer"
        >
            <FaMagic className="text-purple-400" />
            {t('reflectHero.badge')}
        </motion.div>

        {/* Title */}
        <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60"
        >
            {t('reflectHero.title')}
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 mb-12 max-w-lg mx-auto"
        >
            {t('reflectHero.subtitle')}
        </motion.p>

        {/* Black Hole / Event Horizon Effect */}
        <div className="relative w-full max-w-5xl h-[400px] mt-10 perspective-1000">
            {/* The Black Hole Core */}
            <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[600px] h-[300px] md:w-[800px] md:h-[400px]">
                 {/* Glows */}
                <div className="absolute inset-0 rounded-[100%] bg-purple-600/20 blur-[80px] animate-pulse"></div>
                <div className="absolute inset-x-10 bottom-0 h-[200px] rounded-[100%] bg-indigo-500/30 blur-[60px]"></div>
                
                {/* The Ring/Horizon */}
                <div className="absolute left-1/2 bottom-[-150px] -translate-x-1/2 w-[120%] h-[300px] rounded-[50%] border-t-2 border-white/50 bg-gradient-to-b from-purple-500/10 to-transparent shadow-[0_-10px_40px_rgba(168,85,247,0.4)] box-shadow-[0_0_50px_rgba(139,92,246,0.5)]"></div>
                
                {/* Bright Edge */}
                <div className="absolute left-1/2 bottom-[-152px] -translate-x-1/2 w-[120%] h-[300px] rounded-[50%] border-t-[4px] border-purple-300 blur-[2px] opacity-70"></div>
                
                {/* Inner Darkness */}
                 <div className="absolute left-1/2 bottom-[-148px] -translate-x-1/2 w-[118%] h-[296px] rounded-[50%] bg-[#050505]"></div>
            </div>

            {/* Particles / Stars moving into/out of the hole */}
            <div className="absolute inset-0 overflow-hidden">
                {particles.map((p) => (
                    <motion.div
                        key={p.id}
                        className="absolute rounded-full bg-white"
                        style={{
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                            width: p.size,
                            height: p.size,
                            opacity: Math.random() * 0.5 + 0.2,
                        }}
                        animate={{
                            y: [0, -100],
                            opacity: [0, 1, 0],
                        }}
                        transition={{
                            duration: p.duration,
                            repeat: Infinity,
                            delay: p.delay,
                            ease: "linear"
                        }}
                    />
                ))}
            </div>

             {/* UI Mockup Placeholder */}
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] md:w-[80%] h-[200px] bg-[#111] rounded-t-2xl border border-white/10 border-b-0 shadow-2xl overflow-hidden z-20">
                {/* Mockup Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#151515]">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                    </div>
                    <div className="text-xs text-gray-500">{t('reflectHero.mockupLabel')}</div>
                    <div className="w-4"></div>
                </div>
                {/* Mockup Content */}
                <div className="p-6 grid grid-cols-4 gap-6 h-full">
                    {/* Sidebar */}
                    <div className="col-span-1 border-r border-white/5 pr-4 hidden md:block">
                        <div className="space-y-4">
                            <div className="h-2 w-20 bg-white/10 rounded"></div>
                            <div className="h-2 w-16 bg-white/10 rounded"></div>
                            <div className="h-2 w-24 bg-white/10 rounded"></div>
                        </div>
                    </div>
                    {/* Main Content */}
                    <div className="col-span-4 md:col-span-3">
                         <div className="h-8 w-48 bg-white/10 rounded mb-6"></div>
                         <div className="space-y-3">
                            <div className="h-2 w-full bg-white/5 rounded"></div>
                            <div className="h-2 w-[90%] bg-white/5 rounded"></div>
                            <div className="h-2 w-[95%] bg-white/5 rounded"></div>
                         </div>
                    </div>
                </div>
                
                {/* Fade Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent"></div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default ReflectHero;
