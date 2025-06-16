import React, { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FaStar, FaUsers, FaClock, FaPlay } from 'react-icons/fa';
import IconComponent from './IconComponent';
import { useModelPosition } from '../../utils/ModelPositionContext';

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  rating: number;
  students: number;
  duration: string;
  image: string;
  price: number;
  featured: boolean;
}

// Sample course data
const sampleCourses: Course[] = [
  {
    id: '1',
    title: 'AI & Machine Learning Fundamentals',
    description: 'Master the basics of artificial intelligence and machine learning with hands-on projects.',
    instructor: 'Dr. Sarah Johnson',
    rating: 4.9,
    students: 12500,
    duration: '8 weeks',
    image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400',
    price: 99,
    featured: true
  },
  {
    id: '2',
    title: 'Data Science & Analytics',
    description: 'Learn to analyze and visualize data to make informed business decisions.',
    instructor: 'Prof. Michael Chen',
    rating: 4.8,
    students: 9800,
    duration: '10 weeks',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
    price: 129,
    featured: true
  },
  {
    id: '3',
    title: 'Web Development Bootcamp',
    description: 'Full-stack web development from frontend to backend with modern technologies.',
    instructor: 'Alex Rodriguez',
    rating: 4.7,
    students: 15200,
    duration: '12 weeks',
    image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400',
    price: 149,
    featured: true
  }
];

const FeaturedCourses3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { registerComponent, unregisterComponent } = useModelPosition();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);

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
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Featured Courses
            </h2>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover our most popular AI-powered courses designed to accelerate your learning journey
          </p>
        </motion.div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sampleCourses.map((course, index) => (
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
                  src={course.image}
                  alt={course.title}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                
                {/* Featured Badge */}
                {course.featured && (
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Featured
                  </div>
                )}

                {/* Play Button */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 border border-white/30">
                    <IconComponent icon={FaPlay} className="text-white text-2xl" />
                  </div>
                </motion.div>
              </div>

              {/* Course Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                  {course.title}
                </h3>
                <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                  {course.description}
                </p>

                {/* Course Stats */}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <IconComponent icon={FaStar} className="text-yellow-400" />
                    <span>{course.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconComponent icon={FaUsers} />
                    <span>{course.students.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconComponent icon={FaClock} />
                    <span>{course.duration}</span>
                  </div>
                </div>

                {/* Instructor */}
                <p className="text-gray-300 text-sm mb-4">
                  by <span className="text-blue-300 font-medium">{course.instructor}</span>
                </p>

                {/* Price and CTA */}
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-white">
                    ${course.price}
                  </div>
                  <motion.button
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Enroll Now
                  </motion.button>
                </div>
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
          >
            View All Courses
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default FeaturedCourses3D; 