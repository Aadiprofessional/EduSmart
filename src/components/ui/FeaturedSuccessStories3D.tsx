import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaQuoteLeft, FaStar, FaGraduationCap, FaMapMarkerAlt, FaArrowRight } from 'react-icons/fa';
import IconComponent from './IconComponent';
import { useModelPosition } from '../../utils/ModelPositionContext';
import { useFeaturedData, type CaseStudy } from '../../utils/featuredApiService';
import { useLanguage } from '../../utils/LanguageContext';

interface SuccessStory {
  id: string;
  name: string;
  achievement: string;
  story: string;
  image: string;
  rating: number;
  university?: string;
  course?: string;
}

// Sample success stories data - used as fallback when no case studies are available
const sampleStories: SuccessStory[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    achievement: 'Accepted to MIT',
    story: 'MatrixEdu\'s AI tutoring helped me master calculus and physics, leading to my acceptance at MIT for Computer Science.',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
    rating: 5,
    university: 'MIT',
    course: 'Computer Science'
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    achievement: 'Full Scholarship Winner',
    story: 'The scholarship guidance and essay optimization tools helped me secure a full scholarship to Stanford University.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    rating: 5,
    university: 'Stanford',
    course: 'Engineering'
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    achievement: 'Career Transformation',
    story: 'Transitioned from marketing to data science with MatrixEdu\'s comprehensive courses and mentorship program.',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    rating: 5,
    course: 'Data Science'
  }
];

// Animation variants for story cards
const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 50,
    rotateX: -10
  },
  visible: { 
    opacity: 1, 
    y: 0,
    rotateX: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

const FeaturedSuccessStories3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { registerComponent, unregisterComponent } = useModelPosition();
  const { t } = useLanguage();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);

  // Fetch data from API
  const { data, loading, error } = useFeaturedData();
  const [stories, setStories] = useState<SuccessStory[]>([]);

  // Navigation handler
  const handleViewAllStories = () => {
    navigate('/case-studies');
  };

  // Convert case studies to success stories format or use sample data
  useEffect(() => {
    if (data?.case_studies && data.case_studies.length > 0) {
      const convertedStories: SuccessStory[] = data.case_studies.map((caseStudy: CaseStudy) => ({
        id: caseStudy.id,
        name: caseStudy.student_name,
        achievement: caseStudy.achievement,
        story: caseStudy.description,
        image: caseStudy.student_image || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
        rating: caseStudy.rating || 5,
        university: caseStudy.university,
        course: caseStudy.course
      }));
      setStories(convertedStories);
    } else {
      // Use sample data when no case studies are available
      setStories(sampleStories);
    }
  }, [data]);

  // Register component for 3D models
  useEffect(() => {
    if (containerRef.current) {
      registerComponent('success-stories', containerRef.current, {
        pencil: {
          x: 500,    // Centered horizontally
          y: -300, // 200px above component center
          z: 2,
          scale: 1.8,
          rotation: { x: 0, y: 0, z: 2.8 },
          visible: true
        },
        eraser: {
          x: 600, // 400px to the left of component center
          y: 200, // 200px above component center
          z: 1,
          scale: 1.2,
          visible: true
        },
        sharpener: {
          x: -800,  // 400px to the right of component center
          y: 300, // 200px above component center
          z: 1,
          scale: 0.02,
          visible: true
        }
      });
    }

    return () => {
      unregisterComponent('success-stories');
    };
  }, [registerComponent, unregisterComponent]);

  if (loading) {
    return (
      <section ref={containerRef} className="py-20 bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-white mt-4">{t('home.featuredSuccessStories.loadingStories')}</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section ref={containerRef} className="py-20 bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center text-red-400">
            <p>{t('home.featuredSuccessStories.errorLoading')}: {error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={containerRef} className="py-20 bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-2000"></div>
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
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-4 sm:mb-6 bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500 bg-clip-text text-transparent">
              {t('home.featuredSuccessStories.title')}
            </h2>
          </div>
          <p className="text-sm sm:text-xl text-gray-300 max-w-3xl mx-auto">
            {t('home.featuredSuccessStories.subtitle')}
          </p>
        </motion.div>

        {/* Success Stories Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-12">
          {stories.map((story, index) => (
            <motion.div
              key={story.id}
              variants={itemVariants}
              whileHover={{ 
                y: -10,
                rotateY: 5,
                scale: 1.02
              }}
              className="group relative bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-500 h-full flex flex-col"
            >
              {/* Story Image */}
              <div className="relative overflow-hidden">
                <img
                  src={story.image}
                  alt={story.name}
                  className="w-full h-32 sm:h-36 lg:h-40 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                
                {/* Quote Icon */}
                <div className="absolute top-2 left-2 bg-white/20 backdrop-blur-sm rounded-full p-2">
                  <IconComponent icon={FaQuoteLeft} className="text-white text-xs sm:text-sm" />
                </div>
              </div>

              {/* Story Content */}
              <div className="p-3 sm:p-4 lg:p-6 flex flex-col flex-grow">
                <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors line-clamp-2">
                  {story.name}
                </h3>
                
                <div className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                  <p className="text-purple-200 font-semibold text-xs sm:text-sm lg:text-base">{story.achievement}</p>
                </div>

                <p className="text-gray-300 mb-3 sm:mb-4 line-clamp-3 text-xs sm:text-sm lg:text-base leading-relaxed flex-grow">
                  "{story.story.length > 60 ? story.story.substring(0, 60) + '...' : story.story}"
                </p>

                {/* Details */}
                <div className="space-y-1 mb-3 sm:mb-4">
                  {story.university && (
                    <div className="flex items-center text-xs text-gray-400">
                      <IconComponent icon={FaGraduationCap} className="mr-1 sm:mr-2 text-purple-400 flex-shrink-0" />
                      <span className="truncate">{story.university}</span>
                    </div>
                  )}
                  {story.course && (
                    <div className="text-xs text-gray-400 hidden sm:block">
                      {t('home.featuredSuccessStories.course')}: <span className="text-indigo-300">{story.course}</span>
                    </div>
                  )}
                </div>

                {/* Rating - Fixed at bottom */}
                <div className="flex items-center mt-auto">
                  {[...Array(story.rating)].map((_, i) => (
                    <IconComponent key={i} icon={FaStar} className="text-yellow-400 text-xs mr-1" />
                  ))}
                  <span className="text-gray-400 text-xs ml-1 sm:ml-2">({story.rating}/5)</span>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none rounded-2xl"></div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Stories Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true, amount: 0.1 }}
          className="text-center"
        >
          <motion.button
            className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full text-white font-semibold text-lg shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 flex items-center mx-auto"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 20px 40px rgba(147, 51, 234, 0.3)"
            }}
            whileTap={{ scale: 0.95 }}
            onClick={handleViewAllStories}
          >
            {t('home.featuredSuccessStories.viewAllStories')}
            <IconComponent icon={FaArrowRight} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default FeaturedSuccessStories3D; 