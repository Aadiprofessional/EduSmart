import React from 'react';
import { motion } from 'framer-motion';
import { FaQuoteLeft, FaStar } from 'react-icons/fa';
import IconComponent from './IconComponent';
import AnimatedSection from './AnimatedSection';
import { useLanguage } from '../../utils/LanguageContext';

const ClientFeedback: React.FC = () => {
  const { t } = useLanguage();

  const testimonials = [
    {
      id: 1,
      name: 'Sarah Chen',
      university: 'Stanford University',
      program: 'Computer Science',
      rating: 5,
      feedback: 'MatrixEdu helped me find the perfect university match. The AI recommendations were spot-on, and I got accepted to my dream school!',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80'
    },
    {
      id: 2,
      name: 'Michael Rodriguez',
      university: 'MIT',
      program: 'Engineering',
      rating: 5,
      feedback: 'The scholarship finder feature saved me thousands of dollars. I found funding opportunities I never knew existed.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80'
    },
    {
      id: 3,
      name: 'Emily Wang',
      university: 'Oxford University',
      program: 'International Relations',
      rating: 5,
      feedback: 'The application tracker kept me organized throughout the entire process. I highly recommend MatrixEdu to all students.',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80'
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <AnimatedSection direction="up">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-teal-800 mb-4">
              {t('clientFeedback.title')}
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {t('clientFeedback.subtitle')}
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <AnimatedSection key={testimonial.id} direction="up" delay={0.1 * index}>
              <motion.div
                className="bg-white rounded-lg shadow-lg p-6 h-full relative"
                whileHover={{ 
                  y: -5,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div 
                  className="absolute top-4 right-4 text-teal-600 opacity-20"
                  whileHover={{ scale: 1.2, opacity: 0.4 }}
                >
                  <IconComponent icon={FaQuoteLeft} className="h-8 w-8" />
                </motion.div>
                
                <div className="flex items-center mb-4">
                  <motion.img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  />
                  <div>
                    <h4 className="font-bold text-teal-700">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.program}</p>
                    <p className="text-sm text-orange-500 font-medium">{testimonial.university}</p>
                  </div>
                </div>
                
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * i }}
                    >
                      <IconComponent icon={FaStar} className="h-5 w-5 text-yellow-400" />
                    </motion.div>
                  ))}
                </div>
                
                <p className="text-gray-600 italic">"{testimonial.feedback}"</p>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ClientFeedback; 