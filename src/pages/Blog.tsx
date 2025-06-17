import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaCalendarAlt, FaUser, FaTag, FaSearch, FaArrowLeft, FaClock, FaArrowRight, FaChartLine, FaGraduationCap, FaGlobe, FaTimes, FaShare, FaBookmark, FaEye, FaFilter, FaChevronDown, FaSort, FaHeart, FaRegHeart, FaNewspaper, FaTh, FaList, FaPen } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PageHeader from '../components/ui/PageHeader';
import MobileFilterPanel from '../components/ui/MobileFilterPanel';
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

interface PaginationInfo {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}

const Blog: React.FC = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileViewMode, setMobileViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    itemsPerPage: 12
  });
  const [selectedTag, setSelectedTag] = useState<string>('');

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
    }
  ];

  useEffect(() => {
    fetchBlogs();
    fetchCategories();
    fetchTags();
  }, []);

  useEffect(() => {
    // Refetch blogs when filters change
    fetchBlogs();
  }, [activeCategory, searchQuery, selectedTag, pagination.currentPage]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading blogs with filters:', { 
        page: pagination.currentPage, 
        category: activeCategory !== 'all' ? activeCategory : undefined,
        tag: selectedTag || undefined,
        search: searchQuery || undefined
      });
      
      const response = await blogAPI.getAll(
        pagination.currentPage, 
        pagination.itemsPerPage,
        activeCategory !== 'all' ? activeCategory : undefined,
        selectedTag || undefined,
        searchQuery || undefined
      );
      
      console.log('Blogs API response:', response);
      
      if (response.success && response.data) {
        let blogsData = response.data;
        let paginationData = null;
        
        // Handle API response structure: { blogs: [...], pagination: {...} }
        if (blogsData && blogsData.blogs && Array.isArray(blogsData.blogs)) {
          paginationData = blogsData.pagination;
          blogsData = blogsData.blogs;
        } else if (!Array.isArray(blogsData)) {
          console.warn('Unexpected blogs data structure:', blogsData);
          blogsData = sampleBlogs;
        }
        
        // Process blogs to add calculated fields
        const processedBlogs = blogsData.map((blog: BlogPost) => ({
          ...blog,
          read_time: blog.read_time || calculateReadTime(blog.content || blog.excerpt),
          views: blog.views || Math.floor(Math.random() * 1000) + 100
        }));
        
        console.log('Setting blogs:', processedBlogs);
        setBlogPosts(processedBlogs);
        
        // Update pagination if available
        if (paginationData) {
          setPagination(paginationData);
        }
      } else {
        console.warn('API response not successful, using sample data');
        setBlogPosts(sampleBlogs);
        setError('Unable to load latest blogs. Showing sample content.');
      }
    } catch (error) {
      console.error('Error loading blogs:', error);
      setError('Failed to load blogs. Please check your connection.');
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
        setCategories(['all', ...response.data.categories]);
      } else {
        const uniqueCategories = Array.from(new Set(sampleBlogs.map(blog => blog.category)));
        setCategories(['all', ...uniqueCategories]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      const uniqueCategories = Array.from(new Set((blogPosts.length > 0 ? blogPosts : sampleBlogs).map(blog => blog.category)));
      setCategories(['all', ...uniqueCategories]);
    }
  };

  const fetchTags = async () => {
    try {
      console.log('Loading tags...');
      const response = await blogAPI.getTags();
      console.log('Tags response:', response);
      
      if (response.success && response.data && response.data.tags) {
        setTags(response.data.tags);
      } else {
        const allTags = sampleBlogs.reduce((tags, blog) => {
          if (blog.tags && Array.isArray(blog.tags)) {
            return [...tags, ...blog.tags];
          }
          return tags;
        }, [] as string[]);
        setTags(Array.from(new Set(allTags)));
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      const allTags = (blogPosts.length > 0 ? blogPosts : sampleBlogs).reduce((tags, blog) => {
        if (blog.tags && Array.isArray(blog.tags)) {
          return [...tags, ...blog.tags];
        }
        return tags;
      }, [] as string[]);
      setTags(Array.from(new Set(allTags)));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  // Filter and sort blogs
  const filteredBlogs = blogPosts.filter(blog => {
    const matchesCategory = activeCategory === 'all' || blog.category === activeCategory;
    const matchesSearch = !searchQuery || 
      (blog.title && blog.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (blog.excerpt && blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (blog.category && blog.category.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = !selectedTag || (blog.tags && Array.isArray(blog.tags) && blog.tags.includes(selectedTag));
    
    return matchesCategory && matchesSearch && matchesTag;
  });

  // Sort blogs
  const sortedBlogs = [...filteredBlogs].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'popular':
        return (b.views || 0) - (a.views || 0);
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const getCategoryIcon = (category: string) => {
    if (!category) return <IconComponent icon={FaGraduationCap} className="text-gray-500" />;
    
    switch (category.toLowerCase()) {
      case 'technology':
        return <IconComponent icon={FaChartLine} className="text-blue-500" />;
      case 'education':
        return <IconComponent icon={FaGraduationCap} className="text-green-500" />;
      case 'scholarships':
        return <IconComponent icon={FaGlobe} className="text-purple-500" />;
      case 'success stories':
        return <IconComponent icon={FaHeart} className="text-red-500" />;
      case 'study abroad':
        return <IconComponent icon={FaGlobe} className="text-indigo-500" />;
      case 'career':
        return <IconComponent icon={FaChartLine} className="text-orange-500" />;
      default:
        return <IconComponent icon={FaGraduationCap} className="text-gray-500" />;
    }
  };

  const openBlogModal = async (blog: BlogPost) => {
    try {
      // Fetch full blog content if not already loaded
      if (!blog.content || blog.content === 'Full content here...') {
        const response = await blogAPI.getById(blog.id);
        if (response.success && response.data && response.data.blog) {
          setSelectedBlog(response.data.blog);
        } else {
          setSelectedBlog(blog);
        }
      } else {
        setSelectedBlog(blog);
      }
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching blog details:', error);
      setSelectedBlog(blog);
      setShowModal(true);
    }
  };

  const closeBlogModal = () => {
    setShowModal(false);
    setSelectedBlog(null);
  };

  const clearAllFilters = () => {
    setActiveCategory('all');
    setSearchQuery('');
    setSelectedTag('');
    setSortBy('newest');
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  console.log('Rendering blogs:', blogPosts.length, 'filtered:', sortedBlogs.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50">
      <Header />
      <main className="flex-grow">
        <PageHeader
          title={t('blog.title') || 'Blog & Insights'}
          subtitle={t('blog.subtitle') || 'Stay updated with the latest trends in education and technology'}
          height="sm"
        >
          {/* Enhanced Search Bar - Desktop only */}
          <div className="max-w-2xl mx-auto hidden lg:block">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 shadow-2xl border border-white/20">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder={t('blog.searchPlaceholder') || 'Search articles...'}
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

        {/* Main Content */}
        <section className="py-8 sm:py-12">
          <div className="container mx-auto px-4">
            {/* Mobile Search and Action Bar - Show on mobile only */}
            <div className="block lg:hidden mb-6 space-y-4">
              {/* Mobile Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search articles..."
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
                  onClick={() => setShowFilters(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <IconComponent icon={FaFilter} className="h-4 w-4" />
                  <span>Filters</span>
                  {((activeCategory !== 'all' ? 1 : 0) + (selectedTag ? 1 : 0) + (searchQuery ? 1 : 0)) > 0 && (
                    <span className="bg-blue-800 text-white text-xs px-2 py-1 rounded-full">
                      {(activeCategory !== 'all' ? 1 : 0) + (selectedTag ? 1 : 0) + (searchQuery ? 1 : 0)}
                    </span>
                  )}
                </button>

                {/* View Mode Toggle */}
                <button
                  onClick={() => setMobileViewMode(mobileViewMode === 'grid' ? 'list' : 'grid')}
                  className="px-3 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all flex items-center justify-center"
                >
                  <IconComponent icon={mobileViewMode === 'grid' ? FaFilter : FaSort} className="h-4 w-4" />
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

            {/* Mobile Filter Panel - Show on mobile/tablet only */}
            <div className="hidden">
              <MobileFilterPanel
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search articles..."
                filters={[
                  {
                    key: 'category',
                    label: 'Category',
                    value: activeCategory === 'all' ? '' : activeCategory,
                    options: categories.filter(cat => cat !== 'all').map(category => ({ 
                      value: category, 
                      label: category,
                      count: blogPosts.filter(p => p.category === category).length
                    })),
                    onChange: (value) => setActiveCategory(value || 'all')
                  }
                ]}
                sortOptions={[
                  { value: 'newest', label: 'Newest First' },
                  { value: 'oldest', label: 'Oldest First' },
                  { value: 'popular', label: 'Most Popular' },
                  { value: 'title', label: 'Title' }
                ]}
                sortBy={sortBy}
                onSortChange={setSortBy}
                onClearFilters={clearAllFilters}
                activeFilterCount={
                  (activeCategory !== 'all' ? 1 : 0) + 
                  (selectedTag ? 1 : 0) + 
                  (searchQuery ? 1 : 0)
                }
              />
            </div>

            {loading ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading articles...</p>
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
                        {categories.filter(cat => cat !== 'all').map((category) => {
                          // Use all blogs for count, not filtered ones
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
                        {tags.slice(0, 10).map(tag => (
                          <motion.button
                            key={tag}
                            className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                              selectedTag === tag
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 hover:bg-blue-100 hover:text-blue-800 text-gray-700'
                            }`}
                            onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
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
                        {activeCategory === 'all' ? 'Latest Articles' : activeCategory}
                        {searchQuery && (
                          <span className="text-lg font-normal text-gray-600 ml-2">
                            - Results for "{searchQuery}"
                          </span>
                        )}
                      </h2>
                      <p className="text-gray-600">
                        Showing {sortedBlogs.length} article{sortedBlogs.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-4 sm:mt-0">
                      {/* View Mode Toggle - Desktop */}
                      <div className="hidden lg:flex items-center gap-2">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}
                        >
                          <IconComponent icon={FaSort} />
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}
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
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="newest">Newest First</option>
                          <option value="oldest">Oldest First</option>
                          <option value="popular">Most Popular</option>
                          <option value="title">Title</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Active Filters */}
                  {(searchQuery || activeCategory !== 'all' || selectedTag) && (
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
                        {selectedTag && (
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                            Tag: #{selectedTag}
                            <button onClick={() => setSelectedTag('')}>
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
                      {sortedBlogs.map((post) => (
                        <motion.div
                          key={post.id}
                          className={viewMode === 'grid' 
                            ? "bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group cursor-pointer"
                            : "bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col lg:flex-row group cursor-pointer"
                          }
                          variants={itemVariants}
                          whileHover={{ y: -4, scale: 1.01 }}
                          onClick={() => openBlogModal(post)}
                        >
                          {viewMode === 'grid' ? (
                            // Grid View Layout - Database-style card
                            <>
                              <div className="relative overflow-hidden">
                                <img 
                                  src={post.image || '/api/placeholder/400/250'} 
                                  alt={post.title}
                                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm font-bold text-purple-600 shadow-md">
                                  {post.read_time || calculateReadTime(post.content || '')} min
                                </div>
                                {post.featured && (
                                  <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                                    Featured
                                  </div>
                                )}
                              </div>
                              
                              <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                                    {getCategoryIcon(post.category)}
                                    <span className="ml-1">{post.category}</span>
                                  </span>
                                  <span className="text-gray-500 text-xs">
                                    {formatDate(post.created_at)}
                                  </span>
                                </div>
                                
                                <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 flex-shrink-0 group-hover:text-purple-600 transition-colors">
                                  {post.title}
                                </h3>
                                <p className="text-gray-600 mb-4 text-sm line-clamp-3 flex-1">{post.excerpt}</p>
                                
                                <div className="flex items-center mb-4">
                                  <img 
                                    src={post.author?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'Author')}&background=8B5CF6&color=fff`}
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
                                
                                {/* Database-style single button */}
                                <motion.button
                                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white py-3 px-4 rounded-lg font-medium transition-all text-sm shadow-lg"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openBlogModal(post);
                                  }}
                                >
                                  Read Article
                                </motion.button>
                              </div>
                            </>
                          ) : (
                            // List View Layout - Database-style horizontal card
                            <>
                              <div className="relative overflow-hidden w-full lg:w-80 flex-shrink-0">
                                <img 
                                  src={post.image || '/api/placeholder/400/250'} 
                                  alt={post.title}
                                  className="w-full h-48 lg:h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                {post.featured && (
                                  <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                                    Featured
                                  </div>
                                )}
                              </div>
                              
                              <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                                    {getCategoryIcon(post.category)}
                                    <span className="ml-1">{post.category}</span>
                                  </span>
                                  <span className="text-gray-500 text-xs">
                                    {post.read_time || calculateReadTime(post.content || '')} min read
                                  </span>
                                </div>
                                
                                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">
                                  {post.title}
                                </h3>
                                <p className="text-gray-600 mb-4 line-clamp-2 flex-1">{post.excerpt}</p>
                                
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center">
                                    <img 
                                      src={post.author?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'Author')}&background=8B5CF6&color=fff`}
                                      alt={post.author?.name || 'Author'}
                                      className="w-8 h-8 rounded-full mr-3"
                                    />
                                    <div>
                                      <p className="text-sm font-medium text-gray-800">{post.author?.name || 'Anonymous'}</p>
                                      <p className="text-xs text-gray-600">{formatDate(post.created_at)}</p>
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
                                        openBlogModal(post);
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
                                
                                {/* Tags */}
                                {post.tags && post.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {post.tags.slice(0, 5).map(tag => (
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
                        {sortedBlogs.map((post) => (
                          <motion.div
                            key={post.id}
                            variants={fadeIn("up", 0.1)}
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                            onClick={() => openBlogModal(post)}
                          >
                            <div className="relative">
                              <img
                                src={post.image || '/api/placeholder/300/200'}
                                alt={post.title}
                                className="w-full h-28 sm:h-32 object-cover"
                              />
                              {post.featured && (
                                <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-1 py-0.5 rounded-full">
                                  ★
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2 leading-tight">
                                {post.title}
                              </h3>
                              <p className="text-xs text-gray-600 mb-2 flex items-center">
                                <IconComponent icon={FaNewspaper} className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="truncate">{post.category}</span>
                              </p>
                              <div className="space-y-1 text-xs mb-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-500">Author:</span>
                                  <span className="font-medium text-purple-600 truncate">{post.author?.name || 'Anonymous'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-500">Read time:</span>
                                  <span className="font-medium text-green-600">{post.read_time || calculateReadTime(post.content || '')} min</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-500">Date:</span>
                                  <span className="font-medium">{formatDate(post.created_at)}</span>
                                </div>
                              </div>
                              <button className="w-full px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-md hover:bg-purple-700 transition-colors">
                                Read Article
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      /* Mobile List View */
                      <div className="space-y-3">
                        {sortedBlogs.map((post) => (
                          <motion.div
                            key={post.id}
                            variants={fadeIn("up", 0.1)}
                            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
                            onClick={() => openBlogModal(post)}
                          >
                            <div className="flex gap-3">
                              <div className="relative flex-shrink-0">
                                <img
                                  src={post.image || '/api/placeholder/60/60'}
                                  alt={post.title}
                                  className="w-14 h-14 object-cover rounded-md"
                                />
                                {post.featured && (
                                  <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1 py-0.5 rounded-full">
                                    ★
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">
                                  {post.title}
                                </h3>
                                <p className="text-xs text-gray-600 mb-2 flex items-center">
                                  <IconComponent icon={FaNewspaper} className="h-3 w-3 mr-1" />
                                  {post.category}
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-500">Author: </span>
                                    <span className="font-medium text-purple-600">{post.author?.name || 'Anonymous'}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Read: </span>
                                    <span className="font-medium">{post.read_time || calculateReadTime(post.content || '')} min</span>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-gray-500">Published: </span>
                                    <span className="font-medium text-green-600">{formatDate(post.created_at)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                <button className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors">
                                  <IconComponent icon={FaBookmark} className="h-3 w-3" />
                                </button>
                                <button className="p-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors">
                                  <IconComponent icon={FaEye} className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <motion.div 
                      className="mt-8 flex justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePageChange(pagination.currentPage - 1)}
                          disabled={pagination.currentPage === 1}
                          className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                                pagination.currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        
                        {pagination.totalPages > 5 && (
                          <>
                            <span className="px-2 text-gray-500">...</span>
                            <button
                              onClick={() => handlePageChange(pagination.totalPages)}
                              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                                pagination.currentPage === pagination.totalPages
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pagination.totalPages}
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => handlePageChange(pagination.currentPage + 1)}
                          disabled={pagination.currentPage === pagination.totalPages}
                          className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <img 
                  src={selectedBlog.image} 
                  alt={selectedBlog.title}
                  className="w-full h-48 sm:h-64 object-cover"
                />
                <button
                  onClick={closeBlogModal}
                  className="absolute top-4 right-4 bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors shadow-md"
                >
                  <IconComponent icon={FaTimes} className="h-4 w-4" />
                </button>
              </div>
              
              <div className="p-4 sm:p-8">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="bg-blue-100 text-blue-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full flex items-center">
                    {getCategoryIcon(selectedBlog.category)}
                    <span className="ml-1">{selectedBlog.category}</span>
                  </span>
                  <span className="text-gray-500 text-xs sm:text-sm flex items-center">
                    <IconComponent icon={FaClock} className="mr-1 h-3 w-3" />
                    {selectedBlog.read_time || calculateReadTime(selectedBlog.content || selectedBlog.excerpt)} min read
                  </span>
                  {selectedBlog.views && (
                    <span className="text-gray-500 text-xs sm:text-sm flex items-center">
                      <IconComponent icon={FaEye} className="mr-1 h-3 w-3" />
                      {selectedBlog.views.toLocaleString()}
                    </span>
                  )}
                </div>
                
                <h1 className="text-xl sm:text-3xl font-bold text-gray-800 mb-4 leading-tight">{selectedBlog.title}</h1>
                
                <div className="flex items-center mb-6">
                  <img 
                    src={selectedBlog.author?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedBlog.author?.name || 'Author')}&background=3b82f6&color=fff`}
                    alt={selectedBlog.author?.name || 'Author'}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mr-3 sm:mr-4"
                  />
                  <div>
                    <p className="font-medium text-gray-800 text-sm sm:text-base">{selectedBlog.author?.name || 'Anonymous'}</p>
                    <p className="text-gray-600 text-xs sm:text-sm">{formatDate(selectedBlog.created_at)}</p>
                  </div>
                </div>
                
                <div className="prose prose-sm sm:prose max-w-none mb-6">
                  <p className="text-sm sm:text-lg text-gray-700 leading-relaxed">{selectedBlog.content || selectedBlog.excerpt}</p>
                </div>
                
                {selectedBlog.tags && selectedBlog.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {selectedBlog.tags.map(tag => (
                      <span key={tag} className="bg-gray-100 text-gray-700 text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base">
                    <IconComponent icon={FaShare} className="h-4 w-4" />
                    Share
                  </button>
                  <button className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base">
                    <IconComponent icon={FaBookmark} className="h-4 w-4" />
                    Save for Later
                  </button>
                  <button className="flex items-center justify-center gap-2 bg-green-100 text-green-700 px-4 py-2.5 rounded-lg hover:bg-green-200 transition-colors text-sm sm:text-base">
                    <IconComponent icon={FaHeart} className="h-4 w-4" />
                    Like
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    {categories.filter(cat => cat !== 'all').map(category => (
                      <option key={category} value={category}>
                        {category} ({blogPosts.filter(p => p.category === category).length})
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="popular">Most Popular</option>
                    <option value="title">Title</option>
                  </select>
                </div>

                {/* Popular Tags */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Popular Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {tags.slice(0, 15).map(tag => (
                      <button
                        key={tag}
                        className={`text-xs font-medium px-3 py-2 rounded-full transition-colors ${
                          selectedTag === tag
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-gray-100 hover:bg-blue-100 hover:text-blue-800 text-gray-700 border border-gray-200'
                        }`}
                        onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
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
                        setSortBy('featured');
                      }}
                      className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      📌 Featured Articles
                    </button>
                    <button
                      onClick={() => {
                        setActiveCategory('all');
                        setSortBy('popular');
                      }}
                      className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      🔥 Most Popular
                    </button>
                    <button
                      onClick={() => {
                        setActiveCategory('all');
                        setSortBy('newest');
                      }}
                      className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      🆕 Latest Articles
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

export default Blog; 