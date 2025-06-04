import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaCalendarAlt, FaUser, FaTag, FaSearch, FaArrowLeft, FaClock, FaArrowRight, FaChartLine, FaGraduationCap, FaGlobe } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import IconComponent from '../components/ui/IconComponent';
import { motion } from 'framer-motion';
import { blogAPI } from '../utils/apiService';
import { useLanguage } from '../utils/LanguageContext';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  author: {
    name: string;
    avatar_url?: string;
  };
  created_at: string;
  updated_at: string;
  category: string;
  tags: string[];
  image: string;
  author_id: string;
}

const Blog: React.FC = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBlogs();
    fetchCategories();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await blogAPI.getAll(1, 50); // Get more blogs for user website
      
      if (response.success && response.data) {
        // Handle the API response structure
        let blogsData = response.data;
        
        // The API returns { blogs: [...], pagination: {...} }
        if (blogsData && blogsData.blogs) {
          blogsData = blogsData.blogs;
        }
        
        setBlogPosts(Array.isArray(blogsData) ? blogsData : []);
      } else {
        setError('Failed to fetch blogs');
        setBlogPosts([]);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
      setError('Error loading blogs');
      setBlogPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await blogAPI.getCategories();
      if (response.success && response.data && response.data.categories) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Helper function to calculate read time (rough estimate)
  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min`;
  };

  // Filter blog posts based on search and active category
  const filteredPosts = blogPosts.filter(post => {
    // Search filter
    if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }
    
    // Category filter
    if (activeCategory !== 'all' && post.category !== activeCategory) {
      return false;
    }
    
    return true;
  });

  // Get icon for category
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'technology':
        return <IconComponent icon={FaChartLine} className="text-teal-600" />;
      case 'education':
        return <IconComponent icon={FaGraduationCap} className="text-blue-600" />;
      case 'programming':
        return <IconComponent icon={FaChartLine} className="text-purple-600" />;
      case 'career':
        return <IconComponent icon={FaGraduationCap} className="text-orange-600" />;
      case 'study tips':
        return <IconComponent icon={FaGlobe} className="text-green-600" />;
      default:
        return <IconComponent icon={FaGlobe} className="text-gray-600" />;
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
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.95
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header />
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header />
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Loading Blogs</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchBlogs}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

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
                {t('blog.title')}
              </motion.h1>
              <motion.p 
                className="text-xl mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {t('blog.subtitle')}
              </motion.p>
              <motion.div 
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <input
                  type="text"
                  placeholder={t('blog.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-3 pr-12 bg-white rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <IconComponent icon={FaSearch} className="absolute right-4 top-3.5 text-gray-500" />
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Featured Posts */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <motion.h2 
              className="text-2xl font-bold text-teal-800 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {t('blog.featuredArticles')}
            </motion.h2>
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {blogPosts.slice(0, 4).map(post => (
                <motion.div 
                  key={post.id} 
                  className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 flex flex-col lg:flex-row"
                  variants={itemVariants}
                  whileHover={{ 
                    y: -5,
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="lg:w-1/2 overflow-hidden">
                    <motion.img 
                      src={post.image} 
                      alt={post.title} 
                      className="w-full h-64 lg:h-full object-cover"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="lg:w-1/2 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center mb-2">
                        <span className="bg-teal-100 text-teal-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                          {getCategoryIcon(post.category)}
                          <span className="ml-1">{post.category}</span>
                        </span>
                        <span className="ml-2 text-gray-500 text-xs flex items-center">
                          <IconComponent icon={FaClock} className="mr-1" />
                          {calculateReadTime(post.content || post.excerpt)}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h3>
                      <p className="text-gray-600 mb-4">{post.excerpt}</p>
                    </div>
                    <div className="flex items-center">
                      <img 
                        className="w-10 h-10 rounded-full mr-4" 
                        src={post.author.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.name)}&background=0ea5e9&color=fff`} 
                        alt={post.author.name} 
                      />
                      <div className="text-sm">
                        <p className="text-gray-900 font-medium">{post.author.name}</p>
                        <p className="text-gray-500">{formatDate(post.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Category Filter and All Posts */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar */}
              <motion.div 
                className="lg:w-1/4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-teal-800 mb-4">{t('blog.categories')}</h3>
                  <div className="space-y-2">
                    <motion.button
                      className={`w-full text-left px-3 py-2 rounded-lg ${
                        activeCategory === 'all'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setActiveCategory('all')}
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {t('blog.allCategories')}
                    </motion.button>
                    {categories.map(category => (
                      <motion.button
                        key={category}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center ${
                          activeCategory === category
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setActiveCategory(category)}
                        whileHover={{ x: 5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="mr-2">{getCategoryIcon(category)}</span>
                        {category}
                      </motion.button>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                  <h3 className="text-lg font-bold text-teal-800 mb-4">{t('blog.trendingTopics')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(blogPosts.flatMap(post => post.tags))).slice(0, 10).map(tag => (
                      <motion.span 
                        key={tag}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium px-2.5 py-1.5 rounded cursor-pointer"
                        onClick={() => setSearchQuery(tag)}
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 0 }}
                      >
                        {tag}
                      </motion.span>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-teal-700 to-teal-900 rounded-lg shadow-md p-6 mt-6 text-white">
                  <h3 className="text-lg font-bold mb-4">Newsletter</h3>
                  <p className="text-teal-100 mb-4">Subscribe to get the latest educational insights delivered to your inbox</p>
                  <form className="space-y-4">
                    <input
                      type="email"
                      placeholder="Your email address"
                      className="w-full px-4 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                    />
                    <motion.button 
                      type="submit"
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md transition-colors"
                      whileHover={{ y: -2 }}
                      whileTap={{ y: 0 }}
                    >
                      Subscribe
                    </motion.button>
                  </form>
                </div>
              </motion.div>
              
              {/* Posts Grid */}
              <motion.div 
                className="lg:w-3/4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <h2 className="text-2xl font-bold text-teal-800 mb-6">
                  {activeCategory === 'all' ? 'All Articles' : activeCategory}
                </h2>
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {filteredPosts.map(post => (
                    <motion.div 
                      key={post.id} 
                      className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full"
                      variants={itemVariants}
                      whileHover={{ 
                        y: -5,
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="overflow-hidden">
                        <motion.img 
                          src={post.image} 
                          alt={post.title} 
                          className="w-full h-48 object-cover"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <div className="p-4 flex-grow">
                        <div className="flex items-center mb-2">
                          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                            {getCategoryIcon(post.category)}
                            <span className="ml-1">{post.category}</span>
                          </span>
                          <span className="ml-2 text-gray-500 text-xs flex items-center">
                            <IconComponent icon={FaClock} className="mr-1" />
                            {calculateReadTime(post.content || post.excerpt)}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h3>
                        <p className="text-gray-600 mb-4 text-sm">{post.excerpt.substring(0, 100)}...</p>
                      </div>
                      <div className="px-4 pb-4 mt-auto">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <img 
                              className="w-8 h-8 rounded-full mr-2" 
                              src={post.author.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.name)}&background=0ea5e9&color=fff`} 
                              alt={post.author.name} 
                            />
                            <div className="text-xs">
                              <p className="text-gray-900 font-medium">{post.author.name}</p>
                              <p className="text-gray-500">{formatDate(post.created_at)}</p>
                            </div>
                          </div>
                          <motion.span 
                            className="text-orange-500 text-sm font-medium cursor-pointer flex items-center"
                            whileHover={{ x: 3 }}
                          >
                            Read more 
                            <IconComponent icon={FaArrowRight} className="ml-1" />
                          </motion.span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
                
                {filteredPosts.length === 0 && (
                  <motion.div 
                    className="bg-white rounded-lg shadow-md p-8 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <h3 className="text-xl font-bold text-gray-700 mb-2">No articles found</h3>
                    <p className="text-gray-600">Try adjusting your search or filter to find what you're looking for.</p>
                    <motion.button
                      onClick={() => {
                        setSearchQuery('');
                        setActiveCategory('all');
                      }}
                      className="mt-4 text-teal-600 font-medium"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Clear all filters
                    </motion.button>
                  </motion.div>
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

export default Blog; 