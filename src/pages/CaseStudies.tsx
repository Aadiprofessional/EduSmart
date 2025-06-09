import React, { useState, useEffect } from 'react';
import { FaGraduationCap, FaUniversity, FaChartLine, FaStar, FaFilter, FaSearch, FaCheck, FaTimesCircle, FaEye, FaHeart, FaCalendarAlt, FaMapMarkerAlt, FaAward, FaSpinner, FaTimes } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PageHeader from '../components/ui/PageHeader';
import IconComponent from '../components/ui/IconComponent';
import { motion } from 'framer-motion';
import { useLanguage } from '../utils/LanguageContext';
import { caseStudyAPI } from '../utils/apiService';

interface CaseStudy {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  student_name: string;
  student_image?: string;
  student_background?: string;
  previous_education?: string;
  target_program?: string;
  target_university?: string;
  target_country?: string;
  outcome: string;
  scholarship_amount?: number;
  scholarship_currency?: string;
  application_year?: number;
  story_content?: string;
  challenges_faced?: string[];
  strategies_used?: string[];
  advice_given?: string[];
  timeline?: string;
  test_scores?: any;
  documents_used?: string[];
  featured: boolean;
  category?: string;
  field_of_study?: string;
  tags?: string[];
  reading_time?: number;
  views?: number;
  likes?: number;
  status?: string;
  created_at: string;
  updated_at?: string;
}

const CaseStudies: React.FC = () => {
  const { t } = useLanguage();
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    category: '',
    outcome: '',
    country: '',
    field: '',
    featured: false
  });
  const [showModal, setShowModal] = useState(false);
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<CaseStudy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [outcomes, setOutcomes] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [fields, setFields] = useState<string[]>([]);

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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  const loadCaseStudies = async () => {
    try {
      setLoading(true);
      const response = await caseStudyAPI.getAll(
        currentPage,
        9,
        activeFilters.category || undefined,
        activeFilters.outcome || undefined,
        activeFilters.country || undefined,
        activeFilters.field || undefined,
        searchQuery || undefined,
        activeFilters.featured || undefined
      );
      if (response.success) {
        setCaseStudies(response.data.caseStudies || []);
        setTotalPages(response.data.totalPages || 1);
      } else {
        console.error('Failed to load case studies:', response.error);
        setCaseStudies([]);
      }
    } catch (error) {
      console.error('Error loading case studies:', error);
      setCaseStudies([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const [categoriesResult, outcomesResult, countriesResult, fieldsResult] = await Promise.all([
        caseStudyAPI.getCategories(),
        caseStudyAPI.getOutcomes(),
        caseStudyAPI.getCountries(),
        caseStudyAPI.getFields()
      ]);

      if (categoriesResult.success) {
        setCategories(categoriesResult.data || []);
      }
      if (outcomesResult.success) {
        setOutcomes(outcomesResult.data || []);
      }
      if (countriesResult.success) {
        setCountries(countriesResult.data || []);
      }
      if (fieldsResult.success) {
        setFields(fieldsResult.data || []);
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  useEffect(() => {
    loadCaseStudies();
  }, [currentPage, searchQuery, activeFilters]);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  // Mock data for development
  useEffect(() => {
    if (caseStudies.length === 0 && !loading) {
      setCaseStudies([
        {
          id: "1",
          title: "From Community College to Harvard Medical School",
          description: "How Sarah overcame financial challenges and academic setbacks to achieve her dream of becoming a doctor.",
          student_name: "Sarah Johnson",
          student_background: "First-generation college student",
          previous_education: "Community College",
          target_program: "MD Program",
          target_university: "Harvard Medical School",
          target_country: "United States",
          outcome: "Accepted with Full Scholarship",
          scholarship_amount: 250000,
          scholarship_currency: "USD",
          application_year: 2023,
          story_content: "Sarah's journey began at a local community college where she excelled in her pre-medical courses despite working part-time to support her family. Through determination, strategic planning, and the right guidance, she transferred to a four-year university and eventually gained acceptance to one of the most prestigious medical schools in the world.",
          challenges_faced: ["Financial constraints", "Limited research opportunities", "First-generation college student"],
          strategies_used: ["Community college transfer pathway", "Extensive volunteering", "Research partnerships", "Strong personal statement"],
          advice_given: ["Start early with planning", "Build strong relationships with mentors", "Don't let background define your limits"],
          featured: true,
          category: "Medical School",
          field_of_study: "Medicine",
          tags: ["Harvard", "Medical School", "Scholarship", "First-generation"],
          reading_time: 8,
          views: 15420,
          likes: 892,
          status: "published",
          created_at: "2023-12-01T00:00:00Z"
        },
        {
          id: "2",
          title: "Engineering Dreams: From India to MIT",
          description: "Raj's incredible journey from a small town in India to one of the world's top engineering schools.",
          student_name: "Raj Patel",
          student_background: "Small town in Gujarat, India",
          previous_education: "Local Engineering College",
          target_program: "MS in Computer Science",
          target_university: "Massachusetts Institute of Technology",
          target_country: "United States",
          outcome: "Accepted with Research Assistantship",
          scholarship_amount: 45000,
          scholarship_currency: "USD",
          application_year: 2023,
          story_content: "Coming from a small town with limited resources, Raj had to overcome language barriers, financial constraints, and intense competition. His passion for technology and innovative projects helped him stand out among thousands of applicants.",
          challenges_faced: ["Language barriers", "Limited resources", "Intense competition", "Visa process"],
          strategies_used: ["Open source contributions", "Strong GRE scores", "Compelling SOP", "Professor connections"],
          advice_given: ["Focus on practical projects", "Network with alumni", "Prepare thoroughly for standardized tests"],
          featured: true,
          category: "Graduate School",
          field_of_study: "Computer Science",
          tags: ["MIT", "Engineering", "International Student", "Research"],
          reading_time: 10,
          views: 12350,
          likes: 743,
          status: "published",
          created_at: "2023-11-15T00:00:00Z"
        },
        {
          id: "3",
          title: "Business Leadership: From Startup to Stanford MBA",
          description: "How Maria leveraged her entrepreneurial experience to gain admission to Stanford's prestigious MBA program.",
          student_name: "Maria Rodriguez",
          student_background: "Tech Startup Founder",
          previous_education: "State University Business Degree",
          target_program: "MBA",
          target_university: "Stanford Graduate School of Business",
          target_country: "United States",
          outcome: "Accepted with Merit Scholarship",
          scholarship_amount: 75000,
          scholarship_currency: "USD",
          application_year: 2023,
          story_content: "Maria founded her first startup at 22 and scaled it to a multi-million dollar company. Her unique entrepreneurial journey and leadership experience made her a standout candidate for Stanford's competitive MBA program.",
          challenges_faced: ["Balancing work and applications", "Competitive applicant pool", "GMAT preparation"],
          strategies_used: ["Unique entrepreneurial story", "Strong leadership examples", "Alumni networking", "Compelling essays"],
          advice_given: ["Leverage unique experiences", "Show clear career goals", "Connect with current students"],
          featured: false,
          category: "Business School",
          field_of_study: "Business Administration",
          tags: ["Stanford", "MBA", "Entrepreneur", "Leadership"],
          reading_time: 7,
          views: 9876,
          likes: 567,
          status: "published",
          created_at: "2023-12-15T00:00:00Z"
        }
      ]);
      setCategories(["Medical School", "Graduate School", "Business School", "Law School"]);
      setOutcomes(["Accepted with Full Scholarship", "Accepted with Merit Scholarship", "Accepted with Research Assistantship", "Accepted"]);
      setCountries(["United States", "United Kingdom", "Canada", "Australia", "Germany"]);
      setFields(["Medicine", "Computer Science", "Business Administration", "Engineering", "Law"]);
    }
  }, [caseStudies, loading]);

  const toggleFilter = (filterType: keyof typeof activeFilters, value: any) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? (filterType === 'featured' ? false : '') : value
    }));
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setActiveFilters({
      category: '',
      outcome: '',
      country: '',
      field: '',
      featured: false
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  const openModal = (caseStudy: CaseStudy) => {
    setSelectedCaseStudy(caseStudy);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCaseStudy(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <main className="flex-grow">
        <PageHeader
          title="Success Stories"
          subtitle="Inspiring journeys of students who achieved their dreams"
          height="lg"
        >
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 shadow-2xl border border-white/20">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder={t('caseStudies.searchPlaceholder') || 'Search success stories...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-6 py-4 pl-12 bg-white/90 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white transition-all text-lg placeholder-gray-500"
                  />
                  <IconComponent icon={FaSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                </div>
                <button className="px-6 py-4 bg-white/20 hover:bg-white/30 text-white rounded-xl font-medium transition-colors flex items-center gap-2 border border-white/30">
                  <IconComponent icon={FaSearch} />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>
            </div>
          </div>
        </PageHeader>

        <section className="py-12">
          <div className="container mx-auto px-4">
            {/* Search and Filters Section */}
            <section className="py-8 bg-white border-b border-gray-200 shadow-sm">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div 
                  className="flex flex-col lg:flex-row gap-6 items-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  {/* Filter Buttons */}
                  <motion.div 
                    className="flex flex-wrap gap-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <select
                      value={activeFilters.category}
                      onChange={(e) => toggleFilter('category', e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 hover:border-blue-300"
                    >
                      <option value="">All Categories</option>
                      {(categories || []).map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>

                    <select
                      value={activeFilters.outcome}
                      onChange={(e) => toggleFilter('outcome', e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 hover:border-blue-300"
                    >
                      <option value="">All Outcomes</option>
                      {(outcomes || []).map(outcome => (
                        <option key={outcome} value={outcome}>{outcome}</option>
                      ))}
                    </select>

                    <select
                      value={activeFilters.country}
                      onChange={(e) => toggleFilter('country', e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 hover:border-blue-300"
                    >
                      <option value="">All Countries</option>
                      {(countries || []).map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>

                    <select
                      value={activeFilters.field}
                      onChange={(e) => toggleFilter('field', e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 hover:border-blue-300"
                    >
                      <option value="">All Fields</option>
                      {(fields || []).map(field => (
                        <option key={field} value={field}>{field}</option>
                      ))}
                    </select>

                    <motion.button
                      onClick={() => toggleFilter('featured', true)}
                      className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                        activeFilters.featured === true
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-300'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <IconComponent icon={FaStar} className="inline" />
                      Featured
                    </motion.button>

                    {(searchQuery || Object.values(activeFilters).some(v => v !== null && v !== false && v !== '')) && (
                      <motion.button
                        onClick={clearAllFilters}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all duration-200 border border-red-200"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <IconComponent icon={FaTimesCircle} className="inline mr-2" />
                        Clear All
                      </motion.button>
                    )}
                  </motion.div>
                </motion.div>
              </div>
            </section>

            {/* Success Stories Grid */}
            <section className="py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {loading ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="text-center">
                      <IconComponent icon={FaSpinner} className="animate-spin text-4xl text-blue-600 mb-4 mx-auto" />
                      <p className="text-gray-600 mb-4">Please wait while we load the success stories.</p>
                    </div>
                  </div>
                ) : caseStudies.length > 0 ? (
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {caseStudies.map((caseStudy) => (
                      <motion.div 
                        key={caseStudy.id} 
                        className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                        variants={itemVariants}
                        whileHover={{ 
                          y: -8,
                          transition: { duration: 0.3 }
                        }}
                        onClick={() => openModal(caseStudy)}
                      >
                        <div className="relative">
                          {/* Student Image or Placeholder */}
                          <div className="h-48 bg-gradient-to-br from-blue-400 to-indigo-500 relative overflow-hidden">
                            {caseStudy.student_image ? (
                              <img 
                                src={caseStudy.student_image} 
                                alt={caseStudy.student_name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                                  <IconComponent icon={FaGraduationCap} className="text-3xl text-white" />
                                </div>
                              </div>
                            )}
                            
                            {/* Featured Badge */}
                            {caseStudy.featured && (
                              <div className="absolute top-4 right-4">
                                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                  <IconComponent icon={FaStar} className="text-xs" />
                                  Featured
                                </span>
                              </div>
                            )}
                            
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                            
                            {/* Student Name on Image */}
                            <div className="absolute bottom-4 left-4 text-white">
                              <h3 className="text-lg font-bold">{caseStudy.student_name}</h3>
                              {caseStudy.student_background && (
                                <p className="text-sm text-white/80">{caseStudy.student_background}</p>
                              )}
                            </div>
                          </div>

                          {/* Card Content */}
                          <div className="p-6">
                            <h4 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                              {caseStudy.title}
                            </h4>
                            
                            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                              {caseStudy.description}
                            </p>

                            {/* University and Country Info */}
                            <div className="flex flex-wrap gap-2 mb-4 text-sm">
                              {caseStudy.target_university && (
                                <div className="flex items-center gap-1">
                                  <IconComponent icon={FaUniversity} className="text-blue-500" />
                                  <span className="truncate">{caseStudy.target_university}</span>
                                </div>
                              )}
                              {caseStudy.target_country && (
                                <div className="flex items-center gap-1">
                                  <IconComponent icon={FaMapMarkerAlt} className="text-blue-500" />
                                  <span>{caseStudy.target_country}</span>
                                </div>
                              )}
                            </div>

                            {/* Outcome Badge */}
                            {caseStudy.outcome && (
                              <div className="mb-4">
                                <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium">
                                  {caseStudy.outcome}
                                </span>
                              </div>
                            )}

                            {/* Tags */}
                            {caseStudy.tags && caseStudy.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {caseStudy.tags.slice(0, 3).map((tag, index) => (
                                  <span key={index} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                                    {tag}
                                  </span>
                                ))}
                                {caseStudy.tags.length > 3 && (
                                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                                    +{caseStudy.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                {caseStudy.reading_time && (
                                  <div className="flex items-center gap-1">
                                    <IconComponent icon={FaCalendarAlt} />
                                    <span>{caseStudy.reading_time} min read</span>
                                  </div>
                                )}
                                {caseStudy.views && (
                                  <div className="flex items-center gap-1">
                                    <IconComponent icon={FaEye} />
                                    <span>{caseStudy.views}</span>
                                  </div>
                                )}
                              </div>
                              <button className="text-blue-600 hover:text-blue-700 font-medium text-sm group-hover:translate-x-1 transition-transform">
                                Read More →
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="text-center py-20">
                    <div className="max-w-md mx-auto">
                      <IconComponent icon={FaTimesCircle} className="text-6xl text-gray-300 mb-6 mx-auto" />
                      <h3 className="text-xl font-bold text-gray-700 mb-2">No success stories found</h3>
                      <p className="text-gray-600 mb-4">Try adjusting your search or filters to find relevant success stories.</p>
                      <button
                        onClick={clearAllFilters}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-12">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-4 py-2 rounded-lg ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>
      </main>

      {/* Modal for detailed view */}
      {showModal && selectedCaseStudy && (
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModal}
        >
          <motion.div 
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedCaseStudy.title}</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <IconComponent icon={FaTimes} className="text-2xl" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Student Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Name:</span> {selectedCaseStudy.student_name}</p>
                    <p><span className="font-medium">Background:</span> {selectedCaseStudy.student_background}</p>
                    <p><span className="font-medium">Previous Education:</span> {selectedCaseStudy.previous_education}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Target Application</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Program:</span> {selectedCaseStudy.target_program}</p>
                    <p><span className="font-medium">University:</span> {selectedCaseStudy.target_university}</p>
                    <p><span className="font-medium">Country:</span> {selectedCaseStudy.target_country}</p>
                    <p><span className="font-medium">Year:</span> {selectedCaseStudy.application_year}</p>
                  </div>
                </div>
              </div>
              
              {selectedCaseStudy.story_content && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Success Story</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{selectedCaseStudy.story_content}</p>
                  </div>
                </div>
              )}
              
              {selectedCaseStudy.strategies_used && selectedCaseStudy.strategies_used.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Strategies Used</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedCaseStudy.strategies_used.map((strategy, index) => (
                      <li key={index} className="text-gray-700">{strategy}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {selectedCaseStudy.advice_given && selectedCaseStudy.advice_given.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Advice Given</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedCaseStudy.advice_given.map((advice, index) => (
                      <li key={index} className="text-gray-700">{advice}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
      
      <Footer />
    </div>
  );
};

export default CaseStudies; 