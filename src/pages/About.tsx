import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { motion } from 'framer-motion';
import AnimatedSection from '../components/ui/AnimatedSection';

const About: React.FC = () => {
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

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <motion.div 
          className="bg-gradient-to-r from-teal-700 to-teal-900 text-white py-16 relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Animated background elements */}
          <motion.div 
            className="absolute w-96 h-96 bg-teal-600 rounded-full opacity-10" 
            style={{ filter: 'blur(80px)', top: '-10%', right: '5%' }}
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 30, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
          <motion.div 
            className="absolute w-64 h-64 bg-orange-500 rounded-full opacity-10" 
            style={{ filter: 'blur(60px)', bottom: '-5%', left: '10%' }}
            animate={{
              scale: [1, 1.1, 1],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.h1 
              className="text-4xl font-bold mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              About EduSmart
            </motion.h1>
            <motion.p 
              className="text-xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              We're transforming the educational experience through AI-powered solutions
            </motion.p>
          </div>
        </motion.div>
        
        <AnimatedSection>
          <section className="py-16">
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold text-teal-700 mb-6">Our Mission</h2>
                <p className="text-gray-700 mb-4">
                  At EduSmart, our mission is to make quality education accessible to everyone through cutting-edge 
                  technology and personalized learning experiences.
                </p>
                <p className="text-gray-700 mb-4">
                  We believe that every student deserves an educational journey tailored to their unique needs and learning style.
                  Our AI-powered platform adapts to individual students, providing recommendations, resources, and guidance
                  that help them achieve their academic goals.
                </p>
                <p className="text-gray-700">
                  Through innovative technology and a dedication to educational excellence, we're building a brighter future 
                  where learning knows no boundaries.
                </p>
              </motion.div>
              <motion.div 
                className="rounded-lg overflow-hidden shadow-lg"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80" 
                  alt="Students collaborating" 
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>
          </section>
        </AnimatedSection>
        
        <AnimatedSection>
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <motion.h2 
                className="text-3xl font-bold text-teal-700 mb-12 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                Our Team
              </motion.h2>
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <motion.div 
                  className="bg-white p-6 rounded-lg shadow-md text-center"
                  variants={itemVariants}
                  whileHover={{ y: -10, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                >
                  <div className="w-32 h-32 rounded-full mx-auto mb-4 overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&h=150&q=80" 
                      alt="Team Member 1" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-teal-700">Alex Johnson</h3>
                  <p className="text-gray-600 mb-2">CEO & Co-Founder</p>
                  <p className="text-gray-500 text-sm">
                    Former education policy advisor with a passion for making quality education accessible to all.
                  </p>
                </motion.div>
                <motion.div 
                  className="bg-white p-6 rounded-lg shadow-md text-center"
                  variants={itemVariants}
                  whileHover={{ y: -10, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                >
                  <div className="w-32 h-32 rounded-full mx-auto mb-4 overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&h=150&q=80" 
                      alt="Team Member 2" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-teal-700">Sarah Chen</h3>
                  <p className="text-gray-600 mb-2">CTO & Co-Founder</p>
                  <p className="text-gray-500 text-sm">
                    AI researcher with experience at top tech companies, driving our technology innovation.
                  </p>
                </motion.div>
                <motion.div 
                  className="bg-white p-6 rounded-lg shadow-md text-center"
                  variants={itemVariants}
                  whileHover={{ y: -10, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                >
                  <div className="w-32 h-32 rounded-full mx-auto mb-4 overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&h=150&q=80" 
                      alt="Team Member 3" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-teal-700">Michael Rodriguez</h3>
                  <p className="text-gray-600 mb-2">Head of Education</p>
                  <p className="text-gray-500 text-sm">
                    Former professor with 15 years of experience in curriculum development and teaching.
                  </p>
                </motion.div>
                <motion.div 
                  className="bg-white p-6 rounded-lg shadow-md text-center"
                  variants={itemVariants}
                  whileHover={{ y: -10, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                >
                  <div className="w-32 h-32 rounded-full mx-auto mb-4 overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&h=150&q=80" 
                      alt="Team Member 4" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-teal-700">Jessica Lee</h3>
                  <p className="text-gray-600 mb-2">Head of Product</p>
                  <p className="text-gray-500 text-sm">
                    Product expert with a background in UX design and a focus on creating intuitive learning experiences.
                  </p>
                </motion.div>
              </motion.div>
            </div>
          </section>
        </AnimatedSection>
        
        <AnimatedSection>
          <section className="py-16">
            <div className="container mx-auto px-4 text-center">
              <motion.h2 
                className="text-3xl font-bold text-teal-700 mb-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                Our Values
              </motion.h2>
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-8"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <motion.div 
                  className="p-6"
                  variants={itemVariants}
                >
                  <motion.div 
                    className="bg-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="text-2xl">1</span>
                  </motion.div>
                  <h3 className="text-xl font-semibold text-teal-700 mb-2">Innovation</h3>
                  <p className="text-gray-600">
                    We're constantly pushing the boundaries of what's possible in education technology.
                  </p>
                </motion.div>
                <motion.div 
                  className="p-6"
                  variants={itemVariants}
                >
                  <motion.div 
                    className="bg-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="text-2xl">2</span>
                  </motion.div>
                  <h3 className="text-xl font-semibold text-teal-700 mb-2">Accessibility</h3>
                  <p className="text-gray-600">
                    We believe quality education should be available to everyone, regardless of background.
                  </p>
                </motion.div>
                <motion.div 
                  className="p-6"
                  variants={itemVariants}
                >
                  <motion.div 
                    className="bg-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="text-2xl">3</span>
                  </motion.div>
                  <h3 className="text-xl font-semibold text-teal-700 mb-2">Excellence</h3>
                  <p className="text-gray-600">
                    We hold ourselves to the highest standards in everything we do.
                  </p>
                </motion.div>
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