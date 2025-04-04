import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube } from 'react-icons/fa';
import IconComponent from '../ui/IconComponent';
import { motion } from 'framer-motion';

const Footer: React.FC = () => {
  const socialVariants = {
    hover: { scale: 1.2, rotate: 5, transition: { duration: 0.2 } }
  };

  const linkVariants = {
    hover: { x: 5, color: '#f97316', transition: { duration: 0.2 } }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <footer className="bg-teal-900 text-white relative overflow-hidden">
      {/* Background decoration */}
      <motion.div 
        className="absolute w-96 h-96 rounded-full bg-teal-800"
        style={{ top: '-15%', right: '-10%', filter: 'blur(80px)', opacity: 0.4 }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.4, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
        }}
      />
      <motion.div 
        className="absolute w-64 h-64 rounded-full bg-orange-500"
        style={{ bottom: '-5%', left: '-5%', filter: 'blur(60px)', opacity: 0.2 }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {/* About */}
          <motion.div variants={itemVariants}>
            <h3 className="text-xl font-bold mb-4">About Us</h3>
            <p className="text-gray-300 mb-4">
              EduSmart is an AI-powered educational platform helping students find their dream university and educational path with personalized guidance and resources.
            </p>
            <div className="flex space-x-4">
              <motion.a href="#" className="text-gray-300 hover:text-orange-500" variants={socialVariants} whileHover="hover">
                <IconComponent icon={FaFacebook} size={20} />
              </motion.a>
              <motion.a href="#" className="text-gray-300 hover:text-orange-500" variants={socialVariants} whileHover="hover">
                <IconComponent icon={FaTwitter} size={20} />
              </motion.a>
              <motion.a href="#" className="text-gray-300 hover:text-orange-500" variants={socialVariants} whileHover="hover">
                <IconComponent icon={FaInstagram} size={20} />
              </motion.a>
              <motion.a href="#" className="text-gray-300 hover:text-orange-500" variants={socialVariants} whileHover="hover">
                <IconComponent icon={FaLinkedin} size={20} />
              </motion.a>
              <motion.a href="#" className="text-gray-300 hover:text-orange-500" variants={socialVariants} whileHover="hover">
                <IconComponent icon={FaYoutube} size={20} />
              </motion.a>
            </div>
          </motion.div>
          
          {/* Quick Links */}
          <motion.div variants={itemVariants}>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <motion.div variants={linkVariants} whileHover="hover">
                  <Link to="/" className="text-gray-300 inline-block">Home</Link>
                </motion.div>
              </li>
              <li>
                <motion.div variants={linkVariants} whileHover="hover">
                  <Link to="/database" className="text-gray-300 inline-block">University Database</Link>
                </motion.div>
              </li>
              <li>
                <motion.div variants={linkVariants} whileHover="hover">
                  <Link to="/case-studies" className="text-gray-300 inline-block">Success Stories</Link>
                </motion.div>
              </li>
              <li>
                <motion.div variants={linkVariants} whileHover="hover">
                  <Link to="/ai-courses" className="text-gray-300 inline-block">AI Courses</Link>
                </motion.div>
              </li>
              <li>
                <motion.div variants={linkVariants} whileHover="hover">
                  <Link to="/blog" className="text-gray-300 inline-block">Blog</Link>
                </motion.div>
              </li>
            </ul>
          </motion.div>
          
          {/* Resources */}
          <motion.div variants={itemVariants}>
            <h3 className="text-xl font-bold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <motion.div variants={linkVariants} whileHover="hover">
                  <Link to="/scholarship-finder" className="text-gray-300 inline-block">Scholarship Finder</Link>
                </motion.div>
              </li>
              <li>
                <motion.div variants={linkVariants} whileHover="hover">
                  <Link to="/application-tracker" className="text-gray-300 inline-block">Application Tracker</Link>
                </motion.div>
              </li>
              <li>
                <motion.div variants={linkVariants} whileHover="hover">
                  <Link to="/privacy" className="text-gray-300 inline-block">Privacy Policy</Link>
                </motion.div>
              </li>
              <li>
                <motion.div variants={linkVariants} whileHover="hover">
                  <Link to="/terms" className="text-gray-300 inline-block">Terms of Service</Link>
                </motion.div>
              </li>
              <li>
                <motion.div variants={linkVariants} whileHover="hover">
                  <Link to="/faq" className="text-gray-300 inline-block">FAQ</Link>
                </motion.div>
              </li>
            </ul>
          </motion.div>
          
          {/* Contact */}
          <motion.div variants={itemVariants}>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-gray-300">
              <li>123 Education Street</li>
              <li>Hong Kong, NY 10001</li>
              <li>Phone: (123) 456-7890</li>
              <li>Email: info@edusmart.com</li>
            </ul>
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="mb-4 md:mb-0">
            <span className="text-gray-300">© 2025 EduSmart. All rights reserved.</span>
            <br />
            <span className="text-gray-300">Powered by <a href="https://www.matrixai.asia" className="text-gray-300 hover:text-orange-500">MatrixAI</a> X <a href="https://www.smarteducation.asia" className="text-gray-300 hover:text-orange-500">Smart Education</a></span>
          </div>
          <div className="flex space-x-6">
            <motion.div variants={linkVariants} whileHover="hover">
              <Link to="/privacy" className="text-gray-300 text-sm inline-block">
                Privacy Policy
              </Link>
            </motion.div>
            <motion.div variants={linkVariants} whileHover="hover">
              <Link to="/terms" className="text-gray-300 text-sm inline-block">
                Terms of Service
              </Link>
            </motion.div>
            <motion.div variants={linkVariants} whileHover="hover">
              <Link to="/cookies" className="text-gray-300 text-sm inline-block">
                Cookie Policy
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;