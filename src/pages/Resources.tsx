import React, { useState, useEffect } from 'react';
import { FaGraduationCap, FaBook, FaFileAlt, FaBriefcase, FaSearch, FaRegFileAlt, FaDownload, FaVideo, FaFilter, FaChevronDown, FaTimes, FaSort, FaEye, FaBookmark, FaPlay } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import IconComponent from '../components/ui/IconComponent';
import { motion } from 'framer-motion';
import { fetchResponses, fetchResponseCategories, fetchResponseTypes } from '../utils/apiService';

interface Resource {
  id: string;
  title: string;
  type: 'guide' | 'template' | 'checklist' | 'video' | 'webinar' | 'ebook';
  category: 'application' | 'study' | 'test-prep' | 'career';
  description: string;
  thumbnail: string;
  url?: string;
  download_link?: string;
  video_link?: string;
  featured?: boolean;
  tags: string[];
  downloads: number;
  views?: number;
  created_at: string;
  updated_at: string;
}

const Resources: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeType, setActiveType] = useState('all');
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('featured');

  // Sample data as fallback
  const sampleResources: Resource[] = [
    {
      id: '1',
      title: 'University Application Guide 2024',
      type: 'guide',
      category: 'application',
      description: 'Complete step-by-step guide for university applications including essays, recommendations, and deadlines.',
      thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      download_link: '#',
      featured: true,
      tags: ['Application', 'University', 'Guide', 'Essays'],
      downloads: 2450,
      views: 5200,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z'
    },
    {
      id: '2',
      title: 'Study Schedule Template',
      type: 'template',
      category: 'study',
      description: 'Customizable study schedule template to help you organize your academic workload effectively.',
      thumbnail: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      download_link: '#',
      featured: false,
      tags: ['Study', 'Template', 'Organization', 'Planning'],
      downloads: 1890,
      views: 3400,
      created_at: '2024-01-10T00:00:00Z',
      updated_at: '2024-01-10T00:00:00Z'
    },
    {
      id: '3',
      title: 'SAT Preparation Checklist',
      type: 'checklist',
      category: 'test-prep',
      description: 'Comprehensive checklist to ensure you are fully prepared for the SAT exam.',
      thumbnail: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      download_link: '#',
      featured: true,
      tags: ['SAT', 'Test Prep', 'Checklist', 'Exam'],
      downloads: 3200,
      views: 6800,
      created_at: '2024-01-05T00:00:00Z',
      updated_at: '2024-01-05T00:00:00Z'
    },
    {
      id: '4',
      title: 'Career Planning Workshop',
      type: 'video',
      category: 'career',
      description: 'Interactive video workshop on career planning and professional development strategies.',
      thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      video_link: '#',
      featured: false,
      tags: ['Career', 'Workshop', 'Professional', 'Development'],
      downloads: 0,
      views: 2100,
      created_at: '2023-12-28T00:00:00Z',
      updated_at: '2023-12-28T00:00:00Z'
    },
    {
      id: '5',
      title: 'Scholarship Application E-book',
      type: 'ebook',
      category: 'application',
      description: 'Comprehensive e-book covering scholarship opportunities and application strategies.',
      thumbnail: 'https://images.unsplash.com/photo-1532649538693-f3a2ec1bf8bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      download_link: '#',
      featured: true,
      tags: ['Scholarship', 'E-book', 'Application', 'Funding'],
      downloads: 1650,
      views: 4200,
      created_at: '2023-12-20T00:00:00Z',
      updated_at: '2023-12-20T00:00:00Z'
    },
    {
      id: '6',
      title: 'Study Techniques Webinar',
      type: 'webinar',
      category: 'study',
      description: 'Live webinar recording on effective study techniques and memory improvement methods.',
      thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      video_link: '#',
      featured: false,
      tags: ['Study', 'Webinar', 'Techniques', 'Memory'],
      downloads: 0,
      views: 1800,
      created_at: '2023-12-15T00:00:00Z',
      updated_at: '2023-12-15T00:00:00Z'
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading resources...');
      
      const [responsesData, categoriesData, typesData] = await Promise.all([
        fetchResponses(),
        fetchResponseCategories(),
        fetchResponseTypes()
      ]);
      
      console.log('Resources API responses:', { responsesData, categoriesData, typesData });
      
      // Handle resources data
      if (responsesData && responsesData.responses && Array.isArray(responsesData.responses)) {
        setResources(responsesData.responses);
      } else {
        console.warn('Using sample resources data');
        setResources(sampleResources);
      }
      
      // Handle categories data
      if (categoriesData && categoriesData.categories && Array.isArray(categoriesData.categories)) {
        setCategories(categoriesData.categories);
      } else {
        const uniqueCategories = Array.from(new Set(sampleResources.map(resource => resource.category)));
        setCategories(uniqueCategories);
      }
      
      // Handle types data
      if (typesData && typesData.types && Array.isArray(typesData.types)) {
        setTypes(typesData.types);
      } else {
        const uniqueTypes = Array.from(new Set(sampleResources.map(resource => resource.type)));
        setTypes(uniqueTypes);
      }
    } catch (err) {
      console.error('Error loading resources:', err);
      setError('Failed to load resources. Showing sample data.');
      setResources(sampleResources);
      const uniqueCategories = Array.from(new Set(sampleResources.map(resource => resource.category)));
      const uniqueTypes = Array.from(new Set(sampleResources.map(resource => resource.type)));
      setCategories(uniqueCategories);
      setTypes(uniqueTypes);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced filtering logic
  const filteredResources = resources.filter(resource => {
    // Search filter - check title, description, and tags
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = resource.title.toLowerCase().includes(query);
      const matchesDescription = resource.description.toLowerCase().includes(query);
      const matchesTags = resource.tags && resource.tags.some(tag => tag.toLowerCase().includes(query));
      
      if (!matchesTitle && !matchesDescription && !matchesTags) {
        return false;
      }
    }
    
    // Category filter
    if (activeCategory !== 'all' && resource.category !== activeCategory) {
      return false;
    }
    
    // Type filter
    if (activeType !== 'all' && resource.type !== activeType) {
      return false;
    }
    
    return true;
  });

  // Sort resources
  const sortedResources = [...filteredResources].sort((a, b) => {
    switch (sortBy) {
      case 'downloads':
        return b.downloads - a.downloads;
      case 'views':
        return (b.views || 0) - (a.views || 0);
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'featured':
      default:
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    }
  });

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

  // Get icon for resource type
  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'guide':
        return <IconComponent icon={FaBook} className="text-teal-600" />;
      case 'template':
        return <IconComponent icon={FaRegFileAlt} className="text-blue-600" />;
      case 'checklist':
        return <IconComponent icon={FaFileAlt} className="text-green-600" />;
      case 'video':
      case 'webinar':
        return <IconComponent icon={FaVideo} className="text-red-600" />;
      case 'ebook':
        return <IconComponent icon={FaBook} className="text-purple-600" />;
      default:
        return <IconComponent icon={FaFileAlt} className="text-gray-600" />;
    }
  };

  // Get icon for resource category
  const getResourceCategoryIcon = (category: string) => {
    switch (category) {
      case 'application':
        return <IconComponent icon={FaFileAlt} className="text-teal-600" />;
      case 'study':
        return <IconComponent icon={FaBook} className="text-blue-600" />;
      case 'test-prep':
        return <IconComponent icon={FaGraduationCap} className="text-orange-600" />;
      case 'career':
        return <IconComponent icon={FaBriefcase} className="text-purple-600" />;
      default:
        return <IconComponent icon={FaFileAlt} className="text-gray-600" />;
    }
  };

  // Get label for resource category
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'application':
        return 'Application Guides';
      case 'study':
        return 'Study Materials';
      case 'test-prep':
        return 'Test Preparation';
      case 'career':
        return 'Career Resources';
      default:
        return category;
    }
  };

  // Get label for resource type
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'guide':
        return 'Guides';
      case 'template':
        return 'Templates';
      case 'checklist':
        return 'Checklists';
      case 'video':
        return 'Videos';
      case 'webinar':
        return 'Webinars';
      case 'ebook':
        return 'E-Books';
      default:
        return type;
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setActiveCategory('all');
    setActiveType('all');
    setSortBy('featured');
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

  console.log('Rendering resources:', resources.length, 'filtered:', sortedResources.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50">
      <Header />
      <main className="flex-grow">
        {/* Hero Section with Enhanced Search */}
        <motion.section 
          className="bg-gradient-to-r from-green-600 via-teal-700 to-blue-800 text-white py-20 relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Background elements */}
          <motion.div 
            className="absolute top-0 right-0 w-96 h-96 bg-green-500 rounded-full opacity-20" 
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
                Educational Resources
              </motion.h1>
              <motion.p 
                className="text-xl md:text-2xl mb-12 text-green-100"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                Access high-quality guides, templates, videos, and more to support your educational journey
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
                        placeholder="Search resources, guides, templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-6 py-4 pl-12 bg-gray-50 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all text-lg"
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
                        className="px-4 py-4 bg-gray-50 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[150px]"
                      >
                        <option value="all">All Categories</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>{getCategoryLabel(category)}</option>
                        ))}
                      </select>
                      
                      <select
                        value={activeType}
                        onChange={(e) => setActiveType(e.target.value)}
                        className="px-4 py-4 bg-gray-50 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[130px]"
                      >
                        <option value="all">All Types</option>
                        {types.map((type) => (
                          <option key={type} value={type}>{getTypeLabel(type)}</option>
                        ))}
                      </select>
                      
                      <motion.button
                        className="px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
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
                    {(searchQuery || activeCategory !== 'all' || activeType !== 'all') && (
                      <button
                        onClick={clearAllFilters}
                        className="text-sm text-green-600 hover:text-green-700 font-medium"
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
                            ? 'bg-green-100 text-green-800 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setActiveCategory('all')}
                        whileHover={{ x: 2 }}
                      >
                        All Categories ({resources.length})
                      </motion.button>
                      {categories.map((category) => {
                        const count = resources.filter(r => r.category === category).length;
                        return (
                          <motion.button
                            key={category}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center ${
                              activeCategory === category
                                ? 'bg-green-100 text-green-800 font-medium'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                            onClick={() => setActiveCategory(category)}
                            whileHover={{ x: 2 }}
                          >
                            <span className="mr-2">{getResourceCategoryIcon(category)}</span>
                            {getCategoryLabel(category)} ({count})
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Types */}
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-700 mb-3">Resource Types</h4>
                    <div className="space-y-2">
                      <motion.button
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          activeType === 'all'
                            ? 'bg-blue-100 text-blue-800 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setActiveType('all')}
                        whileHover={{ x: 2 }}
                      >
                        All Types
                      </motion.button>
                      {types.map((type) => {
                        const count = resources.filter(r => r.type === type).length;
                        return (
                          <motion.button
                            key={type}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center ${
                              activeType === type
                                ? 'bg-blue-100 text-blue-800 font-medium'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                            onClick={() => setActiveType(type)}
                            whileHover={{ x: 2 }}
                          >
                            <span className="mr-2">{getResourceTypeIcon(type)}</span>
                            {getTypeLabel(type)} ({count})
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Popular Tags */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-700 mb-3">Popular Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(resources.flatMap(resource => resource.tags || []))).slice(0, 10).map(tag => (
                        <motion.button
                          key={tag}
                          className="bg-gray-100 hover:bg-green-100 hover:text-green-800 text-gray-700 text-xs font-medium px-3 py-1 rounded-full transition-colors"
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
                      {activeCategory === 'all' && activeType === 'all' 
                        ? 'All Resources' 
                        : activeCategory !== 'all' && activeType !== 'all'
                          ? `${getTypeLabel(activeType)} in ${getCategoryLabel(activeCategory)}`
                          : activeCategory !== 'all'
                            ? getCategoryLabel(activeCategory)
                            : getTypeLabel(activeType)
                      }
                      {searchQuery && (
                        <span className="text-lg font-normal text-gray-600 ml-2">
                          - Results for "{searchQuery}"
                        </span>
                      )}
                    </h2>
                    <p className="text-gray-600">
                      Showing {sortedResources.length} resource{sortedResources.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-4 sm:mt-0">
                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-2">
                      <IconComponent icon={FaSort} className="text-gray-500" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      >
                        <option value="featured">Featured First</option>
                        <option value="downloads">Most Downloaded</option>
                        <option value="views">Most Viewed</option>
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Active Filters */}
                {(searchQuery || activeCategory !== 'all' || activeType !== 'all') && (
                  <motion.div 
                    className="mb-6 bg-white rounded-xl shadow-lg p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-gray-600 font-medium">Active filters:</span>
                      {searchQuery && (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                          Search: "{searchQuery}"
                          <button onClick={() => setSearchQuery('')}>
                            <IconComponent icon={FaTimes} className="text-xs" />
                          </button>
                        </span>
                      )}
                      {activeCategory !== 'all' && (
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                          Category: {getCategoryLabel(activeCategory)}
                          <button onClick={() => setActiveCategory('all')}>
                            <IconComponent icon={FaTimes} className="text-xs" />
                          </button>
                        </span>
                      )}
                      {activeType !== 'all' && (
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                          Type: {getTypeLabel(activeType)}
                          <button onClick={() => setActiveType('all')}>
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
                
                {/* Resources Grid */}
                {sortedResources.length > 0 ? (
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {sortedResources.map((resource) => (
                      <motion.div
                        key={resource.id}
                        className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group"
                        variants={itemVariants}
                        whileHover={{ y: -8, scale: 1.02 }}
                      >
                        <div className="relative overflow-hidden">
                          <img 
                            src={resource.thumbnail || '/api/placeholder/400/250'} 
                            alt={resource.title}
                            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm font-bold text-green-600 shadow-md flex items-center">
                            <IconComponent icon={FaDownload} className="mr-1" />
                            {resource.downloads.toLocaleString()}
                          </div>
                          {resource.featured && (
                            <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                              Featured
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                            <motion.button
                              className="bg-white text-green-600 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              {resource.download_link ? <IconComponent icon={FaDownload} /> : <IconComponent icon={FaPlay} />}
                            </motion.button>
                          </div>
                        </div>
                        
                        <div className="p-6 flex-1 flex flex-col">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                              {getResourceTypeIcon(resource.type)}
                              <span className="ml-1">{getTypeLabel(resource.type)}</span>
                            </span>
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                              {getResourceCategoryIcon(resource.category)}
                              <span className="ml-1">{getCategoryLabel(resource.category)}</span>
                            </span>
                          </div>
                          
                          <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 flex-shrink-0 group-hover:text-green-600 transition-colors">
                            {resource.title}
                          </h3>
                          <p className="text-gray-600 mb-4 text-sm line-clamp-3 flex-1">{resource.description}</p>
                          
                          <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <IconComponent icon={FaDownload} className="mr-1" />
                              <span>{resource.downloads.toLocaleString()} downloads</span>
                            </div>
                            {resource.views && (
                              <div className="flex items-center">
                                <IconComponent icon={FaEye} className="mr-1" />
                                <span>{resource.views.toLocaleString()} views</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Tags */}
                          {resource.tags && resource.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-4">
                              {resource.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex gap-2 mt-auto">
                            <motion.a
                              href={resource.download_link || resource.video_link || resource.url}
                              className="flex-1 bg-gradient-to-r from-green-600 to-teal-700 hover:from-green-700 hover:to-teal-800 text-white py-3 px-4 rounded-lg font-medium transition-all text-sm shadow-lg text-center flex items-center justify-center"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {resource.download_link ? (
                                <>
                                  <IconComponent icon={FaDownload} className="mr-2" />
                                  Download
                                </>
                              ) : (
                                <>
                                  <IconComponent icon={FaPlay} className="mr-2" />
                                  View
                                </>
                              )}
                            </motion.a>
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
                    <h3 className="text-2xl font-semibold text-gray-600 mb-2">No resources found</h3>
                    <p className="text-gray-500 mb-6">Try adjusting your search terms or filters to find what you're looking for.</p>
                    <motion.button
                      onClick={clearAllFilters}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
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

export default Resources; 