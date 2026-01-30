import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaStar, 
  FaUsers, 
  FaClock, 
  FaPlay, 
  FaGraduationCap,
  FaBookOpen,
  FaLaptopCode,
  FaBrain,
  FaCalculator,
  FaMicroscope,
  FaLanguage,
  FaPalette,
  FaMoneyBillWave,
  FaHistory
} from 'react-icons/fa';
import { FiArrowRight, FiLoader, FiAlertCircle } from 'react-icons/fi';
import IconComponent from './IconComponent';
import { useModelPosition } from '../../utils/ModelPositionContext';
import { featuredApiService, type Course } from '../../utils/featuredApiService';
import { useLanguage } from '../../utils/LanguageContext';

const FeaturedCourses3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { registerComponent, unregisterComponent } = useModelPosition();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);

  const { t } = useLanguage();

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
      <section ref={containerRef} className="py-20 bg-transparent relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
              className="w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-slate-400 text-lg">{t('home.featuredCourses.loadingCourses')}</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section ref={containerRef} className="py-20 bg-transparent relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <IconComponent icon={FiAlertCircle} className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-400 text-lg">{t('home.featuredCourses.errorLoading')}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={containerRef} className="py-20 bg-transparent relative overflow-hidden">
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
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-4 sm:mb-6 tracking-tight">
              {t('home.featuredCourses.title')}
            </h2>
          </div>
          <p className="text-sm sm:text-xl text-slate-400 max-w-3xl mx-auto font-light">
            {t('home.featuredCourses.subtitle')}
          </p>
        </motion.div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          <AnimatePresence>
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true, amount: 0.1 }}
                whileHover={{ 
                  y: -5,
                }}
                className="group relative bg-[#121212] rounded-xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-300 h-full flex flex-col shadow-lg"
              >
                {/* Course Image */}
                <div className="relative overflow-hidden">
                  <img
                    src={course.thumbnail_image || 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400'}
                    alt={course.title}
                    className="w-full h-32 sm:h-40 lg:h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
                  
                  {/* Featured Badge */}
                  {course.featured && (
                    <div className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider">
                      Featured
                    </div>
                  )}

                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/90 rounded-full p-3 shadow-lg">
                      <IconComponent icon={FaPlay} className="text-black text-sm" />
                    </div>
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm mb-4 line-clamp-2 flex-grow">
                    {course.description}
                  </p>

                  {/* Course Stats */}
                  <div className="flex items-center gap-4 mb-4 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5">
                      <IconComponent icon={FaStar} className="text-yellow-500" />
                      <span>{course.rating || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <IconComponent icon={FaUsers} />
                      <span className="hidden sm:inline">{t('home.featuredCourses.students')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <IconComponent icon={FaClock} />
                      <span className="hidden sm:inline">{course.level}</span>
                    </div>
                  </div>

                  {/* Instructor and Price */}
                  <div className="flex items-center justify-between mb-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs text-white">
                        {course.instructor_name.charAt(0)}
                      </div>
                      <p className="text-xs text-slate-400 truncate max-w-[100px]">{course.instructor_name}</p>
                    </div>
                    <p className="text-sm font-bold text-white">${course.price}</p>
                  </div>

                  {/* Enroll Button */}
                  <motion.button
                    className="w-full bg-white text-black font-semibold py-3 px-4 rounded-lg hover:bg-slate-200 transition-colors duration-300 text-sm mt-auto"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleEnrollNow(course.id)}
                  >
                    {t('home.featuredCourses.enrollNow')}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* View All Courses Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="text-center mt-12 sm:mt-16"
        >
          <motion.button
            onClick={handleViewAllCourses}
            className="group bg-transparent border border-white/20 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-all duration-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="flex items-center gap-2">
              <span>{t('home.featuredCourses.viewAllCourses')}</span>
              <IconComponent icon={FiArrowRight} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default FeaturedCourses3D; 
