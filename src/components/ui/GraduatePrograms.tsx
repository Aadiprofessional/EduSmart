import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedSection from './AnimatedSection';

const GraduatePrograms: React.FC = () => {
  const programs = [
    {
      id: 1,
      title: 'International University Database',
      description: 'Search top universities worldwide with detailed rankings, tuition fees, and admission requirements',
      link: '/database',
      image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 2,
      title: 'AI Education Courses',
      description: 'Explore AI-focused programs, online certifications, and expert tutorials',
      link: '/ai-courses',
      image: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 3,
      title: 'Success Case Studies',
      description: 'Learn from real student experiences, strategies, and admission success stories',
      link: '/case-studies',
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 4,
      title: 'Application Tracking',
      description: 'Manage your applications with real-time status updates and deadline alerts',
      link: '/tracking',
      image: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <AnimatedSection direction="up">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-teal-800 mb-4">Study Abroad Programs</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore our comprehensive database of international universities and resources designed to help you find the perfect program for your educational goals.
            </p>
          </div>
        </AnimatedSection>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {programs.map((program, index) => (
            <AnimatedSection key={program.id} direction="up" delay={0.1 * index}>
              {/* Desktop view - vertical card */}
              <motion.div 
                whileHover={{ 
                  y: -10,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-white rounded-lg shadow-md overflow-hidden h-full hidden md:block"
              >
                <div className="h-48 overflow-hidden">
                  <motion.img 
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    src={program.image} 
                    alt={program.title} 
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-teal-700 mb-2">{program.title}</h3>
                  <p className="text-gray-600 mb-4">{program.description}</p>
                  <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                    <Link 
                      to={program.link}
                      className="text-orange-500 hover:text-orange-600 font-medium inline-flex items-center"
                    >
                      Learn More 
                      <motion.span 
                        initial={{ x: 0 }}
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
                      >
                        →
                      </motion.span>
                    </Link>
                  </motion.div>
                </div>
              </motion.div>

              {/* Mobile view - horizontal card */}
              <motion.div 
                whileHover={{ 
                  y: -5,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-white rounded-lg shadow-md overflow-hidden h-full md:hidden flex flex-row"
              >
                <div className="w-2/5 overflow-hidden">
                  <motion.img 
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    src={program.image} 
                    alt={program.title} 
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-4 w-3/5">
                  <h3 className="text-base font-semibold text-teal-700 mb-1">{program.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{program.description}</p>
                  <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                    <Link 
                      to={program.link}
                      className="text-orange-500 hover:text-orange-600 font-medium inline-flex items-center text-sm"
                    >
                      Learn More 
                      <motion.span 
                        initial={{ x: 0 }}
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
                      >
                        →
                      </motion.span>
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GraduatePrograms; 