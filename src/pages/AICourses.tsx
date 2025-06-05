import React, { useState, useEffect } from 'react';
import { FaGraduationCap, FaStar, FaUniversity, FaCertificate, FaRobot, FaLaptopCode, FaSearch, FaTag, FaChalkboardTeacher, FaBookmark, FaRegBookmark, FaChevronRight, FaTimes, FaUserTie, FaFilter } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import IconComponent from '../components/ui/IconComponent';
import { motion } from 'framer-motion';
import { useLanguage } from '../utils/LanguageContext';
import { courseAPI } from '../utils/apiService';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  price: number;
  original_price?: number | null;
  image?: string | null;
  instructor_name: string;
  instructor_bio?: string | null;
  instructor_image?: string | null;
  syllabus?: any | null;
  prerequisites?: string[] | null;
  learning_outcomes?: string[] | null;
  skills_gained?: string[] | null;
  language?: string | null;
  certificate?: boolean | null;
  rating?: number | null;
  total_reviews?: number | null;
  total_students?: number | null;
  featured?: boolean | null;
  status?: string | null;
  video_preview_url?: string | null;
  course_materials?: any | null;
  tags?: string[] | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Teacher {
  id: number;
  name: string;
  title: string;
  subjects: string[];
  levels: string[];
  rating: number;
  students: number;
  experience: string;
  image: string;
  bio: string;
  courses: number;
  featured?: boolean;
}

const AICourses: React.FC = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // API state management - Initialize courses as empty array to prevent filter error
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [favoriteTeachers, setFavoriteTeachers] = useState<number[]>([]);

  // Sample teachers data
  const teachers: Teacher[] = [
    {
      id: 1,
      name: "Dr. Sarah Chen",
      title: "AI Research Scientist",
      subjects: ["Machine Learning", "Deep Learning", "Computer Vision"],
      levels: ["Beginner", "Intermediate", "Advanced"],
      rating: 4.9,
      students: 15420,
      experience: "8 years",
      image: "/api/placeholder/150/150",
      bio: "Leading expert in computer vision and neural networks with publications in top-tier conferences.",
      courses: 12,
      featured: true
    },
    {
      id: 2,
      name: "Prof. Michael Rodriguez",
      title: "Data Science Professor",
      subjects: ["Data Science", "Statistics", "Python Programming"],
      levels: ["Beginner", "Intermediate"],
      rating: 4.8,
      students: 12350,
      experience: "12 years",
      image: "/api/placeholder/150/150",
      bio: "Professor of Data Science with extensive industry experience in Fortune 500 companies.",
      courses: 8,
      featured: true
    },
    {
      id: 3,
      name: "Dr. Emily Watson",
      title: "NLP Specialist",
      subjects: ["Natural Language Processing", "Linguistics", "Text Analytics"],
      levels: ["Intermediate", "Advanced"],
      rating: 4.7,
      students: 9800,
      experience: "6 years",
      image: "/api/placeholder/150/150",
      bio: "Specialist in natural language processing with focus on multilingual AI systems.",
      courses: 6,
      featured: false
    }
  ];

  // Load data on component mount
  useEffect(() => {
    loadCourses();
    loadFilterOptions();
  }, []);

  // Load courses from API
  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await courseAPI.getAll();
      if (response.success && response.data && Array.isArray(response.data)) {
        setCourses(response.data);
      } else {
        // If API fails or returns invalid data, set empty array
        setCourses([]);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      // Set empty array on error to prevent filter issues
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  // Load filter options
  const loadFilterOptions = async () => {
    try {
      const [categoriesRes, levelsRes] = await Promise.all([
        courseAPI.getCategories(),
        courseAPI.getLevels()
      ]);
      
      if (categoriesRes.success && categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
      
      if (levelsRes.success && levelsRes.data) {
        setLevels(levelsRes.data);
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  // Filter courses based on search and active filters - Add safety check
  const filteredCourses = Array.isArray(courses) ? courses.filter(course => {
    // Search filter
    if (searchQuery && !course.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !course.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Subject filter
    if (selectedSubject && course.category !== selectedSubject) {
      return false;
    }
    
    // Level filter
    if (selectedLevel && course.level !== selectedLevel) {
      return false;
    }
    
    return true;
  }) : [];

  // Filter teachers based on search and active filters
  const filteredTeachers = teachers.filter(teacher => {
    // Search filter
    if (searchQuery && !teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !teacher.subjects.some(subject => subject.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }
    
    // Subject filter
    if (selectedSubject && !teacher.subjects.includes(selectedSubject)) {
      return false;
    }
    
    // Level filter
    if (selectedLevel && !teacher.levels.includes(selectedLevel)) {
      return false;
    }
    
    return true;
  });

  const toggleFavoriteTeacher = (teacherId: number) => {
    setFavoriteTeachers(prev => 
      prev.includes(teacherId) 
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const addFilter = (filter: string) => {
    if (!activeFilters.includes(filter)) {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  const removeFilter = (filter: string) => {
    setActiveFilters(activeFilters.filter(f => f !== filter));
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setSelectedSubject('');
    setSelectedLevel('');
    setSelectedType('');
    setSearchQuery('');
  };

  // Sample courses data - using different variable name to avoid conflict
  const sampleCoursesData: Course[] = [
    {
      id: "1",
      title: "Master of Science in Artificial Intelligence",
      description: "Stanford's MS in AI program prepares students for leadership roles in AI research and development. The curriculum covers foundational AI concepts, advanced machine learning techniques, and specialized areas like NLP and computer vision.",
      category: "Machine Learning",
      level: "Advanced",
      duration: "2 years",
      price: 60000,
      original_price: 65000,
      image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop",
      instructor_name: "Stanford University",
      instructor_bio: "World-renowned institution for AI research and education",
      instructor_image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      syllabus: null,
      prerequisites: ["Bachelor's in Computer Science", "Linear Algebra", "Statistics"],
      learning_outcomes: ["Advanced ML algorithms", "AI research methods", "Industry applications"],
      skills_gained: ["Python", "TensorFlow", "Research", "Leadership"],
      language: "English",
      certificate: true,
      rating: 4.8,
      total_reviews: 1250,
      total_students: 5000,
      featured: true,
      status: "active",
      video_preview_url: "https://www.youtube.com/watch?v=aircAruvnKk",
      course_materials: null,
      tags: ["AI", "Machine Learning", "Graduate"],
      created_by: "stanford-admin",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z"
    },
    {
      id: "2",
      title: "Deep Learning Specialization",
      description: "Learn the foundations of Deep Learning, understand how to build neural networks, and lead successful machine learning projects. The specialization covers CNN, RNN, LSTM, and other modern architectures.",
      category: "Deep Learning",
      level: "Intermediate",
      duration: "5 months",
      price: 49,
      original_price: 79,
      image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop",
      instructor_name: "Andrew Ng",
      instructor_bio: "Co-founder of Coursera and former head of Baidu AI Group",
      instructor_image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      syllabus: null,
      prerequisites: ["Basic Python", "Linear Algebra"],
      learning_outcomes: ["Neural Networks", "CNN", "RNN", "LSTM"],
      skills_gained: ["TensorFlow", "Keras", "Python", "Deep Learning"],
      language: "English",
      certificate: true,
      rating: 4.9,
      total_reviews: 89000,
      total_students: 450000,
      featured: true,
      status: "active",
      video_preview_url: "https://www.youtube.com/watch?v=CS4cs9xVecg",
      course_materials: null,
      tags: ["Deep Learning", "Neural Networks", "Coursera"],
      created_by: "coursera-admin",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z"
    },
    {
      id: "3",
      title: "AI for Everyone",
      description: "A non-technical course designed to help you understand AI technologies and how they can impact your business. Learn the skills to work with an AI team and build an AI strategy in your company.",
      category: "AI Fundamentals",
      level: "Beginner",
      duration: "4 weeks",
      price: 49,
      original_price: null,
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop",
      instructor_name: "Andrew Ng",
      instructor_bio: "Co-founder of Coursera and former head of Baidu AI Group",
      instructor_image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      syllabus: null,
      prerequisites: null,
      learning_outcomes: ["AI Strategy", "Business Applications", "Team Management"],
      skills_gained: ["AI Strategy", "Business Planning", "Team Leadership"],
      language: "English",
      certificate: true,
      rating: 4.7,
      total_reviews: 45000,
      total_students: 200000,
      featured: false,
      status: "active",
      video_preview_url: "https://www.youtube.com/watch?v=21EiKfQYZXc",
      course_materials: null,
      tags: ["AI", "Business", "Strategy"],
      created_by: "coursera-admin",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z"
    },
    {
      id: "4",
      title: "TensorFlow Developer Professional Certificate",
      description: "Prepare for the TensorFlow Developer Certificate exam while learning best practices for TensorFlow, a popular open-source framework for machine learning.",
      category: "Machine Learning",
      level: "Intermediate",
      duration: "3 months",
      price: 49,
      original_price: null,
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop",
      instructor_name: "Laurence Moroney",
      instructor_bio: "AI Advocate at Google and TensorFlow expert",
      instructor_image: "https://images.unsplash.com/photo-1472099645785-2616b612b786?w=150&h=150&fit=crop&crop=face",
      syllabus: null,
      prerequisites: ["Basic Python", "Machine Learning basics"],
      learning_outcomes: ["TensorFlow", "Model deployment", "Certification"],
      skills_gained: ["TensorFlow", "Python", "Model Deployment", "Certification"],
      language: "English",
      certificate: true,
      rating: 4.6,
      total_reviews: 25000,
      total_students: 120000,
      featured: false,
      status: "active",
      video_preview_url: "https://www.youtube.com/watch?v=tPYj3fFJGjk",
      course_materials: null,
      tags: ["TensorFlow", "Certification", "Google"],
      created_by: "coursera-admin",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z"
    },
    {
      id: "5",
      title: "Using ChatGPT for Statement of Purpose Writing",
      description: "Learn how to effectively use ChatGPT to craft a compelling Statement of Purpose for university applications. This tutorial covers prompt engineering techniques, editing strategies, and ethical considerations.",
      category: "AI Tools",
      level: "Beginner",
      duration: "2 hours",
      price: 0,
      original_price: null,
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop",
      instructor_name: "Dr. Sarah Chen",
      instructor_bio: "Academic writing expert and AI tools specialist",
      instructor_image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      syllabus: null,
      prerequisites: null,
      learning_outcomes: ["Prompt engineering", "Academic writing", "AI ethics"],
      skills_gained: ["ChatGPT", "Writing", "Prompt Engineering"],
      language: "English",
      certificate: false,
      rating: 4.5,
      total_reviews: 1200,
      total_students: 8500,
      featured: false,
      status: "active",
      video_preview_url: "https://www.youtube.com/watch?v=example1",
      course_materials: null,
      tags: ["ChatGPT", "Writing", "Tutorial"],
      created_by: "edusmart-admin",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z"
    },
    {
      id: "6",
      title: "AI for University Selection and Application",
      description: "This hands-on tutorial demonstrates how to leverage AI tools to research universities, compare programs, and make data-driven decisions about where to apply based on your profile and preferences.",
      category: "AI Tools",
      level: "Beginner",
      duration: "3 hours",
      price: 0,
      original_price: null,
      image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop",
      instructor_name: "Dr. Michael Rodriguez",
      instructor_bio: "University admissions consultant and AI researcher",
      instructor_image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      syllabus: null,
      prerequisites: null,
      learning_outcomes: ["University research", "AI-assisted decision making", "Application strategy"],
      skills_gained: ["Research", "Decision Making", "AI Tools"],
      language: "English",
      certificate: false,
      rating: 4.7,
      total_reviews: 850,
      total_students: 5200,
      featured: false,
      status: "active",
      video_preview_url: "https://www.youtube.com/watch?v=example2",
      course_materials: null,
      tags: ["University", "Research", "Tutorial"],
      created_by: "edusmart-admin",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z"
    },
    {
      id: "7",
      title: "Ph.D. in Artificial Intelligence and Machine Learning",
      description: "CMU's renowned Ph.D. program focuses on cutting-edge AI research, with opportunities to work with leading faculty on projects spanning machine learning theory, robotics, computer vision, and more.",
      category: "Machine Learning",
      level: "Advanced",
      duration: "4-5 years",
      price: 0,
      original_price: null,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
      instructor_name: "Carnegie Mellon University",
      instructor_bio: "Leading research university in computer science and AI",
      instructor_image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      syllabus: null,
      prerequisites: ["Master's in CS/related field", "Strong research background"],
      learning_outcomes: ["Advanced research", "AI theory", "Publication skills"],
      skills_gained: ["Research", "AI Theory", "Publications", "Teaching"],
      language: "English",
      certificate: false,
      rating: 4.9,
      total_reviews: 150,
      total_students: 300,
      featured: true,
      status: "active",
      video_preview_url: "https://www.youtube.com/watch?v=example3",
      course_materials: null,
      tags: ["PhD", "Research", "CMU"],
      created_by: "cmu-admin",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z"
    },
    {
      id: "8",
      title: "Introduction to Quantum Computing",
      description: "An introductory course to quantum computing principles and applications. Explore quantum mechanics basics, quantum algorithms, and their potential impact on computing.",
      category: "Physics",
      level: "Intermediate",
      duration: "1 semester",
      price: 0,
      original_price: null,
      image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop",
      instructor_name: "Dr. Alice Johnson",
      instructor_bio: "Quantum computing researcher and physics professor",
      instructor_image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      syllabus: null,
      prerequisites: ["Linear Algebra", "Basic Physics"],
      learning_outcomes: ["Quantum mechanics", "Quantum algorithms", "Computing applications"],
      skills_gained: ["Quantum Computing", "Physics", "Mathematics"],
      language: "English",
      certificate: true,
      rating: 4.4,
      total_reviews: 320,
      total_students: 1800,
      featured: false,
      status: "active",
      video_preview_url: "https://www.youtube.com/watch?v=example4",
      course_materials: null,
      tags: ["Quantum", "Physics", "Computing"],
      created_by: "university-admin",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z"
    },
    {
      id: "9",
      title: "Advanced Statistics for Data Science",
      description: "Master statistical methods essential for data science. This comprehensive course covers probability theory, inference, regression, and modern statistical computing techniques.",
      category: "Mathematics",
      level: "Advanced",
      duration: "4 months",
      price: 0,
      original_price: null,
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
      instructor_name: "Dr. Robert Kim",
      instructor_bio: "Statistics professor and data science consultant",
      instructor_image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      syllabus: null,
      prerequisites: ["Calculus", "Basic Statistics"],
      learning_outcomes: ["Advanced statistics", "Data analysis", "Statistical computing"],
      skills_gained: ["Statistics", "R", "Python", "Data Analysis"],
      language: "English",
      certificate: true,
      rating: 4.6,
      total_reviews: 890,
      total_students: 4200,
      featured: false,
      status: "active",
      video_preview_url: "https://www.youtube.com/watch?v=example5",
      course_materials: null,
      tags: ["Statistics", "Data Science", "Mathematics"],
      created_by: "university-admin",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z"
    },
    {
      id: "10",
      title: "Contemporary Literature and Digital Media",
      description: "Explore the intersection of contemporary literature and digital media. Analyze how digital technologies are transforming narrative forms, readership, and literary criticism.",
      category: "English Literature",
      level: "Advanced",
      duration: "1 year",
      price: 0,
      original_price: null,
      image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop",
      instructor_name: "Dr. Emily Watson",
      instructor_bio: "Literature professor specializing in digital humanities",
      instructor_image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      syllabus: null,
      prerequisites: ["Bachelor's in Literature or related field"],
      learning_outcomes: ["Digital humanities", "Literary analysis", "Media studies"],
      skills_gained: ["Literary Analysis", "Digital Media", "Critical Thinking"],
      language: "English",
      certificate: true,
      rating: 4.3,
      total_reviews: 180,
      total_students: 650,
      featured: false,
      status: "active",
      video_preview_url: "https://www.youtube.com/watch?v=example6",
      course_materials: null,
      tags: ["Literature", "Digital Media", "Humanities"],
      created_by: "university-admin",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z"
    }
  ];

  // Ensure displayCourses is always an array
  const displayCourses = Array.isArray(courses) && courses.length > 0 ? courses : sampleCoursesData;
  
  // Sample categories and subjects for fallback
  const fallbackCategories = ['Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'AI Tools', 'Business Strategy', 'Research', 'Writing'];
  const subjects = ['Machine Learning', 'Deep Learning', 'Physics', 'Mathematics', 'English Literature', 'Quantum Computing', 'Natural Language Processing', 'Statistics'];
  
  // Use API data if available, otherwise fall back to sample data
  const displayCategories = categories.length > 0 ? categories : fallbackCategories;
  
  // Helper to render star ratings
  const renderStars = (rating: number | null | undefined) => {
    const safeRating = rating || 0;
    return Array.from({ length: 5 }, (_, i) => (
      <IconComponent 
        key={i} 
        icon={FaStar}
        className={i < Math.floor(safeRating) ? 'text-yellow-400' : 'text-gray-300'} 
      />
    ));
  };
  
  // Get appropriate icon for course type
  const getCourseTypeIcon = (type: string | undefined) => {
    // Since type doesn't exist in our Course interface, we'll use category instead
    return <IconComponent icon={FaGraduationCap} className="text-primary" />;
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

  const filterButtonVariants = {
    hover: {
      scale: 1.05,
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.95
    }
  };

  // Get courses for a specific teacher
  const getTeacherCourses = (teacherId: number) => {
    // For now, return empty array since we don't have teacher-course mapping in API
    return [];
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
                {t('aiCourses.title')}
              </motion.h1>
              <motion.p 
                className="text-xl mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {t('aiCourses.subtitle')}
              </motion.p>
              <motion.div 
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <input
                  type="text"
                  placeholder={t('aiCourses.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full max-w-md mx-auto px-4 py-3 pl-12 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <IconComponent icon={FaSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </motion.div>

              {/* Display Mode Toggle */}
              <motion.div 
                className="mt-6 flex justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="bg-teal-800 bg-opacity-50 rounded-full p-1 flex">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                      viewMode === 'grid'
                        ? 'bg-white text-teal-800'
                        : 'text-white hover:bg-teal-600 hover:bg-opacity-50'
                    }`}
                  >
                    {t('courses.title')}
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                      viewMode === 'list'
                        ? 'bg-white text-teal-800'
                        : 'text-white hover:bg-teal-600 hover:bg-opacity-50'
                    }`}
                  >
                    <IconComponent icon={FaChalkboardTeacher} className="text-xs" />
                    Teachers
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            {/* Featured Courses */}
            {viewMode === 'grid' && (
              <motion.div 
                className="mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-teal-800 mb-6">{t('aiCourses.featuredCourses')}</h2>
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {(displayCourses || []).filter(course => course.featured).map(course => (
                    <motion.div 
                      key={course.id} 
                      className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 flex flex-col md:flex-row"
                      variants={itemVariants}
                      whileHover={{ 
                        y: -5,
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="md:w-1/3 overflow-hidden">
                        <motion.img 
                          src={course.image || '/api/placeholder/400/300'} 
                          alt={course.title}
                          className="h-full w-full object-cover" 
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <div className="md:w-2/3 p-6">
                        <div className="flex items-center gap-2 mb-2">
                          {getCourseTypeIcon(course.category)}
                          <span className="text-sm font-medium text-gray-600">{course.instructor_name}</span>
                        </div>
                        <h3 className="text-xl font-bold text-teal-800 mb-2">{course.title}</h3>
                        <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                        
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex gap-1">
                            {renderStars(course.rating)}
                          </div>
                          <span className="text-sm text-gray-600">{course.rating || 0} ({course.total_reviews?.toLocaleString() || 0} reviews)</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-2xl font-bold text-primary">${course.price}</span>
                            {course.original_price && course.original_price > course.price && (
                              <span className="text-lg text-gray-500 line-through">${course.original_price}</span>
                            )}
                          </div>
                          <a
                            href={course.video_preview_url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                          >
                            Preview
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* Featured Teachers */}
            {viewMode === 'list' && (
              <motion.div 
                className="mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-teal-800 mb-6">Featured Teachers</h2>
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {teachers.filter(teacher => teacher.featured).map(teacher => (
                    <motion.div 
                      key={teacher.id} 
                      className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 flex flex-col"
                      variants={itemVariants}
                      whileHover={{ 
                        y: -5,
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="relative p-6 pt-0 flex-grow flex flex-col">
                        <div className="flex justify-center -mt-12 mb-4">
                          <img 
                            src={teacher.image} 
                            alt={teacher.name}
                            className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border-4 border-white shadow-lg"
                          />
                        </div>
                        <div className="absolute top-3 right-3">
                          <button 
                            onClick={() => toggleFavoriteTeacher(teacher.id)}
                            className="text-gray-400 hover:text-yellow-500 transition-colors"
                          >
                            <IconComponent 
                              icon={favoriteTeachers.includes(teacher.id) ? FaBookmark : FaRegBookmark} 
                              className={favoriteTeachers.includes(teacher.id) ? "text-yellow-500" : ""} 
                            />
                          </button>
                        </div>
                        <h3 className="text-xl font-bold text-teal-800 mb-1 text-center">{teacher.name}</h3>
                        <p className="text-gray-600 text-sm mb-2 text-center">{teacher.title}</p>
                        <p className="text-gray-600 text-sm mb-3 text-center">{teacher.experience}</p>
                        
                        <div className="flex flex-wrap justify-center gap-1 mb-3">
                          {teacher.subjects.map((subject, index) => (
                            <span key={index} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                              {subject}
                            </span>
                          ))}
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-4 text-center">{teacher.bio}</p>
                        
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <div className="flex gap-1">
                            {renderStars(teacher.rating)}
                          </div>
                          <span className="text-sm text-gray-600">{teacher.rating} ({teacher.students.toLocaleString()})</span>
                        </div>
                        
                        <div className="mt-auto flex flex-col gap-2">
                          <button
                            onClick={() => {
                              // Navigate to teacher's courses
                              setViewMode('grid');
                              // You would filter courses by teacher here
                            }}
                            className="bg-teal-500 hover:bg-teal-600 text-white text-center py-2 rounded-lg transition-colors"
                          >
                            View Courses ({getTeacherCourses(teacher.id).length})
                            <IconComponent icon={FaChevronRight} className="text-xs" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}
            
            {/* Filter options */}
            <div className="mb-8">
              {viewMode === 'grid' && (
                <div className="flex flex-wrap gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiCourses.filterByType')}</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedType('all')}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedType === 'all'
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {t('aiCourses.allTypes')}
                      </button>
                      <button
                        onClick={() => setSelectedType('university')}
                        className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                          selectedType === 'university'
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <IconComponent icon={FaUniversity} className="text-xs" /> {t('aiCourses.university')}
                      </button>
                      <button
                        onClick={() => setSelectedType('certification')}
                        className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                          selectedType === 'certification'
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <IconComponent icon={FaCertificate} className="text-xs" /> {t('aiCourses.certification')}
                      </button>
                      <button
                        onClick={() => setSelectedType('tutorial')}
                        className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                          selectedType === 'tutorial'
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <IconComponent icon={FaLaptopCode} className="text-xs" /> {t('aiCourses.tutorial')}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiCourses.filterByLevel')}</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedLevel('all')}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedLevel === 'all'
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {t('aiCourses.allLevels')}
                      </button>
                      <button
                        onClick={() => setSelectedLevel('Beginner')}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedLevel === 'Beginner'
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Beginner
                      </button>
                      <button
                        onClick={() => setSelectedLevel('Intermediate')}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedLevel === 'Intermediate'
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Intermediate
                      </button>
                      <button
                        onClick={() => setSelectedLevel('Advanced')}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedLevel === 'Advanced'
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Advanced
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedSubject('all')}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedSubject === 'all'
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        All Categories
                      </button>
                      {displayCategories.map(category => (
                        <button
                          key={category}
                          onClick={() => setSelectedSubject(category)}
                          className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                            selectedSubject === category
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
              )}
              
              {/* Teacher Filters */}
              {viewMode === 'list' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject Areas</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedSubject('all')}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedSubject === 'all'
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      All Subjects
                    </button>
                    {subjects.map(subject => (
                      <button
                        key={subject}
                        onClick={() => setSelectedSubject(subject)}
                        className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                          selectedSubject === subject
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <IconComponent icon={FaGraduationCap} className="text-xs" /> {subject}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Course listing */}
            {viewMode === 'grid' && filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map(course => (
                  <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 flex flex-col">
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={course.image || '/api/placeholder/400/300'} 
                        alt={course.title} 
                        className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                      />
                    </div>
                    <div className="p-6 flex-grow flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        {getCourseTypeIcon(course.category)}
                        <span className="text-sm font-medium text-gray-600">{course.instructor_name}</span>
                      </div>
                      <h3 className="text-lg font-bold text-teal-800 mb-2">{course.title}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-3 flex-grow">{course.description}</p>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                          {course.category}
                        </span>
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                          {course.level}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-1">
                          {renderStars(course.rating)}
                        </div>
                        <span className="text-xs text-gray-600">{course.rating || 0}</span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-primary">${course.price}</span>
                          {course.original_price && course.original_price > course.price && (
                            <span className="text-sm text-gray-500 line-through">${course.original_price}</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{course.duration}</span>
                      </div>
                      
                      <a
                        href={course.video_preview_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 bg-orange-500 hover:bg-orange-600 text-white text-center py-2 rounded-lg transition-colors"
                      >
                        Preview Course
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