import React from 'react';
import { FaStar, FaQuoteRight } from 'react-icons/fa';
import IconComponent from './IconComponent';
import { motion } from 'framer-motion';
import AnimatedSection from './AnimatedSection';

const ClientFeedback: React.FC = () => {
  const testimonials = [
    {
      id: 1,
      name: 'Sarah J.',
      role: 'Computer Science Student',
      university: 'MIT (Admitted)',
      content: 'EduSmart\'s AI matching tool helped me find programs that perfectly aligned with my interests. Their application tracking kept me organized through the whole process!',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
    },
    {
      id: 2,
      name: 'Michael L.',
      role: 'International Student',
      university: 'Oxford University',
      content: 'As an international student, I was overwhelmed by options until I found EduSmart. Their database made comparing universities across countries so much easier.',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
    },
    {
      id: 3,
      name: 'Emma R.',
      role: 'Scholarship Recipient',
      university: 'Stanford University',
      content: 'Thanks to EduSmart\'s scholarship finder, I discovered and applied for funding I didn\'t know existed. Now I\'m studying at my dream university with a full scholarship!',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
    }
  ];

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, index) => (
      <motion.span 
        key={index}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 * index }}
      >
        <IconComponent 
          icon={FaStar}
          className={`${index < rating ? 'text-yellow-500' : 'text-gray-300'}`} 
        />
      </motion.span>
    ));
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <AnimatedSection direction="up">
          <h2 className="text-3xl font-bold text-teal-800 mb-12 text-center">Client Feedback</h2>
        </AnimatedSection>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <AnimatedSection key={testimonial.id} direction="up" delay={0.1 * index}>
              <motion.div 
                className="bg-white p-6 rounded-lg shadow-md border border-gray-100 relative h-full"
                whileHover={{ 
                  y: -10,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div 
                  className="absolute top-6 right-6 text-teal-100 text-4xl opacity-50"
                  animate={{ rotate: [0, 5, 0] }}
                  transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
                >
                  <IconComponent icon={FaQuoteRight} />
                </motion.div>
                
                <div className="flex text-yellow-500 mb-4">
                  {renderStars(testimonial.rating)}
                </div>
                <p className="text-gray-700 mb-6 relative z-10">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <motion.div 
                    className="w-12 h-12 rounded-full mr-4 overflow-hidden"
                    whileHover={{ scale: 1.1 }}
                  >
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  <div>
                    <h4 className="font-semibold text-teal-700">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                    <p className="text-orange-500 text-sm">{testimonial.university}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ClientFeedback; 