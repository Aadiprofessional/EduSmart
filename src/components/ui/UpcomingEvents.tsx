import React from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaRobot, FaMoneyBillWave, FaUsers, FaCalendarCheck, FaUniversity } from 'react-icons/fa';
import IconComponent from './IconComponent';
import { motion } from 'framer-motion';
import AnimatedSection from './AnimatedSection';

const UpcomingEvents: React.FC = () => {
  const upcomingFeatures = [
    {
      id: 1,
      title: 'AI-Powered Interview Prep',
      description: 'Get personalized mock interviews with AI feedback to help you ace university admissions and scholarship interviews.',
      status: 'In Development',
      release: 'Coming Soon',
      icon: <IconComponent icon={FaRobot} className="text-orange-500 text-5xl" />,
      link: '/features/interview-prep',
      image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 2,
      title: 'Study Abroad Cost Calculator',
      description: 'Estimate your total expenses, including tuition, living costs, and travel, based on your destination and lifestyle preferences.',
      status: 'In Progress',
      release: 'Q3 2025',
      icon: <IconComponent icon={FaMoneyBillWave} className="text-orange-500 text-5xl" />,
      link: '/features/cost-calculator',
      image: 'https://images.unsplash.com/photo-1564939558297-fc396f18e5c7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 3,
      title: 'University Networking Hub',
      description: 'Connect with current students and alumni to get real insights into university life, courses, and career opportunities.',
      status: 'Planning Stage',
      release: 'To Be Announced',
      icon: <IconComponent icon={FaUsers} className="text-orange-500 text-5xl" />,
      link: '/features/networking-hub',
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 4,
      title: 'AI-Generated Study Plan',
      description: 'Receive a personalized study plan based on your target universities, application deadlines, and preparation timeline.',
      status: 'Beta Testing',
      release: 'Early 2026',
      icon: <IconComponent icon={FaCalendarCheck} className="text-orange-500 text-5xl" />,
      link: '/features/study-plan',
      image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 5,
      title: 'Virtual Campus Tours',
      description: 'Explore universities around the world with 360° virtual tours and interactive campus experiences.',
      status: 'Concept Development',
      release: 'Future Update',
      icon: <IconComponent icon={FaUniversity} className="text-orange-500 text-5xl" />,
      link: '/features/virtual-tours',
      image: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <AnimatedSection direction="up">
          <h2 className="text-3xl font-bold text-teal-800 mb-12 text-center">Upcoming Features</h2>
        </AnimatedSection>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingFeatures.slice(0, 6).map((feature, index) => (
            <AnimatedSection key={feature.id} direction="up" delay={0.1 * index}>
              <motion.div 
                className="bg-white rounded-lg shadow-md overflow-hidden relative border border-gray-200 h-full"
                whileHover={{ 
                  y: -10,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div 
                  className="absolute top-4 right-4 bg-orange-500 text-white text-xs py-1 px-2 rounded z-10"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  NEW
                </motion.div>
                <div className="h-40 overflow-hidden">
                  <motion.img 
                    src={feature.image} 
                    alt={feature.title}
                    className="w-full h-full object-cover transition-transform duration-300"
                    whileHover={{ scale: 1.05 }}
                  />
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                  >
                    <div className="text-white text-5xl">{feature.icon}</div>
                  </motion.div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-teal-700 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <div className="flex items-center text-gray-600 mb-1">
                    <IconComponent icon={FaCalendarAlt} className="mr-2 text-orange-500" />
                    <span className="text-sm">Status: {feature.status}</span>
                  </div>
                  <p className="text-gray-600 mb-4 text-sm">Expected Release: {feature.release}</p>
                  <motion.div
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link 
                      to={feature.link}
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
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UpcomingEvents; 