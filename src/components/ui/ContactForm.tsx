import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AnimatedSection from './AnimatedSection';
import { FaUser, FaEnvelope, FaCommentAlt, FaPaperPlane, FaPlus, FaMinus } from 'react-icons/fa';

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Form submitted with data:', formData);
      // Reset form
      setFormData({
        name: '',
        email: '',
        message: ''
      });
      setIsSubmitting(false);
      setIsSubmitted(true);
      
      // Reset submission message after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
    }, 1500);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: 'How does the AI university matching algorithm work?',
      answer: 'Our AI system analyzes your academic background, test scores, budget, and preferences to match you with universities where you have the best chance of admission and fit.'
    },
    {
      question: 'Can I access university rankings and admission requirements?',
      answer: 'Yes, our database includes comprehensive information on QS rankings, tuition fees, GPA requirements, language proficiency needs, and application deadlines for universities worldwide.'
    },
    {
      question: 'Are the success stories and case studies real?',
      answer: 'Absolutely. All our case studies feature real students who have used our platform, though some details may be anonymized to protect privacy.'
    },
    {
      question: 'How can I track my university applications?',
      answer: 'Our application tracker provides real-time status updates, document submission countdowns, and deadline alerts to keep your applications organized.'
    }
  ];

  return (
    <section className="py-16 bg-gray-50 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10">
        <img 
          src="https://images.unsplash.com/photo-1612897001778-11138e47d703?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80" 
          alt="Background pattern"
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* FAQ Section */}
          <AnimatedSection direction="right" className="lg:w-1/2">
            <h2 className="text-3xl font-bold text-teal-800 mb-8">Get some simple answers here.</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-lg shadow-sm overflow-hidden"
                >
                  <motion.button 
                    onClick={() => toggleFaq(index)}
                    className="w-full text-left p-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors"
                    whileHover={{ backgroundColor: "#f9fafb" }}
                  >
                    <h3 className="text-lg font-semibold text-teal-700">{faq.question}</h3>
                    <motion.div 
                      animate={{ rotate: openFaq === index ? 45 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-orange-500"
                    >
                      {openFaq === index ? <FaMinus /> : <FaPlus />}
                    </motion.div>
                  </motion.button>
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ 
                      height: openFaq === index ? 'auto' : 0,
                      opacity: openFaq === index ? 1 : 0
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="p-4 text-gray-600 border-t border-gray-100">{faq.answer}</p>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>
          
          {/* Contact Form */}
          <AnimatedSection direction="left" className="lg:w-1/2">
            <motion.div 
              className="bg-white p-8 rounded-lg shadow-md"
              whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-teal-800 mb-6">Make An Inquiry</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <FaUser className="mr-2 text-teal-600" /> Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                    required
                  />
                </motion.div>
                <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <FaEnvelope className="mr-2 text-teal-600" /> Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                    required
                  />
                </motion.div>
                <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <FaCommentAlt className="mr-2 text-teal-600" /> Your Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                    required
                  ></textarea>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-md transition-colors font-medium flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <span className="loading-spinner mr-2"></span>
                    ) : (
                      <FaPaperPlane className="mr-2" />
                    )}
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </motion.div>
                {isSubmitted && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-green-100 text-green-700 p-3 rounded-md"
                  >
                    Thank you for your message! We will get back to you soon.
                  </motion.div>
                )}
              </form>
            </motion.div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default ContactForm; 