import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../utils/LanguageContext';
import { courseAPI } from '../utils/apiService';
import { FaSearch, FaFilter, FaStar, FaUsers, FaClock, FaGraduationCap, FaTimes, FaChevronDown, FaBookmark, FaPlay, FaTag, FaSort } from 'react-icons/fa';
import IconComponent from '../components/ui/IconComponent';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  price: number;
  original_price?: number | null;
  image?: string | null;
  instructor_name: string;
  instructor_bio?: string | null;
  instructor_image?: string | null;
  rating?: number | null;
  total_reviews?: number | null;
  total_students?: number | null;
  featured?: boolean | null;
  status?: string | null;
  tags?: string[] | null;
  created_at: string;
  updated_at: string;
}

const Courses: React.FC = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeLevel, setActiveLevel] = useState('all');
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Sample data as fallback
  const sampleCourses: Course[] = [
    {
      id: '1',
      title: 'Introduction to AI',
      description: 'Learn the fundamentals of Artificial Intelligence and machine learning concepts.',
      category: 'Computer Science',
      level: 'Beginner',
      duration: '8 weeks',
      price: 49.99,
      original_price: 79.99,
      image: 'https://images.unsplash.com/photo-1593376893114-1a66d1013e14?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
      instructor_name: 'Dr. Smith',
      rating: 4.8,
      total_reviews: 1245,
      total_students: 5420,
      featured: true,
      status: 'active',
      tags: ['AI', 'Machine Learning', 'Programming'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      title: 'Business Management',
      description: 'Master essential business management skills and leadership principles.',
      category: 'Business',
      level: 'Intermediate',
      duration: '12 weeks',
      price: 39.99,
      original_price: null,
      image: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
      instructor_name: 'Prof. Johnson',
      rating: 4.6,
      total_reviews: 980,
      total_students: 3200,
      featured: false,
      status: 'active',
      tags: ['Business', 'Management', 'Leadership'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '3',
      title: 'Data Visualization',
      description: 'Create compelling data visualizations and learn advanced analytics techniques.',
      category: 'Data Science',
      level: 'Advanced',
      duration: '10 weeks',
      price: 59.99,
      original_price: 89.99,
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
      instructor_name: 'Sarah Williams',
      rating: 4.9,
      total_reviews: 1560,
      total_students: 4800,
      featured: true,
      status: 'active',
      tags: ['Data Science', 'Visualization', 'Analytics'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '4',
      title: 'UX/UI Design Principles',
      description: 'Learn modern design principles and create user-centered digital experiences.',
      category: 'Design',
      level: 'Beginner',
      duration: '6 weeks',
      price: 44.99,
      original_price: null,
      image: 'https://images.unsplash.com/photo-1517292987719-0369a794ec0f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
      instructor_name: 'Mike Robertson',
      rating: 4.7,
      total_reviews: 1100,
      total_students: 2900,
      featured: false,
      status: 'active',
      tags: ['Design', 'UX', 'UI', 'User Experience'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '5',
      title: 'Mechanical Engineering Basics',
      description: 'Understand fundamental mechanical engineering concepts and applications.',
      category: 'Engineering',
      level: 'Intermediate',
      duration: '14 weeks',
      price: 54.99,
      original_price: 74.99,
      image: 'https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
      instructor_name: 'Dr. Chen',
      rating: 4.5,
      total_reviews: 875,
      total_students: 1800,
      featured: false,
      status: 'active',
      tags: ['Engineering', 'Mechanical', 'Physics'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '6',
      title: 'Web Development Bootcamp',
      description: 'Complete full-stack web development course from beginner to advanced.',
      category: 'Computer Science',
      level: 'Beginner',
      duration: '16 weeks',
      price: 79.99,
      original_price: 129.99,
      image: 'https://images.unsplash.com/photo-1605379399642-870262d3d051?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
      instructor_name: 'Jessica Lee',
      rating: 4.8,
      total_reviews: 2200,
      total_students: 8500,
      featured: true,
      status: 'active',
      tags: ['Web Development', 'Programming', 'Full Stack'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];

  useEffect(() => {
    loadCourses();
    loadFilterOptions();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading courses...');
      
      const response = await courseAPI.getAll();
      console.log('Courses API response:', response);
      
      if (response.success && response.data) {
        let coursesData = response.data;
        
        // Handle different API response structures
        if (coursesData && coursesData.courses && Array.isArray(coursesData.courses)) {
          coursesData = coursesData.courses;
        } else if (coursesData && Array.isArray(coursesData.data)) {
          coursesData = coursesData.data;
        } else if (!Array.isArray(coursesData)) {
          console.warn('Unexpected courses data structure:', coursesData);
          coursesData = sampleCourses;
        }
        
        console.log('Setting courses:', coursesData);
        setCourses(Array.isArray(coursesData) ? coursesData : sampleCourses);
      } else {
        console.warn('API response not successful, using sample data');
        setCourses(sampleCourses);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      setError('Failed to load courses. Showing sample data.');
      setCourses(sampleCourses);
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      console.log('Loading filter options...');
      
      const [categoriesRes, levelsRes] = await Promise.all([
        courseAPI.getCategories(),
        courseAPI.getLevels()
      ]);
      
      console.log('Categories response:', categoriesRes);
      console.log('Levels response:', levelsRes);
      
      if (categoriesRes.success && categoriesRes.data) {
        let categoriesData = categoriesRes.data;
        if (categoriesData.categories && Array.isArray(categoriesData.categories)) {
          categoriesData = categoriesData.categories;
        } else if (!Array.isArray(categoriesData)) {
          categoriesData = Array.from(new Set(sampleCourses.map(course => course.category)));
        }
        setCategories(categoriesData);
      } else {
        const uniqueCategories = Array.from(new Set(sampleCourses.map(course => course.category)));
        setCategories(uniqueCategories);
      }
      
      if (levelsRes.success && levelsRes.data) {
        let levelsData = levelsRes.data;
        if (levelsData.levels && Array.isArray(levelsData.levels)) {
          levelsData = levelsData.levels;
        } else if (!Array.isArray(levelsData)) {
          levelsData = Array.from(new Set(sampleCourses.map(course => course.level)));
        }
        setLevels(levelsData);
      } else {
        const uniqueLevels = Array.from(new Set(sampleCourses.map(course => course.level)));
        setLevels(uniqueLevels);
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
      // Extract from current courses or sample data
      const uniqueCategories = Array.from(new Set((courses.length > 0 ? courses : sampleCourses).map(course => course.category)));
      const uniqueLevels = Array.from(new Set((courses.length > 0 ? courses : sampleCourses).map(course => course.level)));
      setCategories(uniqueCategories);
      setLevels(uniqueLevels);
    }
  };

  // Enhanced filtering logic
  const filteredCourses = courses.filter((course) => {
    // Search filter - check title, description, instructor, tags, and category
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = course.title.toLowerCase().includes(query);
      const matchesDescription = course.description.toLowerCase().includes(query);
      const matchesInstructor = course.instructor_name.toLowerCase().includes(query);
      const matchesTags = course.tags && course.tags.some(tag => tag.toLowerCase().includes(query));
      const matchesCategory = course.category.toLowerCase().includes(query);
      
      if (!matchesTitle && !matchesDescription && !matchesInstructor && !matchesTags && !matchesCategory) {
        return false;
      }
    }
    
    // Category filter
    if (activeCategory !== 'all' && course.category !== activeCategory) {
      return false;
    }
    
    // Level filter
    if (activeLevel !== 'all' && course.level !== activeLevel) {
      return false;
    }
    
    // Price range filter
    if (course.price < priceRange[0] || course.price > priceRange[1]) {
      return false;
    }
    
    return true;
  });

  // Sort courses
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'students':
        return (b.total_students || 0) - (a.total_students || 0);
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'featured':
      default:
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    }
  });

  const renderStars = (rating: number | null | undefined) => {
    const safeRating = rating || 0;
    return Array.from({ length: 5 }, (_, i) => (
      <IconComponent 
        key={i} 
        icon={FaStar}
        className={i < Math.floor(safeRating) ? 'text-yellow-400' : 'text-gray-300'} 
      />
    ));
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setActiveCategory('all');
    setActiveLevel('all');
    setPriceRange([0, 1000]);
    setSortBy('featured');
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50">
        <Header />
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  console.log('Rendering courses:', courses.length, 'filtered:', sortedCourses.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50">
      <Header />
      <main className="flex-grow">
        {/* Hero Section with Enhanced Search */}
        <motion.section 
          className="bg-gradient-to-r from-teal-600 via-teal-700 to-blue-800 text-white py-20 relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Background elements */}
          <motion.div 
            className="absolute top-0 right-0 w-96 h-96 bg-teal-500 rounded-full opacity-20" 
            animate={{
              x: [0, 20, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            style={{ filter: 'blur(70px)', top: '-20%', right: '5%' }}
          />
          <motion.div 
            className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 rounded-full opacity-10" 
            animate={{
              x: [0, -30, 0],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            style={{ filter: 'blur(50px)', bottom: '-10%', left: '10%' }}
          />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <motion.h1 
                className="text-5xl md:text-6xl font-bold mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Discover Amazing Courses
              </motion.h1>
              <motion.p 
                className="text-xl md:text-2xl mb-12 text-teal-100"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                Learn from industry experts and advance your career with our comprehensive course catalog
              </motion.p>
              
              {/* Enhanced Search Bar */}
              <motion.div 
                className="max-w-4xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="bg-white rounded-2xl p-2 shadow-2xl">
                  <div className="flex flex-col lg:flex-row gap-2">
                    {/* Search Input */}
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Search courses, instructors, or topics..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-6 py-4 pl-12 bg-gray-50 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-lg"
                      />
                      <IconComponent icon={FaSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <IconComponent icon={FaTimes} />
                        </button>
                      )}
                    </div>
                    
                    {/* Quick Filters */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={activeCategory}
                        onChange={(e) => setActiveCategory(e.target.value)}
                        className="px-4 py-4 bg-gray-50 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[150px]"
                      >
                        <option value="all">All Categories</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                      
                      <select
                        value={activeLevel}
                        onChange={(e) => setActiveLevel(e.target.value)}
                        className="px-4 py-4 bg-gray-50 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[130px]"
                      >
                        <option value="all">All Levels</option>
                        {levels.map((level) => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                      
                      <motion.button
                        className="px-6 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        <IconComponent icon={FaFilter} />
                        <span className="hidden sm:inline">More Filters</span>
                        <IconComponent icon={FaChevronDown} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Main Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar Filters */}
              <motion.div 
                className="lg:w-1/4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Filters</h3>
                    {(searchQuery || activeCategory !== 'all' || activeLevel !== 'all') && (
                      <button
                        onClick={clearAllFilters}
                        className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Categories */}
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-700 mb-3">Categories</h4>
                    <div className="space-y-2">
                      <motion.button
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          activeCategory === 'all'
                            ? 'bg-teal-100 text-teal-800 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setActiveCategory('all')}
                        whileHover={{ x: 2 }}
                      >
                        All Categories ({courses.length})
                      </motion.button>
                      {categories.map((category) => {
                        const count = courses.filter(c => c.category === category).length;
                        return (
                          <motion.button
                            key={category}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                              activeCategory === category
                                ? 'bg-teal-100 text-teal-800 font-medium'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                            onClick={() => setActiveCategory(category)}
                            whileHover={{ x: 2 }}
                          >
                            {category} ({count})
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Levels */}
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-700 mb-3">Levels</h4>
                    <div className="space-y-2">
                      <motion.button
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          activeLevel === 'all'
                            ? 'bg-blue-100 text-blue-800 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setActiveLevel('all')}
                        whileHover={{ x: 2 }}
                      >
                        All Levels
                      </motion.button>
                      {levels.map((level) => {
                        const count = courses.filter(c => c.level === level).length;
                        return (
                          <motion.button
                            key={level}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                              activeLevel === level
                                ? 'bg-blue-100 text-blue-800 font-medium'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                            onClick={() => setActiveLevel(level)}
                            whileHover={{ x: 2 }}
                          >
                            {level} ({count})
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-700 mb-3">
                      Price Range: ${priceRange[0]} - ${priceRange[1]}
                    </h4>
                    <div className="space-y-3">
                      <input
                        type="range"
                        min="0"
                        max="1000"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                        className="w-full"
                      />
                      <input
                        type="range"
                        min="0"
                        max="1000"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Popular Tags */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-700 mb-3">Popular Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(courses.flatMap(course => course.tags || []))).slice(0, 10).map(tag => (
                        <motion.button
                          key={tag}
                          className="bg-gray-100 hover:bg-teal-100 hover:text-teal-800 text-gray-700 text-xs font-medium px-3 py-1 rounded-full transition-colors"
                          onClick={() => setSearchQuery(tag)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          #{tag}
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 bg-white rounded-xl shadow-lg p-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      {activeCategory === 'all' ? 'All Courses' : activeCategory}
                      {searchQuery && (
                        <span className="text-lg font-normal text-gray-600 ml-2">
                          - Results for "{searchQuery}"
                        </span>
                      )}
                    </h2>
                    <p className="text-gray-600">
                      Showing {sortedCourses.length} course{sortedCourses.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-4 sm:mt-0">
                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-2">
                      <IconComponent icon={FaSort} className="text-gray-500" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                      >
                        <option value="featured">Featured First</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="rating">Highest Rated</option>
                        <option value="students">Most Popular</option>
                        <option value="newest">Newest First</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Active Filters */}
                {(searchQuery || activeCategory !== 'all' || activeLevel !== 'all') && (
                  <motion.div 
                    className="mb-6 bg-white rounded-xl shadow-lg p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-gray-600 font-medium">Active filters:</span>
                      {searchQuery && (
                        <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                          Search: "{searchQuery}"
                          <button onClick={() => setSearchQuery('')}>
                            <IconComponent icon={FaTimes} className="text-xs" />
                          </button>
                        </span>
                      )}
                      {activeCategory !== 'all' && (
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                          Category: {activeCategory}
                          <button onClick={() => setActiveCategory('all')}>
                            <IconComponent icon={FaTimes} className="text-xs" />
                          </button>
                        </span>
                      )}
                      {activeLevel !== 'all' && (
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                          Level: {activeLevel}
                          <button onClick={() => setActiveLevel('all')}>
                            <IconComponent icon={FaTimes} className="text-xs" />
                          </button>
                        </span>
                      )}
                      <button
                        onClick={clearAllFilters}
                        className="text-gray-500 hover:text-gray-700 text-sm underline ml-2"
                      >
                        Clear all
                      </button>
                    </div>
                  </motion.div>
                )}
                
                {/* Courses Grid */}
                {sortedCourses.length > 0 ? (
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {sortedCourses.map((course) => (
                      <motion.div
                        key={course.id}
                        className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group"
                        variants={itemVariants}
                        whileHover={{ y: -8, scale: 1.02 }}
                      >
                        <div className="relative overflow-hidden">
                          <img 
                            src={course.image || '/api/placeholder/400/250'} 
                            alt={course.title}
                            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm font-bold text-teal-600 shadow-md">
                            ${course.price}
                            {course.original_price && course.original_price > course.price && (
                              <span className="text-xs text-gray-500 line-through ml-1">${course.original_price}</span>
                            )}
                          </div>
                          {course.featured && (
                            <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                              Featured
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                            <motion.button
                              className="bg-white text-teal-600 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <IconComponent icon={FaPlay} />
                            </motion.button>
                          </div>
                        </div>
                        
                        <div className="p-6 flex-1 flex flex-col">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="bg-teal-100 text-teal-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                              {course.category}
                            </span>
                            <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
                              {course.level}
                            </span>
                          </div>
                          
                          <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 flex-shrink-0 group-hover:text-teal-600 transition-colors">
                            {course.title}
                          </h3>
                          <p className="text-gray-600 mb-4 text-sm line-clamp-3 flex-1">{course.description}</p>
                          
                          <div className="flex items-center mb-4">
                            <img 
                              src={course.instructor_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructor_name)}&background=0ea5e9&color=fff`}
                              alt={course.instructor_name}
                              className="w-8 h-8 rounded-full mr-3"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{course.instructor_name}</p>
                              <div className="flex items-center">
                                <div className="flex gap-1 mr-2">
                                  {renderStars(course.rating)}
                                </div>
                                <span className="text-xs text-gray-600">
                                  {course.rating || 0} ({course.total_reviews?.toLocaleString() || 0})
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <IconComponent icon={FaUsers} className="mr-1" />
                              <span>{course.total_students?.toLocaleString() || 0} students</span>
                            </div>
                            <div className="flex items-center">
                              <IconComponent icon={FaClock} className="mr-1" />
                              <span>{course.duration}</span>
                            </div>
                          </div>
                          
                          {/* Tags */}
                          {course.tags && course.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-4">
                              {course.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex gap-2 mt-auto">
                            <motion.button
                              className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white py-3 px-4 rounded-lg font-medium transition-all text-sm shadow-lg"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              Enroll Now
                            </motion.button>
                            <motion.button
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-lg transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <IconComponent icon={FaBookmark} />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    className="text-center py-16 bg-white rounded-xl shadow-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <IconComponent icon={FaGraduationCap} className="mx-auto text-6xl text-gray-300 mb-4" />
                    <h3 className="text-2xl font-semibold text-gray-600 mb-2">No item found</h3>
                    <p className="text-gray-500 mb-6">Try adjusting your search terms or filters to find what you're looking for.</p>
                    <motion.button
                      onClick={clearAllFilters}
                      className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Clear all filters
                    </motion.button>
                  </motion.div>
                )}
                
                {/* Debug Info */}
                {error && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800">{error}</p>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Courses; 