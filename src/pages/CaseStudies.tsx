import React, { useState, useEffect } from 'react';
import { FaGraduationCap, FaUniversity, FaChartLine, FaStar, FaFilter, FaSearch, FaCheck, FaTimesCircle, FaEye, FaHeart, FaCalendarAlt, FaMapMarkerAlt, FaAward, FaSpinner, FaTimes } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
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
    featured: false,
  });
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<CaseStudy | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [outcomes, setOutcomes] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load case studies and filter options
  useEffect(() => {
    loadCaseStudies();
    loadFilterOptions();
  }, [currentPage, activeFilters, searchQuery]);

  const loadCaseStudies = async () => {
    try {
      setLoading(true);
      const result = await caseStudyAPI.getAll(
        currentPage,
        12,
        activeFilters.category || undefined,
        activeFilters.outcome || undefined,
        activeFilters.country || undefined,
        activeFilters.field || undefined,
        searchQuery || undefined,
        activeFilters.featured || undefined
      );
      
      if (result.success && result.data && Array.isArray(result.data.caseStudies)) {
        setCaseStudies(result.data.caseStudies);
        setTotalPages(result.data.pagination?.totalPages || 1);
      } else {
        console.error('Failed to load success stories:', result.error);
        // Use sample data as fallback
        setCaseStudies(sampleCaseStudies);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error loading success stories:', error);
      // Use sample data as fallback
      setCaseStudies(sampleCaseStudies);
      setTotalPages(1);
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

      // Ensure arrays are always set, even if API fails
      if (categoriesResult.success && Array.isArray(categoriesResult.data)) {
        setCategories(categoriesResult.data);
      } else {
        setCategories([]);
      }
      
      if (outcomesResult.success && Array.isArray(outcomesResult.data)) {
        setOutcomes(outcomesResult.data);
      } else {
        setOutcomes([]);
      }
      
      if (countriesResult.success && Array.isArray(countriesResult.data)) {
        setCountries(countriesResult.data);
      } else {
        setCountries([]);
      }
      
      if (fieldsResult.success && Array.isArray(fieldsResult.data)) {
        setFields(fieldsResult.data);
      } else {
        setFields([]);
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
      // Set empty arrays on error to prevent map errors
      setCategories([]);
      setOutcomes([]);
      setCountries([]);
      setFields([]);
    }
  };

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
      featured: false,
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  const openModal = (caseStudy: CaseStudy) => {
    setSelectedCaseStudy(caseStudy);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedCaseStudy(null);
    setShowModal(false);
  };

  // Sample case studies data for fallback
  const sampleCaseStudies: CaseStudy[] = [
    {
      id: "1",
      title: "From Community College to Harvard: A Journey of Determination",
      subtitle: "Breaking barriers through academic excellence",
      description: "Sarah's inspiring journey from a small community college to Harvard University, overcoming financial challenges and academic obstacles to achieve her dream of studying computer science at one of the world's top universities.",
      student_name: "Sarah Johnson",
      student_image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
      student_background: "First-generation college student",
      previous_education: "Community College - Computer Science",
      target_program: "Master of Science in Computer Science",
      target_university: "Harvard University",
      target_country: "United States",
      outcome: "Accepted with Full Scholarship",
      scholarship_amount: 75000,
      scholarship_currency: "USD",
      application_year: 2023,
      story_content: "Sarah's journey began at a local community college where she discovered her passion for computer science. Despite facing financial hardships and being a first-generation college student, she maintained a perfect GPA while working part-time to support her family. Her dedication to research and community service caught the attention of Harvard's admissions committee.",
      challenges_faced: ["Financial constraints", "Limited research opportunities", "First-generation college student"],
      strategies_used: ["Maintained perfect GPA", "Engaged in community service", "Sought mentorship", "Applied for multiple scholarships"],
      advice_given: ["Start early with applications", "Don't let background limit your dreams", "Seek mentorship and guidance", "Focus on both academics and extracurriculars"],
      timeline: "18 months",
      featured: true,
      category: "Computer Science",
      field_of_study: "Technology",
      tags: ["Harvard", "Full Scholarship", "Computer Science", "First-Generation"],
      reading_time: 8,
      views: 15420,
      likes: 892,
      status: "published",
      created_at: "2024-01-15T00:00:00Z",
      updated_at: "2024-01-15T00:00:00Z"
    },
    {
      id: "2",
      title: "Medical Dreams Realized: From Rural India to Johns Hopkins",
      subtitle: "Overcoming geographical and financial barriers",
      description: "Raj's remarkable transformation from a rural village in India to becoming a medical student at Johns Hopkins University, showcasing how determination and strategic planning can overcome any obstacle.",
      student_name: "Raj Patel",
      student_image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      student_background: "Rural village background",
      previous_education: "MBBS from Government Medical College",
      target_program: "MD in Internal Medicine",
      target_university: "Johns Hopkins University",
      target_country: "United States",
      outcome: "Accepted with Partial Scholarship",
      scholarship_amount: 45000,
      scholarship_currency: "USD",
      application_year: 2023,
      story_content: "Growing up in a small village with limited access to quality education, Raj's journey to Johns Hopkins seemed impossible. Through online learning, self-study, and unwavering determination, he not only excelled in his medical studies but also conducted groundbreaking research that impressed international admissions committees.",
      challenges_faced: ["Limited internet access", "Language barriers", "Financial constraints", "Lack of guidance"],
      strategies_used: ["Online learning platforms", "Research publications", "International medical conferences", "Strong recommendation letters"],
      advice_given: ["Leverage online resources", "Build strong research portfolio", "Network with international professionals", "Prepare thoroughly for standardized tests"],
      timeline: "24 months",
      featured: true,
      category: "Medicine",
      field_of_study: "Healthcare",
      tags: ["Johns Hopkins", "Medicine", "International Student", "Research"],
      reading_time: 12,
      views: 23150,
      likes: 1456,
      status: "published",
      created_at: "2024-01-10T00:00:00Z",
      updated_at: "2024-01-10T00:00:00Z"
    },
    {
      id: "3",
      title: "Engineering Excellence: MIT Bound Against All Odds",
      subtitle: "From public school to prestigious engineering program",
      description: "Maria's inspiring story of how she went from a underfunded public school to MIT's prestigious engineering program, proving that passion and perseverance can overcome any educational disadvantage.",
      student_name: "Maria Rodriguez",
      student_image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
      student_background: "Public school student",
      previous_education: "Bachelor of Engineering - Mechanical",
      target_program: "Master of Science in Mechanical Engineering",
      target_university: "Massachusetts Institute of Technology",
      target_country: "United States",
      outcome: "Accepted with Research Assistantship",
      scholarship_amount: 55000,
      scholarship_currency: "USD",
      application_year: 2023,
      story_content: "Maria attended an underfunded public school where advanced STEM courses were limited. She taught herself advanced mathematics and physics, participated in online engineering competitions, and built impressive projects in her garage. Her innovative approach to problem-solving and self-directed learning impressed MIT's admissions committee.",
      challenges_faced: ["Limited STEM resources", "No advanced courses", "Financial limitations", "Lack of engineering mentors"],
      strategies_used: ["Self-directed learning", "Online competitions", "DIY engineering projects", "Community college courses"],
      advice_given: ["Take initiative in learning", "Build practical projects", "Participate in competitions", "Seek online mentorship"],
      timeline: "20 months",
      featured: false,
      category: "Engineering",
      field_of_study: "Technology",
      tags: ["MIT", "Engineering", "Self-taught", "Innovation"],
      reading_time: 10,
      views: 18750,
      likes: 1123,
      status: "published",
      created_at: "2024-01-05T00:00:00Z",
      updated_at: "2024-01-05T00:00:00Z"
    },
    {
      id: "4",
      title: "Business Leadership at Wharton: From Startup Failure to Success",
      subtitle: "Turning entrepreneurial setbacks into MBA admission gold",
      description: "Alex's journey from a failed startup to Wharton's MBA program, demonstrating how failures can be transformed into compelling success stories that resonate with top business schools.",
      student_name: "Alex Chen",
      student_image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      student_background: "Failed entrepreneur",
      previous_education: "Bachelor of Business Administration",
      target_program: "Master of Business Administration",
      target_university: "Wharton School, University of Pennsylvania",
      target_country: "United States",
      outcome: "Accepted with Merit Scholarship",
      scholarship_amount: 40000,
      scholarship_currency: "USD",
      application_year: 2023,
      story_content: "After his tech startup failed spectacularly, Alex could have given up on his entrepreneurial dreams. Instead, he analyzed his failures, gained valuable corporate experience, and crafted a compelling narrative about learning from setbacks. His honest reflection on failure and growth mindset impressed Wharton's admissions committee.",
      challenges_faced: ["Startup failure", "Financial losses", "Damaged confidence", "Explaining failure in applications"],
      strategies_used: ["Honest self-reflection", "Corporate experience", "Leadership roles", "Strong essays about growth"],
      advice_given: ["Embrace and learn from failures", "Show growth and resilience", "Gain diverse experiences", "Craft authentic narratives"],
      timeline: "15 months",
      featured: false,
      category: "Business",
      field_of_study: "Business Administration",
      tags: ["Wharton", "MBA", "Entrepreneurship", "Resilience"],
      reading_time: 9,
      views: 12340,
      likes: 789,
      status: "published",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z"
    },
    {
      id: "5",
      title: "Oxford Dreams: A Refugee's Path to Academic Excellence",
      subtitle: "From displacement to prestigious scholarship",
      description: "Amira's extraordinary journey from a refugee camp to Oxford University, showcasing how education can be a powerful tool for transformation and hope in the face of adversity.",
      student_name: "Amira Hassan",
      student_image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face",
      student_background: "Refugee background",
      previous_education: "Bachelor of Arts in Literature",
      target_program: "Master of Philosophy in English Literature",
      target_university: "Oxford University",
      target_country: "United Kingdom",
      outcome: "Accepted with Rhodes Scholarship",
      scholarship_amount: 60000,
      scholarship_currency: "GBP",
      application_year: 2023,
      story_content: "Amira spent her teenage years in a refugee camp where educational resources were scarce. Through determination and the help of volunteer teachers, she not only completed her education but excelled academically. Her unique perspective on literature and her commitment to using education to help other refugees made her a standout Rhodes Scholar candidate.",
      challenges_faced: ["Displacement", "Limited educational resources", "Language barriers", "Trauma and uncertainty"],
      strategies_used: ["Volunteer teacher support", "Online learning", "Community involvement", "Powerful personal statement"],
      advice_given: ["Use your unique story", "Seek community support", "Focus on helping others", "Never give up on education"],
      timeline: "30 months",
      featured: true,
      category: "Literature",
      field_of_study: "Humanities",
      tags: ["Oxford", "Rhodes Scholar", "Refugee", "Literature"],
      reading_time: 15,
      views: 28900,
      likes: 2134,
      status: "published",
      created_at: "2023-12-20T00:00:00Z",
      updated_at: "2023-12-20T00:00:00Z"
    },
    {
      id: "6",
      title: "Breaking Barriers: First in Family to Attend Cambridge",
      subtitle: "Pioneering higher education in the family",
      description: "James's groundbreaking achievement as the first person in his family to attend university, culminating in acceptance to Cambridge University's prestigious physics program.",
      student_name: "James Thompson",
      student_image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
      student_background: "First-generation university student",
      previous_education: "A-Levels in Physics, Mathematics, Chemistry",
      target_program: "Bachelor of Arts in Natural Sciences (Physics)",
      target_university: "Cambridge University",
      target_country: "United Kingdom",
      outcome: "Accepted with Full Bursary",
      scholarship_amount: 35000,
      scholarship_currency: "GBP",
      application_year: 2023,
      story_content: "Coming from a working-class family where no one had ever attended university, James had to navigate the complex world of higher education applications entirely on his own. His exceptional performance in physics and his determination to break the cycle of limited educational opportunities in his family impressed Cambridge admissions tutors.",
      challenges_faced: ["No family guidance", "Financial constraints", "Imposter syndrome", "Complex application process"],
      strategies_used: ["School counselor support", "Online research", "University outreach programs", "Strong academic performance"],
      advice_given: ["Seek guidance from school counselors", "Use university outreach programs", "Don't let background limit aspirations", "Focus on academic excellence"],
      timeline: "12 months",
      featured: false,
      category: "Physics",
      field_of_study: "Natural Sciences",
      tags: ["Cambridge", "Physics", "First-Generation", "Full Bursary"],
      reading_time: 7,
      views: 9876,
      likes: 567,
      status: "published",
      created_at: "2023-12-15T00:00:00Z",
      updated_at: "2023-12-15T00:00:00Z"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-teal-600 to-blue-600 text-white py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute w-64 h-64 bg-white/10 rounded-full"
              style={{ top: '10%', left: '10%' }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute w-48 h-48 bg-orange-400/20 rounded-full"
              style={{ top: '60%', right: '15%' }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
            />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.h1 
                className="text-4xl md:text-6xl font-bold mb-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Success Stories
              </motion.h1>
              <motion.p 
                className="text-xl md:text-2xl text-teal-100 mb-8 max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Inspiring journeys of students who achieved their dreams through determination and strategic planning
              </motion.p>
              
              <motion.div 
                className="flex flex-wrap justify-center gap-4 text-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <motion.div 
                  className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2"
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.3)" }}
                  transition={{ duration: 0.2 }}
                >
                  <IconComponent icon={FaGraduationCap} className="text-white" />
                  <span>{caseStudies.length}+ Success Stories</span>
                </motion.div>
                <motion.div 
                  className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2"
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.3)" }}
                  transition={{ duration: 0.2 }}
                >
                  <IconComponent icon={FaUniversity} className="text-white" />
                  <span>Top Universities</span>
                </motion.div>
                <motion.div 
                  className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2"
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.3)" }}
                  transition={{ duration: 0.2 }}
                >
                  <IconComponent icon={FaAward} className="text-white" />
                  <span>Scholarship Winners</span>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Search and Filters Section */}
        <section className="py-8 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="flex flex-col lg:flex-row gap-6 items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Search Bar */}
              <div className="flex-1 max-w-2xl">
                <div className="relative">
                  <IconComponent icon={FaSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search success stories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent shadow-sm transition-all duration-200 hover:shadow-md"
                  />
                </div>
              </div>

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
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white transition-all duration-200 hover:border-teal-300"
                >
                  <option value="">All Categories</option>
                  {(categories || []).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                <select
                  value={activeFilters.outcome}
                  onChange={(e) => toggleFilter('outcome', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white transition-all duration-200 hover:border-teal-300"
                >
                  <option value="">All Outcomes</option>
                  {(outcomes || []).map(outcome => (
                    <option key={outcome} value={outcome}>{outcome}</option>
                  ))}
                </select>

                <select
                  value={activeFilters.country}
                  onChange={(e) => toggleFilter('country', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white transition-all duration-200 hover:border-teal-300"
                >
                  <option value="">All Countries</option>
                  {(countries || []).map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>

                <select
                  value={activeFilters.field}
                  onChange={(e) => toggleFilter('field', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white transition-all duration-200 hover:border-teal-300"
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
                      ? 'bg-yellow-500 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-yellow-50 border border-gray-300'
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
                  <IconComponent icon={FaSpinner} className="animate-spin text-4xl text-teal-600 mb-4 mx-auto" />
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
                      <div className="h-48 bg-gradient-to-br from-teal-400 to-blue-500 relative overflow-hidden">
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
                          <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
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
                        <h4 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-teal-600 transition-colors">
                          {caseStudy.title}
                        </h4>
                        
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {caseStudy.description}
                        </p>

                        {/* University and Country Info */}
                        <div className="flex flex-wrap gap-2 mb-4 text-sm">
                          {caseStudy.target_university && (
                            <div className="flex items-center gap-1">
                              <IconComponent icon={FaUniversity} className="text-teal-500" />
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
                          <button className="text-teal-600 hover:text-teal-700 font-medium text-sm group-hover:translate-x-1 transition-transform">
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
                    className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
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
                            ? 'bg-teal-600 text-white'
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