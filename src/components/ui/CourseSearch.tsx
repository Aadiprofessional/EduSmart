import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaGraduationCap } from 'react-icons/fa';
import IconComponent from './IconComponent';
import { motion } from 'framer-motion';
import AnimatedSection from './AnimatedSection';

const CourseSearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    country: '',
    major: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Build query string
    const queryParams = new URLSearchParams();
    if (searchParams.keyword) queryParams.append('keyword', searchParams.keyword);
    if (searchParams.country) queryParams.append('country', searchParams.country);
    if (searchParams.major) queryParams.append('major', searchParams.major);
    
    // Navigate to database page with search params
    navigate(`/database?${queryParams.toString()}`);
  };

  return (
    <section className="py-16 bg-teal-900 relative overflow-hidden">
      {/* Animated background elements */}
      <motion.div 
        className="absolute top-0 left-0 w-64 h-64 bg-teal-700 rounded-full opacity-20" 
        animate={{
          x: [0, 20, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "reverse"
        }}
        style={{ filter: 'blur(40px)', top: '-20px', left: '10%' }}
      />
      <motion.div 
        className="absolute bottom-0 right-0 w-80 h-80 bg-orange-500 rounded-full opacity-10" 
        animate={{
          x: [0, -30, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: "reverse"
        }}
        style={{ filter: 'blur(60px)', bottom: '-40px', right: '5%' }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <AnimatedSection>
          <div className="text-center mb-10">
            <motion.h2 
              className="text-3xl font-bold text-white mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Search For Universities
            </motion.h2>
            <motion.p 
              className="text-gray-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Find your ideal university based on your preferences, location, and academic interests
            </motion.p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <motion.form 
              onSubmit={handleSubmit} 
              className="bg-white p-6 rounded-lg shadow-lg"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                  <input
                    type="text"
                    placeholder="Search Keywords"
                    name="keyword"
                    value={searchParams.keyword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                  />
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                  <select
                    name="country"
                    value={searchParams.country}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                  >
                    <option value="">Select Country</option>
                    <option value="usa">United States</option>
                    <option value="uk">United Kingdom</option>
                    <option value="canada">Canada</option>
                    <option value="australia">Australia</option>
                    <option value="germany">Germany</option>
                    <option value="france">France</option>
                    <option value="japan">Japan</option>
                    <option value="china">China</option>
                  </select>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                  <select
                    name="major"
                    value={searchParams.major}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                  >
                    <option value="">Select Major</option>
                    <option value="ai">Artificial Intelligence</option>
                    <option value="business">Business</option>
                    <option value="engineering">Engineering</option>
                    <option value="medicine">Medicine</option>
                    <option value="arts">Arts & Humanities</option>
                    <option value="science">Natural Sciences</option>
                    <option value="social-science">Social Sciences</option>
                    <option value="law">Law</option>
                  </select>
                </motion.div>
              </div>
              
              <div className="mt-6">
                <motion.button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-md transition-colors flex items-center justify-center font-medium"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <IconComponent icon={FaSearch} className="mr-2" />
                  Search Universities
                </motion.button>
              </div>
            </motion.form>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default CourseSearch; 