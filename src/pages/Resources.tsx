import React, { useState, useEffect } from 'react';
import { FaGraduationCap, FaBook, FaFileAlt, FaBriefcase, FaSearch, FaRegFileAlt, FaDownload, FaVideo, FaFilter, FaChevronDown, FaTimes, FaSort, FaEye, FaBookmark, FaPlay, FaTh, FaList } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PageHeader from '../components/ui/PageHeader';
import MobileFilterPanel from '../components/ui/MobileFilterPanel';
import IconComponent from '../components/ui/IconComponent';
import { motion, AnimatePresence } from 'framer-motion';
import { responseAPI } from '../utils/apiService';
import { useLanguage } from '../utils/LanguageContext';

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileViewMode, setMobileViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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
        responseAPI.getAll(),
        responseAPI.getCategories(),
        responseAPI.getTypes()
      ]);
      
      console.log('Resources API responses:', { responsesData, categoriesData, typesData });
      
      // Handle resources data
      if (responsesData && responsesData.success && responsesData.data && Array.isArray(responsesData.data)) {
        setResources(responsesData.data);
      } else if (responsesData && responsesData.success && responsesData.data && responsesData.data.responses && Array.isArray(responsesData.data.responses)) {
        setResources(responsesData.data.responses);
      } else {
        console.warn('Using sample resources data');
        setResources(sampleResources);
      }
      
      // Handle categories data
      if (categoriesData && categoriesData.success && categoriesData.data && Array.isArray(categoriesData.data)) {
        setCategories(categoriesData.data);
      } else if (categoriesData && categoriesData.success && categoriesData.data && categoriesData.data.categories && Array.isArray(categoriesData.data.categories)) {
        setCategories(categoriesData.data.categories);
      } else {
        const uniqueCategories = Array.from(new Set(sampleResources.map(resource => resource.category)));
        setCategories(uniqueCategories);
      }
      
      // Handle types data
      if (typesData && typesData.success && typesData.data && Array.isArray(typesData.data)) {
        setTypes(typesData.data);
      } else if (typesData && typesData.success && typesData.data && typesData.data.types && Array.isArray(typesData.data.types)) {
        setTypes(typesData.data.types);
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
      const matchesTitle = resource.title && resource.title.toLowerCase().includes(query);
      const matchesDescription = resource.description && resource.description.toLowerCase().includes(query);
      const matchesTags = resource.tags && Array.isArray(resource.tags) && resource.tags.some(tag => tag && tag.toLowerCase().includes(query));
      
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

  console.log('Rendering resources:', resources.length, 'filtered:', sortedResources.length);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <main className="flex-grow">
        <PageHeader
          title="Educational Resources"
          subtitle="Comprehensive guides, templates, and tools for your academic journey"
          height="sm"
        >
          {/* Search Bar - Desktop only */}
          <div className="max-w-2xl mx-auto hidden lg:block">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 shadow-2xl border border-white/20">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search resources..."
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
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  onClick={() => setShowFilters(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <IconComponent icon={FaFilter} className="h-4 w-4" />
                  <span>Filters</span>
                  {((activeCategory !== 'all' ? 1 : 0) + (activeType !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0)) > 0 && (
                    <span className="bg-green-800 text-white text-xs px-2 py-1 rounded-full">
                      {(activeCategory !== 'all' ? 1 : 0) + (activeType !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0)}
                    </span>
                  )}
                </button>

                {/* View Mode Toggle */}
                <button
                  onClick={() => setMobileViewMode(mobileViewMode === 'grid' ? 'list' : 'grid')}
                  className="px-3 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 transition-all flex items-center justify-center"
                >
                  <IconComponent icon={mobileViewMode === 'grid' ? FaTh : FaList} className="h-4 w-4" />
                </button>

                {/* Sort Toggle */}
                <button
                  onClick={() => setSortBy(sortBy === 'featured' ? 'downloads' : 'featured')}
                  className="px-3 py-3 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-lg hover:from-teal-600 hover:to-green-600 transition-all flex items-center justify-center"
                >
                  <IconComponent icon={FaSort} className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Mobile Filter Panel - Show on mobile/tablet only */}
            <div className="hidden">
              <MobileFilterPanel
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search resources..."
                filters={[
                  {
                    key: 'category',
                    label: 'Category',
                    value: activeCategory === 'all' ? '' : activeCategory,
                    options: categories.map(category => ({ 
                      value: category, 
                      label: getCategoryLabel(category),
                      count: resources.filter(r => r.category === category).length
                    })),
                    onChange: (value) => setActiveCategory(value || 'all')
                  },
                  {
                    key: 'type',
                    label: 'Resource Type',
                    value: activeType === 'all' ? '' : activeType,
                    options: types.map(type => ({ 
                      value: type, 
                      label: getTypeLabel(type),
                      count: resources.filter(r => r.type === type).length
                    })),
                    onChange: (value) => setActiveType(value || 'all')
                  }
                ]}
                sortOptions={[
                  { value: 'featured', label: 'Featured First' },
                  { value: 'downloads', label: 'Most Downloaded' },
                  { value: 'views', label: 'Most Viewed' },
                  { value: 'newest', label: 'Newest First' },
                  { value: 'oldest', label: 'Oldest First' }
                ]}
                sortBy={sortBy}
                onSortChange={setSortBy}
                onClearFilters={clearAllFilters}
                activeFilterCount={
                  (activeCategory !== 'all' ? 1 : 0) + 
                  (activeType !== 'all' ? 1 : 0) + 
                  (searchQuery ? 1 : 0)
                }
              />
            </div>

            {loading ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading resources...</p>
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
                          ? 'Educational Resources' 
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
                      {/* View Mode Toggle - Desktop */}
                      <div className="hidden lg:flex items-center gap-2">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-2 rounded ${viewMode === 'grid' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}
                        >
                          <IconComponent icon={FaSort} />
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-2 rounded ${viewMode === 'list' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}
                        >
                          <IconComponent icon={FaFilter} />
                        </button>
                      </div>

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
                  
                  {/* Desktop View */}
                  <div className="hidden lg:block">
                    <motion.div 
                      className={viewMode === 'grid' ? 
                        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 
                        'space-y-6'
                      }
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {sortedResources.map((resource) => (
                        <motion.div
                          key={resource.id}
                          className={viewMode === 'grid' 
                            ? "bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group"
                            : "bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col lg:flex-row group"
                          }
                          variants={itemVariants}
                          whileHover={{ y: -4, scale: 1.01 }}
                        >
                          {viewMode === 'grid' ? (
                            // Grid View Layout - Database-style card
                            <>
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
                                
                                {/* Database-style single button */}
                                <motion.a
                                  href={resource.download_link || resource.video_link || resource.url}
                                  className="w-full bg-gradient-to-r from-green-600 to-teal-700 hover:from-green-700 hover:to-teal-800 text-white py-3 px-4 rounded-lg font-medium transition-all text-sm shadow-lg text-center flex items-center justify-center"
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
                              </div>
                            </>
                          ) : (
                            // List View Layout - Database-style horizontal card
                            <>
                              <div className="relative overflow-hidden w-full lg:w-80 flex-shrink-0">
                                <img 
                                  src={resource.thumbnail || '/api/placeholder/400/250'} 
                                  alt={resource.title}
                                  className="w-full h-48 lg:h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                {resource.featured && (
                                  <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                                    Featured
                                  </div>
                                )}
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
                                  <span className="text-gray-500 text-xs flex items-center">
                                    <IconComponent icon={FaDownload} className="mr-1" />
                                    {resource.downloads.toLocaleString()}
                                  </span>
                                  {resource.views && (
                                    <span className="text-gray-500 text-xs flex items-center">
                                      <IconComponent icon={FaEye} className="mr-1" />
                                      {resource.views.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                                
                                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-green-600 transition-colors">
                                  {resource.title}
                                </h3>
                                <p className="text-gray-600 mb-4 line-clamp-2 flex-1">{resource.description}</p>
                                
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center text-sm text-gray-600">
                                      <IconComponent icon={FaDownload} className="mr-1" />
                                      <span>{resource.downloads.toLocaleString()} downloads</span>
                                    </div>
                                    {resource.views && (
                                      <div className="flex items-center text-sm text-gray-600">
                                        <IconComponent icon={FaEye} className="mr-1" />
                                        <span>{resource.views.toLocaleString()} views</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Database-style dual buttons */}
                                  <div className="flex items-center gap-2">
                                    <motion.a
                                      href={resource.download_link || resource.video_link || resource.url}
                                      className="bg-gradient-to-r from-green-600 to-teal-700 hover:from-green-700 hover:to-teal-800 text-white py-2 px-4 rounded-lg font-medium transition-all text-sm shadow-lg flex items-center"
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                    >
                                      {resource.download_link ? (
                                        <>
                                          <IconComponent icon={FaDownload} className="mr-2" />
                                          Get
                                        </>
                                      ) : (
                                        <>
                                          <IconComponent icon={FaPlay} className="mr-2" />
                                          View
                                        </>
                                      )}
                                    </motion.a>
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
                                
                                {/* Tags */}
                                {resource.tags && resource.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {resource.tags.slice(0, 5).map(tag => (
                                      <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Mobile View */}
                  <div className="lg:hidden">
                    {mobileViewMode === 'grid' ? (
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        {sortedResources.map((resource) => (
                          <motion.div
                            key={resource.id}
                            variants={fadeIn("up", 0.1)}
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                          >
                            <div className="relative">
                              <img
                                src={resource.thumbnail || '/api/placeholder/300/200'}
                                alt={resource.title}
                                className="w-full h-28 sm:h-32 object-cover"
                              />
                              <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-bold text-green-600 shadow-md">
                                {resource.downloads.toLocaleString()}
                              </div>
                              {resource.featured && (
                                <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                                  ★
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2 leading-tight">
                                {resource.title}
                              </h3>
                              <p className="text-xs text-gray-600 mb-2 flex items-center">
                                <IconComponent icon={FaDownload} className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="truncate">{getTypeLabel(resource.type)}</span>
                              </p>
                              <div className="space-y-1 text-xs mb-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-500">Type:</span>
                                  <span className="font-medium text-green-600">{getTypeLabel(resource.type)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-500">Downloads:</span>
                                  <span className="font-medium text-blue-600">{resource.downloads.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-500">Category:</span>
                                  <span className="font-medium">{getCategoryLabel(resource.category)}</span>
                                </div>
                              </div>
                              <button className="w-full px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors">
                                {resource.download_link ? 'Download' : 'View'}
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      /* Mobile List View */
                      <div className="space-y-3">
                        {sortedResources.map((resource) => (
                          <motion.div
                            key={resource.id}
                            variants={fadeIn("up", 0.1)}
                            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
                          >
                            <div className="flex gap-3">
                              <div className="relative flex-shrink-0">
                                <img
                                  src={resource.thumbnail || '/api/placeholder/60/60'}
                                  alt={resource.title}
                                  className="w-14 h-14 object-cover rounded-md"
                                />
                                {resource.featured && (
                                  <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1 py-0.5 rounded-full">
                                    ★
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">
                                  {resource.title}
                                </h3>
                                <p className="text-xs text-gray-600 mb-2 flex items-center">
                                  <IconComponent icon={FaDownload} className="h-3 w-3 mr-1" />
                                  {getTypeLabel(resource.type)}
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-500">Downloads: </span>
                                    <span className="font-medium text-green-600">{resource.downloads.toLocaleString()}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Category: </span>
                                    <span className="font-medium">{getCategoryLabel(resource.category)}</span>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-gray-500">Type: </span>
                                    <span className="font-medium text-blue-600">{getTypeLabel(resource.type)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                <button className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors">
                                  <IconComponent icon={FaBookmark} className="h-3 w-3" />
                                </button>
                                <button className="p-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                                  <IconComponent icon={resource.download_link ? FaDownload : FaEye} className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Mobile Filter Modal */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-[10000] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFilters(false)}
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
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors bg-gray-50 border border-gray-200"
                >
                  <IconComponent icon={FaTimes} className="h-5 w-5 text-gray-700" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 pb-20">
                {/* Categories */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={activeCategory}
                    onChange={(e) => setActiveCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {getCategoryLabel(category)} ({resources.filter(r => r.category === category).length})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Resource Types */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Resource Type</label>
                  <select
                    value={activeType}
                    onChange={(e) => setActiveType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">All Types</option>
                    {types.map(type => (
                      <option key={type} value={type}>
                        {getTypeLabel(type)} ({resources.filter(r => r.type === type).length})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="featured">Featured First</option>
                    <option value="downloads">Most Downloaded</option>
                    <option value="views">Most Viewed</option>
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>

                {/* Popular Tags */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Popular Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(resources.flatMap(resource => resource.tags || []))).slice(0, 15).map(tag => (
                      <button
                        key={tag}
                        className="bg-gray-100 hover:bg-green-100 hover:text-green-800 text-gray-700 text-xs font-medium px-3 py-2 rounded-full transition-colors border border-gray-200"
                        onClick={() => setSearchQuery(tag)}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Filters */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quick Filters</label>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setActiveCategory('all');
                        setActiveType('all');
                        setSortBy('featured');
                      }}
                      className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      ⭐ Featured Resources
                    </button>
                    <button
                      onClick={() => {
                        setActiveCategory('all');
                        setActiveType('guide');
                        setSortBy('downloads');
                      }}
                      className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      📚 Popular Guides
                    </button>
                    <button
                      onClick={() => {
                        setActiveCategory('all');
                        setActiveType('template');
                        setSortBy('downloads');
                      }}
                      className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      📋 Useful Templates
                    </button>
                    <button
                      onClick={() => {
                        setActiveCategory('all');
                        setActiveType('video');
                        setSortBy('views');
                      }}
                      className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      🎥 Video Resources
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
                  onClick={() => setShowFilters(false)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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

export default Resources; 