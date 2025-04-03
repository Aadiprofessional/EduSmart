import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaCalendarAlt, FaUser, FaTag, FaSearch, FaArrowLeft, FaClock, FaArrowRight, FaChartLine, FaGraduationCap, FaGlobe } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import IconComponent from '../components/ui/IconComponent';

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
        avatar: "https://via.placeholder.com/40x40",
        title: "AI Education Specialist"
      },
      publishDate: "August 15, 2025",
      readTime: "7 min",
      category: "AI in Education",
      tags: ["AI", "Admissions", "Technology", "Applications"],
      image: "https://via.placeholder.com/600x400?text=AI+in+Admissions",
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
        avatar: "https://via.placeholder.com/40x40",
        title: "Education Consultant"
      },
      publishDate: "July 28, 2025",
      readTime: "10 min",
      category: "University Rankings",
      tags: ["Computer Science", "Rankings", "STEM", "University Selection"],
      image: "https://via.placeholder.com/600x400?text=CS+University+Rankings",
      trending: true,
      slug: "top-universities-computer-science-2025"
    },
    {
      id: 3,
      title: "Writing a Compelling Statement of Purpose: Tips from Admission Officers",
      excerpt: "Learn directly from university admission officers about what makes a statement of purpose stand out from the crowd.",
      author: {
        name: "Jennifer Wu",
        avatar: "https://via.placeholder.com/40x40",
        title: "Former Admissions Officer"
      },
      publishDate: "August 5, 2025",
      readTime: "8 min",
      category: "Application Tips",
      tags: ["SOP", "Writing", "Application Strategy", "Admissions"],
      image: "https://via.placeholder.com/600x400?text=Statement+of+Purpose",
      featured: true,
      slug: "writing-compelling-statement-of-purpose-tips"
    },
    {
      id: 4,
      title: "Studying Abroad on a Budget: A Complete Financial Guide",
      excerpt: "Your comprehensive guide to financing your international education, from scholarships to part-time work opportunities.",
      author: {
        name: "David Parker",
        avatar: "https://via.placeholder.com/40x40",
        title: "International Education Advisor"
      },
      publishDate: "July 20, 2025",
      readTime: "12 min",
      category: "Study Abroad",
      tags: ["Finance", "Scholarships", "Budget", "International Students"],
      image: "https://via.placeholder.com/600x400?text=Study+Abroad+Budget",
      slug: "studying-abroad-budget-financial-guide"
    },
    {
      id: 5,
      title: "The Future of Graduate Education: Trends to Watch in 2024",
      excerpt: "Explore emerging trends in graduate education, from micro-credentials to hybrid learning models that are reshaping higher education.",
      author: {
        name: "Prof. Robert Mason",
        avatar: "https://via.placeholder.com/40x40",
        title: "Education Futurist"
      },
      publishDate: "August 12, 2025",
      readTime: "9 min",
      category: "Education Trends",
      tags: ["Future of Education", "Trends", "Graduate Programs", "Innovation"],
      image: "https://via.placeholder.com/600x400?text=Education+Trends",
      slug: "future-graduate-education-trends-2024"
    },
    {
      id: 6,
      title: "How to Prepare for GRE at Home: A 3-Month Study Plan",
      excerpt: "A comprehensive 3-month GRE preparation strategy for busy professionals, complete with weekly goals and resource recommendations.",
      author: {
        name: "Lisa Thompson",
        avatar: "https://via.placeholder.com/40x40",
        title: "Test Prep Specialist"
      },
      publishDate: "July 10, 2025",
      readTime: "11 min",
      category: "Test Preparation",
      tags: ["GRE", "Study Plan", "Test Prep", "Graduate School"],
      image: "https://via.placeholder.com/600x400?text=GRE+Prep",
      trending: true,
      slug: "gre-preparation-3-month-study-plan"
    },
    {
      id: 7,
      title: "Using ChatGPT to Improve Your Research Papers: A Guide",
      excerpt: "Learn how to use AI tools like ChatGPT effectively to enhance your academic writing and research while avoiding ethical pitfalls.",
      author: {
        name: "Dr. Sarah Chen",
        avatar: "https://via.placeholder.com/40x40",
        title: "AI Education Specialist"
      },
      publishDate: "August 8, 2025",
      readTime: "6 min",
      category: "AI in Education",
      tags: ["ChatGPT", "AI Writing", "Research", "Academic Writing"],
      image: "https://via.placeholder.com/600x400?text=ChatGPT+Research",
      slug: "chatgpt-improve-research-papers-guide"
    },
    {
      id: 8,
      title: "Networking for Graduate Students: Building Academic Connections",
      excerpt: "Strategies for building a powerful professional network during your graduate studies that will benefit your academic and career goals.",
      author: {
        name: "Tanisha Williams",
        avatar: "https://via.placeholder.com/40x40",
        title: "Career Development Coach"
      },
      publishDate: "July 25, 2025",
      readTime: "8 min",
      category: "Career Development",
      tags: ["Networking", "Academic Connections", "Professional Development", "Graduate School"],
      image: "https://via.placeholder.com/600x400?text=Academic+Networking",
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

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <section className="bg-gradient-to-r from-teal-700 to-teal-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold mb-4">EduSmart Blog</h1>
              <p className="text-xl mb-8">
                Insights, guides, and expert advice on university admissions, study abroad,
                and leveraging AI for your educational journey.
              </p>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search articles by topic, keyword, or tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-3 pr-12 bg-white rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <IconComponent icon={FaSearch} className="absolute right-4 top-3.5 text-gray-500" />
              </div>
            </div>
          </div>
        </section>

        {/* Featured Posts */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-teal-800 mb-8">Featured Articles</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {blogPosts.filter(post => post.featured).map(post => (
                <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 flex flex-col lg:flex-row">
                  <div className="lg:w-1/2">
                    <img 
                      src={post.image} 
                      alt={post.title} 
                      className="w-full h-64 lg:h-full object-cover"
                    />
                  </div>
                  <div className="lg:w-1/2 p-6 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      {getCategoryIcon(post.category)}
                      <span className="text-sm font-medium text-teal-600">{post.category}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-3 hover:text-teal-700 transition-colors">
                      <a href={`/blog/${post.slug}`}>{post.title}</a>
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">{post.excerpt}</p>
                    <div className="flex items-center gap-3 mb-4">
                      <img 
                        src={post.author.avatar} 
                        alt={post.author.name} 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-700">{post.author.name}</p>
                        <p className="text-xs text-gray-500">{post.author.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-auto">
                      <span className="flex items-center gap-1 mr-4">
                        <IconComponent icon={FaCalendarAlt} className="text-gray-400" />
                        {post.publishDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <IconComponent icon={FaClock} className="text-gray-400" />
                        {post.readTime} read
                      </span>
                    </div>
                    <a 
                      href={`/blog/${post.slug}`}
                      className="mt-4 inline-flex items-center gap-1 text-teal-600 font-medium hover:text-teal-700 transition-colors"
                    >
                      Read more <IconComponent icon={FaArrowRight} className="text-xs" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trending Posts */}
        <section className="py-10 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-teal-800 mb-6">Trending Now</h2>
            <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide">
              {blogPosts.filter(post => post.trending).map(post => (
                <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 flex-shrink-0 w-72 md:w-80">
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      {getCategoryIcon(post.category)}
                      <span className="text-xs font-medium text-teal-600">{post.category}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2 hover:text-teal-700 transition-colors line-clamp-2">
                      <a href={`/blog/${post.slug}`}>{post.title}</a>
                    </h3>
                    <div className="flex items-center text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1 mr-3">
                        <IconComponent icon={FaCalendarAlt} className="text-gray-400" />
                        {post.publishDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <IconComponent icon={FaClock} className="text-gray-400" />
                        {post.readTime} read
                      </span>
                    </div>
                    <a 
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-1 text-sm text-teal-600 font-medium hover:text-teal-700 transition-colors"
                    >
                      Read article <IconComponent icon={FaArrowRight} className="text-xs" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* All Posts with Category Filter */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-teal-800">All Articles</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    activeCategory === 'all'
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All
                </button>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                      activeCategory === category
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {getCategoryIcon(category)}
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {filteredPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map(post => (
                  <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 flex flex-col h-full">
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={post.image} 
                        alt={post.title} 
                        className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                      />
                    </div>
                    <div className="p-6 flex-grow flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        {getCategoryIcon(post.category)}
                        <span className="text-xs font-medium text-teal-600">{post.category}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2 hover:text-teal-700 transition-colors">
                        <a href={`/blog/${post.slug}`}>{post.title}</a>
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{post.excerpt}</p>
                      
                      <div className="flex flex-wrap gap-1 mb-4">
                        {post.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded flex items-center gap-1">
                            <IconComponent icon={FaTag} className="text-gray-400 text-xs" /> {tag}
                          </span>
                        ))}
                        {post.tags.length > 3 && (
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                            +{post.tags.length - 3} more
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-500 mt-auto mb-3">
                        <span className="flex items-center gap-1 mr-3">
                          <IconComponent icon={FaCalendarAlt} className="text-gray-400" />
                          {post.publishDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <IconComponent icon={FaClock} className="text-gray-400" />
                          {post.readTime} read
                        </span>
                      </div>
                      
                      <a 
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-1 text-sm text-teal-600 font-medium hover:text-teal-700 transition-colors"
                      >
                        Read article <IconComponent icon={FaArrowRight} className="text-xs" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <IconComponent icon={FaSearch} className="text-5xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No articles found</h3>
                <p className="text-gray-600">Try adjusting your search criteria.</p>
              </div>
            )}
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="py-12 bg-gradient-to-r from-teal-700 to-teal-900 text-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Stay Updated with EduSmart Insights</h2>
              <p className="text-teal-100">
                Subscribe to our newsletter for the latest articles, tips, and resources delivered directly to your inbox.
              </p>
            </div>
            <div className="max-w-xl mx-auto">
              <form className="flex flex-col md:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex-grow px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                />
                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-lg transition-colors font-medium"
                >
                  Subscribe
                </button>
              </form>
              <p className="text-sm text-teal-200 mt-3 text-center">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Blog; 