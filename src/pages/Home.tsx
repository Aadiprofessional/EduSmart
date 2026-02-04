import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { Header } from '../components/layout';
import Footer from '../components/layout/Footer';
import Hero3D from '../components/ui/Hero3D';
import FeaturedCourses3D from '../components/ui/FeaturedCourses3D';
import FeaturedResources3D from '../components/ui/FeaturedResources3D';
import FeaturedSuccessStories3D from '../components/ui/FeaturedSuccessStories3D';
import FeaturedScholarships3D from '../components/ui/FeaturedScholarships3D';
import ScrollingBalls3D from '../components/ui/ScrollingBalls3D';
import { useLanguage } from '../utils/LanguageContext';
import { ModelPositionProvider, useModelPosition } from '../utils/ModelPositionContext';
import { useAuth } from '../utils/AuthContext';
import MatrixEduLanding from '../components/ui/MatrixEduLanding';

// Our Impact Section Component
const OurImpactSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { registerComponent, unregisterComponent } = useModelPosition();
  const { t } = useLanguage();

  useEffect(() => {
    if (sectionRef.current) {
      registerComponent('our-impact', sectionRef.current, {
        pencil: {
          x: 0,    // Centered horizontally
          y: 0,    // Same vertical level as component center
          z: 2,
          scale: 1.4,
          rotation: { x: 0, y: 1.5, z: 0 },
          visible: false
        },
        eraser: {
          x: -700, // 300px to the left of component center
          y: 50,  // 100px below component center
          z: 2,
          scale: 0.8,
          visible: true
        },
        sharpener: {
          x: 400,  // 300px to the right of component center
          y: -100,  // 100px below component center
          z: 2,
          scale: 0.02,
          visible: true
        }
      });
    }

    return () => {
      unregisterComponent('our-impact');
    };
  }, [registerComponent, unregisterComponent]);

  return (
    <section ref={sectionRef} className="py-20 bg-transparent relative overflow-hidden">
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.1 }}
          className="text-center mb-16"
        >
          <div className="relative">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              {t('home.impact.title')}
            </h2>
            {/* Invisible anchor points for precise positioning */}
            <div 
              id="pencil-anchor-impact" 
              className="absolute left-1/2 transform -translate-x-1/2 top-1/2 -translate-y-1/2 w-1 h-1 pointer-events-none"
              style={{ zIndex: -1 }}
            />
            <div 
              id="eraser-anchor-impact" 
              className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-8 w-1 h-1 pointer-events-none"
              style={{ zIndex: -1 }}
            />
            <div 
              id="sharpener-anchor-impact" 
              className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-8 w-1 h-1 pointer-events-none"
              style={{ zIndex: -1 }}
            />
          </div>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            {t('home.impact.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-8">
          {[
            { number: '50K+', label: t('home.impact.studentsEnrolled') },
            { number: '1000+', label: t('home.impact.coursesAvailable') },
            { number: '95%', label: t('home.impact.successRate') },
            { number: '24/7', label: t('home.impact.aiSupport') }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true, amount: 0.1 }}
              whileHover={{ 
                y: -5,
              }}
              className="group relative bg-[#121212] rounded-xl p-4 sm:p-6 lg:p-8 border border-white/10 hover:border-white/30 transition-all duration-300"
              data-magnetic
            >
              <div className="text-center">
                <div className={`text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-1 sm:mb-2`}>
                  {stat.number}
                </div>
                <div className="text-gray-500 font-medium text-xs sm:text-sm lg:text-base">
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Ready to Transform Section Component
const ReadyToTransformSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { registerComponent, unregisterComponent } = useModelPosition();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    if (sectionRef.current) {
      registerComponent('ready-to-transform', sectionRef.current, {
        pencil: {
          x: 0,    // Centered horizontally
          y: -230, // 100px above component center (horizontal/sleeping position)
          z: 2,
          scale: 4.8,
          rotation: { x: 0, y: 0, z: 1.5 }, // Horizontal/sleeping rotation
          visible: true
        },
        eraser: {
          x: -900, // 400px to the left of component center
          y: 400,    // Same vertical level as component center
          z: 1,
          scale: 0.9,
          visible: true
        },
        sharpener: {
          x: 600,  // 400px to the right of component center
          y: 0,    // Same vertical level as component center
          z: 1,
          scale: 0.02,
          visible: true
        }
      });
    }

    return () => {
      unregisterComponent('ready-to-transform');
    };
  }, [registerComponent, unregisterComponent]);

  // Navigation handlers
  const handleStartJourney = () => {
    navigate('/signup');
  };

  const handleExploreFeatures = () => {
    navigate('/about');
  };

  return (
    <section ref={sectionRef} className="py-20 bg-transparent relative overflow-hidden">
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="relative">
            <h2 className="text-5xl md:text-7xl font-bold text-white mb-8">
              {t('home.transform.title')}
            </h2>
            {/* Invisible anchor points for precise positioning */}
            <div 
              id="pencil-anchor-transform" 
              className="absolute left-1/2 transform -translate-x-1/2 top-1/2 -translate-y-1/2 w-1 h-1 pointer-events-none"
              style={{ zIndex: -1 }}
            />
            <div 
              id="eraser-anchor-transform" 
              className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-12 w-1 h-1 pointer-events-none"
              style={{ zIndex: -1 }}
            />
            <div 
              id="sharpener-anchor-transform" 
              className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-12 w-1 h-1 pointer-events-none"
              style={{ zIndex: -1 }}
            />
          </div>
          <p className="text-xl md:text-2xl text-gray-400 mb-12">
            {t('home.transform.subtitle')}
          </p>
          
          <div className="flex flex-row gap-3 sm:gap-6 justify-center items-center">
            <motion.button
              onClick={handleStartJourney}
              className="flex-1 sm:flex-none px-8 py-4 bg-white rounded-lg text-black font-bold text-sm sm:text-xl hover:bg-gray-200 transition-all duration-300"
              whileHover={{ 
                scale: 1.05,
              }}
              whileTap={{ scale: 0.95 }}
              data-magnetic
            >
              <span className="hidden sm:inline">{t('home.transform.startJourney')}</span>
              <span className="sm:hidden">{t('home.transform.start')}</span>
            </motion.button>
            
            <motion.button
              onClick={handleExploreFeatures}
              className="flex-1 sm:flex-none px-8 py-4 border border-white/20 rounded-lg text-white font-bold text-sm sm:text-xl hover:bg-white/10 transition-all duration-300"
              whileHover={{ 
                scale: 1.05,
              }}
              whileTap={{ scale: 0.95 }}
              data-magnetic
            >
              <span className="hidden sm:inline">{t('home.transform.exploreFeatures')}</span>
              <span className="sm:hidden">{t('home.transform.explore')}</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const Home: React.FC = () => {
  const { t } = useLanguage();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Add smooth scrolling behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <ModelPositionProvider>
      <MatrixEduLanding />
      <Footer />
    </ModelPositionProvider>
  );
};

export default Home; 