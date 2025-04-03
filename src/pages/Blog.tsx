import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaCalendarAlt, FaUser, FaTag, FaSearch, FaArrowLeft, FaClock, FaArrowRight, FaChartLine, FaGraduationCap, FaGlobe } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import IconComponent from '../components/ui/IconComponent';
import { motion } from 'framer-motion';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content?: string;
  author: {
    name: string;
    avatar: string;
    title: string;
  };
  publishDate: string;
  readTime: string;
  category: string;
  tags: string[];
  image: string;
  featured?: boolean;
  trending?: boolean;
  slug: string;
}

const Blog: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Sample blog post data
  const blogPosts: BlogPost[] = [
    {
      id: 1,
      title: "How AI is Transforming University Admissions in 2025",
      excerpt: "Discover how artificial intelligence is revolutionizing the college application process and how you can leverage these tools for your applications.",
      author: {
        name: "Dr. Sarah Chen",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=40&h=40&q=80",
        title: "AI Education Specialist"
      },
      publishDate: "August 15, 2025",
      readTime: "7 min",
      category: "AI in Education",
      tags: ["AI", "Admissions", "Technology", "Applications"],
      image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      featured: true,
      trending: true,
      slug: "ai-transforming-university-admissions-2025"
    },
    {
      id: 2,
      title: "Top 10 Universities for Computer Science in 2025",
      excerpt: "Looking to study computer science? Explore our comprehensive ranking of the best universities worldwide for CS degrees.",
      author: {
        name: "Michael Reeves",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=40&h=40&q=80",
        title: "Education Consultant"
      },
      publishDate: "July 28, 2025",
      readTime: "10 min",
      category: "University Rankings",
      tags: ["Computer Science", "Rankings", "STEM", "University Selection"],
      image: "https://images.unsplash.com/photo-1517849845537-4d257902454a?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      trending: true,
      slug: "top-universities-computer-science-2025"
    },
    {
      id: 3,
      title: "Writing a Compelling Statement of Purpose: Tips from Admission Officers",
      excerpt: "Learn directly from university admission officers about what makes a statement of purpose stand out from the crowd.",
      author: {
        name: "Jennifer Wu",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=40&h=40&q=80",
        title: "Former Admissions Officer"
      },
      publishDate: "August 5, 2025",
      readTime: "8 min",
      category: "Application Tips",
      tags: ["SOP", "Writing", "Application Strategy", "Admissions"],
      image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      featured: true,
      slug: "writing-compelling-statement-of-purpose-tips"
    },
    {
      id: 4,
      title: "Studying Abroad on a Budget: A Complete Financial Guide",
      excerpt: "Your comprehensive guide to financing your international education, from scholarships to part-time work opportunities.",
      author: {
        name: "David Parker",
        avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=40&h=40&q=80",
        title: "International Education Advisor"
      },
      publishDate: "July 20, 2025",
      readTime: "12 min",
      category: "Study Abroad",
      tags: ["Finance", "Scholarships", "Budget", "International Students"],
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      slug: "studying-abroad-budget-financial-guide"
    },
    {
      id: 5,
      title: "The Future of Graduate Education: Trends to Watch in 2024",
      excerpt: "Explore emerging trends in graduate education, from micro-credentials to hybrid learning models that are reshaping higher education.",
      author: {
        name: "Prof. Robert Mason",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=40&h=40&q=80",
        title: "Education Futurist"
      },
      publishDate: "August 12, 2025",
      readTime: "9 min",
      category: "Education Trends",
      tags: ["Future of Education", "Trends", "Graduate Programs", "Innovation"],
      image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      slug: "future-graduate-education-trends-2024"
    },
    {
      id: 6,
      title: "How to Prepare for GRE at Home: A 3-Month Study Plan",
      excerpt: "A comprehensive 3-month GRE preparation strategy for busy professionals, complete with weekly goals and resource recommendations.",
      author: {
        name: "Lisa Thompson",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=40&h=40&q=80",
        title: "Test Prep Specialist"
      },
      publishDate: "July 10, 2025",
      readTime: "11 min",
      category: "Test Preparation",
      tags: ["GRE", "Study Plan", "Test Prep", "Graduate School"],
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      trending: true,
      slug: "gre-preparation-3-month-study-plan"
    },
    {
      id: 7,
      title: "Using ChatGPT to Improve Your Research Papers: A Guide",
      excerpt: "Learn how to use AI tools like ChatGPT effectively to enhance your academic writing and research while avoiding ethical pitfalls.",
      author: {
        name: "Dr. Sarah Chen",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=40&h=40&q=80",
        title: "AI Education Specialist"
      },
      publishDate: "August 8, 2025",
      readTime: "6 min",
      category: "AI in Education",
      tags: ["ChatGPT", "AI Writing", "Research", "Academic Writing"],
      image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      slug: "chatgpt-improve-research-papers-guide"
    },
    {
      id: 8,
      title: "Networking for Graduate Students: Building Academic Connections",
      excerpt: "Strategies for building a powerful professional network during your graduate studies that will benefit your academic and career goals.",
      author: {
        name: "Tanisha Williams",
        avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=40&h=40&q=80",
        title: "Career Development Coach"
      },
      publishDate: "July 25, 2025",
      readTime: "8 min",
      category: "Career Development",
      tags: ["Networking", "Academic Connections", "Professional Development", "Graduate School"],
      image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
      slug: "networking-graduate-students-academic-connections"
    }
  ];

  // Extract unique categories from blog posts
  const categories = Array.from(new Set(blogPosts.map(post => post.category)));

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
    switch (category) {
      case 'AI in Education':
        return <IconComponent icon={FaChartLine} className="text-teal-600" />;
      case 'University Rankings':
        return <IconComponent icon={FaGraduationCap} className="text-blue-600" />;
      case 'Application Tips':
        return <IconComponent icon={FaGraduationCap} className="text-orange-600" />;
      case 'Study Abroad':
        return <IconComponent icon={FaGlobe} className="text-green-600" />;
      case 'Education Trends':
        return <IconComponent icon={FaChartLine} className="text-purple-600" />;
      case 'Test Preparation':
        return <IconComponent icon={FaGraduationCap} className="text-red-600" />;
      case 'Career Development':
        return <IconComponent icon={FaChartLine} className="text-indigo-600" />;
      default:
        return <IconComponent icon={FaGraduationCap} className="text-gray-600" />;
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
                EduSmart Blog
              </motion.h1>
              <motion.p 
                className="text-xl mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Insights, guides, and expert advice on university admissions, study abroad,
                and leveraging AI for your educational journey.
              </motion.p>
              <motion.div 
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <input
                  type="text"
                  placeholder="Search articles by topic, keyword, or tag..."
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
              Featured Articles
            </motion.h2>
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {blogPosts.filter(post => post.featured).map(post => (
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
                          {post.readTime}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h3>
                      <p className="text-gray-600 mb-4">{post.excerpt}</p>
                    </div>
                    <div className="flex items-center">
                      <img 
                        className="w-10 h-10 rounded-full mr-4" 
                        src={post.author.avatar} 
                        alt={post.author.name} 
                      />
                      <div className="text-sm">
                        <p className="text-gray-900 font-medium">{post.author.name}</p>
                        <p className="text-gray-500">{post.publishDate}</p>
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
                  <h3 className="text-lg font-bold text-teal-800 mb-4">Categories</h3>
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
                      All Categories
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
                  <h3 className="text-lg font-bold text-teal-800 mb-4">Trending Topics</h3>
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
                            {post.readTime}
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
                              src={post.author.avatar} 
                              alt={post.author.name} 
                            />
                            <span className="text-sm text-gray-700">{post.author.name}</span>
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