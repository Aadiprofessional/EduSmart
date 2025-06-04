import React, { useState } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { motion } from 'framer-motion';
import { useLanguage } from '../utils/LanguageContext';

const Courses: React.FC = () => {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('All Courses');
  const [searchTerm, setSearchTerm] = useState('');

  const courseCategories = [
    t('courses.allCourses'),
    t('courses.categories.computerScience'),
    t('courses.categories.business'),
    t('courses.categories.dataScience'),
    t('courses.categories.design'),
    t('courses.categories.engineering')
  ];

  const courseData = [
    {
      id: 1,
      title: 'Introduction to AI',
      category: t('courses.categories.computerScience'),
      instructor: 'Dr. Smith',
      rating: 4.8,
      students: 1245,
      price: 49.99,
      image: 'https://images.unsplash.com/photo-1593376893114-1a66d1013e14?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 2,
      title: 'Business Management',
      category: t('courses.categories.business'),
      instructor: 'Prof. Johnson',
      rating: 4.6,
      students: 980,
      price: 39.99,
      image: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 3,
      title: 'Data Visualization',
      category: t('courses.categories.dataScience'),
      instructor: 'Sarah Williams',
      rating: 4.9,
      students: 1560,
      price: 59.99,
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 4,
      title: 'UX/UI Design Principles',
      category: t('courses.categories.design'),
      instructor: 'Mike Robertson',
      rating: 4.7,
      students: 1100,
      price: 44.99,
      image: 'https://images.unsplash.com/photo-1517292987719-0369a794ec0f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 5,
      title: 'Mechanical Engineering Basics',
      category: t('courses.categories.engineering'),
      instructor: 'Dr. Chen',
      rating: 4.5,
      students: 875,
      price: 54.99,
      image: 'https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 6,
      title: 'Web Development Bootcamp',
      category: t('courses.categories.computerScience'),
      instructor: 'Jessica Lee',
      rating: 4.8,
      students: 2200,
      price: 79.99,
      image: 'https://images.unsplash.com/photo-1605379399642-870262d3d051?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'
    }
  ];

  const filteredCourses = courseData.filter((course) => {
    const matchesCategory = activeCategory === t('courses.allCourses') || course.category === activeCategory;
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.95
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <motion.div 
          className="bg-teal-900 text-white py-16 relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Background elements */}
          <motion.div 
            className="absolute top-0 right-0 w-96 h-96 bg-teal-700 rounded-full opacity-20" 
            animate={{
              x: [0, 20, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            style={{ filter: 'blur(70px)', top: '-20%', right: '5%' }}
          />
          <motion.div 
            className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500 rounded-full opacity-10" 
            animate={{
              x: [0, -30, 0],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            style={{ filter: 'blur(50px)', bottom: '-10%', left: '10%' }}
          />
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.h1 
              className="text-4xl font-bold mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {t('courses.title')}
            </motion.h1>
            <motion.p 
              className="text-xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {t('courses.subtitle')}
            </motion.p>
          </div>
        </motion.div>
        
        <section className="py-10">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <motion.div 
                  className="flex flex-wrap gap-2 mb-4 md:mb-0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  {courseCategories.map((category, index) => (
                    <motion.button
                      key={category}
                      className={`px-4 py-2 rounded-full ${
                        activeCategory === category
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                      onClick={() => setActiveCategory(category)}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      {category}
                    </motion.button>
                  ))}
                </motion.div>
                
                <motion.div 
                  className="relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <input
                    type="text"
                    placeholder={t('courses.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 w-64"
                  />
                </motion.div>
              </div>
            </div>
            
            {filteredCourses.length > 0 ? (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredCourses.map((course) => (
                  <motion.div
                    key={course.id}
                    className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                    variants={itemVariants}
                    whileHover={{ y: -5 }}
                  >
                    <div className="relative">
                      <img 
                        src={course.image} 
                        alt={course.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded-full text-sm font-bold text-orange-500">
                        ${course.price}
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{course.title}</h3>
                      <p className="text-gray-600 mb-4">{t('courses.instructor')}: {course.instructor}</p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <span className="text-yellow-500 mr-1">★</span>
                          <span className="text-gray-700">{course.rating}</span>
                        </div>
                        <span className="text-gray-600 text-sm">{course.students} {t('courses.students')}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <motion.button
                          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                        >
                          {t('courses.enrollNow')}
                        </motion.button>
                        <motion.button
                          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                        >
                          {t('courses.viewDetails')}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                className="text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-xl font-semibold text-gray-600 mb-2">{t('courses.noCoursesFound')}</h3>
                <p className="text-gray-500">{t('common.search')}</p>
              </motion.div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Courses; 