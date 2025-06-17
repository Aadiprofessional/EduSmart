import React, { useState, useEffect } from 'react';
import { FaGraduationCap, FaUniversity, FaChartLine, FaStar, FaFilter, FaSearch, FaCheck, FaTimesCircle, FaEye, FaHeart, FaCalendarAlt, FaMapMarkerAlt, FaAward, FaSpinner, FaTimes, FaTh, FaList, FaSort, FaUser, FaBookmark } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PageHeader from '../components/ui/PageHeader';
import MobileFilterPanel from '../components/ui/MobileFilterPanel';
import IconComponent from '../components/ui/IconComponent';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileViewMode, setMobileViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'scholarship' | 'university'>('newest');

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

  const fadeIn = (direction: string, delay: number) => ({
    hidden: {
      y: direction === "up" ? 40 : direction === "down" ? -40 : 0,
      x: direction === "left" ? 40 : direction === "right" ? -40 : 0,
      opacity: 0,
    },
    visible: {
      y: 0,
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        delay: delay,
        ease: "easeOut",
      },
    },
  });

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
      // Set mock data if API fails
      setCategories(["Medical School", "Graduate School", "Business School", "Law School"]);
      setOutcomes(["Accepted with Full Scholarship", "Accepted with Merit Scholarship", "Accepted with Research Assistantship", "Accepted"]);
      setCountries(["United States", "United Kingdom", "Canada", "Australia", "Germany"]);
      setFields(["Medicine", "Computer Science", "Business Administration", "Engineering", "Law"]);
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
      // Only set filter options if they haven't been set yet
      if (categories.length === 0) {
        setCategories(["Medical School", "Graduate School", "Business School", "Law School"]);
      }
      if (outcomes.length === 0) {
        setOutcomes(["Accepted with Full Scholarship", "Accepted with Merit Scholarship", "Accepted with Research Assistantship", "Accepted"]);
      }
      if (countries.length === 0) {
        setCountries(["United States", "United Kingdom", "Canada", "Australia", "Germany"]);
      }
      if (fields.length === 0) {
        setFields(["Medicine", "Computer Science", "Business Administration", "Engineering", "Law"]);
      }
    }
  }, [caseStudies, loading, categories.length, outcomes.length, countries.length, fields.length]);

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
          height="sm"
        >
          {/* Search Bar - Desktop only */}
          <div className="max-w-2xl mx-auto hidden lg:block">
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

        <section className="py-8 sm:py-12">
          <div className="container mx-auto px-4">
            {/* Mobile Search and Action Bar - Show on mobile only */}
            <div className="block lg:hidden mb-6 space-y-4">
              {/* Mobile Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search success stories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <IconComponent icon={FaSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <IconComponent icon={FaTimes} className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Mobile Filter and Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <IconComponent icon={FaFilter} className="h-4 w-4" />
                  <span>Filters</span>
                  {((activeFilters.category ? 1 : 0) + (activeFilters.outcome ? 1 : 0) + (activeFilters.country ? 1 : 0) + (activeFilters.field ? 1 : 0) + (activeFilters.featured ? 1 : 0) + (searchQuery ? 1 : 0)) > 0 && (
                    <span className="bg-purple-800 text-white text-xs px-2 py-1 rounded-full">
                      {(activeFilters.category ? 1 : 0) + (activeFilters.outcome ? 1 : 0) + (activeFilters.country ? 1 : 0) + (activeFilters.field ? 1 : 0) + (activeFilters.featured ? 1 : 0) + (searchQuery ? 1 : 0)}
                    </span>
                  )}
                </button>

                {/* View Mode Toggle */}
                <button
                  onClick={() => setMobileViewMode(mobileViewMode === 'grid' ? 'list' : 'grid')}
                  className="px-3 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center"
                >
                  <IconComponent icon={mobileViewMode === 'grid' ? FaTh : FaList} className="h-4 w-4" />
                </button>

                {/* Sort Toggle */}
                <button
                  onClick={() => setSortBy(sortBy === 'newest' ? 'popular' : 'newest')}
                  className="px-3 py-3 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-lg hover:from-teal-600 hover:to-green-600 transition-all flex items-center justify-center"
                >
                  <IconComponent icon={FaSort} className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Desktop Search and Filters Section - Hidden on mobile */}
            <section className="hidden lg:block py-8 bg-white border-b border-gray-200 shadow-sm rounded-xl mb-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Success Stories</h2>
                    <p className="text-gray-600">
                      Showing {caseStudies.length} success stor{caseStudies.length !== 1 ? 'ies' : 'y'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-4 lg:mt-0">
                    {/* View Mode Toggle - Desktop */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}
                      >
                        <IconComponent icon={FaTh} />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}
                      >
                        <IconComponent icon={FaList} />
                      </button>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-2">
                      <IconComponent icon={FaSort} className="text-gray-500" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'newest' | 'popular' | 'scholarship' | 'university')}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="popular">Most Popular</option>
                        <option value="featured">Featured First</option>
                      </select>
                    </div>
                  </div>
                </div>

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
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all duration-200 hover:border-purple-300"
                    >
                      <option value="">All Categories</option>
                      {Array.isArray(categories) && categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>

                    <select
                      value={activeFilters.outcome}
                      onChange={(e) => toggleFilter('outcome', e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all duration-200 hover:border-purple-300"
                    >
                      <option value="">All Outcomes</option>
                      {Array.isArray(outcomes) && outcomes.map(outcome => (
                        <option key={outcome} value={outcome}>{outcome}</option>
                      ))}
                    </select>

                    <select
                      value={activeFilters.country}
                      onChange={(e) => toggleFilter('country', e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all duration-200 hover:border-purple-300"
                    >
                      <option value="">All Countries</option>
                      {Array.isArray(countries) && countries.map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>

                    <select
                      value={activeFilters.field}
                      onChange={(e) => toggleFilter('field', e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all duration-200 hover:border-purple-300"
                    >
                      <option value="">All Fields</option>
                      {Array.isArray(fields) && fields.map(field => (
                        <option key={field} value={field}>{field}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => toggleFilter('featured', !activeFilters.featured)}
                      className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                        activeFilters.featured
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'bg-white border border-gray-300 text-gray-700 hover:border-purple-300 hover:text-purple-600'
                      }`}
                    >
                      ⭐ Featured
                    </button>

                    {/* Clear Filters Button */}
                    {((activeFilters.category || activeFilters.outcome || activeFilters.country || activeFilters.field || activeFilters.featured || searchQuery) && (
                      <button
                        onClick={clearAllFilters}
                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all duration-200 flex items-center gap-2"
                      >
                        <IconComponent icon={FaTimesCircle} />
                        Clear All
                      </button>
                    ))}
                  </motion.div>
                </motion.div>
              </div>
            </section>

            {/* Success Stories Grid */}
            <section className="py-6 sm:py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {loading ? (
                  <div className="flex justify-center items-center py-12 sm:py-20">
                    <div className="text-center">
                      <IconComponent icon={FaSpinner} className="animate-spin text-3xl sm:text-4xl text-purple-600 mb-4 mx-auto" />
                      <p className="text-sm sm:text-base text-gray-600 mb-4">Please wait while we load the success stories.</p>
                    </div>
                  </div>
                ) : caseStudies.length > 0 ? (
                  <motion.div 
                    className={viewMode === 'grid' 
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
                      : "space-y-6"
                    }
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {caseStudies.map((caseStudy) => (
                      <motion.div
                        key={caseStudy.id}
                        className={viewMode === 'grid' 
                          ? "bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group cursor-pointer"
                          : "bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col lg:flex-row group cursor-pointer"
                        }
                        variants={itemVariants}
                        whileHover={{ y: -4, scale: 1.01 }}
                        onClick={() => openModal(caseStudy)}
                      >
                        {viewMode === 'grid' ? (
                          // Grid View Layout - Database-style card
                          <>
                            <div className="relative overflow-hidden">
                              <img 
                                src={caseStudy.student_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(caseStudy.student_name)}&background=8B5CF6&color=fff`} 
                                alt={caseStudy.student_name}
                                className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                              {caseStudy.reading_time && (
                                <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm font-bold text-purple-600 shadow-md">
                                  {caseStudy.reading_time} min
                                </div>
                              )}
                              {caseStudy.featured && (
                                <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                                  Featured
                                </div>
                              )}
                            </div>
                            
                            <div className="p-6 flex-1 flex flex-col">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                  {caseStudy.target_country || 'International'}
                                </span>
                                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                  {caseStudy.field_of_study || 'General'}
                                </span>
                              </div>
                              
                              <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 flex-shrink-0 group-hover:text-purple-600 transition-colors">
                                {caseStudy.title}
                              </h3>
                              <p className="text-gray-600 mb-4 text-sm line-clamp-3 flex-1">{caseStudy.description}</p>
                              
                              <div className="flex items-center mb-4">
                                <img 
                                  src={caseStudy.student_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(caseStudy.student_name)}&background=8B5CF6&color=fff`}
                                  alt={caseStudy.student_name}
                                  className="w-8 h-8 rounded-full mr-3"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800 truncate">{caseStudy.student_name}</p>
                                  <p className="text-xs text-gray-600">{caseStudy.target_university || 'University'}</p>
                                </div>
                              </div>
                              
                              {/* Outcome Badge */}
                              <div className="mb-4">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                  caseStudy.outcome?.toLowerCase().includes('accepted') 
                                    ? 'bg-green-100 text-green-800'
                                    : caseStudy.outcome?.toLowerCase().includes('scholarship')
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {caseStudy.outcome}
                                </span>
                              </div>
                              
                              {/* Database-style single button */}
                              <motion.button
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white py-3 px-4 rounded-lg font-medium transition-all text-sm shadow-lg"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openModal(caseStudy);
                                }}
                              >
                                Read Story
                              </motion.button>
                            </div>
                          </>
                        ) : (
                          // List View Layout - Database-style horizontal card
                          <>
                            <div className="relative overflow-hidden w-full lg:w-80 flex-shrink-0">
                              <img 
                                src={caseStudy.student_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(caseStudy.student_name)}&background=8B5CF6&color=fff`} 
                                alt={caseStudy.student_name}
                                className="w-full h-48 lg:h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                              {caseStudy.featured && (
                                <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                                  Featured
                                </div>
                              )}
                            </div>
                            
                            <div className="p-6 flex-1 flex flex-col">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                  {caseStudy.target_country || 'International'}
                                </span>
                                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                  {caseStudy.field_of_study || 'General'}
                                </span>
                                {caseStudy.reading_time && (
                                  <span className="text-gray-500 text-xs">
                                    {caseStudy.reading_time} min read
                                  </span>
                                )}
                              </div>
                              
                              <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">
                                {caseStudy.title}
                              </h3>
                              <p className="text-gray-600 mb-4 line-clamp-2 flex-1">{caseStudy.description}</p>
                              
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                  <img 
                                    src={caseStudy.student_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(caseStudy.student_name)}&background=8B5CF6&color=fff`}
                                    alt={caseStudy.student_name}
                                    className="w-8 h-8 rounded-full mr-3"
                                  />
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">{caseStudy.student_name}</p>
                                    <p className="text-xs text-gray-600">{caseStudy.target_university || 'University'}</p>
                                  </div>
                                </div>
                                
                                {/* Database-style dual buttons */}
                                <div className="flex items-center gap-2">
                                  <motion.button
                                    className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white py-2 px-4 rounded-lg font-medium transition-all text-sm shadow-lg"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openModal(caseStudy);
                                    }}
                                  >
                                    Read
                                  </motion.button>
                                  <motion.button
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-all text-sm"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Handle bookmark functionality
                                    }}
                                  >
                                    Save
                                  </motion.button>
                                </div>
                              </div>
                              
                              {/* Outcome Badge */}
                              <div className="flex items-center justify-between">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                  caseStudy.outcome?.toLowerCase().includes('accepted') 
                                    ? 'bg-green-100 text-green-800'
                                    : caseStudy.outcome?.toLowerCase().includes('scholarship')
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {caseStudy.outcome}
                                </span>
                                {caseStudy.scholarship_amount && (
                                  <span className="text-sm font-bold text-green-600">
                                    ${caseStudy.scholarship_amount.toLocaleString()} Scholarship
                                  </span>
                                )}
                              </div>
                            </div>
                          </>
                        )}
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
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
                                ? 'bg-purple-600 text-white'
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
      
      {/* Mobile Filter Modal */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-[10000] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMobileFilters(false)}
          >
            <motion.div
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b px-4 py-4 flex justify-between items-center z-10">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors bg-gray-50 border border-gray-200"
                >
                  <IconComponent icon={FaTimes} className="h-5 w-5 text-gray-700" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 pb-20">
                {/* Category */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={activeFilters.category}
                    onChange={(e) => toggleFilter('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Categories</option>
                    {Array.isArray(categories) && categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Outcome */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Outcome</label>
                  <select
                    value={activeFilters.outcome}
                    onChange={(e) => toggleFilter('outcome', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Outcomes</option>
                    {Array.isArray(outcomes) && outcomes.map(outcome => (
                      <option key={outcome} value={outcome}>{outcome}</option>
                    ))}
                  </select>
                </div>

                {/* Country */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <select
                    value={activeFilters.country}
                    onChange={(e) => toggleFilter('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Countries</option>
                    {Array.isArray(countries) && countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>

                {/* Field of Study */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Field of Study</label>
                  <select
                    value={activeFilters.field}
                    onChange={(e) => toggleFilter('field', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Fields</option>
                    {Array.isArray(fields) && fields.map(field => (
                      <option key={field} value={field}>{field}</option>
                    ))}
                  </select>
                </div>

                {/* Quick Filters */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quick Filters</label>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        toggleFilter('featured', true);
                      }}
                      className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      ⭐ Featured Stories
                    </button>
                    <button
                      onClick={() => {
                        toggleFilter('category', 'Medical School');
                      }}
                      className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      🏥 Medical School
                    </button>
                    <button
                      onClick={() => {
                        toggleFilter('category', 'Graduate School');
                      }}
                      className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      🎓 Graduate School
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 bg-white border-t px-4 py-3 flex gap-3">
                <button
                  onClick={clearAllFilters}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Footer />
    </div>
  );
};

export default CaseStudies; 