import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaCalendarAlt, FaUser, FaTag, FaSearch, FaArrowLeft, FaClock, FaArrowRight, FaChartLine, FaGraduationCap, FaGlobe, FaTimes, FaShare, FaBookmark, FaEye, FaFilter, FaChevronDown, FaSort } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import IconComponent from '../components/ui/IconComponent';
import { motion, AnimatePresence } from 'framer-motion';
import { blogAPI } from '../utils/apiService';
import { useLanguage } from '../utils/LanguageContext';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  author?: {
    name: string;
    avatar_url?: string;
  } | null;
  created_at: string;
  updated_at: string;
  category: string;
  tags: string[];
  image: string;
  author_id: string;
  featured?: boolean;
  views?: number;
  read_time?: number;
}

const Blog: React.FC = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  // Sample data as fallback
  const sampleBlogs: BlogPost[] = [
    {
      id: '1',
      title: 'How AI Is Revolutionizing University Selection Process',
      excerpt: 'Discover how artificial intelligence algorithms are helping students find their perfect university match with unprecedented accuracy and personalized recommendations.',
      content: 'Full content here...',
      author: { name: 'Dr. James Wilson', avatar_url: undefined },
      created_at: '2024-05-15T00:00:00Z',
      updated_at: '2024-05-15T00:00:00Z',
      category: 'Technology',
      tags: ['AI', 'University', 'Technology', 'Education'],
      image: 'https://images.unsplash.com/photo-1593642532744-d377ab507dc8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      author_id: '1',
      featured: true,
      views: 1250,
      read_time: 5
    },
    {
      id: '2',
      title: '5 Success Stories: From Rejection to Top University Admission',
      excerpt: 'Read inspiring case studies of students who overcame initial rejections and secured spots at prestigious universities worldwide through persistence and strategy.',
      content: 'Full content here...',
      author: { name: 'Emily Parker', avatar_url: undefined },
      created_at: '2024-05-10T00:00:00Z',
      updated_at: '2024-05-10T00:00:00Z',
      category: 'Success Stories',
      tags: ['Success', 'University', 'Admission', 'Inspiration'],
      image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      author_id: '2',
      featured: false,
      views: 980,
      read_time: 7
    },
    {
      id: '3',
      title: 'International Scholarship Guide: Hidden Opportunities for 2025',
      excerpt: 'Uncover lesser-known scholarship programs and funding sources for international students planning to study abroad in 2025.',
      content: 'Full content here...',
      author: { name: 'Michael Thompson', avatar_url: undefined },
      created_at: '2024-05-05T00:00:00Z',
      updated_at: '2024-05-05T00:00:00Z',
      category: 'Scholarships',
      tags: ['Scholarships', 'International', 'Funding', 'Study Abroad'],
      image: 'https://images.unsplash.com/photo-1532649538693-f3a2ec1bf8bd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      author_id: '3',
      featured: true,
      views: 1450,
      read_time: 6
    },
    {
      id: '4',
      title: 'Study Abroad: Complete Guide to European Universities',
      excerpt: 'Everything you need to know about studying in Europe, from application processes to living costs and cultural adaptation.',
      content: 'Full content here...',
      author: { name: 'Sarah Johnson', avatar_url: undefined },
      created_at: '2024-04-28T00:00:00Z',
      updated_at: '2024-04-28T00:00:00Z',
      category: 'Study Abroad',
      tags: ['Europe', 'Study Abroad', 'Universities', 'Guide'],
      image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9d1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      author_id: '4',
      featured: false,
      views: 750,
      read_time: 8
    },
    {
      id: '5',
      title: 'Career Planning: From Student to Professional',
      excerpt: 'Strategic career planning tips for students to transition smoothly from academic life to professional success.',
      content: 'Full content here...',
      author: { name: 'David Chen', avatar_url: undefined },
      created_at: '2024-04-20T00:00:00Z',
      updated_at: '2024-04-20T00:00:00Z',
      category: 'Career',
      tags: ['Career', 'Professional', 'Planning', 'Students'],
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      author_id: '5',
      featured: false,
      views: 620,
      read_time: 4
    },
    {
      id: '6',
      title: 'Digital Learning: The Future of Education',
      excerpt: 'Exploring how digital technologies are transforming education and creating new opportunities for learners worldwide.',
      content: 'Full content here...',
      author: { name: 'Lisa Rodriguez', avatar_url: undefined },
      created_at: '2024-04-15T00:00:00Z',
      updated_at: '2024-04-15T00:00:00Z',
      category: 'Education',
      tags: ['Digital Learning', 'Technology', 'Future', 'Education'],
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      author_id: '6',
      featured: true,
      views: 1100,
      read_time: 6
    }
  ];

  useEffect(() => {
    fetchBlogs();
    fetchCategories();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading blogs...');
      
      const response = await blogAPI.getAll(1, 50);
      console.log('Blogs API response:', response);
      
      if (response.success && response.data) {
        let blogsData = response.data;
        
        if (blogsData && blogsData.blogs && Array.isArray(blogsData.blogs)) {
          blogsData = blogsData.blogs;
        } else if (!Array.isArray(blogsData)) {
          console.warn('Unexpected blogs data structure:', blogsData);
          blogsData = sampleBlogs;
        }
        
        console.log('Setting blogs:', blogsData);
        setBlogPosts(Array.isArray(blogsData) ? blogsData : sampleBlogs);
      } else {
        console.warn('API response not successful, using sample data');
        setBlogPosts(sampleBlogs);
      }
    } catch (error) {
      console.error('Error loading blogs:', error);
      setError('Failed to load blogs. Showing sample data.');
      setBlogPosts(sampleBlogs);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      console.log('Loading categories...');
      const response = await blogAPI.getCategories();
      console.log('Categories response:', response);
      
      if (response.success && response.data && response.data.categories) {
        setCategories(response.data.categories);
      } else {
        const uniqueCategories = Array.from(new Set(sampleBlogs.map(blog => blog.category)));
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      const uniqueCategories = Array.from(new Set((blogPosts.length > 0 ? blogPosts : sampleBlogs).map(blog => blog.category)));
      setCategories(uniqueCategories);
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

  // Enhanced filtering logic
  const filteredPosts = blogPosts.filter(post => {
    // Search filter - check title, excerpt, content, tags, and author name
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = post.title.toLowerCase().includes(query);
      const matchesExcerpt = post.excerpt.toLowerCase().includes(query);
      const matchesContent = post.content?.toLowerCase().includes(query);
      const matchesTags = post.tags.some(tag => tag.toLowerCase().includes(query));
      const matchesAuthor = post.author?.name?.toLowerCase().includes(query);
      const matchesCategory = post.category.toLowerCase().includes(query);
      
      if (!matchesTitle && !matchesExcerpt && !matchesContent && !matchesTags && !matchesAuthor && !matchesCategory) {
        return false;
      }
    }
    
    // Category filter
    if (activeCategory !== 'all' && post.category !== activeCategory) {
      return false;
    }
    
    return true;
  });

  // Sort posts
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'popular':
        return (b.views || 0) - (a.views || 0);
      case 'read-time':
        return (a.read_time || 0) - (b.read_time || 0);
      case 'featured':
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      case 'newest':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
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
      case 'study abroad':
        return <IconComponent icon={FaGlobe} className="text-green-600" />;
      case 'scholarships':
        return <IconComponent icon={FaGraduationCap} className="text-yellow-600" />;
      case 'success stories':
        return <IconComponent icon={FaChartLine} className="text-pink-600" />;
      default:
        return <IconComponent icon={FaGlobe} className="text-gray-600" />;
    }
  };

  // Open blog modal
  const openBlogModal = async (blog: BlogPost) => {
    try {
      if (!blog.content) {
        const response = await blogAPI.getById(blog.id);
        if (response.success && response.data) {
          setSelectedBlog(response.data);
        } else {
          setSelectedBlog(blog);
        }
      } else {
        setSelectedBlog(blog);
      }
      setShowModal(true);
      document.body.style.overflow = 'hidden';
    } catch (error) {
      console.error('Error fetching blog details:', error);
      setSelectedBlog(blog);
      setShowModal(true);
      document.body.style.overflow = 'hidden';
    }
  };

  // Close blog modal
  const closeBlogModal = () => {
    setShowModal(false);
    setSelectedBlog(null);
    document.body.style.overflow = 'unset';
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setActiveCategory('all');
    setSortBy('newest');
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

  console.log('Rendering blogs:', blogPosts.length, 'filtered:', sortedPosts.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50">
      <Header />
      <main className="flex-grow">
        {/* Hero Section with Enhanced Search */}
        <motion.section 
          className="bg-gradient-to-r from-blue-600 via-purple-700 to-teal-800 text-white py-20 relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Background elements */}
          <motion.div 
            className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full opacity-20" 
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
            className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500 rounded-full opacity-10" 
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
                Explore Our Blog
              </motion.h1>
              <motion.p 
                className="text-xl md:text-2xl mb-12 text-blue-100"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                Discover insights, tips, and stories to guide your educational journey
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
                        placeholder="Search articles, authors, or topics..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-6 py-4 pl-12 bg-gray-50 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-lg"
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
                        className="px-4 py-4 bg-gray-50 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
                      >
                        <option value="all">All Categories</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                      
                      <motion.button
                        className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
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
                    {(searchQuery || activeCategory !== 'all') && (
                      <button
                        onClick={clearAllFilters}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
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
                            ? 'bg-blue-100 text-blue-800 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setActiveCategory('all')}
                        whileHover={{ x: 2 }}
                      >
                        All Categories ({blogPosts.length})
                      </motion.button>
                      {categories.map((category) => {
                        const count = blogPosts.filter(p => p.category === category).length;
                        return (
                          <motion.button
                            key={category}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center ${
                              activeCategory === category
                                ? 'bg-blue-100 text-blue-800 font-medium'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                            onClick={() => setActiveCategory(category)}
                            whileHover={{ x: 2 }}
                          >
                            <span className="mr-2">{getCategoryIcon(category)}</span>
                            {category} ({count})
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Popular Tags */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-700 mb-3">Popular Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(blogPosts.flatMap(post => post.tags || []))).slice(0, 10).map(tag => (
                        <motion.button
                          key={tag}
                          className="bg-gray-100 hover:bg-blue-100 hover:text-blue-800 text-gray-700 text-xs font-medium px-3 py-1 rounded-full transition-colors"
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
                      {activeCategory === 'all' ? 'All Articles' : activeCategory}
                      {searchQuery && (
                        <span className="text-lg font-normal text-gray-600 ml-2">
                          - Results for "{searchQuery}"
                        </span>
                      )}
                    </h2>
                    <p className="text-gray-600">
                      Showing {sortedPosts.length} article{sortedPosts.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-4 sm:mt-0">
                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-2">
                      <IconComponent icon={FaSort} className="text-gray-500" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="popular">Most Popular</option>
                        <option value="featured">Featured First</option>
                        <option value="read-time">Quick Reads</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Active Filters */}
                {(searchQuery || activeCategory !== 'all') && (
                  <motion.div 
                    className="mb-6 bg-white rounded-xl shadow-lg p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-gray-600 font-medium">Active filters:</span>
                      {searchQuery && (
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                          Search: "{searchQuery}"
                          <button onClick={() => setSearchQuery('')}>
                            <IconComponent icon={FaTimes} className="text-xs" />
                          </button>
                        </span>
                      )}
                      {activeCategory !== 'all' && (
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                          Category: {activeCategory}
                          <button onClick={() => setActiveCategory('all')}>
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
                
                {/* Blog Posts Grid */}
                {sortedPosts.length > 0 ? (
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {sortedPosts.map((post) => (
                      <motion.div
                        key={post.id}
                        className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group cursor-pointer"
                        variants={itemVariants}
                        whileHover={{ y: -8, scale: 1.02 }}
                        onClick={() => openBlogModal(post)}
                      >
                        <div className="relative overflow-hidden">
                          <img 
                            src={post.image || '/api/placeholder/400/250'} 
                            alt={post.title}
                            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm font-bold text-blue-600 shadow-md">
                            <IconComponent icon={FaClock} className="inline mr-1" />
                            {post.read_time || calculateReadTime(post.content || post.excerpt)} min
                          </div>
                          {post.featured && (
                            <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                              Featured
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                            <motion.div
                              className="bg-white text-blue-600 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <IconComponent icon={FaArrowRight} />
                            </motion.div>
                          </div>
                        </div>
                        
                        <div className="p-6 flex-1 flex flex-col">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                              {getCategoryIcon(post.category)}
                              <span className="ml-1">{post.category}</span>
                            </span>
                            {post.views && (
                              <span className="text-gray-500 text-xs flex items-center">
                                <IconComponent icon={FaEye} className="mr-1" />
                                {post.views.toLocaleString()}
                              </span>
                            )}
                          </div>
                          
                          <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 flex-shrink-0 group-hover:text-blue-600 transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-gray-600 mb-4 text-sm line-clamp-3 flex-1">{post.excerpt}</p>
                          
                          <div className="flex items-center mb-4">
                            <img 
                              src={post.author?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'Author')}&background=3b82f6&color=fff`}
                              alt={post.author?.name || 'Author'}
                              className="w-8 h-8 rounded-full mr-3"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{post.author?.name || 'Anonymous'}</p>
                              <p className="text-xs text-gray-600">{formatDate(post.created_at)}</p>
                            </div>
                          </div>
                          
                          {/* Tags */}
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-4">
                              {post.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex gap-2 mt-auto">
                            <motion.button
                              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white py-3 px-4 rounded-lg font-medium transition-all text-sm shadow-lg"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                openBlogModal(post);
                              }}
                            >
                              Read More
                            </motion.button>
                            <motion.button
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-lg transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => e.stopPropagation()}
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
                    <h3 className="text-2xl font-semibold text-gray-600 mb-2">No articles found</h3>
                    <p className="text-gray-500 mb-6">Try adjusting your search terms or filters to find what you're looking for.</p>
                    <motion.button
                      onClick={clearAllFilters}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
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

      {/* Blog Modal */}
      <AnimatePresence>
        {showModal && selectedBlog && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeBlogModal}
          >
            <motion.div
              className="bg-white rounded-xl max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <img 
                  src={selectedBlog.image} 
                  alt={selectedBlog.title}
                  className="w-full h-64 object-cover"
                />
                <button
                  onClick={closeBlogModal}
                  className="absolute top-4 right-4 bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <IconComponent icon={FaTimes} />
                </button>
              </div>
              
              <div className="p-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full flex items-center">
                    {getCategoryIcon(selectedBlog.category)}
                    <span className="ml-1">{selectedBlog.category}</span>
                  </span>
                  <span className="text-gray-500 text-sm flex items-center">
                    <IconComponent icon={FaClock} className="mr-1" />
                    {selectedBlog.read_time || calculateReadTime(selectedBlog.content || selectedBlog.excerpt)} min read
                  </span>
                </div>
                
                <h1 className="text-3xl font-bold text-gray-800 mb-4">{selectedBlog.title}</h1>
                
                <div className="flex items-center mb-6">
                  <img 
                    src={selectedBlog.author?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedBlog.author?.name || 'Author')}&background=3b82f6&color=fff`}
                    alt={selectedBlog.author?.name || 'Author'}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <p className="font-medium text-gray-800">{selectedBlog.author?.name || 'Anonymous'}</p>
                    <p className="text-gray-600 text-sm">{formatDate(selectedBlog.created_at)}</p>
                  </div>
                </div>
                
                <div className="prose max-w-none mb-6">
                  <p className="text-lg text-gray-700 leading-relaxed">{selectedBlog.content || selectedBlog.excerpt}</p>
                </div>
                
                {selectedBlog.tags && selectedBlog.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {selectedBlog.tags.map(tag => (
                      <span key={tag} className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-4">
                  <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    <IconComponent icon={FaShare} />
                    Share
                  </button>
                  <button className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                    <IconComponent icon={FaBookmark} />
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default Blog; 