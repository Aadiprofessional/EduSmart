import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaUser, FaBook, FaDownload, FaVideo, FaFileAlt, FaEye, FaArrowRight, FaGraduationCap, FaBriefcase } from 'react-icons/fa';
import IconComponent from './IconComponent';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedSection from './AnimatedSection';
import { useLanguage } from '../../utils/LanguageContext';
import { blogAPI, fetchResponses } from '../../utils/apiService';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author?: { name: string; avatar_url?: string };
  created_at: string;
  category: string;
  tags: string[];
  image?: string;
  featured?: boolean;
  views?: number;
  read_time?: number;
}

interface Resource {
  id: string;
  title: string;
  type: 'guide' | 'template' | 'checklist' | 'video' | 'webinar' | 'ebook';
  category: 'application' | 'study' | 'test-prep' | 'career';
  description: string;
  thumbnail: string;
  featured?: boolean;
  tags: string[];
  downloads: number;
  views?: number;
  created_at: string;
}

const BlogSection: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'blogs' | 'resources'>('blogs');
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  // Sample featured blogs
  const sampleBlogs: BlogPost[] = [
    {
      id: '1',
      title: 'How AI Is Revolutionizing University Selection Process',
      excerpt: 'Discover how artificial intelligence algorithms are helping students find their perfect university match with unprecedented accuracy.',
      author: { name: 'Dr. James Wilson', avatar_url: undefined },
      created_at: '2024-05-15T00:00:00Z',
      category: 'Technology',
      tags: ['AI', 'University', 'Technology'],
      image: 'https://images.unsplash.com/photo-1593642532744-d377ab507dc8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      featured: true,
      views: 1250,
      read_time: 5
    },
    {
      id: '2',
      title: '5 Success Stories: From Rejection to Top University Admission',
      excerpt: 'Read inspiring case studies of students who overcame initial rejections and secured spots at prestigious universities worldwide.',
      author: { name: 'Emily Parker', avatar_url: undefined },
      created_at: '2024-05-10T00:00:00Z',
      category: 'Success Stories',
      tags: ['Success', 'University', 'Admission'],
      image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      featured: true,
      views: 980,
      read_time: 7
    },
    {
      id: '3',
      title: 'International Scholarship Guide: Hidden Opportunities for 2025',
      excerpt: 'Uncover lesser-known scholarship programs and funding sources for international students planning to study abroad.',
      author: { name: 'Michael Thompson', avatar_url: undefined },
      created_at: '2024-05-05T00:00:00Z',
      category: 'Scholarships',
      tags: ['Scholarships', 'International', 'Funding'],
      image: 'https://images.unsplash.com/photo-1532649538693-f3a2ec1bf8bd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      featured: true,
      views: 1450,
      read_time: 6
    }
  ];

  // Sample featured resources
  const sampleResources: Resource[] = [
    {
      id: '1',
      title: 'University Application Guide 2024',
      type: 'guide',
      category: 'application',
      description: 'Complete step-by-step guide for university applications including essays, recommendations, and deadlines.',
      thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      featured: true,
      tags: ['Application', 'University', 'Guide'],
      downloads: 2450,
      views: 5200,
      created_at: '2024-01-15T00:00:00Z'
    },
    {
      id: '2',
      title: 'SAT Preparation Checklist',
      type: 'checklist',
      category: 'test-prep',
      description: 'Comprehensive checklist to ensure you are fully prepared for the SAT exam.',
      thumbnail: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      featured: true,
      tags: ['SAT', 'Test Prep', 'Checklist'],
      downloads: 3200,
      views: 6800,
      created_at: '2024-01-05T00:00:00Z'
    },
    {
      id: '3',
      title: 'Scholarship Application E-book',
      type: 'ebook',
      category: 'application',
      description: 'Comprehensive e-book covering scholarship opportunities and application strategies.',
      thumbnail: 'https://images.unsplash.com/photo-1532649538693-f3a2ec1bf8bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      featured: true,
      tags: ['Scholarship', 'E-book', 'Application'],
      downloads: 1650,
      views: 4200,
      created_at: '2023-12-20T00:00:00Z'
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load blogs
      try {
        const blogsData = await blogAPI.getAll(1, 10); // Get first 10 blogs
        if (blogsData && blogsData.data && blogsData.data.blogs && Array.isArray(blogsData.data.blogs)) {
          const featuredBlogs = blogsData.data.blogs.filter((blog: any) => blog.featured).slice(0, 3);
          setBlogs(featuredBlogs);
        } else {
          setBlogs(sampleBlogs);
        }
      } catch (err) {
        console.warn('Using sample blogs data');
        setBlogs(sampleBlogs);
      }

      // Load resources
      try {
        const resourcesData = await fetchResponses();
        if (resourcesData && resourcesData.responses && Array.isArray(resourcesData.responses)) {
          const featuredResources = resourcesData.responses.filter((resource: any) => resource.featured).slice(0, 3);
          setResources(featuredResources);
        } else {
          setResources(sampleResources);
        }
      } catch (err) {
        console.warn('Using sample resources data');
        setResources(sampleResources);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setBlogs(sampleBlogs);
      setResources(sampleResources);
    } finally {
      setLoading(false);
    }
  };

  // Get icon for resource type
  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'guide':
        return <IconComponent icon={FaBook} className="text-teal-600" />;
      case 'template':
        return <IconComponent icon={FaFileAlt} className="text-blue-600" />;
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

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-teal-50">
      <div className="container mx-auto px-4">
        <AnimatedSection direction="up">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Latest Insights & Resources
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stay updated with our latest blog posts and access valuable educational resources
            </p>
          </div>
        </AnimatedSection>

        {/* Tab Navigation */}
        <AnimatedSection direction="up" delay={0.2}>
          <div className="flex justify-center mb-12">
            <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-200">
              <div className="flex">
                <motion.button
                  className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                    activeTab === 'blogs'
                      ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('blogs')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <IconComponent icon={FaBook} />
                  Featured Blogs
                </motion.button>
                <motion.button
                  className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                    activeTab === 'resources'
                      ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('resources')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <IconComponent icon={FaDownload} />
                  Featured Resources
                </motion.button>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'blogs' ? (
            <motion.div
              key="blogs"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {blogs.map((post, index) => (
                <motion.div
                  key={post.id}
                  variants={itemVariants}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 group"
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  <div className="relative overflow-hidden">
                    <motion.img
                      src={post.image || '/api/placeholder/400/250'}
                      alt={post.title}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Featured
                    </div>
                    <div className="absolute top-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-700 flex items-center">
                      <IconComponent icon={FaEye} className="mr-1" />
                      {post.views?.toLocaleString() || '0'}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-teal-100 text-teal-800 text-xs font-medium px-3 py-1 rounded-full">
                        {post.category}
                      </span>
                      {post.read_time && (
                        <span className="text-gray-500 text-xs flex items-center">
                          <IconComponent icon={FaCalendarAlt} className="mr-1" />
                          {post.read_time} min read
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-teal-600 transition-colors">
                      <Link to={`/blog/${post.id}`}>
                        {post.title}
                      </Link>
                    </h3>
                    
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <IconComponent icon={FaUser} className="mr-2 text-teal-600" />
                        {post.author?.name || 'Anonymous'}
                      </div>
                      <div className="flex items-center">
                        <IconComponent icon={FaCalendarAlt} className="mr-2 text-teal-600" />
                        {formatDate(post.created_at)}
                      </div>
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {post.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    
                    <motion.div
                      whileHover={{ x: 5 }}
                      className="flex items-center text-teal-600 font-medium"
                    >
                      <Link to={`/blog/${post.id}`} className="flex items-center">
                        Read More
                        <IconComponent icon={FaArrowRight} className="ml-2" />
                      </Link>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="resources"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {resources.map((resource, index) => (
                <motion.div
                  key={resource.id}
                  variants={itemVariants}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 group"
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  <div className="relative overflow-hidden">
                    <motion.img
                      src={resource.thumbnail || '/api/placeholder/400/250'}
                      alt={resource.title}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-green-500 to-teal-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Featured
                    </div>
                    <div className="absolute top-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-700 flex items-center">
                      <IconComponent icon={FaDownload} className="mr-1" />
                      {resource.downloads.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full flex items-center">
                        {getResourceTypeIcon(resource.type)}
                        <span className="ml-1 capitalize">{resource.type}</span>
                      </span>
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full flex items-center">
                        {getResourceCategoryIcon(resource.category)}
                        <span className="ml-1 capitalize">{resource.category}</span>
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-green-600 transition-colors">
                      {resource.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {resource.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <IconComponent icon={FaDownload} className="mr-1" />
                        {resource.downloads.toLocaleString()} downloads
                      </div>
                      {resource.views && (
                        <div className="flex items-center">
                          <IconComponent icon={FaEye} className="mr-1" />
                          {resource.views.toLocaleString()} views
                        </div>
                      )}
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {resource.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    
                    <motion.div
                      whileHover={{ x: 5 }}
                      className="flex items-center text-green-600 font-medium"
                    >
                      <Link to="/resources" className="flex items-center">
                        View Resource
                        <IconComponent icon={FaArrowRight} className="ml-2" />
                      </Link>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* View All Button */}
        <AnimatedSection direction="up" delay={0.4}>
          <div className="text-center mt-12">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to={activeTab === 'blogs' ? '/blog' : '/resources'}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white font-semibold rounded-2xl shadow-lg transition-all duration-300"
              >
                View All {activeTab === 'blogs' ? 'Blogs' : 'Resources'}
                <IconComponent icon={FaArrowRight} className="ml-2" />
              </Link>
            </motion.div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default BlogSection; 