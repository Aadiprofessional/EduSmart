import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaBook, FaDownload, FaEye, FaFileAlt, FaVideo, FaGraduationCap } from 'react-icons/fa';
import IconComponent from './IconComponent';
import { useModelPosition } from '../../utils/ModelPositionContext';
import { useLanguage } from '../../utils/LanguageContext';
import { featuredApiService, type Resource } from '../../utils/featuredApiService';

const FeaturedResources3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { registerComponent, unregisterComponent } = useModelPosition();
  const { t } = useLanguage();
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
      case 'template': return 'from-yellow-500 to-indigo-600';
      case 'video': return 'from-red-500 to-pink-600';
      case 'ebook': return 'from-purple-500 to-indigo-600';
      default: return 'from-blue-500 to-purple-600';
    }
  };

  if (loading) {
    return (
      <section ref={containerRef} className="py-20 bg-transparent relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
            <p className="text-white mt-4">{t('home.featuredResources.loadingResources')}</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section ref={containerRef} className="py-20 bg-transparent relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center text-red-400">
            <p>{t('home.featuredResources.errorLoading')}: {error}</p>
            <p className="text-gray-500 mt-2">{t('home.featuredResources.showingSampleText')}</p>
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
              {t('home.featuredResources.title')}
            </h2>
          </div>
          <p className="text-sm sm:text-xl text-slate-400 max-w-3xl mx-auto font-light">
            {t('home.featuredResources.subtitle')}
          </p>
        </motion.div>

        {/* Resources Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {resources.map((resource, index) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true, amount: 0.1 }}
              whileHover={{ 
                y: -5,
              }}
              className="group relative bg-[#121212] rounded-xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-300 h-full flex flex-col shadow-lg"
            >
              {/* Resource Image */}
              <div className="relative overflow-hidden">
                <img
                  src={resource.thumbnail || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400'}
                  alt={resource.title}
                  className="w-full h-24 sm:h-32 lg:h-40 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
                
                {/* Type Badge */}
                <div className={`absolute top-2 left-2 bg-black/50 backdrop-blur-md text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1 border border-white/10`}>
                  <IconComponent icon={getTypeIcon(resource.type)} className="text-xs" />
                  <span className="hidden lg:inline">{t(`home.featuredResources.types.${resource.type}`)}</span>
                </div>

                {/* Featured Badge */}
                {resource.featured && (
                  <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider">
                    {t('home.featuredResources.featured')}
                  </div>
                )}
              </div>

              {/* Resource Content */}
              <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-sm sm:text-base font-semibold text-white mb-2 line-clamp-2">
                  {resource.title}
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm mb-4 line-clamp-2 hidden sm:block flex-grow">
                  {resource.description}
                </p>

                {/* Resource Stats */}
                <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                  <div className="flex items-center gap-1.5">
                    <IconComponent icon={getTypeIcon(resource.type)} />
                    <span className="hidden lg:inline">{t(`home.featuredResources.types.${resource.type}`)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <IconComponent icon={FaDownload} />
                    <span>{t('home.featuredResources.free')}</span>
                  </div>
                </div>

                {/* Download Button */}
                <motion.button
                  className="w-full bg-white text-black font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors duration-300 text-xs sm:text-sm mt-auto"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDownload(resource.id)}
                >
                  <div className="flex items-center justify-center gap-2">
                    <IconComponent icon={FaDownload} className="text-xs" />
                    <span>{t('home.featuredResources.download')}</span>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Resources Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true, amount: 0.1 }}
          className="text-center mt-12 sm:mt-16"
        >
          <motion.button
            className="group bg-transparent border border-white/20 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-all duration-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleViewAllResources}
          >
            {t('home.featuredResources.viewAllResources')}
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default FeaturedResources3D; 