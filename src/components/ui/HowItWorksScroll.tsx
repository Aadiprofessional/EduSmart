import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { FaUpload, FaBolt, FaBrain, FaPencilAlt, FaSitemap, FaCalendarAlt, FaFileAlt } from 'react-icons/fa';
import { useModelPosition } from '../../utils/ModelPositionContext';
import { useLanguage } from '../../utils/LanguageContext';

interface StepItem {
  id: number;
  title: string;
  description: string;
  videoPlaceholder: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const Step = ({ step, index, isActive, t }: { step: StepItem, index: number, isActive: boolean, t: (key: string) => string }) => {
  const isEven = index % 2 === 0;

  return (
    <div className={`flex flex-col md:flex-row items-center justify-between w-full mb-24 md:mb-32 relative ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
      
      {/* Content Side (Text) */}
      <div className={`w-full md:w-[45%] pl-12 md:pl-0 ${isEven ? 'md:text-right md:pr-12' : 'md:text-left md:pl-12'} mb-8 md:mb-0`}>
        <motion.div
          initial={{ opacity: 0, x: isEven ? -50 : 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative"
        >
          <div className={`flex items-center gap-4 mb-4 justify-start ${isEven ? 'md:justify-end' : 'md:justify-start'}`}>
             <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
                <step.icon size={24} />
             </div>
             <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white font-permanent-marker">{step.title}</h3>
          </div>
          <p className={`text-lg text-gray-600 dark:text-gray-400 leading-relaxed ${isEven ? 'md:text-right' : 'md:text-left'} text-left`}>
            {step.description}
          </p>
        </motion.div>
      </div>

      {/* Center Point */}
      <div className="hidden md:block absolute left-1/2 top-0 md:top-1/2 -translate-x-1/2 md:-translate-y-1/2 z-10 mt-2 md:mt-0">
        <motion.div 
          animate={{ 
            scale: isActive ? 1.5 : 1,
            backgroundColor: isActive ? '#6366f1' : '#e5e7eb',
            borderColor: isActive ? '#818cf8' : '#d1d5db'
          }}
          className="w-6 h-6 rounded-full border-4 transition-colors duration-300 shadow-lg"
        />
      </div>

      {/* Media Side (Video/Visual) */}
      <div className={`w-full md:w-[45%] pl-12 md:pl-0 ${isEven ? 'md:pl-12' : 'md:pr-12'}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className={`relative rounded-2xl overflow-hidden shadow-2xl border-4 ${isActive ? 'border-indigo-500 shadow-indigo-500/20' : 'border-gray-200 dark:border-gray-800'} transition-all duration-500 aspect-video bg-gray-100 dark:bg-gray-900 flex items-center justify-center group`}
        >
           {/* Placeholder for Video - Replace with actual <video> tag later */}
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white">
              {!isActive && (
                <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center backdrop-blur-sm transition-all duration-500">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                        <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[20px] border-l-white border-b-[10px] border-b-transparent ml-1"></div>
                    </div>
                </div>
              )}
              
              <div className={`text-center z-0 transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-50'}`}>
                  <step.icon size={48} className="mx-auto mb-4 text-indigo-400" />
                  <p className="font-bold text-lg mb-2">{step.videoPlaceholder}</p>
                  <p className="text-xs text-gray-400">{t('howItWorks.videoSimulation')}</p>
              </div>

              {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                      <motion.div 
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 5, ease: "linear", repeat: Infinity }}
                        className="h-full bg-indigo-500"
                      />
                  </div>
              )}
           </div>
        </motion.div>
      </div>
    </div>
  );
};

const HowItWorksScroll: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const { registerComponent } = useModelPosition();
  const { t } = useLanguage();

  const steps: StepItem[] = [
    {
      id: 1,
      title: t('howItWorks.steps.0.title'),
      description: t('howItWorks.steps.0.description'),
      icon: FaUpload,
      videoPlaceholder: t('howItWorks.steps.0.videoPlaceholder')
    },
    {
      id: 2,
      title: t('howItWorks.steps.1.title'),
      description: t('howItWorks.steps.1.description'),
      icon: FaBolt,
      videoPlaceholder: t('howItWorks.steps.1.videoPlaceholder')
    },
    {
      id: 3,
      title: t('howItWorks.steps.2.title'),
      description: t('howItWorks.steps.2.description'),
      icon: FaBrain,
      videoPlaceholder: t('howItWorks.steps.2.videoPlaceholder')
    },
    {
      id: 4,
      title: t('howItWorks.steps.3.title'),
      description: t('howItWorks.steps.3.description'),
      icon: FaPencilAlt,
      videoPlaceholder: t('howItWorks.steps.3.videoPlaceholder')
    },
    {
      id: 5,
      title: t('howItWorks.steps.4.title'),
      description: t('howItWorks.steps.4.description'),
      icon: FaSitemap,
      videoPlaceholder: t('howItWorks.steps.4.videoPlaceholder')
    },
    {
      id: 6,
      title: t('howItWorks.steps.5.title'),
      description: t('howItWorks.steps.5.description'),
      icon: FaCalendarAlt,
      videoPlaceholder: t('howItWorks.steps.5.videoPlaceholder')
    },
    {
      id: 7,
      title: t('howItWorks.steps.6.title'),
      description: t('howItWorks.steps.6.description'),
      icon: FaFileAlt,
      videoPlaceholder: t('howItWorks.steps.6.videoPlaceholder')
    }
  ];

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // 3D Model Positions for each step
  const stepPositions = [
    // Step 1: Upload (Text Left, Video Right)
    // Pencil near text (Left), others hidden
    {
      pencil: { x: -600, y: 0, z: 0, scale: 2.5, rotation: { x: 0.2, y: 0.3, z: 0 }, visible: true },
      eraser: { x: 700, y: -200, z: -2, scale: 1.5, visible: false },
      sharpener: { x: 600, y: 300, z: -1, scale: 0.03, visible: false }
    },
    // Step 2: Flashcards (Text Right, Video Left)
    // Pencil near text (Right), Sharpener appears
    {
      pencil: { x: 600, y: 100, z: 0, scale: 2.5, rotation: { x: 0, y: -0.5, z: 0.1 }, visible: true },
      eraser: { x: -700, y: -200, z: -2, scale: 1.5, visible: false },
      sharpener: { x: 500, y: -100, z: -1, scale: 0.03, visible: true }
    },
    // Step 3: Quizzes (Text Left, Video Right)
    // Eraser appears on Left
    {
      pencil: { x: -600, y: -200, z: 0, scale: 2.5, rotation: { x: 0.1, y: 0.4, z: 0 }, visible: true },
      eraser: { x: -500, y: 100, z: 0, scale: 1.6, visible: true },
      sharpener: { x: 600, y: 300, z: -1, scale: 0.03, visible: false }
    },
    // Step 4: Tests (Text Right, Video Left)
    // All visible
    {
      pencil: { x: 600, y: 0, z: 0, scale: 2.5, rotation: { x: 0, y: 0, z: 0.1 }, visible: true },
      eraser: { x: 700, y: 200, z: -1, scale: 1.5, visible: true },
      sharpener: { x: 500, y: -200, z: 0, scale: 0.03, visible: true }
    },
    // Step 5: Mind Maps (Text Left, Video Right)
    {
      pencil: { x: -600, y: 100, z: 0, scale: 2.5, rotation: { x: 0.2, y: 0.3, z: -0.1 }, visible: true },
      eraser: { x: -700, y: -100, z: -2, scale: 1.5, visible: true },
      sharpener: { x: 600, y: 200, z: -1, scale: 0.03, visible: true }
    },
    // Step 6: Study Planner (Text Right, Video Left)
    {
      pencil: { x: 600, y: -150, z: 0, scale: 2.5, rotation: { x: 0, y: -0.4, z: 0.1 }, visible: true },
      eraser: { x: 700, y: 250, z: -1, scale: 1.5, visible: true },
      sharpener: { x: -500, y: -100, z: -1, scale: 0.03, visible: true }
    },
    // Step 7: Notes (Text Left, Video Right)
    {
      pencil: { x: -600, y: 50, z: 0, scale: 2.5, rotation: { x: 0.1, y: 0.2, z: 0 }, visible: true },
      eraser: { x: -500, y: 300, z: -1, scale: 1.5, visible: true },
      sharpener: { x: 600, y: -200, z: -1, scale: 0.03, visible: true }
    }
  ];

  // Update 3D model positions when active step changes
  useEffect(() => {
    if (containerRef.current) {
      registerComponent('how-it-works', containerRef.current, stepPositions[activeStep]);
    }
  }, [activeStep, registerComponent]);

  // Track active step based on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const stepsElements = containerRef.current.querySelectorAll('.step-container');
      const viewportCenter = window.innerHeight / 2;

      stepsElements.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        // If the element is near the center of the viewport
        if (rect.top <= viewportCenter && rect.bottom >= viewportCenter) {
          setActiveStep(index);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section ref={containerRef} className="py-24 relative bg-white dark:bg-[#050505] overflow-hidden">
      <div className="container mx-auto px-4 relative">
        
        {/* Section Header */}
        <div className="text-center mb-24 relative z-10">
            <h2 className="text-4xl md:text-6xl font-permanent-marker mb-6 text-gray-900 dark:text-white">
                {t('howItWorks.title')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                {t('howItWorks.subtitle')}
            </p>
        </div>

        {/* Central Progress Line */}
        <div className="absolute left-4 md:left-1/2 top-48 bottom-24 w-1.5 bg-gray-100 dark:bg-gray-800 -translate-x-1/2 rounded-full overflow-hidden">
            <motion.div 
                style={{ scaleY, transformOrigin: "top" }} 
                className="w-full h-full bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500"
            />
        </div>

        {/* Steps Container */}
        <div className="relative z-10 mt-12">
            {steps.map((step, index) => (
                <div key={step.id} className="step-container min-h-[50vh] flex items-center">
                    <Step step={step} index={index} isActive={activeStep === index} t={t} />
                </div>
            ))}
        </div>

      </div>
    </section>
  );
};

export default HowItWorksScroll;
