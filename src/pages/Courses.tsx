import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../utils/LanguageContext';
import { useAuth } from '../utils/AuthContext';
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
  FaTimesCircle
} from 'react-icons/fa';
import IconWrapper from '../components/IconWrapper';
import PageHeader from '../components/ui/PageHeader';
import IconComponent from '../components/ui/IconComponent';

// Enhanced API service
const API_BASE = 'https://edusmart-server.vercel.app/api/v2';

interface Course {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  category: string;
  level: string;
  language: string;
  duration: string;
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
  const { user } = useAuth();
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
      const response = await fetch(`${API_BASE}/courses/${courseId}/enrollment/${user.id}`);
      const data = await response.json();
      
      if (data.success && data.data.enrolled) {
        setEnrolledCourses(prev => {
          if (!prev.includes(courseId)) {
            return [...prev, courseId];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Error checking course enrollment:', error);
    }
  };

  // API Functions
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (activeCategory) params.append('category', activeCategory);
      if (activeLevel) params.append('level', activeLevel);
      if (priceRange[0] > 0) params.append('price_min', priceRange[0].toString());
      if (priceRange[1] < 200) params.append('price_max', priceRange[1].toString());
      params.append('sort_by', sortBy);
      
      const response = await fetch(`${API_BASE}/courses?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setCourses(data.data.courses || []);
      } else {
        throw new Error(data.error || 'Failed to fetch courses');
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
      const response = await fetch(`${API_BASE}/course-categories`);
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchUserEnrollments = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`${API_BASE}/users/${user.id}/enrollments`);
      const data = await response.json();
      
      if (data.success) {
        const enrolledCourseIds = data.data.enrollments.map((e: any) => e.course_id);
        setEnrolledCourses(enrolledCourseIds);
      }
    } catch (error) {
      console.error('Error fetching user enrollments:', error);
    }
  };

  const fetchCourseDetails = async (courseId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/courses/${courseId}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedCourse(data.data.course);
        if (data.data.course.course_sections) {
          setCourseSections(data.data.course.course_sections);
        }
      } else {
        throw new Error(data.error || 'Course not found');
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

      const response = await fetch(`${API_BASE}/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enrollmentData),
      });

      const data = await response.json();
      console.log('Enrollment response:', data);
      
      if (data.success) {
        if (data.data.alreadyEnrolled) {
          alert('You are already enrolled in this course!');
        } else {
          alert('Successfully enrolled in course!');
        }
        
        // Update enrolled courses list
        setEnrolledCourses(prev => [...prev, courseId]);
        
        // Refresh user enrollments to ensure persistence
        await fetchUserEnrollments();
        
        // Wait longer for the enrollment to be fully processed in the database
        console.log('Waiting for enrollment to be processed...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verify enrollment before navigating
        console.log('Verifying enrollment...');
        const enrollmentCheckUrl = `${API_BASE}/courses/${courseId}/enrollment/${user.id}`;
        const enrollmentResponse = await fetch(enrollmentCheckUrl);
        const enrollmentCheckData = await enrollmentResponse.json();
        
        console.log('Enrollment verification:', enrollmentCheckData);
        
        if (enrollmentCheckData.success && enrollmentCheckData.data.enrolled) {
          console.log('✅ Enrollment verified, navigating to course...');
          // Navigate to course player
          navigateToCoursePlayer(courseId);
        } else {
          console.log('❌ Enrollment verification failed');
          alert('Enrollment successful, but there was an issue accessing the course. Please try again in a moment.');
        }
      } else {
        throw new Error(data.error || 'Enrollment failed');
      }
    } catch (error: any) {
      console.error('Error enrolling in course:', error);
      alert(error.message || 'Failed to enroll in course');
    }
  };

  const navigateToCoursePlayer = async (courseId: string, retryCount = 0): Promise<void> => {
    try {
      console.log('=== NAVIGATION DEBUG ===');
      console.log('Navigating to course:', courseId);
      console.log('User ID:', user?.id);
      console.log('Retry count:', retryCount);
      
      // Get course sections to find the first lecture
      const sectionsUrl = `${API_BASE}/courses/${courseId}/sections?uid=${user?.id}`;
      console.log('Fetching sections from:', sectionsUrl);
      
      const response = await fetch(sectionsUrl);
      const data = await response.json();
      
      console.log('Sections response:', data);
      
      if (!response.ok) {
        console.error('Sections request failed:', response.status, data);
        
        // If 403 and this is the first attempt, try to verify enrollment and retry
        if (response.status === 403 && retryCount < 2) {
          console.log('403 error, checking enrollment status...');
          
          const enrollmentCheckUrl = `${API_BASE}/courses/${courseId}/enrollment/${user?.id}`;
          const enrollmentResponse = await fetch(enrollmentCheckUrl);
          const enrollmentData = await enrollmentResponse.json();
          
          console.log('Enrollment check:', enrollmentData);
          
          if (enrollmentData.success && enrollmentData.data?.enrolled) {
            console.log('User is enrolled, retrying in 1 second...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            return navigateToCoursePlayer(courseId, retryCount + 1);
          } else {
            alert('You need to be enrolled to access this course. Please try enrolling again.');
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
      
      alert(`Failed to access course: ${error.message}`);
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
        height="lg"
      >
        {/* Enhanced Search Bar */}
        <div className="max-w-2xl mx-auto">
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

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
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

        {/* Course Grid */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map((course) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => {
                  setSelectedCourse(course);
                  setCurrentView('details');
                }}
              >
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
                      <IconWrapper icon={FaHeart} size={14} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-blue-600 font-semibold capitalize">{course.category}</span>
                    <span className="text-sm text-gray-500 capitalize">{course.level}</span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
                  
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <IconWrapper icon={FaClock} size={12} />
                      {course.duration}
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

                  <div className="flex gap-2">
                    {isEnrolled(course.id) ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToCoursePlayer(course.id);
                        }}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
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
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Enroll Now
                      </button>
                    )}
                    
                    {!isEnrolled(course.id) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCart(course.id);
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <IconWrapper icon={FaShoppingCart} size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      <Footer />
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
                    <span>{selectedCourse.duration}</span>
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
                          <span>{selectedCourse.duration} on-demand video</span>
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

  return renderCourseBrowse();
};

export default Courses; 