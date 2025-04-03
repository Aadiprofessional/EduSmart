import React from 'react';
import { Link } from 'react-router-dom';
import { FaUniversity, FaMoneyBillWave, FaGraduationCap, FaGlobeAmericas } from 'react-icons/fa';
import IconComponent from './IconComponent';
import { motion } from 'framer-motion';
import AnimatedSection from './AnimatedSection';

const AdmissionInfo: React.FC = () => {
  return (
    <section className="py-16 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <AnimatedSection direction="right" className="md:w-1/2">
            <motion.div 
              className="relative rounded-lg overflow-hidden shadow-xl"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img 
                src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                alt="Admission and Financial Aid" 
                className="w-full h-auto object-cover"
              />
              <motion.div 
                className="absolute inset-0 bg-gradient-to-tr from-teal-800/70 to-transparent flex items-center justify-center"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div 
                  className="text-white text-center p-6"
                  initial={{ y: 20, opacity: 0 }}
                  whileHover={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <IconComponent icon={FaGraduationCap} className="text-5xl mb-4 mx-auto text-orange-400" />
                  <h3 className="text-2xl font-bold mb-2">Success Awaits</h3>
                  <p className="text-white/80">Let us guide you through the admission journey</p>
                </motion.div>
              </motion.div>
            </motion.div>
          </AnimatedSection>
          
          <AnimatedSection direction="left" className="md:w-1/2">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-3xl font-bold text-teal-800 mb-4">Admission & Aid</h2>
              <p className="text-gray-700 mb-4">
                Our comprehensive database provides detailed information on admission requirements for universities worldwide, including GPA thresholds, standardized test scores, language proficiency needs, and application deadlines.
              </p>
              <p className="text-gray-700 mb-6">
                Navigate the complex world of financial aid with our scholarship finder, tuition comparison tools, and ROI calculators. We help you discover merit-based scholarships, need-based grants, and education loans available for international students.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <motion.div 
                  className="flex items-center bg-gray-50 p-3 rounded-lg"
                  whileHover={{ y: -5, backgroundColor: "#f0fdfa" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="bg-teal-100 p-2 rounded-full mr-3">
                    <IconComponent icon={FaUniversity} className="text-teal-700 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-teal-800">10,000+</h3>
                    <p className="text-sm text-gray-600">Universities</p>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex items-center bg-gray-50 p-3 rounded-lg"
                  whileHover={{ y: -5, backgroundColor: "#fff7ed" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="bg-orange-100 p-2 rounded-full mr-3">
                    <IconComponent icon={FaMoneyBillWave} className="text-orange-500 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-teal-800">5,000+</h3>
                    <p className="text-sm text-gray-600">Scholarships</p>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex items-center bg-gray-50 p-3 rounded-lg"
                  whileHover={{ y: -5, backgroundColor: "#f0fdfa" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="bg-teal-100 p-2 rounded-full mr-3">
                    <IconComponent icon={FaGraduationCap} className="text-teal-700 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-teal-800">2,500+</h3>
                    <p className="text-sm text-gray-600">Programs</p>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex items-center bg-gray-50 p-3 rounded-lg"
                  whileHover={{ y: -5, backgroundColor: "#fff7ed" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="bg-orange-100 p-2 rounded-full mr-3">
                    <IconComponent icon={FaGlobeAmericas} className="text-orange-500 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-teal-800">95+</h3>
                    <p className="text-sm text-gray-600">Countries</p>
                  </div>
                </motion.div>
              </div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block"
              >
                <Link
                  to="/admission"
                  className="inline-block bg-teal-700 hover:bg-teal-800 text-white font-medium py-3 px-8 rounded-lg transition-colors"
                >
                  Explore Options
                </Link>
              </motion.div>
            </motion.div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default AdmissionInfo; 