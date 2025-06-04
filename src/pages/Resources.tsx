import React, { useState, useEffect } from 'react';
import { FaGraduationCap, FaBook, FaFileAlt, FaBriefcase, FaSearch, FaRegFileAlt, FaDownload, FaVideo } from 'react-icons/fa';
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

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [responsesData, categoriesData, typesData] = await Promise.all([
          fetchResponses(),
          fetchResponseCategories(),
          fetchResponseTypes()
        ]);
        
        setResources(responsesData.responses);
        setCategories(categoriesData.categories);
        setTypes(typesData.types);
      } catch (err) {
        console.error('Error loading resources:', err);
        setError('Failed to load resources. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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

  // Filter resources based on search and active filters
  const filteredResources = resources.filter(resource => {
    // Search filter
    if (searchQuery && !resource.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !resource.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
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
                Educational Resources
              </motion.h1>
              <motion.p 
                className="text-xl mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Access high-quality guides, templates, videos, and more to support your educational journey
                from application to graduation and beyond.
              </motion.p>
              <motion.div 
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <input
                  type="text"
                  placeholder="Search resources by title, description, or tags..."
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
            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                <span className="ml-3 text-teal-600 font-medium">Loading resources...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
                <div className="flex items-center">
                  <div className="text-red-600 mr-3">⚠️</div>
                  <div>
                    <h3 className="text-red-800 font-medium">Error Loading Resources</h3>
                    <p className="text-red-600 mt-1">{error}</p>
                    <button 
                      onClick={() => window.location.reload()} 
                      className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Content - only show when not loading and no error */}
            {!loading && !error && (
              <>
                {/* Featured Resources */}
                <motion.div 
                  className="mb-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.h2 
                    className="text-2xl font-bold text-teal-800 mb-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    Featured Resources
                  </motion.h2>
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {resources.filter(resource => resource.featured).map(resource => (
                      <motion.div 
                        key={resource.id} 
                        className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 flex flex-col md:flex-row"
                        variants={itemVariants}
                        whileHover={{ 
                          y: -5,
                          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                        }}
                      >
                        <div className="md:w-1/3 overflow-hidden">
                          <motion.img 
                            src={resource.thumbnail} 
                            alt={resource.title} 
                            className="w-full h-full object-cover"
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        <div className="md:w-2/3 p-6">
                          <div className="flex items-center mb-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800 mr-2">
                              {getResourceTypeIcon(resource.type)}
                              <span className="ml-1">{getTypeLabel(resource.type)}</span>
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {getResourceCategoryIcon(resource.category)}
                              <span className="ml-1">{getCategoryLabel(resource.category)}</span>
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-800 mb-2">{resource.title}</h3>
                          <p className="text-gray-600 mb-4">{resource.description}</p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {resource.tags.map((tag, idx) => (
                              <motion.span 
                                key={idx} 
                                className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                                whileHover={{ y: -2 }}
                              >
                                {tag}
                              </motion.span>
                            ))}
                          </div>
                          <motion.a
                            href={resource.download_link || resource.video_link || resource.url}
                            className="inline-flex items-center mt-auto text-teal-600 font-medium"
                            whileHover={{ x: 3 }}
                          >
                            {resource.download_link ? (
                              <>
                                <IconComponent icon={FaDownload} className="mr-1" />
                                Download Resource
                              </>
                            ) : (
                              <>
                                <IconComponent icon={FaVideo} className="mr-1" />
                                View Resource
                              </>
                            )}
                          </motion.a>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>

                {/* Filter and All Resources */}
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Filter Sidebar */}
                  <motion.div 
                    className="lg:w-1/4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                      <h3 className="text-lg font-bold text-teal-800 mb-4">Categories</h3>
                      <div className="space-y-2">
                        <motion.button
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                            activeCategory === 'all'
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-white text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => setActiveCategory('all')}
                          whileHover={{ x: 3 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          All Categories
                        </motion.button>
                        {categories.map(category => (
                          <motion.button
                            key={category}
                            className={`w-full text-left px-3 py-2 rounded-lg flex items-center transition-colors ${
                              activeCategory === category
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                            onClick={() => setActiveCategory(category)}
                            whileHover={{ x: 3 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span className="mr-2">{getResourceCategoryIcon(category)}</span>
                            {getCategoryLabel(category)}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-lg font-bold text-teal-800 mb-4">Resource Types</h3>
                      <div className="space-y-2">
                        <motion.button
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                            activeType === 'all'
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-white text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => setActiveType('all')}
                          whileHover={{ x: 3 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          All Types
                        </motion.button>
                        {types.map(type => (
                          <motion.button
                            key={type}
                            className={`w-full text-left px-3 py-2 rounded-lg flex items-center transition-colors ${
                              activeType === type
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                            onClick={() => setActiveType(type)}
                            whileHover={{ x: 3 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span className="mr-2">{getResourceTypeIcon(type)}</span>
                            {getTypeLabel(type)}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Resources Grid */}
                  <motion.div 
                    className="lg:w-3/4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <h2 className="text-2xl font-bold text-teal-800 mb-6">
                      {activeCategory === 'all' && activeType === 'all' 
                        ? 'All Resources' 
                        : activeCategory !== 'all' && activeType !== 'all'
                          ? `${getTypeLabel(activeType)} in ${getCategoryLabel(activeCategory)}`
                          : activeCategory !== 'all'
                            ? getCategoryLabel(activeCategory)
                            : getTypeLabel(activeType)
                      }
                    </h2>
                    
                    <motion.div 
                      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {filteredResources.map(resource => (
                        <motion.div 
                          key={resource.id} 
                          className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full"
                          variants={itemVariants}
                          whileHover={{ 
                            y: -5,
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
                          }}
                        >
                          <div className="relative overflow-hidden h-48">
                            <motion.img 
                              src={resource.thumbnail} 
                              alt={resource.title} 
                              className="w-full h-full object-cover"
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.5 }}
                            />
                            <div className="absolute top-2 right-2 flex gap-1">
                              <span className="inline-flex items-center justify-center p-1.5 bg-white bg-opacity-90 rounded-full">
                                {getResourceTypeIcon(resource.type)}
                              </span>
                            </div>
                          </div>
                          <div className="p-5 flex-grow flex flex-col">
                            <div className="flex items-center mb-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {getResourceCategoryIcon(resource.category)}
                                <span className="ml-1">{getCategoryLabel(resource.category)}</span>
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">{resource.title}</h3>
                            <p className="text-gray-600 text-sm mb-4">{resource.description.substring(0, 100)}...</p>
                            <div className="flex flex-wrap gap-1 mb-4">
                              {resource.tags.slice(0, 3).map((tag, idx) => (
                                <motion.span 
                                  key={idx} 
                                  className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                                  whileHover={{ y: -1 }}
                                >
                                  {tag}
                                </motion.span>
                              ))}
                              {resource.tags.length > 3 && (
                                <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                  +{resource.tags.length - 3}
                                </span>
                              )}
                            </div>
                            <motion.a
                              href={resource.download_link || resource.video_link || resource.url}
                              className="inline-flex items-center mt-auto text-teal-600 font-medium"
                              whileHover={{ x: 3 }}
                            >
                              {resource.download_link ? (
                                <>
                                  <IconComponent icon={FaDownload} className="mr-1" />
                                  Download Resource
                                </>
                              ) : (
                                <>
                                  <IconComponent icon={FaVideo} className="mr-1" />
                                  View Resource
                                </>
                              )}
                            </motion.a>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                    
                    {filteredResources.length === 0 && (
                      <motion.div 
                        className="bg-white rounded-lg shadow-md p-8 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <h3 className="text-xl font-bold text-gray-700 mb-2">No resources found</h3>
                        <p className="text-gray-600 mb-4">Try adjusting your search or filters to find what you're looking for.</p>
                        <motion.button
                          onClick={() => {
                            setSearchQuery('');
                            setActiveCategory('all');
                            setActiveType('all');
                          }}
                          className="text-teal-600 font-medium"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Clear all filters
                        </motion.button>
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Resources; 