import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaBook, FaDownload, FaEye, FaFileAlt, FaVideo, FaGraduationCap } from 'react-icons/fa';
import IconComponent from './IconComponent';
import { useModelPosition } from '../../utils/ModelPositionContext';
import { featuredApiService, type Resource } from '../../utils/featuredApiService';

const FeaturedResources3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { registerComponent, unregisterComponent } = useModelPosition();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);

  // State for API data
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation handlers
  const handleDownload = (resourceId: string) => {
    // For now, navigate to resources page with the specific resource
    navigate(`/resources?resource=${resourceId}`);
  };

  const handleViewAllResources = () => {
    navigate('/resources');
  };

  // Fetch data from API
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        const response = await featuredApiService.getFeaturedData();
        
        if (response.success && response.data) {
          setResources(response.data.resources || []);
        } else {
          setError(response.error || 'Failed to load resources');
        }
      } catch (err) {
        setError('Failed to load resources');
        console.error('Error fetching resources:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  // Register component for 3D models
  useEffect(() => {
    if (containerRef.current) {
      registerComponent('featured-resources', containerRef.current, {
        pencil: {
          x: 400,    // Centered horizontally
          y: -200, // 200px above component center
          z: 2,
          scale: 1.6,
          rotation: { x: 0, y: 0, z: 1.3 },
          visible: true
        },
        eraser: {
          x: -900, // 400px to the left of component center
          y: -50, // 200px above component center
          z: 1,
          scale: 1,
          visible: true
        },
        sharpener: {
          x: 100,  // 400px to the right of component center
          y: 200, // 200px above component center
          z: 1,
          scale: 1,
          visible: false
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

  if (loading) {
    return (
      <section ref={containerRef} className="py-20 bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
            <p className="text-white mt-4">Loading resources...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section ref={containerRef} className="py-20 bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center text-red-400">
            <p>Error loading resources: {error}</p>
          </div>
        </div>
      </section>
    );
  }

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
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-4 sm:mb-6 bg-gradient-to-r from-green-400 via-yellow-500 to-red-500 bg-clip-text text-transparent">
              Featured Resources
            </h2>
          </div>
          <p className="text-sm sm:text-xl text-gray-300 max-w-3xl mx-auto">
            Access our comprehensive collection of guides, templates, and educational materials
          </p>
        </motion.div>

        {/* Resources Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {resources.map((resource, index) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true, amount: 0.1 }}
              whileHover={{ 
                y: -10,
                scale: 1.02
              }}
              className="group relative bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-500"
            >
              {/* Resource Image */}
              <div className="relative overflow-hidden">
                <img
                  src={resource.thumbnail || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400'}
                  alt={resource.title}
                  className="w-full h-24 sm:h-32 lg:h-40 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                
                {/* Type Badge */}
                <div className={`absolute top-1 sm:top-2 left-1 sm:left-2 bg-gradient-to-r ${getTypeColor(resource.type)} text-white px-1 sm:px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
                  <IconComponent icon={getTypeIcon(resource.type)} className="text-xs" />
                  <span className="hidden lg:inline">{resource.type.toUpperCase()}</span>
                </div>

                {/* Featured Badge */}
                {resource.featured && (
                  <div className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-1 sm:px-2 py-1 rounded-full text-xs font-semibold">
                    <span className="hidden sm:inline">Featured</span>
                    <span className="sm:hidden">★</span>
                  </div>
                )}
              </div>

              {/* Resource Content */}
              <div className="p-2 sm:p-3 lg:p-4">
                <h3 className="text-xs sm:text-sm lg:text-base font-bold text-white mb-1 sm:mb-2 group-hover:text-blue-300 transition-colors line-clamp-2">
                  {resource.title}
                </h3>
                <p className="text-gray-300 text-xs mb-2 sm:mb-3 line-clamp-2 hidden sm:block">
                  {resource.description}
                </p>

                {/* Resource Stats */}
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2 sm:mb-3">
                  <div className="flex items-center gap-1">
                    <IconComponent icon={getTypeIcon(resource.type)} />
                    <span className="hidden lg:inline">{resource.type}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconComponent icon={FaDownload} />
                    <span>Free</span>
                  </div>
                </div>

                {/* Download Button */}
                <motion.button
                  className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white font-medium py-1 sm:py-2 px-2 sm:px-3 rounded-lg hover:from-green-600 hover:to-teal-700 transition-all duration-300 text-xs"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDownload(resource.id)}
                >
                  <div className="flex items-center justify-center gap-1">
                    <IconComponent icon={FaDownload} className="text-xs" />
                    <span className="hidden sm:inline">Download</span>
                    <span className="sm:hidden">Get</span>
                  </div>
                </motion.button>
              </div>

              {/* Hover Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none rounded-2xl"></div>
            </motion.div>
          ))}
        </div>

        {/* View All Resources Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true, amount: 0.1 }}
          className="text-center mt-12"
        >
          <motion.button
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-yellow-600 rounded-full text-white font-semibold text-lg shadow-2xl hover:shadow-green-500/25 transition-all duration-300"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 20px 40px rgba(34, 197, 94, 0.3)"
            }}
            whileTap={{ scale: 0.95 }}
            onClick={handleViewAllResources}
          >
            View All Resources
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default FeaturedResources3D; 