import React from 'react';
import { FaRobot, FaChartLine, FaUserGraduate } from 'react-icons/fa';
import IconComponent from './IconComponent';
import { motion } from 'framer-motion';
import AnimatedSection from './AnimatedSection';

const BestFeatures: React.FC = () => {
  const features = [
    {
      id: 1,
      icon: <IconComponent icon={FaRobot} className="text-orange-500 text-4xl" />,
      title: 'AI-Powered University Matching',
      description: 'Find your ideal university with AI-driven recommendations tailored to your grades, budget, and career goals.'
    },
    {
      id: 2,
      icon: <IconComponent icon={FaUserGraduate} className="text-orange-500 text-4xl" />,
      title: 'Real Success Stories & Case Studies',
      description: 'Get inspired by students who overcame challenges and secured admission to top universities, with insights into their strategies.'
    },
    {
      id: 3,
      icon: <IconComponent icon={FaChartLine} className="text-orange-500 text-4xl" />,
      title: 'Smart Application Tracking',
      description: 'Keep your application process organized with real-time deadline reminders, document tracking, and offer status updates.'
    }
  ];

  return (
    <section className="py-16 bg-teal-900 text-white overflow-hidden">
      <div className="container mx-auto px-4 relative">
        {/* Decorative elements */}
        <motion.div 
          animate={{ 
            rotate: 360,
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 20,
            ease: "linear"
          }}
          className="absolute top-10 right-10 w-64 h-64 bg-teal-700 rounded-full opacity-10 blur-xl"
          style={{ transformOrigin: 'center center' }}
        />
        
        <AnimatedSection direction="up">
          <h2 className="text-3xl font-bold mb-12 text-center">Our Best Features</h2>
        </AnimatedSection>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {features.map((feature, index) => (
            <AnimatedSection key={feature.id} direction="up" delay={0.2 * index}>
              <motion.div 
                className="flex flex-col items-start p-6 border-l-4 border-orange-500 bg-gradient-to-b from-teal-800 to-teal-900 rounded-r-lg h-full"
                whileHover={{ 
                  x: 5,
                  boxShadow: "0 15px 30px -10px rgba(0, 0, 0, 0.3)"
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div 
                  className="mb-4"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BestFeatures; 