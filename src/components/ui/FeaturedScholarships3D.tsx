import React, { useRef, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaGraduationCap, FaGlobe, FaAward, FaDollarSign, FaUsers, FaCalendarAlt, FaRocket, FaExternalLinkAlt, FaSpinner } from 'react-icons/fa';
import IconComponent from './IconComponent';
import { useLanguage } from '../../utils/LanguageContext';
import { useModelPosition } from '../../utils/ModelPositionContext';
import { useFeaturedData, type Scholarship } from '../../utils/featuredApiService';

const FeaturedScholarships3D: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { registerComponent, unregisterComponent } = useModelPosition();
  const { data, loading, error } = useFeaturedData();

  // Navigation handlers
  const handleApplyNow = (scholarshipId?: string) => {
    // Navigate to scholarships page with specific scholarship or general application
    if (scholarshipId) {
      navigate(`/scholarships?apply=${scholarshipId}`);
    } else {
      navigate('/scholarships');
    }
  };

  // Register component for 3D models
  useEffect(() => {
    if (containerRef.current) {
      registerComponent('scholarships', containerRef.current, {
        pencil: {
          x: 500,    // Centered horizontally (pointing to scholarship cards)
          y: 300,  // 100px below component center
          z: 3,
          scale: 2.8,
          rotation: { x: -0.3, y: 0.6, z: 0.1 },
          visible: true
        },
        eraser: {
          x: -400, // 400px to the left of component center
          y: 0,    // Same vertical level as component center
          z: 2,
          scale: 1.5,
          visible: false
        },
        sharpener: {
          x: -600,  // 400px to the right of component center
          y: -500,    // Same vertical level as component center
          z: 2,
          scale: 0.025,
          visible: true
        }
      });
    }

    return () => {
      unregisterComponent('scholarships');
    };
  }, [registerComponent, unregisterComponent]);

  // Sample scholarships as fallback when API data is empty
  const sampleScholarships = [
    {
      id: 'sample-1',
      icon: FaGraduationCap,
      title: t('home.featuredScholarships.samples.meritBased.title'),
      description: t('home.featuredScholarships.samples.meritBased.description'),
      amount: 'Up to $50,000',
      recipients: '500+ Students',
      deadline: 'March 2024',
      color: 'from-blue-400 to-blue-600',
      bgGradient: 'from-blue-500/10 to-blue-600/5',
      accentColor: 'blue-400'
    },
    {
      id: 'sample-2',
      icon: FaGlobe,
      title: t('home.featuredScholarships.samples.international.title'),
      description: t('home.featuredScholarships.samples.international.description'),
      amount: 'Up to $30,000',
      recipients: '300+ Students',
      deadline: 'April 2024',
      color: 'from-green-400 to-green-600',
      bgGradient: 'from-green-500/10 to-green-600/5',
      accentColor: 'green-400'
    },
    {
      id: 'sample-3',
      icon: FaAward,
      title: t('home.featuredScholarships.samples.needBased.title'),
      description: t('home.featuredScholarships.samples.needBased.description'),
      amount: 'Up to $40,000',
      recipients: '400+ Students',
      deadline: 'May 2024',
      color: 'from-purple-400 to-purple-600',
      bgGradient: 'from-purple-500/10 to-purple-600/5',
      accentColor: 'purple-400'
    },
    {
      id: 'sample-4',
      icon: FaRocket,
      title: t('home.featuredScholarships.samples.innovation.title'),
      description: t('home.featuredScholarships.samples.innovation.description'),
      amount: 'Up to $60,000',
      recipients: '200+ Students',
      deadline: 'June 2024',
      color: 'from-orange-400 to-orange-600',
      bgGradient: 'from-orange-500/10 to-orange-600/5',
      accentColor: 'orange-400'
    }
  ];

  // Transform API scholarships to display format
  const transformApiScholarship = (scholarship: Scholarship, index: number) => {
    const colorSchemes = [
      {
        icon: FaGraduationCap,
        color: 'from-blue-400 to-blue-600',
        bgGradient: 'from-blue-500/10 to-blue-600/5',
        accentColor: 'blue-400'
      },
      {
        icon: FaGlobe,
        color: 'from-green-400 to-green-600',
        bgGradient: 'from-green-500/10 to-green-600/5',
        accentColor: 'green-400'
      },
      {
        icon: FaAward,
        color: 'from-purple-400 to-purple-600',
        bgGradient: 'from-purple-500/10 to-purple-600/5',
        accentColor: 'purple-400'
      },
      {
        icon: FaRocket,
        color: 'from-orange-400 to-orange-600',
        bgGradient: 'from-orange-500/10 to-orange-600/5',
        accentColor: 'orange-400'
      }
    ];

    const scheme = colorSchemes[index % colorSchemes.length];

    return {
      id: scholarship.id,
      ...scheme,
      title: scholarship.title,
      description: scholarship.description,
      amount: `$${scholarship.amount.toLocaleString()}`,
      recipients: scholarship.university,
      deadline: new Date(scholarship.deadline).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      })
    };
  };

  // Determine which scholarships to show
  const scholarshipsToShow = data?.scholarships && data.scholarships.length > 0 
    ? data.scholarships.slice(0, 4).map(transformApiScholarship)
    : sampleScholarships;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  return (
    <section ref={containerRef} className="py-20 bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Background Effects - Updated to match homepage */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full"
          style={{
            backgroundSize: '50px 50px',
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center space-y-4">
              <IconComponent icon={FaSpinner} className="text-4xl text-yellow-400 animate-spin" />
              <p className="text-yellow-300 text-lg">{t('home.featuredScholarships.loadingScholarships')}</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="text-red-400 text-xl mb-4">⚠️ {t('home.featuredScholarships.errorLoading')}</div>
              <p className="text-gray-400">{error}</p>
              <p className="text-gray-500 mt-2">{t('home.featuredScholarships.showingSampleText')}</p>
            </div>
          </div>
        )}

        {/* Section Header - Enhanced to match homepage style */}
        {!loading && (
          <>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="relative">
            <motion.h2 
              className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-4 sm:mb-6 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent"
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {t('home.featuredScholarships.title')}
            </motion.h2>
          </div>
          <motion.p 
            className="text-sm sm:text-xl text-gray-300 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {t('home.featuredScholarships.subtitle')}
          </motion.p>
        </motion.div>

        {/* Scholarship Cards - Enhanced design */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {scholarshipsToShow.map((scholarship, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ 
                scale: 1.05,
                rotateY: 5,
                z: 50
              }}
              className="group relative h-full flex flex-col"
              data-magnetic
            >
              {/* Glow Effect */}
              <div className={`absolute -inset-1 bg-gradient-to-r ${scholarship.color} rounded-2xl blur opacity-0 group-hover:opacity-20 transition-all duration-500`}></div>
              
              {/* Card Content */}
              <div className={`relative bg-gradient-to-br ${scholarship.bgGradient} backdrop-blur-lg border border-white/10 rounded-2xl p-3 sm:p-4 lg:p-6 h-full transition-all duration-500 group-hover:border-white/30 flex flex-col`}>
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-r ${scholarship.color} rounded-2xl mb-3 sm:mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent icon={scholarship.icon} className="text-sm sm:text-lg lg:text-2xl text-white" />
                </div>

                {/* Title */}
                <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-white mb-2 sm:mb-3 lg:mb-4 group-hover:text-yellow-300 transition-colors duration-300 line-clamp-2">
                  {scholarship.title}
                </h3>

                {/* Description */}
                <p className="text-gray-300 mb-3 sm:mb-4 lg:mb-6 leading-relaxed text-xs sm:text-sm lg:text-base line-clamp-3 flex-grow">
                  {scholarship.description}
                </p>

                {/* Stats */}
                <div className="space-y-1 sm:space-y-2 lg:space-y-3 mb-3 sm:mb-4 lg:mb-6">
                  <div className="flex items-center text-xs sm:text-sm lg:text-base text-gray-400">
                    <IconComponent icon={FaDollarSign} className={`mr-1 sm:mr-2 lg:mr-3 text-${scholarship.accentColor} flex-shrink-0`} />
                    <span className="font-semibold text-white truncate">{scholarship.amount}</span>
                  </div>
                  <div className="flex items-center text-xs sm:text-sm lg:text-base text-gray-400">
                    <IconComponent icon={FaUsers} className={`mr-1 sm:mr-2 lg:mr-3 text-${scholarship.accentColor} flex-shrink-0`} />
                    <span className="truncate">{scholarship.recipients}</span>
                  </div>
                  <div className="flex items-center text-xs sm:text-sm lg:text-base text-gray-400 hidden sm:flex">
                    <IconComponent icon={FaCalendarAlt} className={`mr-1 sm:mr-2 lg:mr-3 text-${scholarship.accentColor} flex-shrink-0`} />
                    <span className="truncate">{scholarship.deadline}</span>
                  </div>
                </div>

                {/* Apply Button - Fixed at bottom */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full bg-gradient-to-r ${scholarship.color} text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 lg:px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-xs sm:text-sm lg:text-base mt-auto`}
                  onClick={() => handleApplyNow(scholarship.id)}
                >
                  <span className="hidden sm:inline">{t('home.featuredScholarships.applyNow')}</span>
                  <span className="sm:hidden">{t('home.featuredScholarships.apply')}</span>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-center bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-lg border border-white/10 rounded-3xl p-12"
        >
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-6"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <IconComponent icon={FaRocket} className="text-3xl text-white" />
          </motion.div>
          
          <h3 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            {t('home.featuredScholarships.cta.title')}
          </h3>
          
          <p className="text-sm sm:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
            {t('home.featuredScholarships.cta.subtitle')}
          </p>
          
          <div className="flex flex-row gap-3 sm:gap-4 justify-center items-center">
            <Link to="/scholarships" className="flex-1 sm:flex-none">
              <motion.button
                className="w-full sm:w-auto px-4 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full text-black font-bold text-sm sm:text-lg shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300"
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 20px 40px rgba(245, 158, 11, 0.3)"
                }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="hidden sm:inline">{t('home.featuredScholarships.cta.browseAllScholarships')}</span>
                <span className="sm:hidden">{t('home.featuredScholarships.cta.browse')}</span>
              </motion.button>
            </Link>
            
            <Link to="/scholarship-guide" className="flex-1 sm:flex-none">
              <motion.button
                className="w-full sm:w-auto px-4 sm:px-8 py-3 sm:py-4 border-2 border-white/30 rounded-full text-white font-semibold text-sm sm:text-lg backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
                whileHover={{ 
                  scale: 1.05,
                  backgroundColor: "rgba(255, 255, 255, 0.1)"
                }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="hidden sm:inline">{t('home.featuredScholarships.cta.applicationGuide')}</span>
                <span className="sm:hidden">{t('home.featuredScholarships.cta.guide')}</span>
              </motion.button>
            </Link>
          </div>
        </motion.div>
          </>
        )}
      </div>
    </section>
  );
};

export default FeaturedScholarships3D; 