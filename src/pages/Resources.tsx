import React, { useState } from 'react';
import { FaGraduationCap, FaBook, FaFileAlt, FaBriefcase, FaSearch, FaRegFileAlt, FaDownload, FaVideo } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import IconComponent from '../components/ui/IconComponent';
import { motion } from 'framer-motion';

interface Resource {
  id: number;
  title: string;
  type: 'guide' | 'template' | 'checklist' | 'video' | 'webinar' | 'ebook';
  category: 'application' | 'study' | 'test-prep' | 'career';
  description: string;
  thumbnail: string;
  downloadLink?: string;
  videoLink?: string;
  featured?: boolean;
  tags: string[];
}

const Resources: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeType, setActiveType] = useState('all');

  // Sample resources data
  const resources: Resource[] = [
    {
      id: 1,
      title: "Ultimate Graduate School Application Guide",
      type: "guide",
      category: "application",
      description: "A comprehensive guide covering every aspect of the graduate school application process, from selecting programs to acing interviews.",
      thumbnail: "https://images.unsplash.com/photo-1517971129774-8a2b38fa128e?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80",
      downloadLink: "/resources/guides/graduate-application-guide.pdf",
      featured: true,
      tags: ["SOP", "CV", "Recommendations", "Interview"]
    },
    {
      id: 2,
      title: "Statement of Purpose Templates & Examples",
      type: "template",
      category: "application",
      description: "A collection of successful SOP templates and examples for various programs, with annotations explaining effective strategies.",
      thumbnail: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80",
      downloadLink: "/resources/templates/sop-templates.zip",
      tags: ["SOP", "Writing", "Examples"]
    },
    {
      id: 3,
      title: "GRE Preparation Masterclass",
      type: "video",
      category: "test-prep",
      description: "A comprehensive video course covering all GRE sections with proven strategies to maximize your score.",
      thumbnail: "https://images.unsplash.com/photo-1606326608690-4e0281b1e588?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80",
      videoLink: "https://www.youtube.com/watch?v=example",
      tags: ["GRE", "Test Prep", "Strategies"]
    },
    {
      id: 4,
      title: "University Application Checklist",
      type: "checklist",
      category: "application",
      description: "A detailed checklist to ensure you don't miss any important steps or deadlines in your application process.",
      thumbnail: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80",
      downloadLink: "/resources/checklists/application-checklist.pdf",
      tags: ["Organization", "Deadlines", "Planning"]
    },
    {
      id: 5,
      title: "Academic Research Methods Guide",
      type: "ebook",
      category: "study",
      description: "Learn essential research methodologies, data analysis techniques, and academic writing standards for graduate-level research.",
      thumbnail: "https://images.unsplash.com/photo-1532153955177-f59af40d6472?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80",
      downloadLink: "/resources/ebooks/research-methods.pdf",
      featured: true,
      tags: ["Research", "Academia", "Writing", "Data Analysis"]
    },
    {
      id: 6,
      title: "IELTS Speaking Practice Webinar",
      type: "webinar",
      category: "test-prep",
      description: "Interactive webinar with speaking practice exercises and expert feedback to boost your IELTS speaking score.",
      thumbnail: "https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80",
      videoLink: "https://www.example.com/webinars/ielts-speaking",
      tags: ["IELTS", "Speaking", "English Proficiency"]
    },
    {
      id: 7,
      title: "Graduate CV & Resume Templates",
      type: "template",
      category: "career",
      description: "Professional CV and resume templates specifically designed for graduate students and recent graduates.",
      thumbnail: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80",
      downloadLink: "/resources/templates/cv-templates.zip",
      tags: ["CV", "Resume", "Job Application"]
    },
    {
      id: 8,
      title: "PhD Funding Guide",
      type: "guide",
      category: "application",
      description: "Comprehensive guide to finding and securing funding for your PhD, including scholarships, grants, and assistantships.",
      thumbnail: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80",
      downloadLink: "/resources/guides/phd-funding-guide.pdf",
      tags: ["Funding", "Scholarships", "PhD", "Grants"]
    },
    {
      id: 9,
      title: "Academic Networking Strategies",
      type: "ebook",
      category: "career",
      description: "Learn how to build and leverage academic and professional networks to advance your research and career.",
      thumbnail: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80",
      downloadLink: "/resources/ebooks/academic-networking.pdf",
      tags: ["Networking", "Professional Development", "Conferences"]
    }
  ];

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
                        href={resource.downloadLink || resource.videoLink}
                        className="inline-flex items-center text-teal-600 font-medium hover:text-teal-700"
                        whileHover={{ x: 3 }}
                      >
                        {resource.downloadLink ? (
                          <>
                            <IconComponent icon={FaDownload} className="mr-1" />
                            Download Resource
                          </>
                        ) : (
                          <>
                            <IconComponent icon={FaVideo} className="mr-1" />
                            Watch Resource
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
                    {['application', 'study', 'test-prep', 'career'].map(category => (
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
                    {['guide', 'template', 'checklist', 'video', 'webinar', 'ebook'].map(type => (
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
                          href={resource.downloadLink || resource.videoLink}
                          className="inline-flex items-center mt-auto text-teal-600 font-medium"
                          whileHover={{ x: 3 }}
                        >
                          {resource.downloadLink ? (
                            <>
                              <IconComponent icon={FaDownload} className="mr-1" />
                              Download Resource
                            </>
                          ) : (
                            <>
                              <IconComponent icon={FaVideo} className="mr-1" />
                              Watch Resource
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
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Resources; 