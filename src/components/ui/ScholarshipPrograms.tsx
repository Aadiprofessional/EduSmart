import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaGraduationCap, FaGlobe, FaAward } from 'react-icons/fa';
import IconComponent from './IconComponent';
import AnimatedSection from './AnimatedSection';
import { useLanguage } from '../../utils/LanguageContext';

const ScholarshipPrograms: React.FC = () => {
  const { t } = useLanguage();

  const scholarships = [
    {
      icon: FaGraduationCap,
      title: 'Merit-Based Scholarships',
      description: 'Scholarships awarded based on academic excellence and achievements.',
      amount: 'Up to $50,000',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: FaGlobe,
      title: 'International Student Scholarships',
      description: 'Special funding opportunities for international students.',
      amount: 'Up to $30,000',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: FaAward,
      title: 'Need-Based Financial Aid',
      description: 'Financial assistance based on demonstrated financial need.',
      amount: 'Up to $40,000',
      color: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <AnimatedSection direction="up">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-teal-800 mb-4">
              {t('scholarshipPrograms.title')}
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {t('scholarshipPrograms.subtitle')}
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {scholarships.map((scholarship, index) => (
            <AnimatedSection key={index} direction="up" delay={0.1 * index}>
              <motion.div
                className="bg-white rounded-lg shadow-lg overflow-hidden h-full"
                whileHover={{ 
                  y: -10,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className={`bg-gradient-to-r ${scholarship.color} p-6 text-white`}>
                  <motion.div 
                    className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <IconComponent icon={scholarship.icon} className="h-8 w-8" />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-2">{scholarship.title}</h3>
                  <div className="text-2xl font-bold">{scholarship.amount}</div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-6">{scholarship.description}</p>
                  <motion.button
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {t('scholarshipPrograms.applyButton')}
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
                to="/scholarships"
                className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-8 rounded-lg transition-colors"
              >
                {t('scholarshipPrograms.exploreButton')}
              </Link>
            </motion.div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default ScholarshipPrograms; 