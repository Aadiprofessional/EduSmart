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
      color: "from-indigo-500 to-red-500"
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
      color: 'from-indigo-500 to-red-500',
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
      className="relative min-h-screen bg-transparent overflow-hidden"
    >
      <div className="relative z-10 container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-screen">
          
          {/* Left Side - Clean Main Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8 lg:space-y-10"
          >
            {/* Main Title */}
            <div className="space-y-6 text-center lg:text-left mt-16 lg:mt-0">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight text-white tracking-tight"
              >
                {t('home.hero.title')}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg sm:text-xl lg:text-2xl text-slate-400 leading-relaxed max-w-2xl font-light mx-auto lg:mx-0"
              >
                {t('home.hero.subtitle')}
              </motion.p>
            </div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-row gap-4 justify-center lg:justify-start"
            >
              <motion.button
                onClick={() => navigate('/ai-study')}
                className="group flex items-center justify-center px-8 py-4 bg-white text-black rounded-lg font-semibold text-lg hover:bg-slate-200 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <IconComponent icon={FaGraduationCap} className="mr-3 w-5 h-5" />
                <span>{t('home.hero.startLearning')}</span>
                <IconComponent icon={FiArrowRight} className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <motion.button
                onClick={() => navigate('/about')}
                className="group flex items-center justify-center px-8 py-4 bg-transparent border border-white/20 text-white rounded-lg font-semibold text-lg hover:bg-white/10 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <IconComponent icon={AiOutlineTeam} className="mr-3 w-5 h-5" />
                <span>{t('home.hero.aboutUs')}</span>
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Right Side - Feature Slider */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            {/* Feature Slider Container */}
            <div className="bg-[#121212] border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                <div className="flex items-center space-x-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-md bg-white/10`}>
                      <IconComponent icon={sliderFeatures[currentSlide].icon} className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">{sliderFeatures[currentSlide].title}</h3>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature Slider Content */}
              <div className="p-8 min-h-[350px] flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6"
                  >
                    {/* Feature Description */}
                    <div className="space-y-4">
                      <p className="text-slate-300 text-lg leading-relaxed">
                        {sliderFeatures[currentSlide].description}
                      </p>
                      <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                        <p className="text-blue-400 text-sm font-medium">
                          {sliderFeatures[currentSlide].preview}
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <motion.button
                      onClick={() => handleFeatureClick(sliderFeatures[currentSlide])}
                      className="w-full flex items-center justify-center px-6 py-4 bg-white text-black rounded-lg font-semibold text-base hover:bg-slate-200 transition-all duration-300"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <span>{sliderFeatures[currentSlide].buttonText}</span>
                      <IconComponent icon={FiArrowRight} className="ml-3 w-4 h-4" />
                    </motion.button>
                  </motion.div>
                </AnimatePresence>

                {/* Slider Indicators */}
                <div className="flex justify-center space-x-2 mt-8">
                  {sliderFeatures.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentSlide
                          ? 'bg-white w-6'
                          : 'bg-white/20 hover:bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Feature Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="container mx-auto px-2 sm:px-6 mt-16 mb-10"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.button
              onClick={() => handleQuickFeatureClick('ai-learning')}
              className="group flex flex-col items-center p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <IconComponent 
                icon={FaBrain} 
                className="text-blue-400 text-2xl mb-3 group-hover:scale-110 transition-transform duration-300" 
              />
              <span className="text-white font-medium text-sm text-center">
                {t('home.hero.quickFeatures.aiLearning')}
              </span>
            </motion.button>

            <motion.button
              onClick={() => handleQuickFeatureClick('virtual-labs')}
              className="group flex flex-col items-center p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <IconComponent 
                icon={FaFlask} 
                className="text-purple-400 text-2xl mb-3 group-hover:scale-110 transition-transform duration-300" 
              />
              <span className="text-white font-medium text-sm text-center">
                {t('home.hero.quickFeatures.virtualLabs')}
              </span>
            </motion.button>

            <motion.button
              onClick={() => handleQuickFeatureClick('progress-tracking')}
              className="group flex flex-col items-center p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <IconComponent 
                icon={FaChartLine} 
                className="text-emerald-400 text-2xl mb-3 group-hover:scale-110 transition-transform duration-300" 
              />
              <span className="text-white font-medium text-sm text-center">
                {t('home.hero.quickFeatures.progress')}
              </span>
            </motion.button>

            <motion.button
              onClick={() => handleQuickFeatureClick('community')}
              className="group flex flex-col items-center p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <IconComponent 
                icon={FaUsers} 
                className="text-indigo-400 text-2xl mb-3 group-hover:scale-110 transition-transform duration-300" 
              />
              <span className="text-white font-medium text-sm text-center">
                {t('home.hero.quickFeatures.community')}
              </span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Simple Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center">
          <motion.div 
            className="w-1 h-2 bg-white rounded-full mt-2"
          />
        </div>
      </motion.div>
    </section>
  );
};

export default Hero3D; 
