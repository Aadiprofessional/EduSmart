import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fadeIn, staggerContainer } from '../../utils/animations';
import { useLanguage } from '../../utils/LanguageContext';
import AnimatedSection from './AnimatedSection';

const AboutSection: React.FC = () => {
  const { t } = useLanguage();

  const stats = [
    { number: '15K+', label: t('stats.studentsEnrolled') },
    { number: '95%', label: t('stats.successRate') },
    { number: '200+', label: t('stats.expertInstructors') },
    { number: '100+', label: t('stats.globalPartners') },
  ];

  return (
    <section className="py-20 bg-white">
      <motion.div 
        variants={staggerContainer(0.1, 0.1)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
        className="container mx-auto px-4"
      >
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <motion.div 
            variants={fadeIn('right', 0.2)}
            className="lg:w-1/2 relative"
          >
            <motion.div 
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="rounded-lg overflow-hidden shadow-xl"
            >
              <img 
                src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                alt="Students collaborating" 
                className="w-full h-auto object-cover"
              />
            </motion.div>
            
            {/* Decorative elements */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="absolute -bottom-6 -left-6 w-24 h-24 bg-teal-500 rounded-lg z-[-1]"
            />
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="absolute -top-6 -right-6 w-32 h-32 bg-orange-400 rounded-full z-[-1]"
            />
          </motion.div>

          <motion.div 
            variants={fadeIn('left', 0.3)}
            className="lg:w-1/2"
          >
            <AnimatedSection direction="up" delay={0.1}>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-gray-800">
                {t('about.title')}
              </h2>
            </AnimatedSection>
            
            <AnimatedSection direction="up" delay={0.2}>
              <p className="text-gray-600 mb-6 text-lg">
                {t('about.description')}
              </p>
            </AnimatedSection>
            
            <AnimatedSection direction="up" delay={0.3}>
              <p className="text-gray-600 mb-8 text-lg">
                {t('about.subtitle')}
              </p>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={0.4}>
              <Link 
                to="/about"
                className="inline-block bg-teal-700 hover:bg-teal-800 text-white font-medium py-3 px-8 rounded-lg transition-colors mb-12"
              >
                {t('common.readMore')}
              </Link>
            </AnimatedSection>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <AnimatedSection key={index} direction="up" delay={0.5 + index * 0.1}>
                  <div className="text-center hover-float">
                    <h3 className="text-3xl font-bold text-orange-500 mb-2">{stat.number}</h3>
                    <p className="text-gray-500">{stat.label}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default AboutSection; 