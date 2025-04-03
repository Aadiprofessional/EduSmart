import React, { useState } from 'react';
import { FaPaperPlane, FaEnvelope } from 'react-icons/fa';
import IconComponent from './IconComponent';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedSection from './AnimatedSection';

const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription logic
    console.log('Newsletter subscription for:', email);
    setIsSubmitted(true);
    setEmail('');
    // Reset submission status after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
    }, 3000);
  };

  return (
    <section className="py-16 bg-gradient-to-r from-teal-700 to-teal-900 text-white relative overflow-hidden">
      {/* Decorative elements */}
      <motion.div 
        className="absolute top-0 left-0 w-full h-full opacity-10"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
        animate={{ 
          scale: [1, 1.05, 1],
          opacity: [0.05, 0.1, 0.05]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 15,
          ease: "easeInOut"
        }}
      />
      
      <motion.div 
        className="absolute -bottom-16 -right-16 w-64 h-64 bg-teal-500 rounded-full opacity-20 blur-lg"
        animate={{
          y: [0, -10, 0],
          x: [0, 10, 0]
        }}
        transition={{
          repeat: Infinity,
          duration: 8,
          ease: "easeInOut"
        }}
      />
      
      <motion.div 
        className="absolute -top-16 -left-16 w-64 h-64 bg-orange-400 rounded-full opacity-20 blur-lg"
        animate={{
          y: [0, 10, 0],
          x: [0, -10, 0]
        }}
        transition={{
          repeat: Infinity,
          duration: 6,
          ease: "easeInOut",
          delay: 1
        }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center">
          <AnimatedSection direction="up">
            <div className="mb-6 inline-block p-4 bg-white/10 rounded-full">
              <IconComponent icon={FaEnvelope} className="text-white text-3xl" />
            </div>
          </AnimatedSection>
          
          <AnimatedSection direction="up" delay={0.1}>
            <h2 className="text-3xl font-bold mb-2 text-center">Subscribe To Newsletter</h2>
          </AnimatedSection>
          
          <AnimatedSection direction="up" delay={0.2}>
            <p className="text-white/80 mb-8 text-center max-w-xl">
              Get the latest updates on university admissions, scholarships, and educational resources 
              delivered directly to your inbox.
            </p>
          </AnimatedSection>
          
          <AnimatedSection direction="up" delay={0.3}>
            <form onSubmit={handleSubmit} className="w-full max-w-md relative">
              <motion.input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-white/20 bg-white/10 backdrop-blur-sm text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent placeholder-white/60"
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400 }}
                required
              />
              <motion.button
                type="submit"
                className="absolute right-0 top-0 h-full bg-orange-500 hover:bg-orange-600 text-white px-4 rounded-r-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <IconComponent icon={FaPaperPlane} />
              </motion.button>
            </form>
          </AnimatedSection>
          
          <AnimatePresence>
            {isSubmitted && (
              <motion.div 
                className="mt-4 text-white bg-green-600/20 backdrop-blur-sm py-2 px-4 rounded-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                Thank you for subscribing to our newsletter!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default Newsletter; 