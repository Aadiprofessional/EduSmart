import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedSection from './AnimatedSection';
import { FaGraduationCap, FaUniversity, FaGlobeAmericas, FaChartLine } from 'react-icons/fa';
import IconComponent from './IconComponent';

const ScholarshipPrograms: React.FC = () => {
  const scholarshipTypes = [
    {
      icon: <IconComponent icon={FaGraduationCap} />,
      title: "Merit-Based",
      count: "1,250+"
    },
    {
      icon: <IconComponent icon={FaUniversity} />,
      title: "University-Specific",
      count: "3,000+"
    },
    {
      icon: <IconComponent icon={FaGlobeAmericas} />,
      title: "International",
      count: "750+"
    },
    {
      icon: <IconComponent icon={FaChartLine} />,
      title: "Field-Specific",
      count: "1,500+"
    }
  ];
  
  return (
    <section className="py-16 bg-teal-800 text-white relative overflow-hidden">
      {/* Background decoration */}
      <motion.div 
        className="absolute inset-0 opacity-10"
        animate={{ 
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{ 
          repeat: Infinity, 
          repeatType: "reverse", 
          duration: 20,
          ease: "linear"
        }}
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(8px)"
        }}
      />
      
      {/* Floating elements */}
      <motion.div
        className="absolute top-20 right-10 w-40 h-40 bg-orange-400 rounded-full opacity-20 blur-xl"
        animate={{ 
          y: [0, -20, 0],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 5
        }}
      />
      
      <motion.div
        className="absolute bottom-20 left-10 w-56 h-56 bg-teal-400 rounded-full opacity-20 blur-xl"
        animate={{ 
          y: [0, 20, 0],
          opacity: [0.1, 0.15, 0.1]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 7,
          delay: 1
        }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <AnimatedSection direction="up">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Scholarship Programs</h2>
            <p className="text-lg text-gray-300">
              Discover global scholarship opportunities tailored to your academic profile. Our comprehensive database features merit-based, need-based, and specialized scholarships to help fund your international education.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block mt-8"
            >
              <Link 
                to="/scholarships"
                className="inline-block bg-orange-500 hover:bg-orange-600 text-white py-3 px-8 rounded-lg transition-colors"
              >
                Explore Scholarships
              </Link>
            </motion.div>
          </div>
        </AnimatedSection>
        
        <AnimatedSection direction="up" delay={0.2}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {scholarshipTypes.map((type, index) => (
              <motion.div 
                key={index}
                whileHover={{ y: -10, boxShadow: "0 15px 30px -10px rgba(0, 0, 0, 0.3)" }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center"
              >
                <motion.div 
                  className="text-3xl text-orange-400 mb-3 mx-auto"
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {type.icon}
                </motion.div>
                <h3 className="text-xl font-semibold text-white mb-1">
                  {type.title}
                </h3>
                <p className="text-teal-100 font-semibold">{type.count}</p>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default ScholarshipPrograms; 