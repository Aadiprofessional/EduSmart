import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FaBook, FaDownload, FaEye, FaFileAlt, FaVideo, FaGraduationCap } from 'react-icons/fa';
import IconComponent from './IconComponent';
import { useModelPosition } from '../../utils/ModelPositionContext';

interface Resource {
  id: string;
  title: string;
  type: 'guide' | 'template' | 'video' | 'ebook';
  description: string;
  downloads: number;
  views: number;
  thumbnail: string;
  featured: boolean;
}

// Sample resources data
const sampleResources: Resource[] = [
  {
    id: '1',
    title: 'University Application Guide 2024',
    type: 'guide',
    description: 'Complete step-by-step guide for university applications including essays, recommendations, and deadlines.',
    downloads: 2450,
    views: 5200,
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400',
    featured: true
  },
  {
    id: '2',
    title: 'Study Schedule Template',
    type: 'template',
    description: 'Customizable study schedule template to help you organize your academic workload effectively.',
    downloads: 1890,
    views: 3400,
    thumbnail: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400',
    featured: true
  },
  {
    id: '3',
    title: 'Career Planning Workshop',
    type: 'video',
    description: 'Interactive video workshop on career planning and professional development strategies.',
    downloads: 0,
    views: 2100,
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    featured: true
  },
  {
    id: '4',
    title: 'Scholarship Application E-book',
    type: 'ebook',
    description: 'Comprehensive e-book covering scholarship opportunities and application strategies.',
    downloads: 1650,
    views: 4200,
    thumbnail: 'https://images.unsplash.com/photo-1532649538693-f3a2ec1bf8bd?w=400',
    featured: true
  }
];

const FeaturedResources3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { registerComponent, unregisterComponent } = useModelPosition();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  // Register component for 3D models
  useEffect(() => {
    if (containerRef.current) {
      registerComponent('featured-resources', containerRef.current, {
        pencil: {
          x: 0,    // Centered horizontally
          y: -200, // 200px above component center
          z: 2,
          scale: 1.6,
          visible: true
        },
        eraser: {
          x: -400, // 400px to the left of component center
          y: -200, // 200px above component center
          z: 1,
          scale: 1.4,
          visible: true
        },
        sharpener: {
          x: 400,  // 400px to the right of component center
          y: -200, // 200px above component center
          z: 1,
          scale: 1.4,
          visible: true
        }
      });
    }

    return () => {
      unregisterComponent('featured-resources');
    };
  }, [registerComponent, unregisterComponent]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'guide': return FaBook;
      case 'template': return FaFileAlt;
      case 'video': return FaVideo;
      case 'ebook': return FaGraduationCap;
      default: return FaBook;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'guide': return 'from-green-500 to-emerald-600';
      case 'template': return 'from-yellow-500 to-orange-600';
      case 'video': return 'from-red-500 to-pink-600';
      case 'ebook': return 'from-purple-500 to-indigo-600';
      default: return 'from-blue-500 to-purple-600';
    }
  };

  return (
    <section ref={containerRef} className="py-20 bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-20 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute top-60 right-20 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-10 left-1/3 w-96 h-96 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-2000"></div>
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
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 bg-gradient-to-r from-green-400 via-yellow-500 to-red-500 bg-clip-text text-transparent">
              Featured Resources
            </h2>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Access our comprehensive collection of guides, templates, and educational materials
          </p>
        </motion.div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sampleResources.map((resource, index) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ 
                y: -10,
                scale: 1.02
              }}
              className="group relative bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-500"
            >
              {/* Resource Image */}
              <div className="relative overflow-hidden">
                <img
                  src={resource.thumbnail}
                  alt={resource.title}
                  className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                
                {/* Type Badge */}
                <div className={`absolute top-3 left-3 bg-gradient-to-r ${getTypeColor(resource.type)} text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
                  <IconComponent icon={getTypeIcon(resource.type)} className="text-xs" />
                  {resource.type.toUpperCase()}
                </div>

                {/* Featured Badge */}
                {resource.featured && (
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    Featured
                  </div>
                )}
              </div>

              {/* Resource Content */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-green-300 transition-colors line-clamp-2">
                  {resource.title}
                </h3>
                <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                  {resource.description}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-3 text-xs text-gray-400">
                  {resource.downloads > 0 && (
                    <div className="flex items-center gap-1">
                      <IconComponent icon={FaDownload} />
                      <span>{resource.downloads.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <IconComponent icon={FaEye} />
                    <span>{resource.views.toLocaleString()}</span>
                  </div>
                </div>

                {/* Action Button */}
                <motion.button
                  className={`w-full py-2 bg-gradient-to-r ${getTypeColor(resource.type)} rounded-lg text-white font-semibold text-sm hover:shadow-lg transition-all duration-300`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {resource.type === 'video' ? 'Watch Now' : 'Download'}
                </motion.button>
              </div>

              {/* Hover Glow Effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${getTypeColor(resource.type).replace('to-', 'to-').replace('from-', 'from-').replace('500', '500/10').replace('600', '600/10')} opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none rounded-2xl`}></div>
            </motion.div>
          ))}
        </div>

        {/* View All Resources Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <motion.button
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-yellow-600 rounded-full text-white font-semibold text-lg shadow-2xl hover:shadow-green-500/25 transition-all duration-300"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 20px 40px rgba(34, 197, 94, 0.3)"
            }}
            whileTap={{ scale: 0.95 }}
          >
            View All Resources
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default FeaturedResources3D; 