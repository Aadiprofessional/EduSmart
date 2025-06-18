import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaUsers, FaClock, FaPlay } from 'react-icons/fa';
import IconComponent from './IconComponent';
import { useModelPosition } from '../../utils/ModelPositionContext';
import { featuredApiService, type Course } from '../../utils/featuredApiService';

const FeaturedCourses3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { registerComponent, unregisterComponent } = useModelPosition();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);

  // State for API data
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation handlers
  const handleEnrollNow = (courseId: string) => {
    navigate(`/course/${courseId}`);
  };

  const handleViewAllCourses = () => {
    navigate('/ai-courses');
  };

  // Fetch data from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await featuredApiService.getFeaturedData();
        
        if (response.success && response.data) {
          setCourses(response.data.courses || []);
        } else {
          setError(response.error || 'Failed to load courses');
        }
      } catch (err) {
        setError('Failed to load courses');
        console.error('Error fetching courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Register component for 3D models
  useEffect(() => {
    if (containerRef.current) {
      registerComponent('featured-courses', containerRef.current, {
        pencil: {
          x: -500,    // Centered horizontally
          y: 200, // 120px above component center
          z: 2,
          scale: 2.0,
          rotation: { x: 0, y: 0, z: 4.1 },
          visible: true
        },
        eraser: {
          x: -700, // 350px to the left of component center
          y: -150, // 200px above component center
          z: 1,
          scale: 0.8,
          visible: true
        },
        sharpener: {
          x: 370,  // 350px to the right of component center
          y: -330, // 200px above component center
          z: 2,
          scale: 0.02,
          visible: true
        }
      });
    }

    return () => {
      unregisterComponent('featured-courses');
    };
  }, [registerComponent, unregisterComponent]);

  if (loading) {
    return (
      <section ref={containerRef} className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-white mt-4">Loading courses...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section ref={containerRef} className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center text-red-400">
            <p>Error loading courses: {error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={containerRef} className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
      </div>

      <motion.div 
        className="container mx-auto px-4 relative z-10"
        style={{ y }}
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.1 }}
          className="text-center mb-16"
        >
          <div className="relative">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-4 sm:mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Featured Courses
            </h2>
          </div>
          <p className="text-sm sm:text-xl text-gray-300 max-w-3xl mx-auto">
            Discover our most popular AI-powered courses designed to accelerate your learning journey
          </p>
        </motion.div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-8">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true, amount: 0.1 }}
              whileHover={{ 
                y: -10,
                rotateY: 5,
                scale: 1.02
              }}
              className="group relative bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-500"
            >
              {/* Course Image */}
              <div className="relative overflow-hidden">
                <img
                  src={course.thumbnail_image || 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400'}
                  alt={course.title}
                  className="w-full h-32 sm:h-40 lg:h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                
                {/* Featured Badge */}
                {course.featured && (
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    <span className="hidden sm:inline">Featured</span>
                    <span className="sm:hidden">★</span>
                  </div>
                )}

                {/* Play Button */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 sm:p-3 border border-white/30">
                    <IconComponent icon={FaPlay} className="text-white text-sm sm:text-lg lg:text-2xl" />
                  </div>
                </motion.div>
              </div>

              {/* Course Content */}
              <div className="p-3 sm:p-4 lg:p-6">
                <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                  {course.description}
                </p>

                {/* Course Stats */}
                <div className="flex items-center flex-wrap gap-1 sm:gap-2 lg:gap-4 mb-3 sm:mb-4 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <IconComponent icon={FaStar} className="text-yellow-400" />
                    <span>{course.rating || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconComponent icon={FaUsers} />
                    <span className="hidden sm:inline">Students</span>
                    <span className="sm:hidden">👥</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconComponent icon={FaClock} />
                    <span className="hidden sm:inline">{course.level}</span>
                    <span className="sm:hidden">{course.level.slice(0, 3)}</span>
                  </div>
                </div>

                {/* Instructor and Price */}
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-400 hidden sm:block">Instructor</p>
                    <p className="text-xs sm:text-sm text-white font-medium truncate">{course.instructor_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 hidden sm:block">Price</p>
                    <p className="text-sm sm:text-lg lg:text-xl font-bold text-green-400">${course.price}</p>
                  </div>
                </div>

                {/* Enroll Button */}
                <motion.button
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-2 sm:py-3 px-4 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 text-xs sm:text-sm lg:text-base"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleEnrollNow(course.id)}
                >
                  <span className="hidden sm:inline">Enroll Now</span>
                  <span className="sm:hidden">Enroll</span>
                </motion.button>
              </div>

              {/* Hover Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none rounded-2xl"></div>
            </motion.div>
          ))}
        </div>

        {/* View All Courses Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true, amount: 0.1 }}
          className="text-center mt-12"
        >
          <motion.button
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white font-semibold text-lg shadow-2xl hover:shadow-blue-500/25 transition-all duration-300"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)"
            }}
            whileTap={{ scale: 0.95 }}
            onClick={handleViewAllCourses}
          >
            View All Courses
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default FeaturedCourses3D; 