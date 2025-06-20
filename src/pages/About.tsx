import React, { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { motion } from 'framer-motion';
import AnimatedSection from '../components/ui/AnimatedSection';
import IconComponent from '../components/ui/IconComponent';
import { useLanguage } from '../utils/LanguageContext';
import { FaRocket, FaBrain, FaGlobe, FaCode, FaAtom, FaLock } from 'react-icons/fa';

const About: React.FC = () => {
  const { t } = useLanguage();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Track mouse position for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const FloatingParticle = ({ delay = 0, size = 4, color = "bg-cyan-400" }) => (
    <motion.div
      className={`absolute ${color} rounded-full opacity-30`}
      style={{
        width: size,
        height: size,
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%'
      }}
      animate={{
        y: [0, -30, 0],
        x: [0, 15, 0],
        opacity: [0.3, 0.8, 0.3]
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        repeat: Infinity,
        delay: delay
      }}
    />
  );

  const HolographicCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <motion.div
      className={`relative group ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-lg transition-all duration-300" />
      <div className="relative bg-gray-900/50 backdrop-blur-xl border border-cyan-400/30 rounded-2xl p-6 group-hover:border-cyan-400/60 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 to-purple-400/5 rounded-2xl" />
        {children}
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white overflow-hidden">
      <Header />
      
      {/* Floating Particles Background */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <FloatingParticle 
            key={i} 
            delay={i * 0.2} 
            size={Math.random() * 6 + 2}
            color={['bg-cyan-400', 'bg-purple-400', 'bg-pink-400', 'bg-blue-400'][Math.floor(Math.random() * 4)]}
          />
        ))}
      </div>

      <main className="flex-grow relative">
        {/* Hero Section with Cyberpunk Design */}
        <motion.div 
          className="relative py-32 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {/* Animated Grid Background */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }} />
          </div>

          {/* Dynamic Background Elements */}
          <motion.div 
            className="absolute w-96 h-96 rounded-full opacity-10"
            style={{ 
              background: 'linear-gradient(45deg, #06b6d4, #8b5cf6)',
              filter: 'blur(80px)',
              top: '10%',
              right: '10%'
            }}
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          
          <motion.div 
            className="absolute w-64 h-64 rounded-full opacity-10"
            style={{ 
              background: 'linear-gradient(135deg, #ec4899, #f59e0b)',
              filter: 'blur(60px)',
              bottom: '20%',
              left: '5%'
            }}
            animate={{
              scale: [1, 1.3, 1],
              x: [0, 50, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />

          {/* Mouse-following spotlight effect */}
          <motion.div
            className="absolute w-96 h-96 rounded-full opacity-5 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, transparent 70%)',
              left: mousePosition.x - 192,
              top: mousePosition.y - 192,
            }}
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
          />
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              className="text-center max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.h1 
                className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  backgroundSize: '200% 100%'
                }}
              >
                {t('about.title')}
              </motion.h1>
              
              <motion.p 
                className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Revolutionizing education through{' '}
                <span className="text-cyan-400 font-semibold">AI-powered learning</span> and{' '}
                <span className="text-purple-400 font-semibold">intelligent educational tools</span>
              </motion.p>

              <motion.div
                className="flex flex-wrap justify-center gap-4 text-sm text-cyan-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                {['AI Tutoring', 'University Matching', 'Application Tracking', 'Content Generation', 'Document Analysis'].map((tech, index) => (
                  <motion.span
                    key={tech}
                    className="px-4 py-2 bg-cyan-400/10 border border-cyan-400/30 rounded-full"
                    whileHover={{ scale: 1.1, borderColor: 'rgba(6, 182, 212, 0.6)' }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    {tech}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Mission Section with Holographic Design */}
        <AnimatedSection>
          <section className="py-24 relative">
            <div className="container mx-auto px-4">
              <motion.div
                className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <motion.div variants={cardVariants}>
                  <HolographicCard>
                    <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                      Our Mission
                    </h2>
                    <div className="space-y-4 text-gray-300 leading-relaxed">
                      <p>
                        {t('about.description')}
                      </p>
                      <p>
                        MatrixEdu harnesses the power of <span className="text-cyan-400 font-semibold">artificial intelligence</span> to 
                        revolutionize how students discover universities, track applications, and enhance their academic journey through 
                        <span className="text-purple-400 font-semibold"> intelligent tutoring systems</span>.
                      </p>
                      <p>
                        Our platform provides <span className="text-pink-400 font-semibold">comprehensive educational tools</span> including 
                        AI-powered content writing, document analysis, citation generation, flashcard creation, and personalized learning 
                        experiences that adapt to each student's unique needs and goals.
                      </p>
                    </div>
                    
                    {/* Animated Progress Bars */}
                    <div className="mt-8 space-y-4">
                      {[
                        { label: 'AI Accuracy', value: 96 },
                        { label: 'Student Success Rate', value: 94 },
                        { label: 'University Match Precision', value: 98 }
                      ].map((stat, index) => (
                        <motion.div
                          key={stat.label}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.2 }}
                          viewport={{ once: true }}
                        >
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-400">{stat.label}</span>
                            <span className="text-cyan-400">{stat.value}%</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-cyan-400 to-purple-400"
                              initial={{ width: 0 }}
                              whileInView={{ width: `${stat.value}%` }}
                              transition={{ duration: 1.5, delay: index * 0.2 }}
                              viewport={{ once: true }}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </HolographicCard>
                </motion.div>

                <motion.div variants={cardVariants}>
                  <HolographicCard>
                    <div className="relative overflow-hidden rounded-xl">
                      <motion.img 
                        src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80" 
                        alt="AI-Powered Education Technology" 
                        className="w-full h-64 object-cover"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.4 }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
                      
                      {/* Overlay Tech Elements */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          className="text-6xl text-cyan-400 opacity-20"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        >
                          <IconComponent icon={FaAtom} />
                        </motion.div>
                      </div>
                    </div>
                  </HolographicCard>
                </motion.div>
              </motion.div>
            </div>
          </section>
        </AnimatedSection>

        {/* Technology Showcase */}
        <AnimatedSection>
          <section className="py-24 relative">
            <div className="container mx-auto px-4">
              <motion.h2 
                className="text-5xl font-bold text-center mb-16 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                Core Platform Features
              </motion.h2>
              
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {[
                  {
                    icon: FaBrain,
                    title: "AI Tutor Chat",
                    description: "Interactive AI tutoring system with image analysis capabilities, providing personalized learning assistance across all subjects.",
                    color: "from-cyan-400 to-blue-500"
                  },
                  {
                    icon: FaRocket,
                    title: "University Database",
                    description: "Comprehensive global university database with AI-powered matching based on your academic profile and preferences.",
                    color: "from-purple-400 to-pink-500"
                  },
                  {
                    icon: FaAtom,
                    title: "Application Tracker",
                    description: "Smart application management system to track deadlines, requirements, and status across multiple university applications.",
                    color: "from-pink-400 to-red-500"
                  },
                  {
                    icon: FaGlobe,
                    title: "Content Writer",
                    description: "AI-powered content generation tool for essays, personal statements, and academic writing with intelligent suggestions.",
                    color: "from-green-400 to-cyan-500"
                  },
                  {
                    icon: FaCode,
                    title: "Document Analysis",
                    description: "Advanced OCR and grammar checking system that analyzes documents for errors and provides intelligent corrections.",
                    color: "from-yellow-400 to-orange-500"
                  },
                  {
                    icon: FaLock,
                    title: "Citation Generator",
                    description: "Automated citation generation in multiple formats (APA, MLA, Chicago) with URL analysis and bibliography management.",
                    color: "from-indigo-400 to-purple-500"
                  }
                ].map((tech, index) => (
                  <motion.div
                    key={tech.title}
                    variants={cardVariants}
                    whileHover={{ y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <HolographicCard className="h-full">
                      <motion.div
                        className={`w-16 h-16 rounded-xl bg-gradient-to-r ${tech.color} flex items-center justify-center mb-6 mx-auto`}
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                      >
                        <IconComponent icon={tech.icon} className="text-2xl text-white" />
                      </motion.div>
                      
                      <h3 className="text-xl font-bold text-center mb-4 text-white">
                        {tech.title}
                      </h3>
                      
                      <p className="text-gray-300 text-center leading-relaxed">
                        {tech.description}
                      </p>
                      
                      {/* Animated border effect */}
                      <motion.div
                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          background: `conic-gradient(from 0deg, transparent 0deg, rgba(6, 182, 212, 0.3) 90deg, transparent 180deg, rgba(147, 51, 234, 0.3) 270deg, transparent 360deg)`,
                          padding: '1px',
                        }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      />
                    </HolographicCard>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>
        </AnimatedSection>

        {/* Core Values with Futuristic Design */}
        <AnimatedSection>
          <section className="py-24 relative">
            <div className="container mx-auto px-4">
              <motion.h2 
                className="text-5xl font-bold text-center mb-16 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                Core Principles
              </motion.h2>
              
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-12"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {[
                  {
                    number: "01",
                    title: "AI-Driven Innovation",
                    description: "Leveraging cutting-edge artificial intelligence to create personalized learning experiences that adapt to each student's unique journey.",
                    gradient: "from-cyan-400 to-blue-500"
                  },
                  {
                    number: "02", 
                    title: "Educational Accessibility",
                    description: "Making quality educational resources and university guidance accessible to students worldwide, regardless of geographical or economic barriers.",
                    gradient: "from-purple-400 to-pink-500"
                  },
                  {
                    number: "03",
                    title: "Academic Excellence",
                    description: "Maintaining the highest standards through comprehensive tools for content creation, document analysis, and application management.",
                    gradient: "from-pink-400 to-red-500"
                  }
                ].map((value, index) => (
                  <motion.div
                    key={value.number}
                    variants={cardVariants}
                    className="text-center"
                  >
                    <motion.div
                      className={`w-20 h-20 rounded-full bg-gradient-to-r ${value.gradient} flex items-center justify-center mx-auto mb-6 text-white font-bold text-lg relative`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span>{value.number}</span>
                      
                      {/* Pulsing ring effect */}
                      <motion.div
                        className={`absolute inset-0 rounded-full bg-gradient-to-r ${value.gradient} opacity-30`}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </motion.div>
                    
                    <h3 className="text-2xl font-bold mb-4 text-white">
                      {value.title}
                    </h3>
                    
                    <p className="text-gray-300 leading-relaxed">
                      {value.description}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>
        </AnimatedSection>

        {/* Call to Action */}
        <AnimatedSection>
          <section className="py-24 relative">
            <div className="container mx-auto px-4 text-center">
              <motion.div
                className="max-w-4xl mx-auto"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <HolographicCard>
                  <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    Transform Your Educational Journey
                  </h2>
                  <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                    Experience the future of education with MatrixEdu's comprehensive AI-powered platform. 
                    From university discovery to application success, we're here to guide every step of your academic journey.
                  </p>
                  
                  <motion.button
                    className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full font-semibold text-white text-lg relative overflow-hidden group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = '/signup'}
                  >
                    <span className="relative z-10">Start Your Journey Today</span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      layoutId="button-bg"
                    />
                  </motion.button>
                </HolographicCard>
              </motion.div>
            </div>
          </section>
        </AnimatedSection>
      </main>
      
      <Footer />
    </div>
  );
};

export default About; 