import React, { useEffect, useState } from 'react';
import { Header } from '../components/layout';
import Footer from '../components/layout/Footer';
import { motion } from 'framer-motion';
import AnimatedSection from '../components/ui/AnimatedSection';
import IconComponent from '../components/ui/IconComponent';
import { useLanguage } from '../utils/LanguageContext';
import { FaRocket, FaBrain, FaGlobe, FaCode, FaAtom, FaLock, FaUsers, FaLightbulb, FaShieldAlt } from 'react-icons/fa';

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
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: [0, 0, 0.58, 1] as const }
    }
  };

  const FloatingParticle = ({ delay = 0, size = 4, color = "bg-white" }) => (
    <motion.div
      className={`absolute ${color} rounded-full opacity-20`}
      style={{
        width: size,
        height: size,
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%'
      }}
      animate={{
        y: [0, -100],
        opacity: [0, 0.5, 0]
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        repeat: Infinity,
        delay: delay,
        ease: "linear"
      }}
    />
  );

  const HolographicCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <motion.div
      className={`relative group ${className} h-full`}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
      <div className="relative h-full bg-[#0A0A0A] backdrop-blur-xl border border-white/5 rounded-2xl p-8 group-hover:border-purple-500/30 transition-all duration-300 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-purple-500 selection:text-white">
      <Header />
      
      {/* Floating Particles Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {[...Array(40)].map((_, i) => (
          <FloatingParticle 
            key={i} 
            delay={i * 0.2} 
            size={Math.random() * 3 + 1}
            color="bg-white"
          />
        ))}
      </div>

      <main className="flex-grow relative z-10 pt-20">
        {/* Hero Section */}
        <div className="relative py-32 overflow-hidden">
          {/* Spotlight Effect */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              background: `radial-gradient(circle 800px at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.15), transparent 80%)`
            }}
          />

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              className="text-center max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="inline-block mb-6 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm font-medium backdrop-blur-sm"
              >
                {t('about.badge')}
              </motion.div>
              
              <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40">
                {t('about.title') || "Redefining Education with AI"}
              </h1>
              
              <p className="text-xl text-gray-400 mb-12 leading-relaxed max-w-2xl mx-auto">
                {t('about.heroDescription')}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Mission Section */}
        <AnimatedSection>
          <section className="py-24 relative border-t border-white/5">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
                    {t('about.missionTitle')}
                  </h2>
                  <div className="space-y-6 text-lg text-gray-400 leading-relaxed">
                    <p>
                      {t('about.description') || "At MatrixEdu, our mission is to make effective learning simple, structured, and accessible. We bring core study workflows into one place so students can spend more time learning and less time switching tools."}
                    </p>
                    <p>
                      {t('about.missionDescription2')}
                    </p>
                    <div className="pt-6 grid grid-cols-2 gap-8">
                      <div>
                        <div className="text-3xl font-bold text-white mb-2">6</div>
                        <div className="text-sm text-gray-500 uppercase tracking-wider">{t('about.stats.coreAiTools')}</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-white mb-2">1</div>
                        <div className="text-sm text-gray-500 uppercase tracking-wider">{t('about.stats.unifiedWorkspace')}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  className="relative"
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-3xl rounded-full" />
                  <div className="relative bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div className="bg-[#111] p-4 rounded-xl border border-white/5">
                          <IconComponent icon={FaBrain} className="text-2xl text-purple-400 mb-3" />
                          <h3 className="text-white font-medium">{t('about.pillars.smartStudyFlow.title')}</h3>
                          <p className="text-xs text-gray-500 mt-1">{t('about.pillars.smartStudyFlow.description')}</p>
                        </div>
                        <div className="bg-[#111] p-4 rounded-xl border border-white/5 translate-x-4">
                          <IconComponent icon={FaGlobe} className="text-2xl text-blue-400 mb-3" />
                          <h3 className="text-white font-medium">{t('about.pillars.anywhereAccess.title')}</h3>
                          <p className="text-xs text-gray-500 mt-1">{t('about.pillars.anywhereAccess.description')}</p>
                        </div>
                      </div>
                      <div className="space-y-4 pt-8">
                        <div className="bg-[#111] p-4 rounded-xl border border-white/5">
                          <IconComponent icon={FaShieldAlt} className="text-2xl text-green-400 mb-3" />
                          <h3 className="text-white font-medium">{t('about.pillars.reliableWorkspace.title')}</h3>
                          <p className="text-xs text-gray-500 mt-1">{t('about.pillars.reliableWorkspace.description')}</p>
                        </div>
                        <div className="bg-[#111] p-4 rounded-xl border border-white/5 translate-x-4">
                          <IconComponent icon={FaRocket} className="text-2xl text-pink-400 mb-3" />
                          <h3 className="text-white font-medium">{t('about.pillars.fasterExecution.title')}</h3>
                          <p className="text-xs text-gray-500 mt-1">{t('about.pillars.fasterExecution.description')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Features Grid */}
        <AnimatedSection>
          <section className="py-24 relative bg-black/20">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">{t('about.platformCapabilities.title')}</h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  {t('about.platformCapabilities.subtitle')}
                </p>
              </div>
              
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {[
                  {
                    icon: FaBrain,
                    title: t('about.platformCapabilities.cards.dashboard.title'),
                    description: t('about.platformCapabilities.cards.dashboard.description')
                  },
                  {
                    icon: FaRocket,
                    title: t('about.platformCapabilities.cards.solve.title'),
                    description: t('about.platformCapabilities.cards.solve.description')
                  },
                  {
                    icon: FaCode,
                    title: t('about.platformCapabilities.cards.paperGrader.title'),
                    description: t('about.platformCapabilities.cards.paperGrader.description')
                  },
                  {
                    icon: FaLightbulb,
                    title: t('about.platformCapabilities.cards.contentWriter.title'),
                    description: t('about.platformCapabilities.cards.contentWriter.description')
                  },
                  {
                    icon: FaShieldAlt,
                    title: t('about.platformCapabilities.cards.humanizer.title'),
                    description: t('about.platformCapabilities.cards.humanizer.description')
                  },
                  {
                    icon: FaUsers,
                    title: t('about.platformCapabilities.cards.studyPlanner.title'),
                    description: t('about.platformCapabilities.cards.studyPlanner.description')
                  }
                ].map((feature, index) => (
                  <motion.div key={index} variants={cardVariants}>
                    <HolographicCard>
                      <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform duration-300">
                        <IconComponent icon={feature.icon} className="text-xl text-white" />
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </HolographicCard>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>
        </AnimatedSection>

        {/* Values Section */}
        <AnimatedSection>
          <section className="py-24 relative border-t border-white/5">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {[
                  {
                    number: "01",
                    title: t('about.values.innovation.title'),
                    desc: t('about.values.innovation.description')
                  },
                  {
                    number: "02",
                    title: t('about.values.accessibility.title'),
                    desc: t('about.values.accessibility.description')
                  },
                  {
                    number: "03",
                    title: t('about.values.excellence.title'),
                    desc: t('about.values.excellence.description')
                  }
                ].map((value, i) => (
                  <motion.div 
                    key={i}
                    className="text-center group"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.2 }}
                    viewport={{ once: true }}
                  >
                    <div className="text-6xl font-bold text-white/5 mb-6 group-hover:text-purple-500/20 transition-colors duration-300">
                      {value.number}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">{value.title}</h3>
                    <p className="text-gray-400">{value.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* CTA Section */}
        <AnimatedSection>
          <section className="py-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-purple-900/10 pointer-events-none" />
            
            <div className="container mx-auto px-4 text-center relative z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="max-w-3xl mx-auto"
              >
                <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
                  {t('about.cta.title')}
                </h2>
                <p className="text-xl text-gray-400 mb-10">
                  {t('about.cta.subtitle')}
                </p>
                <motion.button
                  className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.href = '/signup'}
                >
                  {t('about.cta.button')}
                </motion.button>
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
