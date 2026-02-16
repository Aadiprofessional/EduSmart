import React, { useState, useEffect } from 'react';
import { FaStar, FaFilter, FaSearch, FaTimes, FaTh, FaList, FaSort, FaArrowRight, FaGraduationCap, FaChartLine, FaHeart, FaUniversity, FaMapMarkerAlt, FaBook, FaMoneyBillWave } from 'react-icons/fa';
import { Header } from '../components/layout';
import Footer from '../components/layout/Footer';
import IconComponent from '../components/ui/IconComponent';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../utils/LanguageContext';
import { caseStudyAPI } from '../utils/apiService';
import { CaseStudiesSkeleton } from '../components/ui/Skeleton';

// Interfaces
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

const FloatingParticle = ({ delay = 0, size = 4, color = "bg-white" }) => (
  <motion.div
    className={`absolute ${color} rounded-full opacity-20`}
    style={{
      width: size,
      height: size,
      left: Math.random() * 100 + '%',
      top: Math.random() * 100 + '%'
    }}
    animate={{
      y: [0, -100],
      opacity: [0, 0.5, 0]
    }}
    transition={{
      duration: 3 + Math.random() * 2,
      repeat: Infinity,
      delay: delay,
      ease: "linear"
    }}
  />
);

const HolographicCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <motion.div
    className={`relative group ${className} h-full`}
    whileHover={{ y: -5 }}
    transition={{ duration: 0.3 }}
  >
    <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
    <div className="relative h-full bg-[#0A0A0A] backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden group-hover:border-purple-500/30 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative z-10 h-full flex flex-col">
        {children}
      </div>
    </div>
  </motion.div>
);

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
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'scholarship'>('newest');

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
        setCaseStudies(Array.isArray(response.data.caseStudies) ? response.data.caseStudies : []);
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

      if (categoriesResult.success && Array.isArray(categoriesResult.data)) setCategories(categoriesResult.data);
      if (outcomesResult.success && Array.isArray(outcomesResult.data)) setOutcomes(outcomesResult.data);
      if (countriesResult.success && Array.isArray(countriesResult.data)) setCountries(countriesResult.data);
      if (fieldsResult.success && Array.isArray(fieldsResult.data)) setFields(fieldsResult.data);
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

  // Mock data for development if empty
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
          story_content: "Sarah's journey began at a local community college where she excelled in her pre-medical courses...",
          challenges_faced: ["Financial constraints", "Limited research opportunities"],
          strategies_used: ["Community college transfer pathway", "Research partnerships"],
          advice_given: ["Start early with planning", "Build strong relationships with mentors"],
          featured: true,
          category: "Medical School",
          field_of_study: "Medicine",
          tags: ["Harvard", "Medical School", "Scholarship"],
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
          target_university: "MIT",
          target_country: "United States",
          outcome: "Accepted with Research Assistantship",
          scholarship_amount: 45000,
          scholarship_currency: "USD",
          application_year: 2023,
          featured: true,
          category: "Graduate School",
          field_of_study: "Computer Science",
          tags: ["MIT", "Engineering", "International Student"],
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
          target_university: "Stanford GSB",
          target_country: "United States",
          outcome: "Accepted with Merit Scholarship",
          scholarship_amount: 75000,
          scholarship_currency: "USD",
          application_year: 2023,
          featured: false,
          category: "Business School",
          field_of_study: "Business Administration",
          tags: ["Stanford", "MBA", "Entrepreneur"],
          reading_time: 7,
          views: 9876,
          likes: 567,
          status: "published",
          created_at: "2023-12-15T00:00:00Z"
        }
      ]);
      // Also set mock filters if empty
      if (categories.length === 0) setCategories(["Medical School", "Graduate School", "Business School", "Law School"]);
      if (outcomes.length === 0) setOutcomes(["Accepted with Full Scholarship", "Accepted with Merit Scholarship", "Accepted with Research Assistantship", "Accepted"]);
      if (countries.length === 0) setCountries(["United States", "United Kingdom", "Canada", "Australia", "Germany"]);
      if (fields.length === 0) setFields(["Medicine", "Computer Science", "Business Administration", "Engineering", "Law"]);
    }
  }, [caseStudies, loading, categories.length]);

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

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCategoryIcon = (category: string) => {
    if (!category) return <IconComponent icon={FaGraduationCap} className="text-gray-500" />;
    
    const lowerCat = category.toLowerCase();
    if (lowerCat.includes('medical')) return <IconComponent icon={FaHeart} className="text-red-500" />;
    if (lowerCat.includes('business')) return <IconComponent icon={FaChartLine} className="text-blue-500" />;
    if (lowerCat.includes('law')) return <IconComponent icon={FaBook} className="text-yellow-500" />;
    if (lowerCat.includes('graduate')) return <IconComponent icon={FaGraduationCap} className="text-green-500" />;
    if (lowerCat.includes('engineering') || lowerCat.includes('computer')) return <IconComponent icon={FaChartLine} className="text-indigo-500" />;
    
    return <IconComponent icon={FaGraduationCap} className="text-gray-500" />;
  };

  const activeFilterCount = (
    (activeFilters.category ? 1 : 0) + 
    (activeFilters.outcome ? 1 : 0) + 
    (activeFilters.country ? 1 : 0) + 
    (activeFilters.field ? 1 : 0) + 
    (activeFilters.featured ? 1 : 0) + 
    (searchQuery ? 1 : 0)
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-purple-500 selection:text-white">
      <Header />
      
      {/* Floating Particles Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {[...Array(30)].map((_, i) => (
          <FloatingParticle 
            key={i} 
            delay={i * 0.2} 
            size={Math.random() * 3 + 1}
            color="bg-white"
          />
        ))}
      </div>

      <main className="flex-grow relative z-10 pt-20">
        {/* Page Header */}
        <div className="text-center mb-12 py-16 px-4">
            <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60"
            >
                {t('caseStudies.title') || "Success Stories"}
            </motion.h1>
            <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-lg text-gray-400 max-w-2xl mx-auto"
            >
                {t('caseStudies.subtitle') || "Inspiring journeys of students who achieved their dreams"}
            </motion.p>
          
          {/* Enhanced Search Bar - Desktop only */}
          <div className="max-w-2xl mx-auto hidden lg:block mt-8">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-2 shadow-2xl border border-white/10">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder={t('caseStudies.searchPlaceholder') || 'Search success stories...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-6 py-4 pl-12 bg-[#0A0A0A]/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-[#0A0A0A] transition-all text-lg placeholder-gray-500 border border-white/5"
                  />
                  <IconComponent icon={FaSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                </div>
                <button className="px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 shadow-lg shadow-purple-500/20">
                  <IconComponent icon={FaSearch} />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
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
                  className="w-full pl-10 pr-10 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <IconComponent icon={FaSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <IconComponent icon={FaTimes} className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Mobile Filter and Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20"
                >
                  <IconComponent icon={FaFilter} className="h-4 w-4" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="bg-purple-800 text-white text-xs px-2 py-1 rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* View Mode Toggle */}
                <button
                  onClick={() => setMobileViewMode(mobileViewMode === 'grid' ? 'list' : 'grid')}
                  className="px-3 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all flex items-center justify-center"
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

            {/* Mobile Filter Modal */}
            <AnimatePresence>
              {showMobileFilters && (
                <motion.div
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] lg:hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowMobileFilters(false)}
                >
                  <motion.div
                    className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0A0A0A] shadow-2xl border-l border-white/10"
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="sticky top-0 bg-[#0A0A0A] border-b border-white/10 px-4 py-4 flex justify-between items-center z-10">
                      <h3 className="text-lg font-semibold text-white">Filters</h3>
                      <button
                        onClick={() => setShowMobileFilters(false)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors bg-white/5 border border-white/10"
                      >
                        <IconComponent icon={FaTimes} className="h-5 w-5 text-gray-400" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 pb-20 overflow-y-auto h-full">
                      {/* Search */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Search</label>
                        <div className="relative">
                            <IconComponent 
                                icon={FaSearch} 
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4"
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search success stories..."
                                className="w-full pl-10 pr-4 py-3 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200 text-sm bg-white/5 text-white placeholder-gray-500"
                            />
                        </div>
                      </div>

                      {/* Categories */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Target Level</label>
                        <select
                          value={activeFilters.category}
                          onChange={(e) => toggleFilter('category', e.target.value)}
                          className="w-full px-3 py-2 bg-[#0A0A0A] border border-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">All Levels</option>
                          {categories.map(category => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Outcomes */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Outcome</label>
                        <select
                          value={activeFilters.outcome}
                          onChange={(e) => toggleFilter('outcome', e.target.value)}
                          className="w-full px-3 py-2 bg-[#0A0A0A] border border-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">All Outcomes</option>
                          {outcomes.map(outcome => (
                            <option key={outcome} value={outcome}>
                              {outcome}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Destination */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Destination</label>
                        <div className="flex flex-wrap gap-2">
                            {countries.map(country => (
                                <button
                                    key={country}
                                    className={`text-xs font-medium px-3 py-2 rounded-full transition-colors border ${
                                        activeFilters.country === country
                                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                                    }`}
                                    onClick={() => toggleFilter('country', country)}
                                >
                                    {country}
                                </button>
                            ))}
                        </div>
                      </div>

                      {/* Sort By */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Sort By</label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="w-full px-3 py-2 bg-[#0A0A0A] border border-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="newest">Newest First</option>
                          <option value="popular">Most Popular</option>
                          <option value="scholarship">Highest Scholarship</option>
                        </select>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="absolute bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-white/10 px-4 py-3 flex gap-3 z-10">
                      <button
                        onClick={clearAllFilters}
                        className="flex-1 px-4 py-2 border border-white/10 text-gray-300 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => setShowMobileFilters(false)}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20"
                      >
                        Apply
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {loading ? (
               <div className="flex flex-col lg:flex-row gap-8">
                {/* Desktop Sidebar Skeleton */}
                <div className="hidden lg:block lg:w-1/4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 animate-pulse">
                    <div className="space-y-4">
                      <div className="h-10 bg-white/10 rounded"></div>
                      <div className="h-10 bg-white/10 rounded"></div>
                      <div className="h-10 bg-white/10 rounded"></div>
                    </div>
                  </div>
                </div>
                {/* Main Content Skeleton */}
                <div className="lg:w-3/4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(6)].map((_, index) => (
                        <CaseStudiesSkeleton key={index} dark={true} />
                      ))}
                    </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Desktop Sidebar Filters - Hidden on mobile */}
                <motion.div 
                  className="hidden lg:block lg:w-1/4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 sticky top-24 backdrop-blur-xl space-y-8">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-white">Filters</h3>
                      {activeFilterCount > 0 && (
                        <button
                          onClick={clearAllFilters}
                          className="text-sm text-purple-400 hover:text-purple-300 font-medium"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {/* Categories */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-300 mb-3">Target Level</h4>
                      <div className="space-y-2">
                        {categories.map((category) => (
                            <motion.button
                              key={category}
                              className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center ${
                                activeFilters.category === category
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium'
                                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
                              }`}
                              onClick={() => toggleFilter('category', category)}
                              whileHover={{ x: 2 }}
                            >
                              <span className="mr-2">{getCategoryIcon(category)}</span>
                              {category}
                            </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Outcomes */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-300 mb-3">Outcome</h4>
                      <div className="space-y-2">
                        {outcomes.slice(0, 5).map((outcome) => (
                            <motion.button
                              key={outcome}
                              className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center ${
                                activeFilters.outcome === outcome
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium'
                                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
                              }`}
                              onClick={() => toggleFilter('outcome', outcome)}
                              whileHover={{ x: 2 }}
                            >
                              <IconComponent icon={FaStar} className="mr-2 text-yellow-500" />
                              {outcome}
                            </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Countries */}
                    <div>
                        <h4 className="text-md font-semibold text-gray-300 mb-3">Destination</h4>
                        <div className="flex flex-wrap gap-2">
                        {countries.map(country => (
                            <motion.button
                            key={country}
                            className={`text-xs font-medium px-3 py-1 rounded-full transition-colors border ${
                                activeFilters.country === country
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                            }`}
                            onClick={() => toggleFilter('country', country)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            >
                            {country}
                            </motion.button>
                        ))}
                        </div>
                    </div>
                  </div>
                </motion.div>

                {/* Main Content */}
                <motion.div 
                  className="lg:w-3/4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {/* Results Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 bg-[#0A0A0A] border border-white/10 rounded-xl p-6 backdrop-blur-xl">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">
                        {activeFilters.category || 'All Stories'}
                        {searchQuery && (
                          <span className="text-lg font-normal text-gray-400 ml-2">
                            - Results for "{searchQuery}"
                          </span>
                        )}
                      </h2>
                      <p className="text-gray-400">
                        Showing {caseStudies.length} success stor{caseStudies.length !== 1 ? 'ies' : 'y'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-4 sm:mt-0">
                      {/* View Mode Toggle - Desktop */}
                      <div className="hidden lg:flex items-center gap-2">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-2 rounded ${viewMode === 'grid' ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-gray-400'}`}
                        >
                          <IconComponent icon={FaTh} />
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-2 rounded ${viewMode === 'list' ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-gray-400'}`}
                        >
                          <IconComponent icon={FaList} />
                        </button>
                      </div>

                      {/* Sort Dropdown */}
                      <div className="flex items-center gap-2">
                        <IconComponent icon={FaSort} className="text-gray-400" />
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="px-3 py-2 bg-[#0A0A0A] border border-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        >
                          <option value="newest">Newest First</option>
                          <option value="popular">Most Popular</option>
                          <option value="scholarship">Highest Scholarship</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Active Filters Bar */}
                  {activeFilterCount > 0 && (
                    <motion.div 
                      className="mb-6 bg-[#0A0A0A] border border-white/10 rounded-xl p-4 backdrop-blur-xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-gray-400 font-medium">Active filters:</span>
                        {Object.entries(activeFilters).map(([key, value]) => {
                            if (!value) return null;
                            return (
                                <span key={key} className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-purple-500/30 capitalize">
                                    {key}: {value.toString()}
                                    <button onClick={() => toggleFilter(key as any, value)}>
                                        <IconComponent icon={FaTimes} className="text-xs" />
                                    </button>
                                </span>
                            );
                        })}
                        {searchQuery && (
                            <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-purple-500/30">
                            Search: "{searchQuery}"
                            <button onClick={() => setSearchQuery('')}>
                                <IconComponent icon={FaTimes} className="text-xs" />
                            </button>
                            </span>
                        )}
                        <button
                          onClick={clearAllFilters}
                          className="text-gray-400 hover:text-white text-sm underline ml-2"
                        >
                          Clear all
                        </button>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Cards Grid/List */}
                  <motion.div 
                    className={viewMode === 'grid' ? 
                      'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 
                      'space-y-6'
                    }
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {caseStudies.map((study) => (
                    <HolographicCard
                      key={study.id}
                      className={viewMode === 'grid' 
                        ? "flex flex-col h-full cursor-pointer group"
                        : "flex flex-col lg:flex-row h-full cursor-pointer group"
                      }
                    >
                      <div
                        className="flex-1 flex flex-col h-full"
                        onClick={() => { setSelectedCaseStudy(study); setShowModal(true); }}
                      >
                        {viewMode === 'grid' ? (
                          // Grid View Layout
                          <>
                            <div className="relative overflow-hidden h-48 flex-shrink-0">
                                {/* Use a gradient placeholder if no image */}
                                {study.student_image ? (
                                    <img 
                                        src={study.student_image} 
                                        alt={study.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-purple-900 to-blue-900 group-hover:scale-110 transition-transform duration-500 flex items-center justify-center">
                                        <IconComponent icon={FaGraduationCap} className="text-white/20 text-6xl" />
                                    </div>
                                )}
                              
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-60" />
                              
                              {study.scholarship_amount && (
                                <div className="absolute top-3 right-3 bg-green-500/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-green-300 border border-green-500/30 flex items-center gap-1">
                                  <IconComponent icon={FaMoneyBillWave} />
                                  {study.scholarship_currency} {study.scholarship_amount.toLocaleString()}
                                </div>
                              )}
                              
                              {study.featured && (
                                <div className="absolute top-3 left-3 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg shadow-purple-500/20">
                                  Featured
                                </div>
                              )}
                            </div>
                            
                            <div className="p-6 flex-1 flex flex-col">
                              <div className="flex items-center gap-2 mb-4">
                                <span className="bg-purple-500/10 text-purple-300 text-xs font-medium px-2.5 py-1 rounded-lg border border-purple-500/20 flex items-center">
                                  {getCategoryIcon(study.category || '')}
                                  <span className="ml-1">{study.category}</span>
                                </span>
                                <span className="text-gray-400 text-xs flex items-center gap-1">
                                    <IconComponent icon={FaMapMarkerAlt} className="text-gray-500" />
                                    {study.target_country}
                                </span>
                              </div>
                              
                              <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                                {study.title}
                              </h3>
                              
                              <div className="mb-4">
                                <div className="text-sm text-gray-300 font-medium mb-1">{study.outcome}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <IconComponent icon={FaUniversity} />
                                    {study.target_university}
                                </div>
                              </div>

                              <p className="text-gray-400 mb-6 text-sm line-clamp-3 flex-1">{study.description}</p>
                              
                              <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                <div className="flex items-center gap-3">
                                  {/* Avatar placeholder */}
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold ring-2 ring-purple-500/20">
                                    {study.student_name.charAt(0)}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-200">{study.student_name}</span>
                                    <span className="text-xs text-gray-500">{study.target_program}</span>
                                  </div>
                                </div>
                                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-purple-500/20 transition-colors">
                                  <IconComponent icon={FaArrowRight} className="text-gray-400 group-hover:text-purple-300 w-4 h-4" />
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          // List View Layout
                          <div className="flex flex-col lg:flex-row h-full">
                            <div className="relative overflow-hidden lg:w-80 h-48 lg:h-auto flex-shrink-0">
                                {study.student_image ? (
                                    <img 
                                        src={study.student_image} 
                                        alt={study.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-purple-900 to-blue-900 group-hover:scale-110 transition-transform duration-500 flex items-center justify-center">
                                        <IconComponent icon={FaGraduationCap} className="text-white/20 text-6xl" />
                                    </div>
                                )}
                              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#0A0A0A] via-transparent to-transparent opacity-60" />
                              {study.featured && (
                                <div className="absolute top-3 left-3 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg shadow-purple-500/20">
                                  Featured
                                </div>
                              )}
                            </div>
                            
                            <div className="p-6 flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center gap-3 mb-3">
                                  <span className="bg-purple-500/10 text-purple-300 text-xs font-medium px-2.5 py-1 rounded-lg border border-purple-500/20">
                                    {study.category}
                                  </span>
                                  <span className="text-gray-400 text-xs flex items-center gap-1">
                                    <IconComponent icon={FaMapMarkerAlt} />
                                    {study.target_country}
                                  </span>
                                  <span className="text-gray-400 text-xs">
                                    {study.application_year}
                                  </span>
                                </div>
                                
                                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                                  {study.title}
                                </h3>
                                
                                <div className="mb-3 flex flex-wrap gap-4 text-sm">
                                    <div className="text-green-400 font-medium">
                                        {study.outcome}
                                    </div>
                                    <div className="text-gray-300 flex items-center gap-1">
                                        <IconComponent icon={FaUniversity} className="text-gray-500" />
                                        {study.target_university}
                                    </div>
                                    {study.scholarship_amount && (
                                        <div className="text-green-300 flex items-center gap-1">
                                            <IconComponent icon={FaMoneyBillWave} />
                                            {study.scholarship_currency} {study.scholarship_amount.toLocaleString()}
                                        </div>
                                    )}
                                </div>

                                <p className="text-gray-400 mb-4 line-clamp-2">{study.description}</p>
                              </div>
                              
                              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold ring-2 ring-purple-500/20">
                                    {study.student_name.charAt(0)}
                                  </div>
                                  <span className="text-sm font-medium text-gray-200">{study.student_name}</span>
                                </div>
                                <span className="flex items-center text-purple-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                                  Read Full Story <IconComponent icon={FaArrowRight} className="ml-2 w-4 h-4" />
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </HolographicCard>
                    ))}
                  </motion.div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <motion.div 
                      className="mt-8 flex justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-4 py-2 text-sm font-medium text-gray-400 bg-[#0A0A0A] border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Previous
                        </button>
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                currentPage === pageNum
                                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                  : 'text-gray-400 bg-[#0A0A0A] border border-white/10 hover:bg-white/5'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 text-sm font-medium text-gray-400 bg-[#0A0A0A] border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />

        {/* Modal for Case Study Details - Keeping minimal for now or reuse existing modal logic */}
        <AnimatePresence>
        {showModal && selectedCaseStudy && (
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
            >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="relative">
                    <div className="h-48 bg-gradient-to-r from-purple-900 to-blue-900 relative">
                         {selectedCaseStudy.student_image && (
                             <img src={selectedCaseStudy.student_image} alt="" className="w-full h-full object-cover opacity-50" />
                         )}
                         <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
                         <button 
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white hover:bg-white/20 transition-colors"
                        >
                            <IconComponent icon={FaTimes} />
                        </button>
                    </div>
                    <div className="p-8 -mt-20 relative">
                         <div className="bg-[#111] border border-white/10 rounded-xl p-6 shadow-xl mb-6">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm border border-purple-500/30">
                                    {selectedCaseStudy.category}
                                </span>
                                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm border border-blue-500/30">
                                    {selectedCaseStudy.outcome}
                                </span>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">{selectedCaseStudy.title}</h2>
                            <p className="text-xl text-gray-300 mb-4">{selectedCaseStudy.description}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-t border-white/10 pt-6">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-3">Student Profile</h3>
                                    <ul className="space-y-2 text-gray-400">
                                        <li className="flex items-center gap-2">
                                            <span className="text-gray-500">Name:</span> {selectedCaseStudy.student_name}
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-gray-500">Target:</span> {selectedCaseStudy.target_university}
                                        </li>
                                         <li className="flex items-center gap-2">
                                            <span className="text-gray-500">Program:</span> {selectedCaseStudy.target_program}
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-3">Key Achievements</h3>
                                     <ul className="space-y-2 text-gray-400">
                                        {selectedCaseStudy.scholarship_amount && (
                                            <li className="flex items-center gap-2 text-green-400">
                                                <IconComponent icon={FaMoneyBillWave} />
                                                Scholarship: {selectedCaseStudy.scholarship_currency} {selectedCaseStudy.scholarship_amount.toLocaleString()}
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                         </div>
                         
                         <div className="prose prose-invert max-w-none">
                             <h3 className="text-2xl font-bold text-white mb-4">The Journey</h3>
                             <p className="text-gray-300 leading-relaxed mb-6">{selectedCaseStudy.story_content || selectedCaseStudy.description}</p>
                             
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                 <div>
                                     <h4 className="text-xl font-bold text-white mb-3">Challenges Faced</h4>
                                     <ul className="list-disc pl-5 text-gray-400 space-y-1">
                                         {selectedCaseStudy.challenges_faced?.map((challenge, i) => (
                                             <li key={i}>{challenge}</li>
                                         ))}
                                     </ul>
                                 </div>
                                 <div>
                                      <h4 className="text-xl font-bold text-white mb-3">Strategies Used</h4>
                                     <ul className="list-disc pl-5 text-gray-400 space-y-1">
                                         {selectedCaseStudy.strategies_used?.map((strategy, i) => (
                                             <li key={i}>{strategy}</li>
                                         ))}
                                     </ul>
                                 </div>
                             </div>
                         </div>
                    </div>
                </div>
            </motion.div>
            </motion.div>
        )}
        </AnimatePresence>
    </div>
  );
};

export default CaseStudies;
