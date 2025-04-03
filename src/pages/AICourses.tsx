import React, { useState } from 'react';
import { FaGraduationCap, FaStar, FaUniversity, FaCertificate, FaRobot, FaLaptopCode, FaSearch, FaTag } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import IconComponent from '../components/ui/IconComponent';

interface Course {
  id: number;
  title: string;
  provider: string;
  type: 'university' | 'certification' | 'tutorial';
  category: string[];
  description: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  rating: number;
  ratingCount: number;
  instructors?: string[];
  prerequisites?: string[];
  skills: string[];
  price?: string;
  link: string;
  image: string;
  featured?: boolean;
}

const AICourses: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeLevel, setActiveLevel] = useState('all');
  const [activeType, setActiveType] = useState('all');
  
  // Sample courses data
  const courses: Course[] = [
    {
      id: 1,
      title: 'Master of Science in Artificial Intelligence',
      provider: 'Stanford University',
      type: 'university',
      category: ['Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision'],
      description: "Stanford's MS in AI program prepares students for leadership roles in AI research and development. The curriculum covers foundational AI concepts, advanced machine learning techniques, and specialized areas like NLP and computer vision.",
      duration: '2 years',
      level: 'Advanced',
      rating: 4.9,
      ratingCount: 245,
      instructors: ['Dr. Andrew Ng', 'Dr. Fei-Fei Li', 'Dr. Christopher Manning'],
      prerequisites: ['Computer Science background', 'Programming experience', 'Linear algebra and calculus'],
      skills: ['Deep Learning', 'Neural Networks', 'Natural Language Processing', 'Computer Vision', 'Reinforcement Learning'],
      price: '$60,000/year',
      link: 'https://ai.stanford.edu/',
      image: 'https://via.placeholder.com/300x200?text=Stanford+AI',
      featured: true
    },
    {
      id: 2,
      title: 'Deep Learning Specialization',
      provider: 'Coursera (by DeepLearning.AI)',
      type: 'certification',
      category: ['Deep Learning', 'Neural Networks', 'Computer Vision', 'NLP'],
      description: 'Learn the foundations of Deep Learning, understand how to build neural networks, and lead successful machine learning projects. The specialization covers CNN, RNN, LSTM, and other modern architectures.',
      duration: '5 months',
      level: 'Intermediate',
      rating: 4.8,
      ratingCount: 156000,
      instructors: ['Andrew Ng'],
      prerequisites: ['Basic Python programming', 'Understanding of linear algebra'],
      skills: ['TensorFlow', 'Convolutional Neural Networks', 'Recurrent Neural Networks', 'Model Optimization'],
      price: '$49/month (subscription)',
      link: 'https://www.coursera.org/specializations/deep-learning',
      image: 'https://via.placeholder.com/300x200?text=Deep+Learning'
    },
    {
      id: 3,
      title: 'AI for Everyone',
      provider: 'Coursera (by DeepLearning.AI)',
      type: 'certification',
      category: ['AI Fundamentals', 'Business Strategy'],
      description: 'A non-technical course designed to help you understand AI technologies and how they can impact your business. Learn the skills to work with an AI team and build an AI strategy in your company.',
      duration: '4 weeks',
      level: 'Beginner',
      rating: 4.7,
      ratingCount: 45000,
      instructors: ['Andrew Ng'],
      skills: ['AI Strategy', 'Machine Learning Project Management', 'AI Ethics', 'Business Applications of AI'],
      price: '$49 (one-time purchase)',
      link: 'https://www.coursera.org/learn/ai-for-everyone',
      image: 'https://via.placeholder.com/300x200?text=AI+for+Everyone'
    },
    {
      id: 4,
      title: 'TensorFlow Developer Professional Certificate',
      provider: 'Coursera (by Google)',
      type: 'certification',
      category: ['Machine Learning', 'Deep Learning', 'TensorFlow'],
      description: 'Prepare for the TensorFlow Developer Certificate exam while learning best practices for TensorFlow, a popular open-source framework for machine learning.',
      duration: '3 months',
      level: 'Intermediate',
      rating: 4.6,
      ratingCount: 32000,
      prerequisites: ['Basic Python programming'],
      skills: ['TensorFlow', 'Convolutional Neural Networks', 'Natural Language Processing', 'Computer Vision'],
      price: '$49/month (subscription)',
      link: 'https://www.coursera.org/professional-certificates/tensorflow-in-practice',
      image: 'https://via.placeholder.com/300x200?text=TensorFlow'
    },
    {
      id: 5,
      title: 'Using ChatGPT for Statement of Purpose Writing',
      provider: 'EduSmart',
      type: 'tutorial',
      category: ['AI Tools', 'Writing', 'Academic Applications'],
      description: 'Learn how to effectively use ChatGPT to craft a compelling Statement of Purpose for university applications. This tutorial covers prompt engineering techniques, editing strategies, and ethical considerations.',
      duration: '2 hours',
      level: 'Beginner',
      rating: 4.8,
      ratingCount: 1200,
      skills: ['Prompt Engineering', 'Content Refinement', 'AI-assisted Writing'],
      price: 'Free',
      link: '/tutorials/chatgpt-sop',
      image: 'https://via.placeholder.com/300x200?text=ChatGPT+Tutorial',
      featured: true
    },
    {
      id: 6,
      title: 'AI for University Selection and Application',
      provider: 'EduSmart',
      type: 'tutorial',
      category: ['AI Tools', 'University Applications', 'Decision Making'],
      description: 'This hands-on tutorial demonstrates how to leverage AI tools to research universities, compare programs, and make data-driven decisions about where to apply based on your profile and preferences.',
      duration: '3 hours',
      level: 'Beginner',
      rating: 4.7,
      ratingCount: 950,
      skills: ['Data-driven Decision Making', 'University Research', 'Application Strategy'],
      price: 'Free',
      link: '/tutorials/ai-university-selection',
      image: 'https://via.placeholder.com/300x200?text=AI+University+Selection'
    },
    {
      id: 7,
      title: 'Ph.D. in Artificial Intelligence and Machine Learning',
      provider: 'Carnegie Mellon University',
      type: 'university',
      category: ['Machine Learning', 'Deep Learning', 'Research', 'Robotics'],
      description: "CMU's renowned Ph.D. program focuses on cutting-edge AI research, with opportunities to work with leading faculty on projects spanning machine learning theory, robotics, computer vision, and more.",
      duration: '4-5 years',
      level: 'Advanced',
      rating: 4.9,
      ratingCount: 180,
      instructors: ['Dr. Tom Mitchell', 'Dr. Manuela Veloso', 'Dr. Ruslan Salakhutdinov'],
      prerequisites: ['Masters degree in related field', 'Strong research background', 'Advanced mathematics'],
      skills: ['Machine Learning Research', 'Algorithm Development', 'Academic Publishing', 'Grant Writing'],
      price: 'Fully funded (includes stipend)',
      link: 'https://www.ml.cmu.edu/academics/ph.d.-in-machine-learning.html',
      image: 'https://via.placeholder.com/300x200?text=CMU+AI+PhD'
    }
  ];

  const categories = ['Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'AI Tools', 'Business Strategy', 'Research', 'Writing'];
  
  // Filter courses based on search and active filters
  const filteredCourses = courses.filter(course => {
    // Search filter
    if (searchQuery && !course.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !course.provider.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !course.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Category filter
    if (activeCategory !== 'all' && !course.category.includes(activeCategory)) {
      return false;
    }
    
    // Level filter
    if (activeLevel !== 'all' && course.level !== activeLevel) {
      return false;
    }
    
    // Type filter
    if (activeType !== 'all' && course.type !== activeType) {
      return false;
    }
    
    return true;
  });

  // Helper to render star ratings
  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, index) => (
      <IconComponent 
        icon={FaStar}
        key={index} 
        className={`${index < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'} ${
          index === Math.floor(rating) && rating % 1 > 0 ? 'text-yellow-200' : ''
        }`} 
      />
    ));
  };
  
  // Get appropriate icon for course type
  const getCourseTypeIcon = (type: string) => {
    switch (type) {
      case 'university':
        return <IconComponent icon={FaUniversity} className="text-teal-600" />;
      case 'certification':
        return <IconComponent icon={FaCertificate} className="text-blue-600" />;
      case 'tutorial':
        return <IconComponent icon={FaLaptopCode} className="text-orange-500" />;
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
              <h1 className="text-4xl font-bold mb-4">AI Education Courses</h1>
              <p className="text-xl mb-8">
                Explore top university AI programs, online certifications, and practical tutorials to 
                master artificial intelligence and enhance your applications.
              </p>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search AI courses, programs and tutorials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-3 pr-12 bg-white rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <IconComponent icon={FaSearch} className="absolute right-4 top-3.5 text-gray-500" />
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            {/* Featured Courses */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-teal-800 mb-6">Featured Programs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.filter(course => course.featured).map(course => (
                  <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 flex flex-col md:flex-row">
                    <div className="md:w-1/3">
                      <img 
                        src={course.image} 
                        alt={course.title} 
                        className="w-full h-48 md:h-full object-cover"
                      />
                    </div>
                    <div className="md:w-2/3 p-6">
                      <div className="flex items-center gap-2 mb-2">
                        {getCourseTypeIcon(course.type)}
                        <span className="text-sm font-medium text-gray-600">{course.provider}</span>
                      </div>
                      <h3 className="text-xl font-bold text-teal-800 mb-2">{course.title}</h3>
                      <p className="text-gray-600 text-sm mb-4">{course.description}</p>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex gap-1">
                          {renderStars(course.rating)}
                        </div>
                        <span className="text-sm text-gray-600">{course.rating} ({course.ratingCount.toLocaleString()} ratings)</span>
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex gap-2">
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {course.level}
                          </span>
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {course.duration}
                          </span>
                        </div>
                        <a
                          href={course.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                        >
                          Learn More
                        </a>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Type</label>
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
                      onClick={() => setActiveType('university')}
                      className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                        activeType === 'university'
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <IconComponent icon={FaUniversity} className="text-xs" /> University Programs
                    </button>
                    <button
                      onClick={() => setActiveType('certification')}
                      className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                        activeType === 'certification'
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <IconComponent icon={FaCertificate} className="text-xs" /> Certifications
                    </button>
                    <button
                      onClick={() => setActiveType('tutorial')}
                      className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                        activeType === 'tutorial'
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <IconComponent icon={FaLaptopCode} className="text-xs" /> Tutorials
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveLevel('all')}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        activeLevel === 'all'
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      All Levels
                    </button>
                    <button
                      onClick={() => setActiveLevel('Beginner')}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        activeLevel === 'Beginner'
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Beginner
                    </button>
                    <button
                      onClick={() => setActiveLevel('Intermediate')}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        activeLevel === 'Intermediate'
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Intermediate
                    </button>
                    <button
                      onClick={() => setActiveLevel('Advanced')}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        activeLevel === 'Advanced'
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Advanced
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
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
                      <IconComponent icon={FaTag} className="text-xs" /> {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Course listing */}
            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map(course => (
                  <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 flex flex-col">
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={course.image} 
                        alt={course.title} 
                        className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                      />
                    </div>
                    <div className="p-6 flex-grow flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        {getCourseTypeIcon(course.type)}
                        <span className="text-sm font-medium text-gray-600">{course.provider}</span>
                      </div>
                      <h3 className="text-lg font-bold text-teal-800 mb-2">{course.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{course.description}</p>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {course.category.slice(0, 3).map((cat, index) => (
                          <span key={index} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                            {cat}
                          </span>
                        ))}
                        {course.category.length > 3 && (
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                            +{course.category.length - 3} more
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-1">
                          {renderStars(course.rating)}
                        </div>
                        <span className="text-xs text-gray-600">{course.rating}</span>
                      </div>
                      
                      <div className="mt-auto pt-4 flex items-center justify-between">
                        <div className="flex gap-2">
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {course.level}
                          </span>
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {course.duration}
                          </span>
                        </div>
                        {course.price && (
                          <span className="text-sm font-medium text-teal-700">
                            {course.price}
                          </span>
                        )}
                      </div>
                      
                      <a
                        href={course.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 bg-orange-500 hover:bg-orange-600 text-white text-center py-2 rounded-lg transition-colors"
                      >
                        View Details
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <IconComponent icon={FaRobot} className="text-5xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No courses match your criteria</h3>
                <p className="text-gray-600">Try adjusting your filters or search query.</p>
              </div>
            )}
          </div>
        </section>

        {/* Why learn AI section */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-teal-800 mb-2">Why Learn AI?</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Artificial Intelligence is transforming industries and creating new opportunities. 
                Here's why building AI skills is essential for your future.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 mb-4">
                  <IconComponent icon={FaGraduationCap} className="text-xl" />
                </div>
                <h3 className="text-lg font-bold text-teal-800 mb-2">Career Opportunities</h3>
                <p className="text-gray-600">
                  AI specialists are among the highest-paid professionals in tech, with demand far exceeding supply. 
                  Companies across all industries are seeking AI talent.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-4">
                  <IconComponent icon={FaRobot} className="text-xl" />
                </div>
                <h3 className="text-lg font-bold text-teal-800 mb-2">Future-Proof Skills</h3>
                <p className="text-gray-600">
                  As AI continues to evolve, understanding these technologies will be essential for staying 
                  competitive in virtually every field, from medicine to business.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                  <IconComponent icon={FaLaptopCode} className="text-xl" />
                </div>
                <h3 className="text-lg font-bold text-teal-800 mb-2">Problem-Solving Power</h3>
                <p className="text-gray-600">
                  AI offers powerful tools to tackle complex challenges—from climate change to healthcare. Learning AI 
                  empowers you to create solutions with global impact.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AICourses; 