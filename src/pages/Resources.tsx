import React, { useState } from 'react';
import { FaGraduationCap, FaBook, FaFileAlt, FaBriefcase, FaSearch, FaRegFileAlt, FaDownload, FaVideo } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

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
      thumbnail: "https://via.placeholder.com/300x200?text=Application+Guide",
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
      thumbnail: "https://via.placeholder.com/300x200?text=SOP+Templates",
      downloadLink: "/resources/templates/sop-templates.zip",
      tags: ["SOP", "Writing", "Examples"]
    },
    {
      id: 3,
      title: "GRE Preparation Masterclass",
      type: "video",
      category: "test-prep",
      description: "A comprehensive video course covering all GRE sections with proven strategies to maximize your score.",
      thumbnail: "https://via.placeholder.com/300x200?text=GRE+Prep",
      videoLink: "https://www.youtube.com/watch?v=example",
      tags: ["GRE", "Test Prep", "Strategies"]
    },
    {
      id: 4,
      title: "University Application Checklist",
      type: "checklist",
      category: "application",
      description: "A detailed checklist to ensure you don't miss any important steps or deadlines in your application process.",
      thumbnail: "https://via.placeholder.com/300x200?text=Checklist",
      downloadLink: "/resources/checklists/application-checklist.pdf",
      tags: ["Organization", "Deadlines", "Planning"]
    },
    {
      id: 5,
      title: "Academic Research Methods Guide",
      type: "ebook",
      category: "study",
      description: "Learn essential research methodologies, data analysis techniques, and academic writing standards for graduate-level research.",
      thumbnail: "https://via.placeholder.com/300x200?text=Research+Methods",
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
      thumbnail: "https://via.placeholder.com/300x200?text=IELTS+Webinar",
      videoLink: "https://www.example.com/webinars/ielts-speaking",
      tags: ["IELTS", "Speaking", "English Proficiency"]
    },
    {
      id: 7,
      title: "Graduate CV & Resume Templates",
      type: "template",
      category: "career",
      description: "Professional CV and resume templates specifically designed for graduate students and recent graduates.",
      thumbnail: "https://via.placeholder.com/300x200?text=CV+Templates",
      downloadLink: "/resources/templates/cv-templates.zip",
      tags: ["CV", "Resume", "Job Application"]
    },
    {
      id: 8,
      title: "PhD Funding Guide",
      type: "guide",
      category: "application",
      description: "Comprehensive guide to finding and securing funding for your PhD, including scholarships, grants, and assistantships.",
      thumbnail: "https://via.placeholder.com/300x200?text=PhD+Funding",
      downloadLink: "/resources/guides/phd-funding-guide.pdf",
      tags: ["Funding", "Scholarships", "PhD", "Grants"]
    },
    {
      id: 9,
      title: "Academic Networking Strategies",
      type: "ebook",
      category: "career",
      description: "Learn how to build and leverage academic and professional networks to advance your research and career.",
      thumbnail: "https://via.placeholder.com/300x200?text=Networking",
      downloadLink: "/resources/ebooks/academic-networking.pdf",
      tags: ["Networking", "Professional Development", "Conferences"]
    }
  ];

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
        return <FaBook className="text-teal-600" />;
      case 'template':
        return <FaRegFileAlt className="text-blue-600" />;
      case 'checklist':
        return <FaFileAlt className="text-green-600" />;
      case 'video':
      case 'webinar':
        return <FaVideo className="text-red-600" />;
      case 'ebook':
        return <FaBook className="text-purple-600" />;
      default:
        return <FaFileAlt className="text-gray-600" />;
    }
  };

  // Get icon for resource category
  const getResourceCategoryIcon = (category: string) => {
    switch (category) {
      case 'application':
        return <FaFileAlt className="text-teal-600" />;
      case 'study':
        return <FaBook className="text-blue-600" />;
      case 'test-prep':
        return <FaGraduationCap className="text-orange-600" />;
      case 'career':
        return <FaBriefcase className="text-purple-600" />;
      default:
        return <FaFileAlt className="text-gray-600" />;
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
        <section className="bg-gradient-to-r from-teal-700 to-teal-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold mb-4">Educational Resources</h1>
              <p className="text-xl mb-8">
                Access high-quality guides, templates, videos, and more to support your educational journey
                from application to graduation and beyond.
              </p>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search resources by title, description, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-3 pr-12 bg-white rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <FaSearch className="absolute right-4 top-3.5 text-gray-500" />
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            {/* Featured Resources */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-teal-800 mb-6">Featured Resources</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {resources.filter(resource => resource.featured).map(resource => (
                  <div key={resource.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 flex flex-col md:flex-row">
                    <div className="md:w-1/3">
                      <img 
                        src={resource.thumbnail} 
                        alt={resource.title} 
                        className="w-full h-48 md:h-full object-cover"
                      />
                    </div>
                    <div className="md:w-2/3 p-6">
                      <div className="flex items-center gap-2 mb-2">
                        {getResourceTypeIcon(resource.type)}
                        <span className="text-sm font-medium text-gray-600">{getTypeLabel(resource.type)}</span>
                        <span className="mx-1">•</span>
                        <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                          {getResourceCategoryIcon(resource.category)}
                          {getCategoryLabel(resource.category)}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-teal-800 mb-2">{resource.title}</h3>
                      <p className="text-gray-600 text-sm mb-4">{resource.description}</p>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {resource.tags.map((tag, idx) => (
                          <span key={idx} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="mt-auto">
                        {resource.downloadLink && (
                          <a
                            href={resource.downloadLink}
                            className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2 mr-2"
                          >
                            <FaDownload /> Download
                          </a>
                        )}
                        {resource.videoLink && (
                          <a
                            href={resource.videoLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-teal-600 hover:bg-teal-700 text-white text-sm px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
                          >
                            <FaVideo /> Watch
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Filter options */}
            <div className="mb-8">
              <div className="flex flex-wrap gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveType('all')}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        activeType === 'all'
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      All Types
                    </button>
                    <button
                      onClick={() => setActiveType('guide')}
                      className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                        activeType === 'guide'
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <FaBook className="text-xs" /> Guides
                    </button>
                    <button
                      onClick={() => setActiveType('template')}
                      className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                        activeType === 'template'
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <FaRegFileAlt className="text-xs" /> Templates
                    </button>
                    <button
                      onClick={() => setActiveType('checklist')}
                      className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                        activeType === 'checklist'
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <FaFileAlt className="text-xs" /> Checklists
                    </button>
                    <button
                      onClick={() => setActiveType('video')}
                      className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                        activeType === 'video'
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <FaVideo className="text-xs" /> Videos
                    </button>
                    <button
                      onClick={() => setActiveType('ebook')}
                      className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                        activeType === 'ebook'
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <FaBook className="text-xs" /> E-Books
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveCategory('all')}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        activeCategory === 'all'
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      All Categories
                    </button>
                    <button
                      onClick={() => setActiveCategory('application')}
                      className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                        activeCategory === 'application'
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <FaFileAlt className="text-xs" /> Application
                    </button>
                    <button
                      onClick={() => setActiveCategory('study')}
                      className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                        activeCategory === 'study'
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <FaBook className="text-xs" /> Study
                    </button>
                    <button
                      onClick={() => setActiveCategory('test-prep')}
                      className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                        activeCategory === 'test-prep'
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <FaGraduationCap className="text-xs" /> Test Prep
                    </button>
                    <button
                      onClick={() => setActiveCategory('career')}
                      className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                        activeCategory === 'career'
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <FaBriefcase className="text-xs" /> Career
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Resource listing */}
            {filteredResources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.map(resource => (
                  <div key={resource.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 flex flex-col">
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={resource.thumbnail} 
                        alt={resource.title} 
                        className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                      />
                    </div>
                    <div className="p-6 flex-grow flex flex-col">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {getResourceTypeIcon(resource.type)}
                        <span className="text-xs font-medium text-gray-600">{getTypeLabel(resource.type)}</span>
                        <span className="mx-1 text-gray-300">•</span>
                        <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
                          {getResourceCategoryIcon(resource.category)}
                          {getCategoryLabel(resource.category)}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-teal-800 mb-2">{resource.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{resource.description}</p>
                      
                      <div className="flex flex-wrap gap-1 mb-4">
                        {resource.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                        {resource.tags.length > 3 && (
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                            +{resource.tags.length - 3} more
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-auto">
                        {resource.downloadLink && (
                          <a
                            href={resource.downloadLink}
                            className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2 mr-2"
                          >
                            <FaDownload /> Download
                          </a>
                        )}
                        {resource.videoLink && (
                          <a
                            href={resource.videoLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-teal-600 hover:bg-teal-700 text-white text-sm px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
                          >
                            <FaVideo /> Watch
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <FaFileAlt className="text-5xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No resources match your criteria</h3>
                <p className="text-gray-600">Try adjusting your filters or search query.</p>
              </div>
            )}
          </div>
        </section>

        {/* Resource request section */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="bg-gray-50 rounded-lg p-8 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-teal-800 mb-4 text-center">Can't find what you need?</h2>
              <p className="text-gray-600 mb-6 text-center">
                If you're looking for specific resources or have suggestions for new materials, 
                let us know and our team will work to create or find what you need.
              </p>
              <div className="flex justify-center">
                <a
                  href="/contact"
                  className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  Request Resources
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Resources; 