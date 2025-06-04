import React, { useState } from 'react';
import { FaGraduationCap, FaUniversity, FaChartLine, FaStar, FaFilter, FaSearch, FaCheck, FaTimesCircle } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import IconComponent from '../components/ui/IconComponent';
import { motion } from 'framer-motion';
import { useLanguage } from '../utils/LanguageContext';

interface CaseStudy {
  id: number;
  name: string;
  profilePic: string;
  background: {
    gpa: string;
    testScores: {
      name: string;
      score: string;
    }[];
    extracurriculars: string[];
    challenges?: string;
  };
  results: {
    universitiesApplied: {
      name: string;
      country: string;
      admitted: boolean;
    }[];
    acceptedTo: string[];
    scholarship?: string;
  };
  strategy: string[];
  testimonial: string;
  isLowGPA?: boolean;
  isInternational?: boolean;
  hasScholarship?: boolean;
}

const CaseStudies: React.FC = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    lowGPA: false,
    international: false,
    scholarship: false,
  });
  const [activeTab, setActiveTab] = useState('all');

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

  const buttonVariants = {
    hover: {
      scale: 1.05,
      backgroundColor: "#0F766E",
      color: "white",
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.95
    }
  };

  // Sample case studies data
  const caseStudies: CaseStudy[] = [
    {
      id: 1,
      name: 'James L.',
      profilePic: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&h=150&q=80',
      background: {
        gpa: '3.2/4.0 (Low for top universities)',
        testScores: [
          { name: 'GRE', score: '326 (V: 158, Q: 168)' },
          { name: 'TOEFL', score: '102' }
        ],
        extracurriculars: [
          'Internship at local tech company',
          'University AI research lab assistant',
          'Open-source contributor to ML frameworks'
        ],
        challenges: 'Low undergraduate GPA due to personal challenges during sophomore year'
      },
      results: {
        universitiesApplied: [
          { name: 'Stanford University', country: 'USA', admitted: false },
          { name: 'MIT', country: 'USA', admitted: false },
          { name: 'UC Berkeley', country: 'USA', admitted: true },
          { name: 'Carnegie Mellon University', country: 'USA', admitted: true },
          { name: 'Cornell University', country: 'USA', admitted: true }
        ],
        acceptedTo: ['UC Berkeley', 'Carnegie Mellon', 'Cornell'],
      },
      strategy: [
        'Focused on exceptional projects showcasing AI expertise',
        'Secured strong recommendation letters from research advisor',
        'Addressed GPA directly in statement of purpose',
        'Highlighted growth and improved performance in junior/senior years'
      ],
      testimonial: "EduSmart helped me overcome my low GPA by highlighting my strengths. Their application strategy made all the difference — I still can't believe I got into UC Berkeley!",
      isLowGPA: true
    },
    {
      id: 2,
      name: 'Sophia H.',
      profilePic: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&h=150&q=80',
      background: {
        gpa: '3.9/4.0',
        testScores: [
          { name: 'GMAT', score: '740' },
          { name: 'IELTS', score: '8.0' }
        ],
        extracurriculars: [
          'Founded university entrepreneur club',
          'Volunteer consultant for local businesses',
          'Summer internship at multinational corporation'
        ]
      },
      results: {
        universitiesApplied: [
          { name: 'Harvard Business School', country: 'USA', admitted: true },
          { name: 'Stanford GSB', country: 'USA', admitted: false },
          { name: 'Wharton', country: 'USA', admitted: true },
          { name: 'INSEAD', country: 'France', admitted: true },
          { name: 'London Business School', country: 'UK', admitted: true }
        ],
        acceptedTo: ['Harvard Business School', 'Wharton', 'INSEAD', 'London Business School'],
        scholarship: '$50,000 scholarship from Wharton'
      },
      strategy: [
        'Created compelling personal brand focused on social entrepreneurship',
        'Demonstrated leadership through multiple examples',
        'Connected past experiences to future goals',
        'Applied in Round 1 for best scholarship opportunities'
      ],
      testimonial: "Using EduSmart's AI matching tool, I identified MBA programs that aligned perfectly with my goals. Their scholarship strategy worked - I received a substantial offer from my dream school!",
      hasScholarship: true
    },
    {
      id: 3,
      name: 'Raj P.',
      profilePic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&h=150&q=80',
      background: {
        gpa: '3.7/4.0',
        testScores: [
          { name: 'TOEFL', score: '110' },
          { name: 'GRE', score: '329 (V: 161, Q: 168)' }
        ],
        extracurriculars: [
          'Research publication in computer vision',
          'Internship at tech startup',
          'Online course certificates in ML and AI'
        ],
        challenges: 'Limited access to research opportunities in home country'
      },
      results: {
        universitiesApplied: [
          { name: 'Carnegie Mellon University', country: 'USA', admitted: true },
          { name: 'University of Toronto', country: 'Canada', admitted: true },
          { name: 'ETH Zurich', country: 'Switzerland', admitted: false },
          { name: 'Georgia Tech', country: 'USA', admitted: true },
          { name: 'University of Washington', country: 'USA', admitted: true }
        ],
        acceptedTo: ['Carnegie Mellon', 'University of Toronto', 'Georgia Tech', 'University of Washington'],
        scholarship: 'Full tuition waiver + stipend at Carnegie Mellon'
      },
      strategy: [
        'Focused application on computer vision specialization',
        'Connected with potential research advisors before applying',
        'Showcased independent projects demonstrating technical skills',
        'Highlighted adaptability and cross-cultural experiences'
      ],
      testimonial: "As an international student, I was overwhelmed by the US application process. EduSmart guided me through each step and helped me secure not just admission but full funding at my top choice program!",
      isInternational: true,
      hasScholarship: true
    },
    {
      id: 4,
      name: 'Emma L.',
      profilePic: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&h=150&q=80',
      background: {
        gpa: '3.1/4.0',
        testScores: [
          { name: 'LSAT', score: '172' }
        ],
        extracurriculars: [
          'Paralegal experience at immigration law firm',
          'Volunteer at legal aid clinic',
          'Student government representative'
        ],
        challenges: 'Low GPA due to working full-time during undergraduate years'
      },
      results: {
        universitiesApplied: [
          { name: 'Harvard Law School', country: 'USA', admitted: false },
          { name: 'Columbia Law School', country: 'USA', admitted: false },
          { name: 'Georgetown Law', country: 'USA', admitted: true },
          { name: 'UCLA Law', country: 'USA', admitted: true },
          { name: 'Fordham Law', country: 'USA', admitted: true }
        ],
        acceptedTo: ['Georgetown Law', 'UCLA Law', 'Fordham Law'],
        scholarship: '$25,000/year at Georgetown Law'
      },
      strategy: [
        'Exceptional LSAT score to offset GPA',
        'Compelling personal statement about immigrant background',
        'Strong work experience in legal field',
        'Explained GPA circumstances without making excuses'
      ],
      testimonial: "Despite my below-average GPA, EduSmart helped me build a strategy that got me into a T14 law school with scholarship! Their application tracker kept me organized through the whole process.",
      isLowGPA: true,
      hasScholarship: true
    }
  ];

  // Filter case studies based on search and active filters
  const filteredCaseStudies = caseStudies.filter(study => {
    // Search filter
    if (searchQuery && !study.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Tab filter
    if (activeTab === 'lowGPA' && !study.isLowGPA) {
      return false;
    }
    
    if (activeTab === 'international' && !study.isInternational) {
      return false;
    }
    
    if (activeTab === 'scholarship' && !study.hasScholarship) {
      return false;
    }
    
    // Active filters
    if (activeFilters.lowGPA && !study.isLowGPA) {
      return false;
    }
    
    if (activeFilters.international && !study.isInternational) {
      return false;
    }
    
    if (activeFilters.scholarship && !study.hasScholarship) {
      return false;
    }
    
    return true;
  });

  const toggleFilter = (filter: keyof typeof activeFilters) => {
    setActiveFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <motion.section 
          className="bg-gradient-to-r from-teal-700 to-teal-900 text-white py-12 relative overflow-hidden"
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
            <div className="text-center max-w-3xl mx-auto">
              <motion.h1 
                className="text-4xl font-bold mb-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {t('caseStudies.title')}
              </motion.h1>
              <motion.p 
                className="text-xl mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {t('caseStudies.subtitle')}
              </motion.p>
              <motion.div 
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <input
                  type="text"
                  placeholder={t('caseStudies.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-3 pr-12 bg-white rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <IconComponent icon={FaSearch} className="absolute right-4 top-3.5 text-gray-500" />
              </motion.div>
            </div>
          </div>
        </motion.section>

        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            {/* Category Tabs */}
            <motion.div 
              className="flex flex-wrap justify-center mb-10 gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-teal-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
                onClick={() => setActiveTab('all')}
              >
                {t('caseStudies.allStories')}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  activeTab === 'lowGPA'
                    ? 'bg-teal-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
                onClick={() => setActiveTab('lowGPA')}
              >
                {t('caseStudies.lowGPAStories')}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  activeTab === 'international'
                    ? 'bg-teal-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
                onClick={() => setActiveTab('international')}
              >
                {t('caseStudies.internationalStories')}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  activeTab === 'scholarship'
                    ? 'bg-teal-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
                onClick={() => setActiveTab('scholarship')}
              >
                {t('caseStudies.scholarshipStories')}
              </motion.button>
            </motion.div>

            {/* Filters */}
            <motion.div 
              className="bg-white rounded-lg shadow-md p-4 mb-8 flex flex-wrap gap-3 items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <span className="text-gray-700 flex items-center">
                {t('caseStudies.filterBy')}:
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-1 rounded text-sm font-medium flex items-center ${
                  activeFilters.lowGPA
                    ? 'bg-teal-100 text-teal-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => toggleFilter('lowGPA')}
              >
                <span className={`w-3 h-3 rounded-full mr-2 ${activeFilters.lowGPA ? 'bg-teal-500' : 'bg-gray-300'}`}></span>
                {t('caseStudies.lowGPA')}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-1 rounded text-sm font-medium flex items-center ${
                  activeFilters.international
                    ? 'bg-teal-100 text-teal-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => toggleFilter('international')}
              >
                <span className={`w-3 h-3 rounded-full mr-2 ${activeFilters.international ? 'bg-teal-500' : 'bg-gray-300'}`}></span>
                {t('caseStudies.international')}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-1 rounded text-sm font-medium flex items-center ${
                  activeFilters.scholarship
                    ? 'bg-teal-100 text-teal-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => toggleFilter('scholarship')}
              >
                <span className={`w-3 h-3 rounded-full mr-2 ${activeFilters.scholarship ? 'bg-teal-500' : 'bg-gray-300'}`}></span>
                {t('caseStudies.scholarship')}
              </motion.button>
              {(activeFilters.lowGPA || activeFilters.international || activeFilters.scholarship) && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-teal-600 hover:text-teal-800 text-sm font-medium underline ml-auto"
                  onClick={() => setActiveFilters({ lowGPA: false, international: false, scholarship: false })}
                >
                  {t('caseStudies.clearAllFilters')}
                </motion.button>
              )}
            </motion.div>

            {/* Case Studies Grid */}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredCaseStudies.length > 0 ? (
                filteredCaseStudies.map(study => (
                  <motion.div 
                    key={study.id} 
                    className="bg-white rounded-lg shadow-lg overflow-hidden"
                    variants={itemVariants}
                    whileHover={{ 
                      y: -5,
                      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                    }}
                  >
                    <div className="border-b border-gray-100">
                      <div className="p-6 flex items-start">
                        <motion.div 
                          className="w-16 h-16 rounded-full overflow-hidden mr-4 flex-shrink-0"
                          whileHover={{ scale: 1.1 }}
                        >
                          <img 
                            src={study.profilePic} 
                            alt={study.name} 
                            className="w-full h-full object-cover"
                          />
                        </motion.div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">
                            {study.name}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {study.isLowGPA && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                {t('caseStudies.lowGPA')}
                              </span>
                            )}
                            {study.isInternational && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {t('caseStudies.international')}
                              </span>
                            )}
                            {study.hasScholarship && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {t('caseStudies.scholarship')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="mb-6">
                        <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider mb-2">
                          {t('caseStudies.background')}
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-gray-700 mb-2">
                            <span className="font-medium">{t('caseStudies.gpa')}:</span> {study.background.gpa}
                          </p>
                          <div className="mb-2">
                            <span className="font-medium text-gray-700">{t('caseStudies.testScores')}:</span>
                            <ul className="mt-1 pl-4">
                              {study.background.testScores.map((score, i) => (
                                <li key={i} className="text-gray-600 text-sm">
                                  {score.name}: {score.score}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="mb-2">
                            <span className="font-medium text-gray-700">{t('caseStudies.extracurriculars')}:</span>
                            <ul className="mt-1 pl-4 list-disc list-inside">
                              {study.background.extracurriculars.map((item, i) => (
                                <motion.li 
                                  key={i} 
                                  className="text-gray-600 text-sm"
                                  initial={{ opacity: 0.5 }}
                                  whileHover={{ opacity: 1, x: 5 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  {item}
                                </motion.li>
                              ))}
                            </ul>
                          </div>
                          {study.background.challenges && (
                            <div className="mt-2 text-sm italic text-gray-600">
                              <span className="font-medium">{t('caseStudies.challenges')}:</span> {study.background.challenges}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider mb-2">
                          {t('caseStudies.results')}
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="mb-3">
                            <span className="font-medium text-gray-700">{t('caseStudies.universitiesApplied')}:</span>
                            <span className="font-medium text-gray-700">Universities Applied:</span>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {study.results.universitiesApplied.map((uni, i) => (
                                <motion.div 
                                  key={i} 
                                  className={`flex items-center p-2 rounded-md text-sm ${
                                    uni.admitted
                                      ? 'bg-green-50 text-green-800'
                                      : 'bg-red-50 text-red-800'
                                  }`}
                                  whileHover={{ scale: 1.03 }}
                                >
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 ${
                                    uni.admitted
                                      ? 'bg-green-100 text-green-600'
                                      : 'bg-red-100 text-red-600'
                                  }`}>
                                    {uni.admitted ? <IconComponent icon={FaCheck} size={10} /> : <IconComponent icon={FaTimesCircle} size={10} />}
                                  </span>
                                  <span>{uni.name}, {uni.country}</span>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                          {study.results.scholarship && (
                            <div className="mt-3 font-medium text-green-700 flex items-center">
                              <IconComponent icon={FaStar} className="mr-2 text-yellow-400" />
                              Scholarship: {study.results.scholarship}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider mb-2">
                          Application Strategy
                        </h4>
                        <ul className="bg-gray-50 p-4 rounded-lg list-disc list-inside">
                          {study.strategy.map((item, i) => (
                            <motion.li 
                              key={i} 
                              className="text-gray-600 text-sm mb-1"
                              initial={{ opacity: 0.5 }}
                              whileHover={{ opacity: 1, x: 5 }}
                              transition={{ duration: 0.2 }}
                            >
                              {item}
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                      
                      <motion.div 
                        className="bg-teal-50 p-5 rounded-lg border-l-4 border-teal-500 italic text-gray-700"
                        initial={{ opacity: 0.8 }}
                        whileHover={{ 
                          opacity: 1,
                          scale: 1.02,
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                        }}
                      >
                        "{study.testimonial}"
                      </motion.div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  className="col-span-full bg-white rounded-lg shadow-md p-8 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <h3 className="text-xl font-bold text-gray-700 mb-2">No case studies match your criteria</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your search or filters to find relevant success stories.</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-teal-600 font-medium"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveFilters({ lowGPA: false, international: false, scholarship: false });
                      setActiveTab('all');
                    }}
                  >
                    Reset all filters
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CaseStudies; 