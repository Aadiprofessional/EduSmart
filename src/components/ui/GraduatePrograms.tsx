import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaGraduationCap, FaUserGraduate, FaBriefcase } from 'react-icons/fa';
import IconComponent from './IconComponent';
import AnimatedSection from './AnimatedSection';
import { useLanguage } from '../../utils/LanguageContext';

const GraduatePrograms: React.FC = () => {
  const { t } = useLanguage();

  const programs = [
    {
      icon: FaGraduationCap,
      title: t('graduatePrograms.programs.masters.title'),
      description: t('graduatePrograms.programs.masters.description'),
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      icon: FaUserGraduate,
      title: t('graduatePrograms.programs.phd.title'),
      description: t('graduatePrograms.programs.phd.description'),
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600'
    },
    {
      icon: FaBriefcase,
      title: t('graduatePrograms.programs.professional.title'),
      description: t('graduatePrograms.programs.professional.description'),
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <AnimatedSection direction="up">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-teal-800 mb-4">
              {t('graduatePrograms.title')}
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {t('graduatePrograms.subtitle')}
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {programs.map((program, index) => (
            <AnimatedSection key={index} direction="up" delay={0.1 * index}>
              <motion.div
                className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100 h-full"
                whileHover={{ 
                  y: -10,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className={`${program.color} p-6 text-white`}>
                  <motion.div 
                    className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <IconComponent icon={program.icon} className="h-8 w-8" />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-2">{program.title}</h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-6">{program.description}</p>
                  <motion.button
                    className={`w-full ${program.color} ${program.hoverColor} text-white font-medium py-2 px-4 rounded-lg transition-colors`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {t('common.readMore')}
                  </motion.button>
                </div>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection direction="up" delay={0.4}>
          <div className="text-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/courses"
                className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-8 rounded-lg transition-colors"
              >
                {t('graduatePrograms.viewAllButton')}
              </Link>
            </motion.div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default GraduatePrograms; 