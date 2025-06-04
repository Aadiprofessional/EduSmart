import React from 'react';
import { motion } from 'framer-motion';
import { AiOutlineRobot, AiOutlineDatabase, AiOutlineTrophy, AiOutlineTeam } from 'react-icons/ai';
import IconComponent from './IconComponent';
import { useLanguage } from '../../utils/LanguageContext';

const BestFeatures: React.FC = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: AiOutlineRobot,
      title: t('bestFeatures.features.aiRecommendations.title'),
      description: t('bestFeatures.features.aiRecommendations.description'),
    },
    {
      icon: AiOutlineDatabase,
      title: t('bestFeatures.features.comprehensiveDatabase.title'),
      description: t('bestFeatures.features.comprehensiveDatabase.description'),
    },
    {
      icon: AiOutlineTrophy,
      title: t('bestFeatures.features.successStories.title'),
      description: t('bestFeatures.features.successStories.description'),
    },
    {
      icon: AiOutlineTeam,
      title: t('bestFeatures.features.expertGuidance.title'),
      description: t('bestFeatures.features.expertGuidance.description'),
    },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.h2 
          className="text-3xl font-bold text-center text-teal-800 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {t('bestFeatures.title')}
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <motion.div 
                className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 text-orange-500 rounded-full mb-4"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <IconComponent icon={feature.icon} className="h-8 w-8" />
              </motion.div>
              <h3 className="text-xl font-semibold text-teal-700 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BestFeatures; 