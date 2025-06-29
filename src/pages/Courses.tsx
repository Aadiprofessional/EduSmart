import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../utils/LanguageContext';
import { useAuth } from '../utils/AuthContext';
import NotificationModal from '../components/ui/NotificationModal';
import { 
  FaGraduationCap, 
  FaSearch, 
  FaFilter, 
  FaHeart, 
  FaShoppingCart, 
  FaStar, 
  FaUsers, 
  FaClock, 
  FaPlay, 
  FaVideo, 
  FaFileAlt, 
  FaDownload, 
  FaChevronRight, 
  FaChevronDown, 
  FaChevronUp, 
  FaChevronLeft,
  FaSpinner,
  FaExclamationTriangle,
  FaPlayCircle,
  FaInfinity,
  FaMobile,
  FaAward,
  FaShare,
  FaCheck,
  FaUniversity,
  FaCertificate,
  FaRobot,
  FaLaptopCode,
  FaTag,
  FaChalkboardTeacher,
  FaBookmark,
  FaRegBookmark,
  FaTimes,
  FaUserTie,
  FaTimesCircle,
  FaSort,
  FaRegHeart,
  FaTh,
  FaList
} from 'react-icons/fa';
import IconWrapper from '../components/IconWrapper';
import PageHeader from '../components/ui/PageHeader';
import IconComponent from '../components/ui/IconComponent';
import { API_BASE_URL } from '../config/api';
import { API_BASE, API_V2_BASE, getAuthHeaders } from '../config/api';

// Enhanced API service
const API_ENDPOINTS = {
  COURSES: '/api/courses',
  COURSE_DETAILS: (id: string) => `/api/courses/${id}`,
  COURSE_CATEGORIES: '/api/course-categories',
  ENROLL: (courseId: string) => `/api/courses/${courseId}/enroll`,
  CHECK_ENROLLMENT: (courseId: string, userId: string) => `/api/courses/${courseId}/enrollment/${userId}`,
  USER_ENROLLMENTS: (userId: string) => `/api/users/${userId}/enrollments`,
  COURSE_PROGRESS: (courseId: string, userId: string) => `/api/courses/${courseId}/progress/${userId}`,
  UPDATE_PROGRESS: (courseId: string) => `/api/courses/${courseId}/progress`,
};

interface Course {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  category: string;
  level: string;
  language: string;
  duration_hours?: number;
  price: number;
  original_price?: number;
  thumbnail_image?: string;
  preview_video_url?: string;
  instructor_name: string;
  instructor_bio?: string;
  instructor_image?: string;
  what_you_will_learn?: string[];
  prerequisites?: string[];
  target_audience?: string[];
  course_includes?: string[];
  tags?: string[];
  status: string;
  featured: boolean;
  rating?: number;
  total_reviews?: number;
  total_students?: number;
  total_lectures?: number;
  total_sections?: number;
  created_at: string;
  updated_at: string;
}

interface CourseSection {
  id: string;
  title: string;
  description?: string;
  section_order: number;
  duration_minutes?: number;
  course_lectures?: CourseLecture[];
}

interface CourseLecture {
  id: string;
  title: string;
  description?: string;
  lecture_type: 'video' | 'article' | 'quiz' | 'assignment' | 'resource';
  video_duration_seconds?: number;
  lecture_order: number;
  is_preview: boolean;
  is_free: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
}

const Courses: React.FC = () => {
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  
  // State management
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'browse' | 'details' | 'learning'>('browse');
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  
  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeLevel, setActiveLevel] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Course details state
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<string[]>([]);

  // Notification modal state
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    message: ''
  });

  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => {
    setNotification({
      isOpen: true,
      type,
      message,
      title
    });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    if (id) {
      setCurrentView('details');
      fetchCourseDetails(id);
    } else {
      setCurrentView('browse');
      fetchCourses();
    }
    fetchCategories();
    if (user) {
      fetchUserEnrollments();
    }
  }, [id, user]);

  // Check enrollment status for selected course
  useEffect(() => {
    if (selectedCourse && user) {
      checkCourseEnrollment(selectedCourse.id);
    }
  }, [selectedCourse, user]);

  const checkCourseEnrollment = async (courseId: string) => {
    if (!user?.id) return;
    
    try {
      // Add authentication headers for V2 API
      const headers = getAuthHeaders(user, session);
      const response = await fetch(`${API_V2_BASE}/courses/${courseId}/enrollment/${user.id}`, {
        headers
      });
      
      if (!response.ok) {
        // If endpoint doesn't exist or returns 404, assume not enrolled
        if (response.status === 404) {
          return;
        }
        // If 401, user needs to authenticate - don't show error
        if (response.status === 401) {
          console.warn('User not authenticated for enrollment check');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Handle different possible response formats
      if (data.success && data.data && data.data.enrolled) {
        setEnrolledCourses(prev => {
          if (!prev.includes(courseId)) {
            return [...prev, courseId];
          }
          return prev;
        });
      } else if (data.enrolled) {
        // Direct enrolled field
        setEnrolledCourses(prev => {
          if (!prev.includes(courseId)) {
            return [...prev, courseId];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Error checking course enrollment:', error);
      // Don't show error to user as this is a background check
    }
  };

  // API Functions
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '50'); // Get more courses for better UX
      if (searchQuery) params.append('search', searchQuery);
      if (activeCategory) params.append('category', activeCategory);
      if (activeLevel) params.append('level', activeLevel);
      if (priceRange[0] > 0) params.append('price_min', priceRange[0].toString());
      if (priceRange[1] < 200) params.append('price_max', priceRange[1].toString());
      
      const response = await fetch(`${API_BASE}/courses?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Handle the actual production API response format: {"success": true, "data": {"courses": [...], "pagination": {...}}}
      if (data.success && data.data && data.data.courses && Array.isArray(data.data.courses)) {
        setCourses(data.data.courses);
      } else if (data.courses && Array.isArray(data.courses)) {
        // Fallback for direct courses array format
        setCourses(data.courses);
      } else {
        console.error('Unexpected API response format:', data);
        throw new Error('Invalid response format: courses not found');
      }
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      setError(error.message || 'Failed to load courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // First try the dedicated categories endpoint
      let response = await fetch(`${API_BASE_URL}/course-categories`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.categories) {
          // Convert categories array to the expected format
          const formattedCategories = data.categories.map((cat: string, index: number) => ({
            id: index.toString(),
            name: cat,
            slug: cat.toLowerCase().replace(/\s+/g, '-')
          }));
          setCategories(formattedCategories);
          return;
        }
      }
      
      // Fallback: Extract categories from courses data
      console.log('Categories endpoint not available, extracting from courses data');
      const coursesResponse = await fetch(`${API_BASE}/courses?limit=100`);
      
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        
        let coursesArray = [];
        
        // Handle production API format: {"success": true, "data": {"courses": [...]}}
        if (coursesData.success && coursesData.data && coursesData.data.courses) {
          coursesArray = coursesData.data.courses;
        } else if (coursesData.courses && Array.isArray(coursesData.courses)) {
          // Fallback for direct courses array format
          coursesArray = coursesData.courses;
        }
        
        if (coursesArray.length > 0) {
          // Extract unique categories from courses
          const categorySet = new Set<string>();
          coursesArray.forEach((course: any) => {
            if (course.category && course.category.trim() !== '') {
              categorySet.add(course.category);
            }
          });
          
          const uniqueCategories = Array.from(categorySet);
          
          const formattedCategories = uniqueCategories.map((cat: string, index: number) => ({
            id: index.toString(),
            name: cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' '),
            slug: cat.toLowerCase().replace(/\s+/g, '-')
          }));
          
          setCategories(formattedCategories);
          console.log('Extracted categories:', formattedCategories);
          return;
        }
      }
      
      // Final fallback: Set some default categories
      const defaultCategories = [
        { id: '0', name: 'Programming', slug: 'programming' },
        { id: '1', name: 'Data Science', slug: 'data-science' },
        { id: '2', name: 'Technology', slug: 'technology' },
        { id: '3', name: 'Business', slug: 'business' },
        { id: '4', name: 'Design', slug: 'design' }
      ];
      setCategories(defaultCategories);
      console.log('Using default categories');
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Set some default categories as fallback
      const defaultCategories = [
        { id: '0', name: 'Programming', slug: 'programming' },
        { id: '1', name: 'Data Science', slug: 'data-science' },
        { id: '2', name: 'Technology', slug: 'technology' },
        { id: '3', name: 'Business', slug: 'business' },
        { id: '4', name: 'Design', slug: 'design' }
      ];
      setCategories(defaultCategories);
    }
  };

  const fetchUserEnrollments = async () => {
    if (!user?.id) return;
    
    try {
      // Add authentication headers for V2 API
      const headers = getAuthHeaders(user, session);
      const response = await fetch(`${API_V2_BASE}/users/${user.id}/enrollments`, {
        headers
      });
      
      if (!response.ok) {
        // If endpoint doesn't exist or returns 404, assume no enrollments
        if (response.status === 404) {
          return;
        }
        // If 401, user needs to authenticate - don't show error
        if (response.status === 401) {
          console.warn('User not authenticated for enrollments check');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Handle different possible response formats
      if (data.success && data.data && data.data.enrollments) {
        const enrolledCourseIds = data.data.enrollments.map((e: any) => e.course_id);
        setEnrolledCourses(enrolledCourseIds);
      } else if (data.enrollments && Array.isArray(data.enrollments)) {
        // Direct enrollments array
        const enrolledCourseIds = data.enrollments.map((e: any) => e.course_id);
        setEnrolledCourses(enrolledCourseIds);
      }
    } catch (error) {
      console.error('Error fetching user enrollments:', error);
      // Don't show error to user as this is a background check
    }
  };

  const fetchCourseDetails = async (courseId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/courses/${courseId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Handle the production API response format: {"success": true, "data": {"course": {...}}}
      if (data.success && data.data && data.data.course) {
        setSelectedCourse(data.data.course);
      } else if (data.course) {
        // Fallback for direct course object format
        setSelectedCourse(data.course);
      } else {
        console.error('Unexpected course details response format:', data);
        throw new Error('Course not found in response');
      }
    } catch (error: any) {
      console.error('Error fetching course details:', error);
      setError(error.message || 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollment = async (courseId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      console.log('=== ENROLLMENT DEBUG ===');
      console.log('User:', user.id);
      console.log('Course:', courseId);
      
      const enrollmentData = {
        userId: user.id,
        pricePaid: selectedCourse?.price || 0,
        paymentMethod: 'credit_card',
        transactionId: 'txn_' + Date.now()
      };

      console.log('Enrollment data:', enrollmentData);

      // Add authentication headers for V2 API
      const headers = getAuthHeaders(user, session);
      const response = await fetch(`${API_V2_BASE}/courses/${courseId}/enroll`, {
        method: 'POST',
        headers,
        body: JSON.stringify(enrollmentData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Enrollment response:', data);
      
      // Handle different possible response formats
      let enrollmentSuccessful = false;
      let alreadyEnrolled = false;
      
      if (data.success) {
        enrollmentSuccessful = true;
        alreadyEnrolled = data.data?.alreadyEnrolled || false;
      } else if (data.enrolled || data.message === 'User already enrolled') {
        enrollmentSuccessful = true;
        alreadyEnrolled = true;
      } else if (data.error) {
        throw new Error(data.error);
      }
      
      if (enrollmentSuccessful) {
        if (alreadyEnrolled) {
          showNotification('info', 'You are already enrolled in this course!', 'Already Enrolled');
        } else {
          showNotification('success', 'Successfully enrolled in course!', 'Enrollment Successful');
        }
        
        // Update enrolled courses list
        setEnrolledCourses(prev => [...prev, courseId]);
        
        // Refresh user enrollments to ensure persistence
        await fetchUserEnrollments();
        
        // Navigate to course player (simplified - just go to course page)
        navigate(`/course/${courseId}`);
      } else {
        throw new Error('Enrollment failed - unknown response format');
      }
    } catch (error: any) {
      console.error('Error enrolling in course:', error);
      showNotification('error', error.message || 'Failed to enroll in course', 'Enrollment Failed');
    }
  };

  const navigateToCoursePlayer = async (courseId: string, retryCount = 0): Promise<void> => {
    try {
      console.log('=== NAVIGATION DEBUG ===');
      console.log('Navigating to course:', courseId);
      console.log('User ID:', user?.id);
      console.log('Retry count:', retryCount);
      
      // Get course sections to find the first lecture
      const sectionsUrl = `${API_V2_BASE}/courses/${courseId}/sections?uid=${user?.id}`;
      console.log('Fetching sections from:', sectionsUrl);
      
      // Add authentication headers for V2 API
      const headers = getAuthHeaders(user, session);
      const response = await fetch(sectionsUrl, { headers });
      const data = await response.json();
      
      console.log('Sections response:', data);
      
      if (!response.ok) {
        console.error('Sections request failed:', response.status, data);
        
        // If 403 and this is the first attempt, try to verify enrollment and retry
        if (response.status === 403 && retryCount < 2) {
          console.log('403 error, checking enrollment status...');
          
          const enrollmentCheckUrl = `${API_V2_BASE}/courses/${courseId}/enrollment/${user?.id}`;
          const enrollmentResponse = await fetch(enrollmentCheckUrl, { headers });
          const enrollmentData = await enrollmentResponse.json();
          
          console.log('Enrollment check:', enrollmentData);
          
          if (enrollmentData.success && enrollmentData.data?.enrolled) {
            console.log('User is enrolled, retrying in 1 second...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            return navigateToCoursePlayer(courseId, retryCount + 1);
          } else {
            showNotification('warning', 'You need to be enrolled to access this course. Please try enrolling again.', 'Access Denied');
            return;
          }
        }
        
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      
      if (data.success && data.data.sections && data.data.sections.length > 0) {
        const firstSection = data.data.sections[0];
        if (firstSection.course_lectures && firstSection.course_lectures.length > 0) {
          const firstLecture = firstSection.course_lectures[0];
          console.log('Navigating to first lecture:', firstLecture.id);
          navigate(`/learn/${courseId}/${firstLecture.id}`);
        } else {
          console.log('No lectures found, navigating to course overview');
          navigate(`/course/${courseId}`);
        }
      } else {
        console.log('No sections found, navigating to course overview');
        navigate(`/course/${courseId}`);
      }
    } catch (error: any) {
      console.error('Error navigating to course player:', error);
      
      if (retryCount < 2) {
        console.log(`Retrying navigation (attempt ${retryCount + 1})...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return navigateToCoursePlayer(courseId, retryCount + 1);
      }
      
      showNotification('error', `Failed to access course: ${error.message}`, 'Navigation Error');
      navigate(`/course/${courseId}`);
    }
  };

  const isEnrolled = (courseId: string) => {
    return enrolledCourses.includes(courseId);
  };

  const toggleWishlist = (courseId: string) => {
    setWishlist(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const toggleCart = (courseId: string) => {
    setCart(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <IconWrapper
            key={star}
            icon={FaStar}
            className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}
            size={14}
          />
        ))}
      </div>
    );
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // Render Course Browse View
  const renderCourseBrowse = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      <PageHeader
        title={t('courses.title') || 'Learn Without Limits'}
        subtitle={t('courses.subtitle') || 'Start, switch, or advance your career with thousands of courses'}
        height="sm"
      >
        {/* Enhanced Search Bar - Desktop only */}
        <div className="max-w-2xl mx-auto hidden lg:block">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 shadow-2xl border border-white/20">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={t('courses.searchPlaceholder') || 'What do you want to learn?'}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Search and Action Bar - Show on mobile only */}
        <div className="block lg:hidden mb-6 space-y-4">
          {/* Mobile Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="What do you want to learn?"
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
              {((activeCategory ? 1 : 0) + (activeLevel ? 1 : 0) + (searchQuery ? 1 : 0)) > 0 && (
                <span className="bg-blue-800 text-white text-xs px-2 py-1 rounded-full">
                  {(activeCategory ? 1 : 0) + (activeLevel ? 1 : 0) + (searchQuery ? 1 : 0)}
                </span>
              )}
            </button>

            {/* View Mode Toggle */}
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="px-3 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all flex items-center justify-center"
            >
              <IconComponent icon={viewMode === 'grid' ? FaFilter : FaSort} className="h-4 w-4" />
            </button>

            {/* Sort Toggle */}
            <button
              onClick={() => setSortBy(sortBy === 'featured' ? 'popular' : 'featured')}
              className="px-3 py-3 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-lg hover:from-teal-600 hover:to-green-600 transition-all flex items-center justify-center"
            >
              <IconComponent icon={FaSort} className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Desktop Filters */}
        <div className="hidden lg:block bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Available Courses</h2>
              <p className="text-gray-600">
                Showing {courses.length} course{courses.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="flex items-center gap-4 mt-4 lg:mt-0">
              {/* View Mode Toggle - Desktop */}
              <div className="flex items-center gap-2">
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
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <select
              value={activeLevel}
              onChange={(e) => setActiveLevel(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="all-levels">All Levels</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
            
            <input
              type="number"
              placeholder="Min Price"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            <input
              type="number"
              placeholder="Max Price"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 200])}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            <button
              onClick={fetchCourses}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Course Grid/List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <IconWrapper icon={FaSpinner} className="animate-spin text-4xl text-blue-600" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <IconWrapper icon={FaExclamationTriangle} className="text-4xl text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Courses</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchCourses}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-6"
          }>
            {courses.map((course) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                className={viewMode === 'grid' 
                  ? "bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full"
                  : "bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col lg:flex-row"
                }
                onClick={() => {
                  setSelectedCourse(course);
                  setCurrentView('details');
                }}
              >
                {viewMode === 'grid' ? (
                  // Grid View Layout
                  <>
                    <div className="relative">
                      <img
                        src={course.thumbnail_image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'}
                        alt={course.title}
                        className="w-full h-48 object-cover"
                      />
                      
                      {course.featured && (
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          Featured
                        </div>
                      )}
                      
                      <div className="absolute top-3 right-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(course.id);
                          }}
                          className={`p-2 rounded-full transition-colors ${
                            wishlist.includes(course.id) 
                              ? 'bg-red-500 text-white' 
                              : 'bg-white/80 text-gray-600 hover:bg-white'
                          }`}
                        >
                          <IconWrapper icon={wishlist.includes(course.id) ? FaHeart : FaRegHeart} size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-600 font-semibold capitalize">{course.category}</span>
                        <span className="text-sm text-gray-500 capitalize">{course.level}</span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">{course.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem] flex-grow">{course.description}</p>
                      
                      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <IconWrapper icon={FaClock} size={12} />
                          {course.duration_hours ? `${course.duration_hours} hours` : 'N/A'}
                        </div>
                        <div className="flex items-center gap-1">
                          <IconWrapper icon={FaUsers} size={12} />
                          {course.total_students || 0}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-gray-900">${course.price}</span>
                          {course.original_price && course.original_price > course.price && (
                            <span className="text-lg text-gray-400 line-through">${course.original_price}</span>
                          )}
                        </div>
                        
                        {course.rating && (
                          <div className="flex items-center gap-1">
                            {renderStars(course.rating)}
                            <span className="text-sm text-gray-600 ml-1">({course.total_reviews})</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-auto">
                        {isEnrolled(course.id) ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateToCoursePlayer(course.id);
                            }}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <IconWrapper icon={FaPlayCircle} size={16} />
                            View Course
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEnrollment(course.id);
                            }}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                          >
                            Enroll Now
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  // List View Layout
                  <>
                    <div className="relative w-full lg:w-80 flex-shrink-0">
                      <img
                        src={course.thumbnail_image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'}
                        alt={course.title}
                        className="w-full h-48 lg:h-full object-cover"
                      />
                      
                      {course.featured && (
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          Featured
                        </div>
                      )}
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-600 font-semibold capitalize">{course.category}</span>
                        <span className="text-sm text-gray-500 capitalize">{course.level}</span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-2 flex-1">{course.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <IconWrapper icon={FaClock} size={12} />
                            {course.duration_hours ? `${course.duration_hours} hours` : 'N/A'}
                          </div>
                          <div className="flex items-center gap-1">
                            <IconWrapper icon={FaUsers} size={12} />
                            {course.total_students || 0}
                          </div>
                          {course.rating && (
                            <div className="flex items-center gap-1">
                              {renderStars(course.rating)}
                              <span className="ml-1">({course.total_reviews})</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-gray-900">${course.price}</span>
                            {course.original_price && course.original_price > course.price && (
                              <span className="text-lg text-gray-400 line-through">${course.original_price}</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWishlist(course.id);
                              }}
                              className={`p-2 rounded-lg transition-colors ${
                                wishlist.includes(course.id) 
                                  ? 'bg-red-100 text-red-600' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                              }`}
                            >
                              <IconWrapper icon={wishlist.includes(course.id) ? FaHeart : FaRegHeart} size={16} />
                            </button>

                            {isEnrolled(course.id) ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigateToCoursePlayer(course.id);
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                              >
                                View Course
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEnrollment(course.id);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                              >
                                Enroll Now
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

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
                {/* Level */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                  <select
                    value={activeLevel}
                    onChange={(e) => setActiveLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="all-levels">All Levels</option>
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
                    <option value="newest">Newest</option>
                    <option value="popular">Most Popular</option>
                    <option value="rating">Highest Rated</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min Price"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Max Price"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 200])}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Quick Filters */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quick Filters</label>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setActiveLevel('');
                        setSortBy('featured');
                      }}
                      className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      ⭐ Featured Courses
                    </button>
                    <button
                      onClick={() => {
                        setActiveLevel('beginner');
                        setSortBy('popular');
                      }}
                      className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      🔥 Popular for Beginners
                    </button>
                    <button
                      onClick={() => {
                        setPriceRange([0, 0]);
                        setSortBy('rating');
                      }}
                      className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      🆓 Free Courses
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 bg-white border-t px-4 py-3 flex gap-3">
                <button
                  onClick={() => {
                    setActiveLevel('');
                    setActiveCategory('');
                    setPriceRange([0, 200]);
                    setSortBy('featured');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={() => {
                    setShowFilters(false);
                    fetchCourses();
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Render Course Details View
  const renderCourseDetails = () => {
    if (!selectedCourse) return null;

    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        {/* Course Header */}
        <div className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Course Info */}
              <div className="lg:col-span-2">
                <nav className="flex items-center gap-2 text-sm mb-4 opacity-80">
                  <button onClick={() => navigate('/courses')} className="hover:text-blue-400">
                    Courses
                  </button>
                  <IconWrapper icon={FaChevronRight} size={12} />
                  <span className="capitalize">{selectedCourse.category}</span>
                  <IconWrapper icon={FaChevronRight} size={12} />
                  <span>{selectedCourse.title}</span>
                </nav>
                
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{selectedCourse.title}</h1>
                {selectedCourse.subtitle && (
                  <p className="text-xl mb-6 opacity-90">{selectedCourse.subtitle}</p>
                )}
                
                <div className="flex flex-wrap items-center gap-6 mb-6">
                  {selectedCourse.rating && (
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400 font-semibold">{selectedCourse.rating}</span>
                      {renderStars(selectedCourse.rating)}
                      <span className="opacity-80">({selectedCourse.total_reviews} reviews)</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <IconWrapper icon={FaUsers} />
                    <span>{selectedCourse.total_students || 0} students</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <IconWrapper icon={FaClock} />
                    <span>{selectedCourse.duration_hours ? `${selectedCourse.duration_hours} hours` : 'N/A'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <IconWrapper icon={FaGraduationCap} />
                    <span className="capitalize">{selectedCourse.level}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedCourse.instructor_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">Created by {selectedCourse.instructor_name}</p>
                      <p className="text-sm opacity-80">Instructor</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Preview Card */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden sticky top-8">
                  {/* Preview Video/Image */}
                  <div className="relative h-48">
                    {selectedCourse.preview_video_url ? (
                      <video
                        src={selectedCourse.preview_video_url}
                        poster={selectedCourse.thumbnail_image}
                        controls
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={selectedCourse.thumbnail_image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'}
                        alt={selectedCourse.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {!selectedCourse.preview_video_url && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                          <IconWrapper icon={FaPlay} className="text-gray-800 ml-1" size={20} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    {/* Pricing */}
                    <div className="text-center mb-6">
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <span className="text-3xl font-bold text-gray-900">${selectedCourse.price}</span>
                        {selectedCourse.original_price && selectedCourse.original_price > selectedCourse.price && (
                          <span className="text-xl text-gray-400 line-through">${selectedCourse.original_price}</span>
                        )}
                      </div>
                      {selectedCourse.original_price && selectedCourse.original_price > selectedCourse.price && (
                        <p className="text-sm text-red-600 font-semibold">
                          {Math.round(((selectedCourse.original_price - selectedCourse.price) / selectedCourse.original_price) * 100)}% off
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      {isEnrolled(selectedCourse.id) ? (
                        <button
                          onClick={() => navigateToCoursePlayer(selectedCourse.id)}
                          className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <IconWrapper icon={FaPlayCircle} size={20} />
                          View Course
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEnrollment(selectedCourse.id)}
                            className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-purple-700 transition-colors"
                          >
                            Enroll Now
                          </button>
                          
                          <button
                            onClick={() => toggleCart(selectedCourse.id)}
                            className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                              cart.includes(selectedCourse.id)
                                ? 'bg-gray-200 text-gray-700'
                                : 'border-2 border-gray-300 text-gray-700 hover:border-gray-400'
                            }`}
                          >
                            {cart.includes(selectedCourse.id) ? 'Remove from Cart' : 'Add to Cart'}
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={() => toggleWishlist(selectedCourse.id)}
                        className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
                      >
                        <IconWrapper icon={FaHeart} className={wishlist.includes(selectedCourse.id) ? 'text-red-500' : ''} />
                        {wishlist.includes(selectedCourse.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      </button>
                    </div>

                    {/* Course Includes */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">This course includes:</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-3">
                          <IconWrapper icon={FaVideo} className="text-gray-600" size={14} />
                          <span>{selectedCourse.duration_hours ? `${selectedCourse.duration_hours} hours` : 'N/A'} on-demand video</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <IconWrapper icon={FaFileAlt} className="text-gray-600" size={14} />
                          <span>{selectedCourse.total_lectures || 0} lectures</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <IconWrapper icon={FaDownload} className="text-gray-600" size={14} />
                          <span>Downloadable resources</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <IconWrapper icon={FaInfinity} className="text-gray-600" size={14} />
                          <span>Full lifetime access</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <IconWrapper icon={FaMobile} className="text-gray-600" size={14} />
                          <span>Access on mobile and TV</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <IconWrapper icon={FaAward} className="text-gray-600" size={14} />
                          <span>Certificate of completion</span>
                        </div>
                      </div>
                    </div>

                    {/* Share */}
                    <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                      <button className="text-purple-600 hover:text-purple-700 font-semibold flex items-center justify-center gap-2 mx-auto">
                        <IconWrapper icon={FaShare} size={14} />
                        Share this course
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Content Tabs */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-8">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'curriculum', label: 'Curriculum' },
                { id: 'instructor', label: 'Instructor' },
                { id: 'reviews', label: 'Reviews' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* What You'll Learn */}
                  {selectedCourse.what_you_will_learn && selectedCourse.what_you_will_learn.length > 0 && (
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">What you'll learn</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedCourse.what_you_will_learn.map((item, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <IconWrapper icon={FaCheck} className="text-green-500 mt-1 flex-shrink-0" size={14} />
                            <span className="text-gray-700">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Course Description */}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Course Description</h3>
                    <div className="prose max-w-none text-gray-700">
                      <p>{selectedCourse.description}</p>
                    </div>
                  </div>

                  {/* Prerequisites */}
                  {selectedCourse.prerequisites && selectedCourse.prerequisites.length > 0 && (
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Prerequisites</h3>
                      <ul className="space-y-2">
                        {selectedCourse.prerequisites.map((item, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Target Audience */}
                  {selectedCourse.target_audience && selectedCourse.target_audience.length > 0 && (
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Who this course is for</h3>
                      <ul className="space-y-2">
                        {selectedCourse.target_audience.map((item, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'curriculum' && (
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Course Curriculum</h3>
                  <div className="space-y-4">
                    {courseSections.map((section, sectionIndex) => (
                      <div key={section.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        <button
                          onClick={() => toggleSection(section.id)}
                          className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-gray-900">
                              Section {section.section_order}: {section.title}
                            </span>
                            <span className="text-sm text-gray-600">
                              {section.course_lectures?.length || 0} lectures
                            </span>
                          </div>
                          <IconWrapper 
                            icon={FaChevronDown} 
                            className={`transform transition-transform ${
                              expandedSections.includes(section.id) ? 'rotate-180' : ''
                            }`} 
                            size={16}
                          />
                        </button>
                        
                        {expandedSections.includes(section.id) && section.course_lectures && (
                          <div className="px-6 py-4 space-y-3">
                            {section.course_lectures.map((lecture, lectureIndex) => (
                              <div key={lecture.id} className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                    {lecture.lecture_type === 'video' && <IconWrapper icon={FaPlay} size={12} />}
                                    {lecture.lecture_type === 'article' && <IconWrapper icon={FaFileAlt} size={12} />}
                                    {lecture.lecture_type === 'quiz' && <IconWrapper icon={FaCheck} size={12} />}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">{lecture.title}</p>
                                    {lecture.description && (
                                      <p className="text-sm text-gray-600">{lecture.description}</p>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                  {lecture.video_duration_seconds && (
                                    <span>{formatDuration(lecture.video_duration_seconds)}</span>
                                  )}
                                  {lecture.is_preview && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs font-semibold">
                                      Preview
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'instructor' && (
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">About the Instructor</h3>
                  <div className="flex items-start gap-6">
                    <div className="w-24 h-24 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                      {selectedCourse.instructor_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">{selectedCourse.instructor_name}</h4>
                      {selectedCourse.instructor_bio && (
                        <p className="text-gray-700 leading-relaxed">{selectedCourse.instructor_bio}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Student Reviews</h3>
                  <div className="text-center py-12 text-gray-500">
                    <IconWrapper icon={FaStar} className="text-4xl mx-auto mb-4 opacity-50" />
                    <p>No reviews yet. Be the first to review this course!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  };

  // Main render
  if (currentView === 'details') {
    return renderCourseDetails();
  }

  return (
    <>
      {renderCourseBrowse()}
      
      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </>
  );
};

export default Courses; 