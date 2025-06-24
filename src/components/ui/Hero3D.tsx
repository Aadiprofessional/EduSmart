import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../utils/LanguageContext';
import { useModelPosition } from '../../utils/ModelPositionContext';
import IconComponent from './IconComponent';
import { 
  AiOutlineRobot, 
  AiOutlineThunderbolt, 
  AiOutlineBulb, 
  AiOutlineFileText,
  AiOutlineArrowRight,
  AiOutlineStar,
  AiOutlineGlobal,
  AiOutlineCloud,
  AiOutlineEye,
  AiOutlineBook,
  AiOutlineTeam,
  AiOutlineSearch,
  AiOutlineUpload
} from 'react-icons/ai';
import { 
  FiZap, 
  FiCpu, 
  FiTrendingUp, 
  FiUsers, 
  FiMessageSquare,
  FiArrowRight,
  FiPlay,
  FiCheck,
  FiBookOpen,
  FiTarget,
  FiAward,
  FiCalendar,
  FiLayers,
  FiPenTool,
  FiDatabase
} from 'react-icons/fi';
import { FaGraduationCap, FaBrain, FaFlask, FaChartLine, FaUsers } from 'react-icons/fa';

const Hero3D: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentFeature, setCurrentFeature] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
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

  // Auto-cycle through features
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-cycle through slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 5);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Register component for 3D models
  useEffect(() => {
    if (sectionRef.current) {
      registerComponent('hero', sectionRef.current, {
        pencil: {
          x: 750,
          y: -50,
          z: 1,
          scale: 3.2,
          rotation: { x: 0.0, y: 0.0, z: 0.1 },
          visible: true
        },
        eraser: {
          x: -750,
          y: 350,
          z: 2,
          scale: 1.0,
          visible: false
        },
        sharpener: {
          x: -600,
          y: 600,
          z: 0,
          scale: 0.03,
          visible: true
        }
      });
    }

    return () => {
      unregisterComponent('hero');
    };
  }, [registerComponent, unregisterComponent]);

  const features = [
    {
      icon: FaGraduationCap,
      title: t('home.hero.features.aiPoweredLearning.title'),
      description: t('home.hero.features.aiPoweredLearning.description'),
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: AiOutlineGlobal,
      title: t('home.hero.features.studyAbroadSupport.title'),
      description: t('home.hero.features.studyAbroadSupport.description'),
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: AiOutlineFileText,
      title: t('home.hero.features.documentAnalysis.title'),
      description: t('home.hero.features.documentAnalysis.description'),
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: AiOutlineTeam,
      title: t('home.hero.features.expertMentorship.title'),
      description: t('home.hero.features.expertMentorship.description'),
      color: "from-orange-500 to-red-500"
    }
  ];

  // 5 Key Features for the slider
  const sliderFeatures = [
    {
      id: 'document-summarizer',
      title: t('home.hero.sliderFeatures.documentSummarizer.title'),
      description: t('home.hero.sliderFeatures.documentSummarizer.description'),
      icon: AiOutlineSearch,
      color: 'from-cyan-500 to-blue-500',
      path: '/ai-study',
      buttonText: t('home.hero.sliderFeatures.documentSummarizer.buttonText'),
      preview: t('home.hero.sliderFeatures.documentSummarizer.preview')
    },
    {
      id: 'database-analysis',
      title: t('home.hero.sliderFeatures.databaseAnalysis.title'),
      description: t('home.hero.sliderFeatures.databaseAnalysis.description'),
      icon: FiDatabase,
      color: 'from-purple-500 to-pink-500',
      path: '/database',
      buttonText: t('home.hero.sliderFeatures.databaseAnalysis.buttonText'),
      preview: t('home.hero.sliderFeatures.databaseAnalysis.preview')
    },
    {
      id: 'study-planner',
      title: t('home.hero.sliderFeatures.studyPlanner.title'),
      description: t('home.hero.sliderFeatures.studyPlanner.description'),
      icon: FiCalendar,
      color: 'from-green-500 to-emerald-500',
      path: '/ai-study',
      buttonText: t('home.hero.sliderFeatures.studyPlanner.buttonText'),
      preview: t('home.hero.sliderFeatures.studyPlanner.preview')
    },
    {
      id: 'content-writer',
      title: t('home.hero.sliderFeatures.contentWriter.title'),
      description: t('home.hero.sliderFeatures.contentWriter.description'),
      icon: FiPenTool,
      color: 'from-orange-500 to-red-500',
      path: '/ai-study',
      buttonText: t('home.hero.sliderFeatures.contentWriter.buttonText'),
      preview: t('home.hero.sliderFeatures.contentWriter.preview')
    },
    {
      id: 'ai-tutor',
      title: t('home.hero.sliderFeatures.aiTutor.title'),
      description: t('home.hero.sliderFeatures.aiTutor.description'),
      icon: FiMessageSquare,
      color: 'from-indigo-500 to-purple-500',
      path: '/ai-study',
      buttonText: t('home.hero.sliderFeatures.aiTutor.buttonText'),
      preview: t('home.hero.sliderFeatures.aiTutor.preview')
    }
  ];

  const stats = [
    { number: "10K+", label: t('home.hero.stats.studentsHelped') },
    { number: "95%", label: t('home.hero.stats.successRate') },
    { number: "50+", label: t('home.hero.stats.universities') },
    { number: "24/7", label: t('home.hero.stats.aiSupport') }
  ];

  const handleFeatureClick = (feature: typeof sliderFeatures[0]) => {
    if (feature.id === 'document-summarizer') {
      navigate('/ai-study?tab=document-summarizer');
    } else if (feature.id === 'study-planner') {
      navigate('/ai-study?tab=study-planner');
    } else if (feature.id === 'content-writer') {
      navigate('/ai-study?tab=content-writer');
    } else if (feature.id === 'ai-tutor') {
      navigate('/ai-study?tab=ai-tutor');
    } else if (feature.id === 'database-analysis') {
      navigate('/database');
    }
  };

  const handleQuickFeatureClick = (featureType: string) => {
    switch (featureType) {
      case 'ai-learning':
        navigate('/ai-study?tab=ai-tutor');
        break;
      case 'study-abroad':
        navigate('/database');
        break;
      case 'document-analysis':
        navigate('/ai-study?tab=document-summarizer');
        break;
      case 'expert-mentorship':
        navigate('/about');
        break;
      default:
        navigate('/ai-study');
    }
  };

  return (
    <section 
      ref={sectionRef}
      className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden"
    >
      {/* Enhanced Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Orbs with improved animations */}
        <motion.div
          className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full blur-2xl"
          animate={{
            x: [0, 120, 0],
            y: [0, -60, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-40 right-32 w-32 h-32 bg-gradient-to-r from-cyan-500/25 to-blue-500/25 rounded-full blur-2xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 80, 0],
            scale: [1, 0.7, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div
          className="absolute bottom-32 left-1/3 w-48 h-48 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-2xl"
          animate={{
            x: [0, 140, 0],
            y: [0, -100, 0],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />

        {/* Enhanced Grid Pattern */}
        <div className="absolute inset-0 opacity-15">
          <div 
            className="w-full h-full"
            style={{
              backgroundSize: '80px 80px',
              backgroundImage: `
                linear-gradient(to right, rgba(6, 182, 212, 0.4) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(6, 182, 212, 0.4) 1px, transparent 1px)
              `,
            }}
          />
        </div>

        {/* Multiple Animated Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-25">
          <defs>
            <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lineGradient2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="1" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d="M0,200 Q400,50 800,200 T1600,200"
            stroke="url(#lineGradient1)"
            strokeWidth="3"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.path
            d="M0,600 Q400,450 800,600 T1600,600"
            stroke="url(#lineGradient2)"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
        </svg>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-screen">
          
          {/* Left Side - Enhanced Main Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-10 lg:space-y-10"
          >
            {/* Enhanced Main Title - Mobile Responsive */}
            <div className="space-y-8 text-center lg:text-left mt-16 lg:mt-0">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-8xl font-bold leading-tight"
              >
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                {t('home.hero.title')}
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg sm:text-xl lg:text-2xl text-slate-300 leading-relaxed max-w-2xl font-light mx-auto lg:mx-0"
              >
                {t('home.hero.subtitle')}
              </motion.p>
            </div>

            {/* Enhanced Action Buttons - Mobile Responsive */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-row gap-3 sm:gap-4 lg:gap-6 justify-center lg:justify-start"
            >
              <motion.button
                onClick={() => navigate('/ai-study')}
                className="group flex items-center justify-center px-4 sm:px-6 lg:px-10 py-3 sm:py-4 lg:py-5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl lg:rounded-2xl text-white font-bold text-xs sm:text-sm lg:text-xl shadow-2xl hover:shadow-cyan-500/30 transition-all duration-300 whitespace-nowrap"
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                <IconComponent icon={FaGraduationCap} className="mr-1.5 sm:mr-2 lg:mr-3 w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6" />
                <span>{t('home.hero.startLearning')}</span>
                <IconComponent icon={FiArrowRight} className="ml-1.5 sm:ml-2 lg:ml-3 w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6 group-hover:translate-x-2 transition-transform" />
              </motion.button>

              <motion.button
                onClick={() => navigate('/about')}
                className="group flex items-center justify-center px-4 sm:px-6 lg:px-10 py-3 sm:py-4 lg:py-5 border-2 border-cyan-500/40 rounded-xl lg:rounded-2xl text-cyan-300 font-bold text-xs sm:text-sm lg:text-xl backdrop-blur-sm hover:bg-cyan-500/10 hover:border-cyan-400 transition-all duration-300 whitespace-nowrap"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <IconComponent icon={AiOutlineTeam} className="mr-1.5 sm:mr-2 lg:mr-3 w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6" />
                <span>{t('home.hero.aboutUs')}</span>
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Right Side - Feature Slider - Mobile Responsive */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            {/* Enhanced Feature Slider Container */}
            <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-2xl border-2 border-cyan-500/30 rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden relative">
              {/* Enhanced Header - Mobile Responsive */}
              <div className="flex items-center justify-between p-4 sm:p-6 lg:p-8 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/80 to-slate-900/80">
                <div className="flex items-center space-x-3 lg:space-x-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 lg:w-4 lg:h-4 bg-red-500 rounded-full shadow-lg"></div>
                    <div className="w-3 h-3 lg:w-4 lg:h-4 bg-yellow-500 rounded-full shadow-lg"></div>
                    <div className="w-3 h-3 lg:w-4 lg:h-4 bg-green-500 rounded-full shadow-lg"></div>
                  </div>
                  <div className="flex items-center space-x-2 lg:space-x-3">
                    <div className={`p-1.5 lg:p-2 bg-gradient-to-r ${sliderFeatures[currentSlide].color} rounded-lg`}>
                      <IconComponent icon={sliderFeatures[currentSlide].icon} className="w-4 h-4 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm sm:text-lg lg:text-xl">{sliderFeatures[currentSlide].title}</h3>
                      <p className="text-slate-400 text-xs lg:text-sm">{t('home.hero.poweredBy')}</p>
                    </div>
                  </div>
                </div>
                {/* Hide Active status on mobile */}
                <div className="hidden sm:flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                  <span className="text-green-400 text-base font-semibold">{t('home.hero.active')}</span>
                </div>
              </div>

              {/* Feature Slider Content */}
              <div className="p-4 sm:p-6 lg:p-8 min-h-[300px] sm:min-h-[350px] lg:min-h-[400px] flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-4 lg:space-y-6"
                  >
                    {/* Feature Description */}
                    <div className="space-y-3 lg:space-y-4">
                      <p className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed">
                        {sliderFeatures[currentSlide].description}
                      </p>
                      <div className="bg-slate-700/30 rounded-lg lg:rounded-xl p-3 lg:p-4 border border-slate-600/30">
                        <p className="text-cyan-400 text-xs sm:text-sm font-medium">
                          {sliderFeatures[currentSlide].preview}
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <motion.button
                      onClick={() => handleFeatureClick(sliderFeatures[currentSlide])}
                      className={`w-full flex items-center justify-center px-6 lg:px-8 py-3 lg:py-4 bg-gradient-to-r ${sliderFeatures[currentSlide].color} rounded-lg lg:rounded-xl text-white font-bold text-sm sm:text-base lg:text-lg shadow-lg hover:shadow-xl transition-all duration-300`}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span>{sliderFeatures[currentSlide].buttonText}</span>
                      <IconComponent icon={FiArrowRight} className="ml-2 lg:ml-3 w-4 h-4 lg:w-5 lg:h-5" />
                    </motion.button>
                  </motion.div>
                </AnimatePresence>

                {/* Slider Indicators */}
                <div className="flex justify-center space-x-2 lg:space-x-3 mt-6 lg:mt-8">
                  {sliderFeatures.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full transition-all duration-300 ${
                        index === currentSlide
                          ? 'bg-cyan-400 shadow-lg shadow-cyan-400/50'
                          : 'bg-slate-600 hover:bg-slate-500'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-4 right-4 w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-4 left-4 w-16 h-16 lg:w-24 lg:h-24 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-xl"></div>
            </div>

            {/* Floating Elements Around Container */}
            <motion.div
              className="absolute -top-4 -right-4 lg:-top-6 lg:-right-6 w-8 h-8 lg:w-12 lg:h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shadow-xl"
              animate={{ 
                rotate: 360,
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <IconComponent icon={AiOutlineBulb} className="w-4 h-4 lg:w-6 lg:h-6 text-white" />
            </motion.div>

            <motion.div
              className="absolute -bottom-3 -left-3 lg:-bottom-4 lg:-left-4 w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg"
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              <IconComponent icon={FiZap} className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
            </motion.div>
          </motion.div>
        </div>

        {/* Enhanced Feature Showcase - Mobile Responsive (wider cards with less gap) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="container mx-auto px-2 sm:px-6 mt-8 sm:mt-16 mb-6 sm:mb-10"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-4 lg:gap-8">
            <motion.button
              onClick={() => handleQuickFeatureClick('ai-learning')}
              className="group flex flex-col items-center p-1.5 sm:p-4 lg:p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg lg:rounded-xl hover:border-blue-400/40 hover:bg-blue-500/15 transition-all duration-300 relative overflow-hidden"
              whileHover={{ y: -3, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <IconComponent 
                icon={FaBrain} 
                className="text-blue-400 text-lg sm:text-2xl lg:text-3xl mb-1 sm:mb-2 lg:mb-3 relative z-10 group-hover:scale-110 transition-transform duration-300" 
              />
              <span className="text-white font-medium text-xs sm:text-sm lg:text-base text-center relative z-10 group-hover:text-blue-300 transition-colors duration-300">
                {t('home.hero.quickFeatures.aiLearning')}
              </span>
              <span className="text-gray-400 text-xs sm:text-xs lg:text-sm text-center mt-0.5 sm:mt-1 relative z-10 group-hover:text-gray-300 transition-colors duration-300">
                {t('home.hero.quickFeatures.smartTutoring')}
              </span>
            </motion.button>

            <motion.button
              onClick={() => handleQuickFeatureClick('virtual-labs')}
              className="group flex flex-col items-center p-1.5 sm:p-4 lg:p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg lg:rounded-xl hover:border-purple-400/40 hover:bg-purple-500/15 transition-all duration-300 relative overflow-hidden"
              whileHover={{ y: -3, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <IconComponent 
                icon={FaFlask} 
                className="text-purple-400 text-lg sm:text-2xl lg:text-3xl mb-1 sm:mb-2 lg:mb-3 relative z-10 group-hover:scale-110 transition-transform duration-300" 
              />
              <span className="text-white font-medium text-xs sm:text-sm lg:text-base text-center relative z-10 group-hover:text-purple-300 transition-colors duration-300">
                {t('home.hero.quickFeatures.virtualLabs')}
              </span>
              <span className="text-gray-400 text-xs sm:text-xs lg:text-sm text-center mt-0.5 sm:mt-1 relative z-10 group-hover:text-gray-300 transition-colors duration-300">
                {t('home.hero.quickFeatures.practiceSafely')}
              </span>
            </motion.button>

            <motion.button
              onClick={() => handleQuickFeatureClick('progress-tracking')}
              className="group flex flex-col items-center p-1.5 sm:p-4 lg:p-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-lg lg:rounded-xl hover:border-emerald-400/40 hover:bg-emerald-500/15 transition-all duration-300 relative overflow-hidden"
              whileHover={{ y: -3, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <IconComponent 
                icon={FaChartLine} 
                className="text-emerald-400 text-lg sm:text-2xl lg:text-3xl mb-1 sm:mb-2 lg:mb-3 relative z-10 group-hover:scale-110 transition-transform duration-300" 
              />
              <span className="text-white font-medium text-xs sm:text-sm lg:text-base text-center relative z-10 group-hover:text-emerald-300 transition-colors duration-300">
                {t('home.hero.quickFeatures.progress')}
              </span>
              <span className="text-gray-400 text-xs sm:text-xs lg:text-sm text-center mt-0.5 sm:mt-1 relative z-10 group-hover:text-gray-300 transition-colors duration-300">
                {t('home.hero.quickFeatures.trackAndLearn')}
              </span>
            </motion.button>

            <motion.button
              onClick={() => handleQuickFeatureClick('community')}
              className="group flex flex-col items-center p-1.5 sm:p-4 lg:p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg lg:rounded-xl hover:border-orange-400/40 hover:bg-orange-500/15 transition-all duration-300 relative overflow-hidden"
              whileHover={{ y: -3, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <IconComponent 
                icon={FaUsers} 
                className="text-orange-400 text-lg sm:text-2xl lg:text-3xl mb-1 sm:mb-2 lg:mb-3 relative z-10 group-hover:scale-110 transition-transform duration-300" 
              />
              <span className="text-white font-medium text-xs sm:text-sm lg:text-base text-center relative z-10 group-hover:text-orange-300 transition-colors duration-300">
                {t('home.hero.quickFeatures.community')}
              </span>
              <span className="text-gray-400 text-xs sm:text-xs lg:text-sm text-center mt-0.5 sm:mt-1 relative z-10 group-hover:text-gray-300 transition-colors duration-300">
                {t('home.hero.quickFeatures.learnTogether')}
              </span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-6 h-10 lg:w-8 lg:h-12 border-3 border-cyan-500/60 rounded-full flex justify-center backdrop-blur-sm bg-slate-900/20 shadow-lg">
          <motion.div 
            className="w-1.5 h-3 lg:w-2 lg:h-4 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full mt-1.5 lg:mt-2 shadow-sm"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
};

export default Hero3D; 