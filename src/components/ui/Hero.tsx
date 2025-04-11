import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fadeIn, slideIn } from '../../utils/animations';

const Hero: React.FC = () => {
  return (
    <section className="bg-gradient-to-r from-teal-700 to-teal-900 text-white py-16 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <motion.div 
            variants={fadeIn('right', 0.3)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            className="md:w-1/2 mb-10 md:mb-0"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Find Your Dream University with AI-Powered Guidance
            </h1>
            <p className="text-xl mb-8">
              Explore top universities, personalized recommendations, and real success stories—all driven by AI to simplify your journey to higher education.
            </p>
            <div className="flex flex-row space-x-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-1/2 md:w-auto">
                <Link
                  to="/courses"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-lg transition-colors text-center block btn-pulse"
                >
                  Explore
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-1/2 md:w-auto">
                <Link
                  to="/about"
                  className="bg-transparent border-2 border-white hover:bg-white hover:text-teal-800 font-medium py-3 px-6 rounded-lg transition-colors text-center block"
                >
                  Learn More
                </Link>
              </motion.div>
            </div>
          </motion.div>
          <motion.div 
            variants={fadeIn('up', 0.4)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            className="md:w-1/2 flex justify-center"
          >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-80 flex items-center justify-center overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" 
                alt="University education illustration" 
                className="h-full w-full object-cover"
              />
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Floating elements for futuristic feel */}
      <motion.div 
        animate={{ 
          y: [0, -10, 0], 
          opacity: [0.3, 0.8, 0.3] 
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 3,
          ease: "easeInOut"
        }}
        className="absolute top-20 left-10 w-20 h-20 bg-teal-300 rounded-full opacity-30 blur-xl"
      />
      <motion.div 
        animate={{ 
          y: [0, 10, 0], 
          opacity: [0.2, 0.6, 0.2] 
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 4,
          ease: "easeInOut",
          delay: 1
        }}
        className="absolute bottom-10 right-20 w-32 h-32 bg-teal-400 rounded-full opacity-20 blur-xl"
      />
    </section>
  );
};

export default Hero; 