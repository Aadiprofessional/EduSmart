import React, { useState, useEffect } from 'react';
import { FaGraduationCap, FaUniversity, FaCalendarAlt, FaDollarSign, FaMapMarkerAlt, FaSearch, FaFilter, FaBookmark, FaRegBookmark, FaExternalLinkAlt, FaSpinner, FaTimesCircle, FaTimes, FaCheck, FaEye, FaHeart, FaStar, FaAward, FaGlobe, FaRobot, FaAtom, FaBolt, FaRocket, FaUsers, FaClock, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { HiOutlineAcademicCap, HiOutlineLocationMarker } from 'react-icons/hi';
import IconComponent from '../components/ui/IconComponent';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../utils/LanguageContext';
import { scholarshipAPI } from '../utils/apiService';

interface Scholarship {
  id: string;
  title: string;
  description: string;
  amount: number;
  eligibility: string;
  deadline: string;
  university: string;
  country: string;
  application_link: string;
  requirements: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Enhanced Animation variants with futuristic effects
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 40, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 15,
      duration: 0.6
    }
  }
};

const cardVariants = {
  hidden: { scale: 0.9, opacity: 0, rotateX: -15 },
  visible: {
    scale: 1,
    opacity: 1,
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      duration: 0.8
    }
  },
  hover: {
    y: -12,
    scale: 1.03,
    rotateX: 5,
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }
};

const floatingVariants = {
  animate: {
    y: [-20, 20, -20],
    rotate: [0, 5, -5, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// CSS for futuristic grid background pattern
const gridPatternStyle = {
  backgroundSize: '30px 30px',
  backgroundImage: `
    linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
  `,
  backgroundPosition: 'center center'
};

const Scholarships: React.FC = () => {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    country: '',
    university: '',
    minAmount: '',
    maxAmount: ''
  });
  const [savedScholarships, setSavedScholarships] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [universities, setUniversities] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalScholarships, setTotalScholarships] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    fetchScholarships();
    fetchCountries();
    fetchUniversities();
  }, [currentPage, filters.country]);

  const fetchScholarships = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await scholarshipAPI.getAll(currentPage, 12, filters.country || undefined);
      
      if (response.success) {
        let scholarshipsData = response.data;
        
        if (scholarshipsData && scholarshipsData.scholarships) {
          setScholarships(scholarshipsData.scholarships);
          if (scholarshipsData.pagination) {
            setTotalPages(scholarshipsData.pagination.totalPages || 1);
            setTotalScholarships(scholarshipsData.pagination.total || 0);
          }
        } else if (Array.isArray(scholarshipsData)) {
          setScholarships(scholarshipsData);
        } else {
          setScholarships([]);
        }
      } else {
        setError('Failed to fetch scholarships');
        setScholarships([]);
      }
    } catch (error) {
      console.error('Error fetching scholarships:', error);
      setError('Error loading scholarships. Please try again later.');
      setScholarships([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCountries = async () => {
    try {
      const response = await scholarshipAPI.getCountries();
      if (response.success && response.data && response.data.countries) {
        setCountries(response.data.countries);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  const fetchUniversities = async () => {
    try {
      const response = await scholarshipAPI.getUniversities();
      if (response.success && response.data && response.data.universities) {
        setUniversities(response.data.universities);
      }
    } catch (error) {
      console.error('Error fetching universities:', error);
    }
  };

  // Helper functions
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isDeadlineApproaching = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isDeadlinePassed = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    return deadlineDate < today;
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredScholarships = scholarships.filter(scholarship => {
    const matchesSearch = scholarship.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         scholarship.university.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         scholarship.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         scholarship.eligibility.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesUniversity = !filters.university || scholarship.university.toLowerCase().includes(filters.university.toLowerCase());
    
    const matchesMinAmount = !filters.minAmount || scholarship.amount >= Number(filters.minAmount);
    const matchesMaxAmount = !filters.maxAmount || scholarship.amount <= Number(filters.maxAmount);

    return matchesSearch && matchesUniversity && matchesMinAmount && matchesMaxAmount;
  });

  const handleSaveScholarship = (id: string) => {
    setSavedScholarships(prev => 
      prev.includes(id) 
        ? prev.filter(scholarshipId => scholarshipId !== id)
        : [...prev, id]
    );
  };

  const resetFilters = () => {
    setFilters({
      country: '',
      university: '',
      minAmount: '',
      maxAmount: ''
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAIAnalysis = async () => {
    setIsAIAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      setIsAIAnalyzing(false);
      // Show AI insights modal or update UI
    }, 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <motion.div 
            className="absolute w-96 h-96 bg-blue-500 rounded-full opacity-20" 
            style={{ filter: 'blur(100px)', top: '10%', right: '10%' }}
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
          <motion.div 
            className="absolute w-64 h-64 bg-purple-500 rounded-full opacity-20" 
            style={{ filter: 'blur(80px)', bottom: '20%', left: '15%' }}
            animate={{
              scale: [1, 1.3, 1],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
          <div className="absolute inset-0 opacity-10" style={gridPatternStyle}></div>
        </div>

        <div className="flex justify-center items-center h-screen relative z-10">
          <motion.div 
            className="relative"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-20 h-20 border-4 border-blue-300/30 rounded-full"></div>
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-400 rounded-full border-t-transparent animate-spin"></div>
            <motion.div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <IconComponent icon={FaAtom} className="text-blue-400 text-2xl" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <motion.div 
            className="absolute w-96 h-96 bg-red-500 rounded-full opacity-10" 
            style={{ filter: 'blur(100px)', top: '20%', right: '20%' }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <div className="absolute inset-0 opacity-5" style={gridPatternStyle}></div>
        </div>

        <div className="container mx-auto px-4 py-16 relative z-10 flex items-center justify-center min-h-screen">
          <motion.div 
            className="text-center bg-white/10 backdrop-blur-md rounded-3xl p-12 border border-white/20"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div 
              className="text-red-400 text-8xl mb-6"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ⚠️
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-4">System Temporarily Unavailable</h2>
            <p className="text-gray-300 mb-8 text-lg">{error}</p>
            <motion.button
              onClick={() => {
                setError(null);
                fetchScholarships();
              }}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-2xl transition-all duration-300 flex items-center mx-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <IconComponent icon={FaRocket} className="mr-2" />
              Retry Connection
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      <main className="pt-20">
        {/* Hero Section with Search */}
        <section className="py-20 relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 left-10 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-500"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                {t('scholarships.title') || 'Future-Ready Scholarship Portal'}
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-12">
                {t('scholarships.subtitle') || 'Unlock your academic potential with our intelligent scholarship matching system'}
              </p>

          {/* Enhanced Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 shadow-2xl border border-white/20">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder={t('scholarships.searchPlaceholder') || 'Search scholarships with AI assistance...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-6 py-4 pl-12 bg-white/90 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white transition-all text-lg placeholder-gray-500"
                  />
                  <IconComponent icon={FaSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                </div>
                <button 
                  onClick={handleAIAnalysis}
                  disabled={isAIAnalyzing}
                  className="px-6 py-4 bg-white/20 hover:bg-white/30 text-white rounded-xl font-medium transition-colors flex items-center gap-2 border border-white/30 disabled:opacity-50"
                >
                  <IconComponent icon={FaRobot} />
                  <span className="hidden sm:inline">{isAIAnalyzing ? 'Analyzing...' : 'AI Search'}</span>
                </button>
              </div>
            </div>
          </div>
            </motion.div>
          </div>
        </section>

        {/* Futuristic Scholarships Section */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4">
            {/* Enhanced Section Header */}
            <motion.div 
              className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center">
                <motion.div
                  className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mr-4"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.8 }}
                >
                  <IconComponent icon={FaRocket} className="text-white text-2xl" />
                </motion.div>
                <div>
                  <h2 className="text-4xl font-bold text-white mb-2">
                    Available <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Scholarships</span>
                  </h2>
                  <p className="text-gray-400 text-lg">
                    Showing {filteredScholarships.length} of {scholarships.length} opportunities
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Futuristic View Toggle */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-6 py-3 rounded-xl transition-all duration-300 flex items-center ${
                      viewMode === 'grid' 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' 
                        : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <IconComponent icon={FaAtom} className="mr-2" />
                    Neural Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-6 py-3 rounded-xl transition-all duration-300 flex items-center ${
                      viewMode === 'list' 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' 
                        : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <IconComponent icon={FaBolt} className="mr-2" />
                    Data Stream
                  </button>
                </div>
                
                <motion.button
                  onClick={() => window.location.href = '/application-tracker'}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-8 py-4 rounded-2xl font-medium flex items-center hover:shadow-2xl transition-all duration-300 border border-purple-400/30"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <IconComponent icon={FaBookmark} className="mr-2" />
                  Mission Control
                </motion.button>
              </div>
            </motion.div>
              
            {/* Enhanced Scholarships Display */}
            <AnimatePresence mode="wait">
              {filteredScholarships.length === 0 ? (
                <motion.div 
                  className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-16 text-center border border-white/20"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div 
                    className="text-gray-400 text-9xl mb-8"
                    variants={floatingVariants}
                    animate="animate"
                  >
                    <IconComponent icon={FaRocket} className="mx-auto" />
                  </motion.div>
                  <h3 className="text-3xl font-bold text-white mb-6">No Scholarships in Database</h3>
                  <p className="text-gray-400 mb-10 max-w-md mx-auto text-lg">
                    Recalibrate your search parameters to discover new funding opportunities in our quantum database.
                  </p>
                  <motion.button 
                    onClick={resetFilters}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium py-4 px-10 rounded-2xl hover:shadow-2xl transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <IconComponent icon={FaStar} className="mr-2" />
                    Reset Quantum Filters
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key={viewMode}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className={viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" 
                    : "space-y-6"
                  }
                >
                  {filteredScholarships.map((scholarship, index) => {
                    const daysUntilDeadline = getDaysUntilDeadline(scholarship.deadline);
                    const isUrgent = daysUntilDeadline <= 7 && daysUntilDeadline > 0;
                    const isExpired = daysUntilDeadline <= 0;
                    
                    return (
                      <motion.div
                        key={scholarship.id}
                        variants={cardVariants}
                        whileHover="hover"
                        className={`relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 border border-slate-700/50 overflow-hidden group ${
                          viewMode === 'list' ? 'flex' : ''
                        } ${isUrgent ? 'ring-2 ring-orange-400/60 shadow-orange-400/20' : ''} ${isExpired ? 'opacity-70' : ''}`}
                      >
                        {/* Enhanced Background Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        {/* Animated Border Effect */}
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-400/20 via-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
                        
                        {/* Status Badges */}
                        {isUrgent && (
                          <motion.div 
                            className="absolute top-6 right-6 z-20"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center shadow-lg border border-orange-400/30">
                              <IconComponent icon={FaBolt} className="mr-1" />
                              URGENT
                            </div>
                          </motion.div>
                        )}
                        
                        {isExpired && (
                          <div className="absolute top-6 right-6 z-20">
                            <div className="bg-slate-600/90 backdrop-blur-sm text-slate-300 px-4 py-2 rounded-full text-xs font-bold border border-slate-500/50">
                              EXPIRED
                            </div>
                          </div>
                        )}

                        <div className={`relative z-10 p-8 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                          {/* Enhanced Header */}
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex-1">
                              <div className="flex items-start gap-4 mb-4">
                                <motion.div 
                                  className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-lg"
                                  whileHover={{ rotate: 360 }}
                                  transition={{ duration: 0.8 }}
                                >
                                  <IconComponent icon={FaAward} className="text-white text-2xl" />
                                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </motion.div>
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors leading-tight mb-2">
                                    {scholarship.title}
                                  </h3>
                                  <p className="text-slate-400 flex items-center text-sm">
                                    <IconComponent icon={FaUniversity} className="mr-2 text-cyan-400" />
                                    {scholarship.university}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <motion.button
                              onClick={() => handleSaveScholarship(scholarship.id)}
                              className={`p-3 rounded-xl transition-all duration-300 ${
                                savedScholarships.includes(scholarship.id)
                                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-white border border-slate-600/50'
                              }`}
                              whileHover={{ scale: 1.1, rotate: 15 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <IconComponent icon={FaBookmark} className="text-lg" />
                            </motion.button>
                          </div>

                          {/* Enhanced Amount and Country Display */}
                          <div className="flex items-center justify-between mb-6 gap-4">
                            <motion.div 
                              className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 backdrop-blur-sm text-emerald-400 px-6 py-3 rounded-2xl font-bold flex items-center border border-emerald-500/30 shadow-lg"
                              whileHover={{ scale: 1.05 }}
                            >
                              <IconComponent icon={FaDollarSign} className="mr-2 text-lg" />
                              <span className="text-lg">{formatAmount(scholarship.amount)}</span>
                            </motion.div>
                            <motion.div 
                              className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 backdrop-blur-sm text-blue-400 px-4 py-2 rounded-xl font-medium border border-blue-500/30"
                              whileHover={{ scale: 1.05 }}
                            >
                              <IconComponent icon={FaGlobe} className="mr-2" />
                              {scholarship.country}
                            </motion.div>
                          </div>

                          {/* Enhanced Description */}
                          <div className="mb-6">
                            <p className="text-slate-300 text-sm leading-relaxed line-clamp-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                              {scholarship.description}
                            </p>
                          </div>

                          {/* Enhanced Details Grid */}
                          <div className="grid grid-cols-1 gap-3 mb-6">
                            <div className="flex items-center text-sm bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
                              <IconComponent icon={HiOutlineLocationMarker} className="mr-3 text-cyan-400 text-base" />
                              <span className="text-slate-300 font-medium">{scholarship.country}</span>
                            </div>
                            <div className="flex items-center text-sm bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
                              <IconComponent icon={HiOutlineAcademicCap} className="mr-3 text-cyan-400 text-base" />
                              <span className="text-slate-300 font-medium">{scholarship.university}</span>
                            </div>
                            <div className="flex items-center text-sm bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
                              <IconComponent icon={FaCalendarAlt} className="mr-3 text-cyan-400 text-base" />
                              <div className="flex items-center justify-between w-full">
                                <span className={`font-medium ${
                                  isUrgent ? 'text-orange-400' : isExpired ? 'text-red-400' : 'text-slate-300'
                                }`}>
                                  {formatDate(scholarship.deadline)}
                                </span>
                                {daysUntilDeadline > 0 && (
                                  <span className="text-xs bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/30">
                                    {daysUntilDeadline} days left
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Enhanced Eligibility Section */}
                          <div className="mb-8">
                            <h4 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center">
                              <IconComponent icon={FaUsers} className="mr-2" />
                              Eligibility Requirements
                            </h4>
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                              <p className="text-slate-300 text-sm leading-relaxed line-clamp-3">
                                {scholarship.eligibility}
                              </p>
                            </div>
                          </div>

                          {/* Enhanced Action Buttons */}
                          <div className="flex gap-4">
                            <motion.a
                              href={scholarship.application_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex-1 py-4 px-6 rounded-2xl font-semibold flex items-center justify-center transition-all duration-300 ${
                                isExpired 
                                  ? 'bg-slate-700/50 text-slate-400 cursor-not-allowed border border-slate-600/50'
                                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-2xl hover:shadow-cyan-500/25 border border-cyan-400/30'
                              }`}
                              whileHover={!isExpired ? { scale: 1.02, y: -2 } : {}}
                              whileTap={!isExpired ? { scale: 0.98 } : {}}
                              onClick={isExpired ? (e) => e.preventDefault() : undefined}
                            >
                              {isExpired ? (
                                <>
                                  <IconComponent icon={FaClock} className="mr-2" />
                                  Mission Expired
                                </>
                              ) : (
                                <>
                                  <IconComponent icon={FaRocket} className="mr-2" />
                                  Launch Application
                                  <IconComponent icon={FaExternalLinkAlt} className="ml-2 text-sm" />
                                </>
                              )}
                            </motion.a>
                            
                            <motion.button
                              className="px-6 py-4 bg-slate-700/50 text-slate-300 rounded-2xl hover:bg-slate-600/50 hover:text-white transition-all duration-300 border border-slate-600/50"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              title="View Full Details"
                            >
                              <IconComponent icon={FaEye} className="text-lg" />
                            </motion.button>
                          </div>
                        </div>

                        {/* Enhanced Bottom Accent */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        {/* Corner Accent */}
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-cyan-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <motion.div 
                className="flex justify-center items-center mt-16 gap-3"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <motion.button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-4 rounded-2xl bg-white/10 backdrop-blur-md shadow-lg border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <IconComponent icon={FaChevronLeft} className="text-white" />
                </motion.button>
                
                <div className="flex gap-2">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <motion.button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-6 py-4 rounded-2xl font-medium transition-all duration-300 ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20 shadow-lg border border-white/20 backdrop-blur-md'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {page}
                      </motion.button>
                    );
                  })}
                </div>
                
                <motion.button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-4 rounded-2xl bg-white/10 backdrop-blur-md shadow-lg border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <IconComponent icon={FaChevronRight} className="text-white" />
                </motion.button>
              </motion.div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Scholarships; 