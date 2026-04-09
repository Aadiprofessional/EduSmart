import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaCalendarAlt, FaUser, FaTag, FaSearch, FaArrowLeft, FaClock, FaArrowRight, FaChartLine, FaGraduationCap, FaGlobe, FaTimes, FaShare, FaBookmark, FaEye, FaFilter, FaChevronDown, FaSort, FaHeart, FaRegHeart, FaNewspaper, FaTh, FaList, FaPen } from 'react-icons/fa';
import { Header } from '../components/layout';
import Footer from '../components/layout/Footer';
import PageHeader from '../components/ui/PageHeader';
import MobileFilterPanel from '../components/ui/MobileFilterPanel';
import IconComponent from '../components/ui/IconComponent';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedSection from '../components/ui/AnimatedSection';
import { blogAPI } from '../utils/apiService';
import { useLanguage } from '../utils/LanguageContext';
import { BlogCardSkeleton } from '../components/ui/Skeleton';

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
      created_at: '2022-05-15T00:00:00Z',
      updated_at: '2022-05-15T00:00:00Z',
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
      created_at: '2022-05-10T00:00:00Z',
      updated_at: '2022-05-10T00:00:00Z',
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
      title: 'International Scholarship Guide: Hidden Opportunities for 2022',
      excerpt: 'Uncover lesser-known scholarship programs and funding sources for international students planning to study abroad in 2022.',
      content: 'Full content here...',
      author: { name: 'Michael Thompson', avatar_url: undefined },
      created_at: '2022-05-05T00:00:00Z',
      updated_at: '2022-05-05T00:00:00Z',
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
        return <IconComponent icon={FaChartLine} className="text-indigo-500" />;
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
        ease: [0, 0, 0.58, 1] as const,
      },
    },
  });

  console.log('Rendering blogs:', blogPosts.length, 'filtered:', sortedBlogs.length);

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
                {t('blog.title')}
            </motion.h1>
            <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-lg text-gray-400 max-w-2xl mx-auto"
            >
                {t('blog.subtitle')}
            </motion.p>
          
          {/* Enhanced Search Bar - Desktop only */}
          <div className="max-w-2xl mx-auto hidden lg:block mt-8">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-2 shadow-2xl border border-white/10">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder={t('blog.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-6 py-4 pl-12 bg-[#0A0A0A]/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-[#0A0A0A] transition-all text-lg placeholder-gray-500 border border-white/5"
                  />
                  <IconComponent icon={FaSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                </div>
                <button className="px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 shadow-lg shadow-purple-500/20">
                  <IconComponent icon={FaSearch} />
                  <span className="hidden sm:inline">{t('common.search')}</span>
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
                  placeholder={t('blog.searchPlaceholder')}
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
                  onClick={() => setShowFilters(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20"
                >
                  <IconComponent icon={FaFilter} className="h-4 w-4" />
                  <span>{t('common.filter')}</span>
                  {((activeCategory !== 'all' ? 1 : 0) + (selectedTag ? 1 : 0) + (searchQuery ? 1 : 0)) > 0 && (
                    <span className="bg-purple-800 text-white text-xs px-2 py-1 rounded-full">
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
                searchPlaceholder={t('blog.searchPlaceholder')}
                filters={[
                  {
                    key: 'category',
                    label: t('blog.category'),
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
                  { value: 'newest', label: t('blog.sortNewest') },
                  { value: 'oldest', label: t('blog.sortOldest') },
                  { value: 'popular', label: t('blog.sortPopular') },
                  { value: 'title', label: t('blog.sortTitle') }
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
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Desktop Sidebar Skeleton */}
                <div className="hidden lg:block lg:w-1/4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 animate-pulse">
                    <div className="flex items-center justify-between mb-6">
                      <div className="h-5 bg-white/10 rounded w-16"></div>
                      <div className="h-4 bg-white/10 rounded w-20"></div>
                    </div>
                    <div className="space-y-4">
                      <div className="h-10 bg-white/10 rounded"></div>
                      <div className="h-10 bg-white/10 rounded"></div>
                      <div className="h-10 bg-white/10 rounded"></div>
                    </div>
                  </div>
                </div>

                {/* Main Content Skeleton */}
                <div className="lg:w-3/4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6 animate-pulse">
                    <div className="h-6 bg-white/10 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-white/10 rounded w-32"></div>
                  </div>

                  {/* Desktop View Skeleton */}
                  <div className="hidden lg:block">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(9)].map((_, index) => (
                        <BlogCardSkeleton key={index} dark={true} />
                      ))}
                    </div>
                  </div>

                  {/* Mobile View Skeleton */}
                  <div className="lg:hidden">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      {[...Array(6)].map((_, index) => (
                        <BlogCardSkeleton key={index} isMobile={true} dark={true} />
                      ))}
                    </div>
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
                  <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 sticky top-24 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-white">{t('common.filter')}</h3>
                      {(searchQuery || activeCategory !== 'all') && (
                        <button
                          onClick={clearAllFilters}
                          className="text-sm text-purple-400 hover:text-purple-300 font-medium"
                        >
                          {t('blog.clearAll')}
                        </button>
                      )}
                    </div>

                    {/* Categories */}
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-gray-300 mb-3">{t('blog.categories')}</h4>
                      <div className="space-y-2">
                        <motion.button
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                            activeCategory === 'all'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium'
                              : 'text-gray-400 hover:bg-white/5 hover:text-white'
                          }`}
                          onClick={() => setActiveCategory('all')}
                          whileHover={{ x: 2 }}
                        >
                          {t('blog.allCategories')} ({blogPosts.length})
                        </motion.button>
                        {categories.filter(cat => cat !== 'all').map((category) => {
                          // Use all blogs for count, not filtered ones
                          const count = blogPosts.filter(p => p.category === category).length;
                          return (
                            <motion.button
                              key={category}
                              className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center ${
                                activeCategory === category
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium'
                                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
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
                      <h4 className="text-md font-semibold text-gray-300 mb-3">{t('blog.popularTags')}</h4>
                      <div className="flex flex-wrap gap-2">
                        {tags.slice(0, 10).map(tag => (
                          <motion.button
                            key={tag}
                            className={`text-xs font-medium px-3 py-1 rounded-full transition-colors border ${
                              selectedTag === tag
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
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
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 bg-[#0A0A0A] border border-white/10 rounded-xl p-6 backdrop-blur-xl">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">
                        {activeCategory === 'all' ? t('blog.latestArticles') : activeCategory}
                        {searchQuery && (
                          <span className="text-lg font-normal text-gray-400 ml-2">
                            - {t('blog.resultsFor')} "{searchQuery}"
                          </span>
                        )}
                      </h2>
                      <p className="text-gray-400">
                        {t('blog.showing')} {sortedBlogs.length} {sortedBlogs.length !== 1 ? t('blog.articlesPlural') : t('blog.articleSingular')}
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
                          onChange={(e) => setSortBy(e.target.value)}
                          className="px-3 py-2 bg-[#0A0A0A] border border-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        >
                          <option value="newest">{t('blog.sortNewest')}</option>
                          <option value="oldest">{t('blog.sortOldest')}</option>
                          <option value="popular">{t('blog.sortPopular')}</option>
                          <option value="title">{t('blog.sortTitle')}</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Active Filters */}
                  {(searchQuery || activeCategory !== 'all' || selectedTag) && (
                    <motion.div 
                      className="mb-6 bg-[#0A0A0A] border border-white/10 rounded-xl p-4 backdrop-blur-xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-gray-400 font-medium">{t('blog.activeFilters')}</span>
                        {searchQuery && (
                          <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-purple-500/30">
                            {t('common.search')}: "{searchQuery}"
                            <button onClick={() => setSearchQuery('')}>
                              <IconComponent icon={FaTimes} className="text-xs" />
                            </button>
                          </span>
                        )}
                        {activeCategory !== 'all' && (
                          <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-purple-500/30">
                            {t('blog.category')}: {activeCategory}
                            <button onClick={() => setActiveCategory('all')}>
                              <IconComponent icon={FaTimes} className="text-xs" />
                            </button>
                          </span>
                        )}
                        {selectedTag && (
                          <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-purple-500/30">
                            {t('blog.tags')}: #{selectedTag}
                            <button onClick={() => setSelectedTag('')}>
                              <IconComponent icon={FaTimes} className="text-xs" />
                            </button>
                          </span>
                        )}
                        <button
                          onClick={clearAllFilters}
                          className="text-gray-400 hover:text-white text-sm underline ml-2"
                        >
                          {t('blog.clearAll')}
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
                      <HolographicCard
                        key={post.id}
                        className={viewMode === 'grid' 
                          ? "flex flex-col h-full cursor-pointer group"
                          : "flex flex-col lg:flex-row h-full cursor-pointer group"
                        }
                      >
                        <div
                          className="flex-1 flex flex-col h-full"
                          onClick={() => openBlogModal(post)}
                        >
                          {viewMode === 'grid' ? (
                            // Grid View Layout
                            <>
                              <div className="relative overflow-hidden h-48 flex-shrink-0">
                                <img 
                                  src={post.image || '/api/placeholder/400/250'} 
                                  alt={post.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-60" />
                                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white border border-white/10">
                                  {post.read_time || calculateReadTime(post.content || '')} min
                                </div>
                                {post.featured && (
                                  <div className="absolute top-3 left-3 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg shadow-purple-500/20">
                                    {t('blog.featured')}
                                  </div>
                                )}
                              </div>
                              
                              <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 mb-4">
                                  <span className="bg-purple-500/10 text-purple-300 text-xs font-medium px-2.5 py-1 rounded-lg border border-purple-500/20 flex items-center">
                                    {getCategoryIcon(post.category)}
                                    <span className="ml-1">{post.category}</span>
                                  </span>
                                  <span className="text-gray-400 text-xs">
                                    {formatDate(post.created_at)}
                                  </span>
                                </div>
                                
                                <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-purple-300 transition-colors">
                                  {post.title}
                                </h3>
                                <p className="text-gray-400 mb-6 text-sm line-clamp-3 flex-1">{post.excerpt}</p>
                                
                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                  <div className="flex items-center gap-3">
                                    <img 
                                      src={post.author?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'Author')}&background=8B5CF6&color=fff`}
                                      alt={post.author?.name || 'Author'}
                                      className="w-8 h-8 rounded-full ring-2 ring-purple-500/20"
                                    />
                                    <div className="flex flex-col">
                                      <span className="text-sm font-medium text-gray-200">{post.author?.name || 'Anonymous'}</span>
                                      <span className="text-xs text-gray-500">{t('blog.author')}</span>
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
                                <img 
                                  src={post.image || '/api/placeholder/400/250'} 
                                  alt={post.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#0A0A0A] via-transparent to-transparent opacity-60" />
                                {post.featured && (
                                  <div className="absolute top-3 left-3 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg shadow-purple-500/20">
                                    {t('blog.featured')}
                                  </div>
                                )}
                              </div>
                              
                              <div className="p-6 flex-1 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center gap-3 mb-3">
                                    <span className="bg-purple-500/10 text-purple-300 text-xs font-medium px-2.5 py-1 rounded-lg border border-purple-500/20 flex items-center">
                                      {getCategoryIcon(post.category)}
                                      <span className="ml-1">{post.category}</span>
                                    </span>
                                    <span className="text-gray-400 text-xs flex items-center gap-1">
                                      <IconComponent icon={FaClock} className="w-3 h-3" />
                                      {post.read_time || calculateReadTime(post.content || '')} {t('blog.minRead')}
                                    </span>
                                  </div>
                                  
                                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">
                                    {post.title}
                                  </h3>
                                  <p className="text-gray-400 mb-4 line-clamp-2">{post.excerpt}</p>
                                  
                                  {/* Tags */}
                                  {post.tags && post.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                      {post.tags.slice(0, 5).map(tag => (
                                        <span key={tag} className="text-xs text-gray-500 hover:text-purple-400 transition-colors">
                                          #{tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                  <div className="flex items-center gap-3">
                                    <img 
                                      src={post.author?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'Author')}&background=8B5CF6&color=fff`}
                                      alt={post.author?.name || 'Author'}
                                      className="w-8 h-8 rounded-full ring-2 ring-purple-500/20"
                                    />
                                    <div className="flex flex-col">
                                      <span className="text-sm font-medium text-gray-200">{post.author?.name || 'Anonymous'}</span>
                                      <span className="text-xs text-gray-500">{formatDate(post.created_at)}</span>
                                    </div>
                                  </div>
                                  
                                  <button
                                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all text-sm shadow-lg shadow-purple-500/20"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openBlogModal(post);
                                    }}
                                  >
                                    {t('blog.readArticle')}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </HolographicCard>
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
                            className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden shadow-lg"
                            onClick={() => openBlogModal(post)}
                          >
                            <div className="relative">
                              <img
                                src={post.image || '/api/placeholder/300/200'}
                                alt={post.title}
                                className="w-full h-28 sm:h-32 object-cover"
                              />
                              {post.featured && (
                                <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                                  ★
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <h3 className="font-semibold text-sm text-white mb-1 line-clamp-2 leading-tight">
                                {post.title}
                              </h3>
                              <p className="text-xs text-gray-400 mb-2 flex items-center">
                                <IconComponent icon={FaNewspaper} className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="truncate">{post.category}</span>
                              </p>
                              <div className="space-y-1 text-xs mb-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-500">{t('blog.author')}:</span>
                                  <span className="font-medium text-purple-400 truncate">{post.author?.name || t('blog.anonymous')}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-500">{t('blog.readTime')}:</span>
                                  <span className="font-medium text-purple-400">{post.read_time || calculateReadTime(post.content || '')} min</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-500">{t('blog.date')}:</span>
                                  <span className="font-medium text-gray-300">{formatDate(post.created_at)}</span>
                                </div>
                              </div>
                              <button className="w-full px-3 py-1.5 bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-medium rounded-md hover:bg-purple-600 hover:text-white transition-colors">
                                {t('blog.readArticle')}
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
                            className="bg-[#0A0A0A] border border-white/10 rounded-xl p-4 shadow-lg"
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
                                  <div className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs px-1 py-0.5 rounded-full">
                                    ★
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm text-white mb-1 line-clamp-1">
                                  {post.title}
                                </h3>
                                <p className="text-xs text-gray-400 mb-2 flex items-center">
                                  <IconComponent icon={FaNewspaper} className="h-3 w-3 mr-1" />
                                  {post.category}
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-500">{t('blog.author')}: </span>
                                    <span className="font-medium text-purple-400">{post.author?.name || t('blog.anonymous')}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">{t('blog.read')}: </span>
                                    <span className="font-medium text-purple-400">{post.read_time || calculateReadTime(post.content || '')} min</span>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-gray-500">{t('blog.published')}: </span>
                                    <span className="font-medium text-gray-300">{formatDate(post.created_at)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                <button className="p-2 bg-white/5 text-gray-400 rounded hover:bg-white/10 transition-colors">
                                  <IconComponent icon={FaBookmark} className="h-3 w-3" />
                                </button>
                                <button className="p-2 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded hover:bg-purple-600 hover:text-white transition-colors">
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
                          className="px-4 py-2 text-sm font-medium text-gray-400 bg-[#0A0A0A] border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {t('common.previous')}
                        </button>
                        
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                pagination.currentPage === pageNum
                                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                  : 'text-gray-400 bg-[#0A0A0A] border border-white/10 hover:bg-white/5'
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
                              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                pagination.currentPage === pagination.totalPages
                                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                  : 'text-gray-400 bg-[#0A0A0A] border border-white/10 hover:bg-white/5'
                              }`}
                            >
                              {pagination.totalPages}
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => handlePageChange(pagination.currentPage + 1)}
                          disabled={pagination.currentPage === pagination.totalPages}
                          className="px-4 py-2 text-sm font-medium text-gray-400 bg-[#0A0A0A] border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {t('common.next')}
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeBlogModal}
          >
            <motion.div
              className="bg-[#0A0A0A] border border-white/10 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
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
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent opacity-60" />
                <button
                  onClick={closeBlogModal}
                  className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors shadow-md backdrop-blur-sm border border-white/10"
                >
                  <IconComponent icon={FaTimes} className="h-4 w-4" />
                </button>
              </div>
              
              <div className="p-4 sm:p-8">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="bg-purple-500/10 text-purple-300 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full flex items-center border border-purple-500/20">
                    {getCategoryIcon(selectedBlog.category)}
                    <span className="ml-1">{selectedBlog.category}</span>
                  </span>
                  <span className="text-gray-400 text-xs sm:text-sm flex items-center">
                    <IconComponent icon={FaClock} className="mr-1 h-3 w-3" />
                    {selectedBlog.read_time || calculateReadTime(selectedBlog.content || selectedBlog.excerpt)} {t('blog.minRead')}
                  </span>
                  {selectedBlog.views && (
                    <span className="text-gray-400 text-xs sm:text-sm flex items-center">
                      <IconComponent icon={FaEye} className="mr-1 h-3 w-3" />
                      {selectedBlog.views.toLocaleString()}
                    </span>
                  )}
                </div>
                
                <h1 className="text-xl sm:text-3xl font-bold text-white mb-4 leading-tight">{selectedBlog.title}</h1>
                
                <div className="flex items-center mb-6">
                  <img 
                    src={selectedBlog.author?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedBlog.author?.name || 'Author')}&background=8B5CF6&color=fff`}
                    alt={selectedBlog.author?.name || 'Author'}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mr-3 sm:mr-4 ring-2 ring-purple-500/20"
                  />
                  <div>
                    <p className="font-medium text-white text-sm sm:text-base">{selectedBlog.author?.name || t('blog.anonymous')}</p>
                    <p className="text-gray-400 text-xs sm:text-sm">{formatDate(selectedBlog.created_at)}</p>
                  </div>
                </div>
                
                <div className="prose prose-sm sm:prose max-w-none mb-6 prose-invert">
                  <p className="text-sm sm:text-lg text-gray-300 leading-relaxed">{selectedBlog.content || selectedBlog.excerpt}</p>
                </div>
                
                {selectedBlog.tags && selectedBlog.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {selectedBlog.tags.map(tag => (
                      <span key={tag} className="bg-white/5 text-gray-300 text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full border border-white/10 hover:bg-white/10 transition-colors">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 border-t border-white/10 pt-6">
                  <button className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base shadow-lg shadow-purple-500/20">
                    <IconComponent icon={FaShare} className="h-4 w-4" />
                    {t('blog.share')}
                  </button>
                  <button className="flex items-center justify-center gap-2 bg-white/5 text-gray-300 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-sm sm:text-base border border-white/10">
                    <IconComponent icon={FaBookmark} className="h-4 w-4" />
                    {t('blog.saveForLater')}
                  </button>
                  <button className="flex items-center justify-center gap-2 bg-green-500/10 text-green-400 px-4 py-2.5 rounded-lg hover:bg-green-500/20 transition-colors text-sm sm:text-base border border-green-500/20">
                    <IconComponent icon={FaHeart} className="h-4 w-4" />
                    {t('blog.like')}
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFilters(false)}
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
                <h3 className="text-lg font-semibold text-white">{t('common.filter')}</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors bg-white/5 border border-white/10"
                >
                  <IconComponent icon={FaTimes} className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 pb-20">
                {/* Categories */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2">{t('blog.category')}</label>
                  <select
                    value={activeCategory}
                    onChange={(e) => setActiveCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A0A0A] border border-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">{t('blog.allCategories')}</option>
                    {categories.filter(cat => cat !== 'all').map(category => (
                      <option key={category} value={category}>
                        {category} ({blogPosts.filter(p => p.category === category).length})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2">{t('blog.sortBy')}</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A0A0A] border border-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="newest">{t('blog.sortNewest')}</option>
                    <option value="oldest">{t('blog.sortOldest')}</option>
                    <option value="popular">{t('blog.sortPopular')}</option>
                    <option value="title">{t('blog.sortTitle')}</option>
                  </select>
                </div>

                {/* Popular Tags */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2">{t('blog.popularTags')}</label>
                  <div className="flex flex-wrap gap-2">
                    {tags.slice(0, 15).map(tag => (
                      <button
                        key={tag}
                        className={`text-xs font-medium px-3 py-2 rounded-full transition-colors ${
                          selectedTag === tag
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-white/5 hover:bg-white/10 text-gray-400 border border-white/10'
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
                  <label className="block text-sm font-medium text-gray-400 mb-2">{t('blog.quickFilters')}</label>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setActiveCategory('all');
                        setSortBy('featured');
                      }}
                      className="w-full text-left px-3 py-2 text-sm bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors border border-white/10"
                    >
                      {t('blog.featuredArticles')}
                    </button>
                    <button
                      onClick={() => {
                        setActiveCategory('all');
                        setSortBy('popular');
                      }}
                      className="w-full text-left px-3 py-2 text-sm bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors border border-white/10"
                    >
                      {t('blog.sortPopular')}
                    </button>
                    <button
                      onClick={() => {
                        setActiveCategory('all');
                        setSortBy('newest');
                      }}
                      className="w-full text-left px-3 py-2 text-sm bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors border border-white/10"
                    >
                      {t('blog.latestArticles')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-white/10 px-4 py-3 flex gap-3">
                <button
                  onClick={clearAllFilters}
                  className="flex-1 px-4 py-2 border border-white/10 text-gray-300 rounded-lg hover:bg-white/5 transition-colors"
                >
                  {t('methodSelection.reset')}
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20"
                >
                  {t('common.submit')}
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
