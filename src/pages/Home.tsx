import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Hero3D from '../components/ui/Hero3D';
import FeaturedCourses3D from '../components/ui/FeaturedCourses3D';
import FeaturedResources3D from '../components/ui/FeaturedResources3D';
import FeaturedSuccessStories3D from '../components/ui/FeaturedSuccessStories3D';
import FeaturedScholarships3D from '../components/ui/FeaturedScholarships3D';
import ScrollingBalls3D from '../components/ui/ScrollingBalls3D';
import { useLanguage } from '../utils/LanguageContext';
import { ModelPositionProvider, useModelPosition } from '../utils/ModelPositionContext';

// Our Impact Section Component
const OurImpactSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { registerComponent, unregisterComponent } = useModelPosition();

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
    <section ref={sectionRef} className="py-20 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="relative">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Our Impact
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
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Transforming education through cutting-edge technology and personalized learning experiences
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { number: '50K+', label: 'Students Enrolled', color: 'from-blue-400 to-blue-600' },
            { number: '1000+', label: 'Courses Available', color: 'from-green-400 to-green-600' },
            { number: '95%', label: 'Success Rate', color: 'from-yellow-400 to-yellow-600' },
            { number: '24/7', label: 'AI Support', color: 'from-purple-400 to-purple-600' }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ 
                scale: 1.05,
                rotateY: 10
              }}
              className="group relative bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-white/30 transition-all duration-500"
              data-magnetic
              data-cursor-text="View Details"
            >
              <div className="text-center">
                <div className={`text-4xl md:text-5xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                  {stat.number}
                </div>
                <div className="text-gray-300 font-medium">
                  {stat.label}
                </div>
              </div>
              
              {/* Hover Glow Effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-10 transition-all duration-500 pointer-events-none rounded-2xl`}></div>
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

  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full filter blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="relative">
            <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Ready to Transform Your Future?
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
          <p className="text-xl md:text-2xl text-gray-300 mb-12">
            Join thousands of students who are already experiencing the future of education with EduSmart's AI-powered learning platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <motion.button
              className="px-12 py-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white font-bold text-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 25px 50px rgba(59, 130, 246, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
              data-magnetic
              data-cursor-text="Start Learning"
            >
              Start Your Journey
            </motion.button>
            
            <motion.button
              className="px-12 py-6 border-2 border-white/30 rounded-full text-white font-bold text-xl backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
              whileHover={{ 
                scale: 1.05,
                backgroundColor: "rgba(255, 255, 255, 0.1)"
              }}
              whileTap={{ scale: 0.95 }}
              data-magnetic
              data-cursor-text="Learn More"
            >
              Explore Features
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const Home: React.FC = () => {
  const { t } = useLanguage();

  useEffect(() => {
    // Add smooth scrolling behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <ModelPositionProvider>
      <div className="min-h-screen bg-black overflow-x-hidden relative">
        {/* Scrolling 3D Balls Background */}
        <ScrollingBalls3D />
        
        {/* Header */}
        <Header />
        
        {/* Main Content */}
        <main className="relative z-20">
          {/* Hero Section */}
          <Hero3D />
          
          {/* Featured Courses Section */}
          <FeaturedCourses3D />
          
          {/* Featured Resources Section */}
          <FeaturedResources3D />
          
          {/* Featured Success Stories Section */}
          <FeaturedSuccessStories3D />
          
          {/* Featured Scholarships Section */}
          <FeaturedScholarships3D />
          
          {/* Interactive Stats Section */}
          <OurImpactSection />

          {/* Call to Action Section */}
          <ReadyToTransformSection />
        </main>
        
        {/* Scroll to top button */}
        <motion.button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-20 right-5 z-40 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-4 rounded-full shadow-2xl hover:shadow-blue-500/25 transition-all duration-300"
          whileHover={{ scale: 1.1, rotate: 360 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
          data-magnetic
          data-cursor-text="Back to Top"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </motion.button>
        
        <Footer />
      </div>
    </ModelPositionProvider>
  );
};

export default Home; 