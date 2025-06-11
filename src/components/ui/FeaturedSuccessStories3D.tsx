import React, { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FaQuoteLeft, FaStar, FaGraduationCap, FaArrowRight } from 'react-icons/fa';
import IconComponent from './IconComponent';
import { useModelPosition } from '../../utils/ModelPositionContext';

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

// Sample success stories data
const sampleStories: SuccessStory[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    achievement: 'Accepted to MIT',
    story: 'EduSmart\'s AI tutoring helped me master calculus and physics, leading to my acceptance at MIT for Computer Science.',
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
    story: 'Transitioned from marketing to data science with EduSmart\'s comprehensive courses and mentorship program.',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    rating: 5,
    course: 'Data Science'
  }
];

const FeaturedSuccessStories3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { registerComponent, unregisterComponent } = useModelPosition();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  // Register component for 3D models
  useEffect(() => {
    if (containerRef.current) {
      registerComponent('success-stories', containerRef.current, {
        pencil: {
          x: 300,  // 300px to the right of component center (near title)
          y: -200, // 200px above component center
          z: 3,
          scale: 1.0,
          rotation: { x: 0.2, y: -0.9, z: 1.6 },
          visible: true
        },
        eraser: {
          x: -750, // 350px to the left of component center (near "View All" button area)
          y: 450,  // 250px below component center
          z: 2,
          scale: 1,
          visible: true
        },
        sharpener: {
          x: 250,  // 350px to the right of component center (near "View All" button area)
          y: 250,  // 250px below component center
          z: 2,
          scale: 0.02,
          visible: true
        }
      });
    }

    return () => {
      unregisterComponent('success-stories');
    };
  }, [registerComponent, unregisterComponent]);

  return (
    <section ref={containerRef} className="py-20 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 right-20 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-2000"></div>
      </div>

      <motion.div 
        className="container mx-auto px-4 relative z-10"
        style={{ y, opacity }}
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="relative">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 bg-gradient-to-r from-purple-400 via-indigo-500 to-blue-500 bg-clip-text text-transparent">
              Success Stories
            </h2>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover how our students achieved their dreams with personalized AI-powered education
          </p>
        </motion.div>

        {/* Success Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {sampleStories.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              whileHover={{ 
                y: -10,
                scale: 1.02
              }}
              className="group relative bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-500"
            >
              {/* Quote Icon */}
              <div className="absolute top-4 left-4 text-purple-400 opacity-20">
                <IconComponent icon={FaQuoteLeft} className="text-3xl" />
              </div>

              {/* Student Image */}
              <div className="flex items-center mb-4">
                <img
                  src={story.image}
                  alt={story.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-purple-400/50 mr-4"
                />
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                    {story.name}
                  </h3>
                  <p className="text-purple-300 font-medium">
                    {story.achievement}
                  </p>
                </div>
              </div>

              {/* Story */}
              <p className="text-gray-300 mb-4 line-clamp-3">
                "{story.story}"
              </p>

              {/* Details */}
              <div className="space-y-2 mb-4">
                {story.university && (
                  <div className="flex items-center text-sm text-gray-400">
                    <IconComponent icon={FaGraduationCap} className="mr-2 text-purple-400" />
                    <span>{story.university}</span>
                  </div>
                )}
                {story.course && (
                  <div className="text-sm text-gray-400">
                    Course: <span className="text-indigo-300">{story.course}</span>
                  </div>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center">
                {[...Array(story.rating)].map((_, i) => (
                  <IconComponent key={i} icon={FaStar} className="text-yellow-400 text-sm mr-1" />
                ))}
                <span className="text-gray-400 text-sm ml-2">({story.rating}/5)</span>
              </div>

              {/* Hover Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none rounded-2xl"></div>
            </motion.div>
          ))}
        </div>

        {/* View All Stories Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <motion.button
            className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full text-white font-semibold text-lg shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 flex items-center mx-auto"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 20px 40px rgba(147, 51, 234, 0.3)"
            }}
            whileTap={{ scale: 0.95 }}
          >
            View All Stories
            <IconComponent icon={FaArrowRight} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default FeaturedSuccessStories3D; 