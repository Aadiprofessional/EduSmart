import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaSortAmountDown, FaExternalLinkAlt, FaUniversity, FaGlobe, FaGraduationCap, FaCalendarAlt, FaDollarSign, FaTrophy, FaChevronDown, FaChevronUp, FaBookmark, FaRobot, FaLightbulb, FaUser, FaBuilding, FaMapMarkerAlt } from 'react-icons/fa';
import { HiOutlineAcademicCap, HiOutlineLocationMarker } from 'react-icons/hi';
import { RiArrowDropDownLine, RiArrowDropUpLine } from 'react-icons/ri';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import IconComponent from '../components/ui/IconComponent';
import { motion } from 'framer-motion';
import { fadeIn, staggerContainer, slideIn } from '../utils/animations';
import { supabase } from '../utils/supabase';
import { useAuth } from '../utils/AuthContext';
import { universityAPI } from '../utils/apiService';
import { useLanguage } from '../utils/LanguageContext';

interface University {
  id: string;
  name: string;
  description: string;
  country: string;
  city: string;
  state: string;
  address: string;
  website: string;
  contact_email: string;
  contact_phone: string;
  established_year: number;
  type: string;
  ranking: number;
  tuition_fee: number;
  application_fee: number;
  acceptance_rate: number;
  student_population: number;
  faculty_count: number;
  programs_offered: string[];
  facilities: string[];
  image: string;
  logo: string;
  gallery: string[];
  campus_size: string;
  campus_type: string;
  accreditation: string;
  notable_alumni: string[];
  slug: string;
  keywords: string[];
  status: string;
  featured: boolean;
  verified: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Additional properties used in the component
  qsRanking: number;
  majorStrengths: string[];
  applicationDeadlines: {
    fall: string;
    spring: string;
  };
  admissionRequirements: {
    minGPA: number;
    testScores: Array<{
      name: string;
      score: string;
    }>;
    languageRequirements: Array<{
      test: string;
      score: string;
    }>;
  };
  tuitionFees: {
    undergraduate: string;
    graduate: string;
  };
  applicationLink: string;
  rankingType: string;
  region: string;
  rankingYear: number;
  acceptanceRate: string;
  studentPopulation: string;
  researchOutput: string;
  employmentRate: string;
  campusType: string;
}

// Helper functions
const formatTuitionFee = (fee: number | null): string => {
  if (!fee) return 'Contact for details';
  if (fee === 0) return 'Free';
  return `$${fee.toLocaleString()}/year`;
};

const formatAcceptanceRate = (rate: number | null): string => {
  if (!rate) return 'N/A';
  return `${rate}%`;
};

const formatStudentPopulation = (population: number | null): string => {
  if (!population) return 'N/A';
  return population.toLocaleString();
};

const getDefaultLogo = () => '/api/placeholder/100/100';

// CSS for grid background pattern
const gridPatternStyle = {
  backgroundSize: '20px 20px',
  backgroundImage: `
    linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
  `,
  backgroundPosition: 'center center'
};

// University Card Component
interface UniversityCardProps {
  university: University;
  onSelect: () => void;
  inCompareList: boolean;
  onToggleCompare: () => void;
}

const UniversityCard: React.FC<UniversityCardProps> = ({ university, onSelect, inCompareList, onToggleCompare }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300"
      variants={fadeIn("up", 0)}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className={`relative ${isMobile ? 'h-24' : 'h-36'} bg-gradient-to-r from-gray-100 to-gray-200 flex justify-center items-center`}>
        <img 
          src={university.logo || getDefaultLogo()} 
          alt={`${university.name} logo`}
          className={`${isMobile ? 'h-16 w-16' : 'h-24 w-24'} object-contain`}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = getDefaultLogo();
          }}
        />
        <div className="absolute top-2 right-2 flex gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare();
            }}
            className={`p-1.5 rounded-full ${inCompareList ? 'bg-secondary text-white' : 'bg-white text-gray-600'}`}
          >
            <IconComponent icon={FaBookmark} className={`${isMobile ? 'text-xs' : 'text-sm'}`} />
          </motion.button>
        </div>
        {university.ranking && (
          <div className="absolute top-2 left-2">
            <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-medium">
              #{university.ranking}
            </span>
          </div>
        )}
      </div>
      
      <div className={`${isMobile ? 'p-3' : 'p-4'}`}>
        <div className="flex justify-between items-start mb-2">
          <h3 className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold text-gray-800 line-clamp-2`}>
            {isMobile ? university.name.split(' ').slice(0, 3).join(' ') + (university.name.split(' ').length > 3 ? '...' : '') : university.name}
          </h3>
        </div>
        
        <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 flex items-center mb-2`}>
          <IconComponent icon={HiOutlineLocationMarker} className="mr-1" /> {university.city}, {university.country}
        </div>
        
        {!isMobile && (
        <div className="flex flex-wrap gap-1 mb-3">
          {university.programs_offered && university.programs_offered.slice(0, 3).map((program, index) => (
            <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
              {program}
            </span>
          ))}
          {university.programs_offered && university.programs_offered.length > 3 && (
            <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
              +{university.programs_offered.length - 3}
            </span>
          )}
        </div>
        )}
        
        <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 mb-4`}>
          <div className="flex justify-between mb-1">
            <span>Tuition:</span>
            <span className="font-medium text-gray-700">
              {isMobile ? formatTuitionFee(university.tuition_fee).split('/')[0] : formatTuitionFee(university.tuition_fee)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Type:</span>
            <span className="font-medium text-gray-700">{university.type || 'N/A'}</span>
          </div>
          {!isMobile && (
            <div className="flex justify-between mt-1">
              <span>Acceptance:</span>
              <span className="font-medium text-gray-700">{formatAcceptanceRate(university.acceptance_rate)}</span>
            </div>
          )}
        </div>
        
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onSelect}
          className={`w-full bg-primary hover:bg-primary-dark text-white ${isMobile ? 'py-1.5 text-xs' : 'py-2 text-sm'} rounded-lg transition-colors font-medium flex items-center justify-center`}
        >
          View Details
        </motion.button>
      </div>
    </motion.div>
  );
};

// University List Item Component
interface UniversityListItemProps {
  university: University;
  onSelect: () => void;
  inCompareList: boolean;
  onToggleCompare: () => void;
}

const UniversityListItem: React.FC<UniversityListItemProps> = ({ university, onSelect, inCompareList, onToggleCompare }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  if (isMobile) {
  return (
    <motion.div 
        className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
      variants={fadeIn("up", 0)}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
      >
        <div className="flex p-3">
          <div className="flex-shrink-0 mr-3">
            <div className="bg-gray-50 rounded-lg p-1 h-12 w-12 flex items-center justify-center">
              <img 
                src={university.logo || getDefaultLogo()} 
                alt={`${university.name} logo`} 
                className="h-10 w-10 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = getDefaultLogo();
                }}
              />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-sm font-bold text-gray-800 truncate pr-2">{university.name}</h3>
              <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">#{university.ranking}</span>
            </div>
            
            <div className="text-xs text-gray-600 mb-1 flex items-center">
              <IconComponent icon={HiOutlineLocationMarker} className="mr-1 text-gray-400" /> 
              <span className="truncate">{university.city}, {university.country}</span>
            </div>
            
            <div className="text-xs text-gray-600 mb-2">
              <div className="flex justify-between">
                <span>Tuition: {formatTuitionFee(university.tuition_fee)}</span>
              </div>
              <div className="flex justify-between mt-0.5">
                <span>Type: {university.type || 'N/A'}</span>
                <span>Acceptance: {formatAcceptanceRate(university.acceptance_rate)}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSelect}
                className="bg-primary hover:bg-primary-dark text-white py-1 px-2 rounded text-xs font-medium"
              >
                View
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCompare();
                }}
                className={`py-1 px-2 rounded text-xs font-medium ${
                  inCompareList ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {inCompareList ? 'Saved' : 'Compare'}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-100"
      variants={fadeIn("up", 0.3)}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
    >
      <div className="flex flex-col sm:flex-row p-4 gap-4">
        <div className="sm:w-24 flex justify-center">
          <div className="bg-gray-50 rounded-lg p-2 h-20 w-20 flex items-center justify-center">
            <img 
              src={university.logo || getDefaultLogo()} 
              alt={`${university.name} logo`} 
              className="h-16 w-16 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = getDefaultLogo();
              }}
            />
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
            <h3 className="text-lg font-bold text-gray-800">{university.name}</h3>
            <div className="flex items-center mt-1 sm:mt-0 gap-2">
              <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-medium">Rank #{university.ranking}</span>
              <span className="text-gray-700 text-sm flex items-center">
                <IconComponent icon={HiOutlineLocationMarker} className="mr-1" /> {university.city}, {university.country}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm mb-2">
            <div className="text-gray-600">
              <span className="font-medium text-gray-700">Undergrad:</span> {formatTuitionFee(university.tuition_fee)}
            </div>
            <div className="text-gray-600">
              <span className="font-medium text-gray-700">Type:</span> {university.type || 'N/A'}
            </div>
            <div className="text-gray-600">
              <span className="font-medium text-gray-700">Acceptance:</span> {formatAcceptanceRate(university.acceptance_rate)}
            </div>
            <div className="text-gray-600">
              <span className="font-medium text-gray-700">Student Population:</span> {formatStudentPopulation(university.student_population)}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1 mb-3">
            {university.programs_offered && university.programs_offered.map((program, index) => (
              <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                {program}
              </span>
            ))}
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onSelect}
              className="bg-primary hover:bg-primary-dark text-white py-1.5 px-4 rounded-lg transition-colors font-medium text-sm flex items-center justify-center"
            >
              View Details
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare();
              }}
              className={`py-1.5 px-4 rounded-lg transition-colors font-medium text-sm flex items-center ${
                inCompareList ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {inCompareList ? (
                <>
                  <IconComponent icon={FaBookmark} className="mr-1" /> Saved
                </>
              ) : (
                <>
                  <IconComponent icon={FaBookmark} className="mr-1" /> Add to Compare
                </>
              )}
            </motion.button>
            
            <motion.a
              href={university.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-secondary-dark font-medium text-sm flex items-center transition-colors"
              whileHover={{ x: 3 }}
            >
              Visit Website <IconComponent icon={FaExternalLinkAlt} className="ml-1 text-xs" />
            </motion.a>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// University Detail Modal Component
interface UniversityDetailModalProps {
  university: University;
  onClose: () => void;
  inCompareList: boolean;
  onToggleCompare: () => void;
}

const UniversityDetailModal: React.FC<UniversityDetailModalProps> = ({ university, onClose, inCompareList, onToggleCompare }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center bg-gradient-to-r from-primary to-primary-dark text-white p-5">
          <div className="flex items-center">
            <div className="bg-white rounded-lg p-2 mr-4">
              <img 
                src={university.logo || getDefaultLogo()} 
                alt={`${university.name} logo`} 
                className="h-12 w-12 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = getDefaultLogo();
                }}
              />
            </div>
            <div>
              <h2 className="text-xl font-bold">{university.name}</h2>
              <div className="flex items-center text-white/80 text-sm">
                <IconComponent icon={HiOutlineLocationMarker} className="mr-1" />
                <span>{university.city}, {university.country}</span>
                <span className="mx-2">•</span>
                <span>Rank #{university.ranking}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-4rem)]">
          <div className="flex flex-wrap gap-4 mb-6">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onToggleCompare}
              className={`py-2 px-4 rounded-lg transition-colors font-medium text-sm flex items-center ${
                inCompareList ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {inCompareList ? (
                <>
                  <IconComponent icon={FaBookmark} className="mr-2" /> Remove from Compare
                </>
              ) : (
                <>
                  <IconComponent icon={FaBookmark} className="mr-2" /> Add to Compare
                </>
              )}
            </motion.button>
            
            <motion.a
              href={university.website}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-lg transition-colors font-medium text-sm flex items-center"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Visit Official Website <IconComponent icon={FaExternalLinkAlt} className="ml-2" />
            </motion.a>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <IconComponent icon={FaDollarSign} className="mr-2 text-primary" /> Tuition & Fees
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Annual Tuition</span>
                  <span className="font-medium text-gray-800">{formatTuitionFee(university.tuition_fee)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Application Fee</span>
                  <span className="font-medium text-gray-800">{university.application_fee ? `$${university.application_fee}` : 'Contact for details'}</span>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-gray-800 mt-6 mb-4 flex items-center">
                <IconComponent icon={FaCalendarAlt} className="mr-2 text-primary" /> Application Deadlines
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Fall Intake</span>
                  <span className="font-medium text-gray-800">{university.applicationDeadlines.fall}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Spring Intake</span>
                  <span className="font-medium text-gray-800">{university.applicationDeadlines.spring}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <IconComponent icon={FaGraduationCap} className="mr-2 text-primary" /> Admission Requirements
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Minimum GPA</span>
                  <span className="font-medium text-gray-800">{university.admissionRequirements.minGPA}</span>
                </div>
                
                <div className="py-2 border-b border-gray-200">
                  <p className="text-gray-600 mb-2">Test Scores</p>
                  <div className="space-y-1">
                    {university.admissionRequirements.testScores.map((test, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-500">{test.name}</span>
                        <span className="font-medium text-gray-700">{test.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="py-2">
                  <p className="text-gray-600 mb-2">Language Requirements</p>
                  <div className="space-y-1">
                    {university.admissionRequirements.languageRequirements.map((lang, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-500">{lang.test}</span>
                        <span className="font-medium text-gray-700">{lang.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <IconComponent icon={FaTrophy} className="mr-2 text-primary" /> Major Strengths
            </h3>
            <div className="flex flex-wrap gap-2">
              {university.majorStrengths.map((major, index) => (
                <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
                  {major}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Compare Universities Modal Component
interface CompareUniversitiesModalProps {
  universities: University[];
  onClose: () => void;
  onRemove: (university: University) => void;
  aiRecommendedId?: string; // ID of the top AI recommended university
  isAutoGenerating?: boolean; // Loading state for auto-generation
}

const CompareUniversitiesModal: React.FC<CompareUniversitiesModalProps> = ({ 
  universities, 
  onClose, 
  onRemove, 
  aiRecommendedId, 
  isAutoGenerating
}) => {
  // Sort universities to put AI recommended first
  const sortedUniversities = [...universities].sort((a, b) => {
    if (a.id === aiRecommendedId) return -1;
    if (b.id === aiRecommendedId) return 1;
    return 0;
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white p-5 flex-shrink-0">
          <h2 className="text-xl font-bold flex items-center">
            <IconComponent icon={FaTrophy} className="mr-2" /> 
            Compare Universities
            {aiRecommendedId && (
              <span className="ml-3 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <span className="w-2 h-2 bg-yellow-300 rounded-full mr-2 animate-pulse"></span>
                AI Recommended
              </span>
            )}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-all duration-300 hover:rotate-90 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-purple-500 hover:to-pink-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Loading state for auto-generation */}
        {isAutoGenerating && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
              <p className="text-lg font-semibold text-purple-800">Getting best university according to your background...</p>
              <p className="text-sm text-gray-600 mt-2">AI is analyzing your profile</p>
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-x-auto overflow-y-hidden">
            <div className="flex gap-6 min-w-max h-full">
              {/* Row headers column */}
              <div className="flex flex-col min-w-[200px] sticky left-0 z-10 bg-white h-full">
                <div className="h-28 bg-gray-50 border-b border-r border-gray-200 p-3 flex items-center flex-shrink-0">
                  <span className="text-gray-800 font-bold">University</span>
                </div>
                <div className="h-12 bg-gray-50 border-b border-r border-gray-200 p-3 flex items-center font-medium text-gray-700 flex-shrink-0">
                  Country
                </div>
                <div className="h-12 bg-gray-50 border-b border-r border-gray-200 p-3 flex items-center font-medium text-gray-700 flex-shrink-0">
                  QS Ranking
                </div>
                <div className="h-12 bg-gray-50 border-b border-r border-gray-200 p-3 flex items-center font-medium text-gray-700 flex-shrink-0">
                  Undergrad Tuition
                </div>
                <div className="h-12 bg-gray-50 border-b border-r border-gray-200 p-3 flex items-center font-medium text-gray-700 flex-shrink-0">
                  Graduate Tuition
                </div>
                <div className="h-12 bg-gray-50 border-b border-r border-gray-200 p-3 flex items-center font-medium text-gray-700 flex-shrink-0">
                  Minimum GPA
                </div>
                <div className="h-16 bg-gray-50 border-b border-r border-gray-200 p-3 flex items-center font-medium text-gray-700 flex-shrink-0">
                  Language Requirements
                </div>
                <div className="h-16 bg-gray-50 border-b border-r border-gray-200 p-3 flex items-center font-medium text-gray-700 flex-shrink-0">
                  Application Deadlines
                </div>
                <div className="h-20 bg-gray-50 border-b border-r border-gray-200 p-3 flex items-center font-medium text-gray-700 flex-shrink-0">
                  Major Strengths
                </div>
                <div className="h-12 bg-gray-50 border-r border-gray-200 p-3 flex items-center font-medium text-gray-700 flex-shrink-0">
                  Apply
                </div>
              </div>

              {/* University columns */}
              {sortedUniversities.map((university, index) => {
                const isAIRecommended = university.id === aiRecommendedId;
                const columnClass = isAIRecommended 
                  ? "bg-gradient-to-b from-purple-50 via-lavender-50 to-indigo-50 border-2 border-purple-300 shadow-lg" 
                  : "bg-white border border-gray-200";
                
                return (
                  <div key={university.id} className={`flex flex-col min-w-[280px] ${columnClass} rounded-lg overflow-hidden h-full`}>
                    {/* University header */}
                    <div className={`h-28 p-3 border-b ${isAIRecommended ? 'border-purple-200' : 'border-gray-200'} relative flex-shrink-0`}>
                      {isAIRecommended && (
                        <div className="absolute top-2 right-2 z-20">
                          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center animate-pulse">
                            <span className="w-2 h-2 bg-yellow-300 rounded-full mr-1"></span>
                            AI TOP PICK
                          </div>
                        </div>
                      )}
                      <div className="flex flex-col items-center h-full justify-center">
                        <div className={`w-12 h-12 rounded-full p-1 mb-1 flex justify-center items-center shadow-sm ${
                          isAIRecommended 
                            ? 'bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-300' 
                            : 'bg-white'
                        }`}>
                          <img 
                            src={university.logo} 
                            alt={`${university.name} logo`} 
                            className="h-10 w-10 object-contain"
                          />
                        </div>
                        <div className={`font-bold text-center text-xs ${
                          isAIRecommended ? 'text-purple-800' : 'text-primary'
                        }`}>
                          {university.name.length > 25 ? university.name.substring(0, 25) + '...' : university.name}
                        </div>
                        <div className="text-xs text-gray-600 flex items-center mt-1">
                          <span className={`px-1 py-0.5 rounded-full text-xs ${
                            isAIRecommended 
                              ? 'bg-purple-200 text-purple-800' 
                              : 'bg-primary/10 text-primary'
                          }`}>
                            #{university.qsRanking}
                          </span>
                        </div>
                        <button 
                          onClick={() => onRemove(university)}
                          className={`mt-1 text-xs hover:scale-110 transition-all duration-200 ${
                            isAIRecommended 
                              ? 'text-purple-600 hover:text-red-500 font-medium' 
                              : 'text-gray-500 hover:text-red-500'
                          }`}
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* University data rows */}
                    <div className={`h-12 p-3 border-b ${isAIRecommended ? 'border-purple-200' : 'border-gray-200'} flex items-center justify-center text-center text-sm flex-shrink-0 ${
                      isAIRecommended ? 'text-purple-800 font-medium' : 'text-gray-800'
                    }`}>
                      {university.country}
                    </div>
                    
                    <div className={`h-12 p-3 border-b ${isAIRecommended ? 'border-purple-200' : 'border-gray-200'} flex items-center justify-center text-center flex-shrink-0 ${
                      isAIRecommended ? 'text-purple-800 font-bold text-lg' : 'text-gray-800'
                    }`}>
                      #{university.qsRanking}
                    </div>
                    
                    <div className={`h-12 p-3 border-b ${isAIRecommended ? 'border-purple-200' : 'border-gray-200'} flex items-center justify-center text-center text-xs flex-shrink-0 ${
                      isAIRecommended ? 'text-purple-800 font-medium' : 'text-gray-800'
                    }`}>
                      {university.tuitionFees.undergraduate}
                    </div>
                    
                    <div className={`h-12 p-3 border-b ${isAIRecommended ? 'border-purple-200' : 'border-gray-200'} flex items-center justify-center text-center text-xs flex-shrink-0 ${
                      isAIRecommended ? 'text-purple-800 font-medium' : 'text-gray-800'
                    }`}>
                      {university.tuitionFees.graduate}
                    </div>
                    
                    <div className={`h-12 p-3 border-b ${isAIRecommended ? 'border-purple-200' : 'border-gray-200'} flex items-center justify-center text-center flex-shrink-0 ${
                      isAIRecommended ? 'text-purple-800 font-bold' : 'text-gray-800'
                    }`}>
                      {university.admissionRequirements.minGPA}
                    </div>
                    
                    <div className={`h-16 p-3 border-b ${isAIRecommended ? 'border-purple-200' : 'border-gray-200'} flex items-center justify-center text-center text-xs flex-shrink-0 ${
                      isAIRecommended ? 'text-purple-800' : 'text-gray-800'
                    }`}>
                      <div>
                        {university.admissionRequirements.languageRequirements.map((lang, i) => (
                          <div key={i} className={isAIRecommended ? 'font-medium' : ''}>
                            {lang.test}: {lang.score}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className={`h-16 p-3 border-b ${isAIRecommended ? 'border-purple-200' : 'border-gray-200'} flex items-center justify-center text-center text-xs flex-shrink-0 ${
                      isAIRecommended ? 'text-purple-800' : 'text-gray-800'
                    }`}>
                      <div>
                        <div className={isAIRecommended ? 'font-medium' : ''}>Fall: {university.applicationDeadlines.fall}</div>
                        <div className={isAIRecommended ? 'font-medium' : ''}>Spring: {university.applicationDeadlines.spring}</div>
                      </div>
                    </div>
                    
                    <div className={`h-20 p-3 border-b ${isAIRecommended ? 'border-purple-200' : 'border-gray-200'} flex items-center justify-center text-xs flex-shrink-0`}>
                      <div className="flex flex-wrap justify-center gap-1">
                        {university.majorStrengths.slice(0, 4).map((major, i) => (
                          <span key={i} className={`text-xs px-1 py-0.5 rounded-full ${
                            isAIRecommended 
                              ? 'bg-purple-200 text-purple-800 font-medium' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {major.length > 8 ? major.substring(0, 8) + '...' : major}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className={`h-12 p-3 flex items-center justify-center flex-shrink-0`}>
                      <a
                        href={university.applicationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-block text-white text-xs py-1.5 px-3 rounded-lg transition-all duration-300 hover:scale-105 ${
                          isAIRecommended 
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg font-bold' 
                            : 'bg-primary hover:bg-primary-dark'
                        }`}
                      >
                        {isAIRecommended ? '🚀 Apply' : 'Apply'}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Database: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    country: '',
    qsRanking: [1, 500],
    tuitionFees: [0, 100000],
    minGPA: [0, 4],
    rankingType: '',
    region: '',
    rankingYear: '',
    acceptanceRate: '',
    studentPopulation: '',
    campusType: '',
    employmentRate: '',
    major: '',
    qsRankingRange: [1, 500],
    researchOutput: '',
    showOnlyOpenApplications: false,
    admissionDifficulty: '',
    testScores: ''
  });
  const [sortBy, setSortBy] = useState('qsRanking');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [compareList, setCompareList] = useState<University[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [aiAnalysisData, setAiAnalysisData] = useState<any>(null);
  const [recommendedUniversities, setRecommendedUniversities] = useState<University[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfileCompletion, setUserProfileCompletion] = useState(0);
  const [isAutoGeneratingRecommendation, setIsAutoGeneratingRecommendation] = useState(false);

  // Fetch universities data
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        setIsLoading(true);
        const response = await universityAPI.getAll();
        if (response.success && response.data) {
          // Transform the data to match our interface
          const transformedData = response.data.map((uni: any) => ({
            ...uni,
            qsRanking: uni.ranking || 999,
            majorStrengths: uni.programs_offered || [],
      applicationDeadlines: {
              fall: 'September 1',
              spring: 'January 15'
      },
      admissionRequirements: {
              minGPA: 3.0,
        testScores: [
                { name: 'SAT', score: '1200+' },
                { name: 'ACT', score: '26+' }
        ],
        languageRequirements: [
                { test: 'IELTS', score: '6.5' },
                { test: 'TOEFL', score: '80' }
              ]
            },
      tuitionFees: {
              undergraduate: `$${uni.tuition_fee?.toLocaleString() || '25,000'}/year`,
              graduate: `$${((uni.tuition_fee || 25000) * 1.2)?.toLocaleString() || '30,000'}/year`
            },
            applicationLink: uni.website || '#',
      rankingType: 'QS World University Rankings',
            region: uni.country === 'United States' ? 'North America' : 
                   uni.country === 'United Kingdom' ? 'Europe' : 
                   uni.country === 'Canada' ? 'North America' : 'Other',
      rankingYear: 2024,
            acceptanceRate: `${uni.acceptance_rate || 50}%`,
            studentPopulation: uni.student_population?.toLocaleString() || '10,000',
            researchOutput: 'High',
            employmentRate: '85%',
            campusType: uni.campus_type || 'Urban'
          }));
          setUniversities(transformedData);
        }
      } catch (error) {
        console.error('Error fetching universities:', error);
        // Set some mock data as fallback
        setUniversities([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUniversities();
  }, []);

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Filter universities based on search and filters
  const filteredUniversities = universities.filter(university => {
    // Search query filter
    if (searchQuery && !university.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !university.country.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !university.majorStrengths.some(major => major.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }
    
    // Country filter
    if (filters.country && university.country !== filters.country) {
      return false;
    }
    
    // Major filter
    if (filters.major && !university.majorStrengths.some(major => 
      major.toLowerCase().includes(filters.major.toLowerCase()))) {
      return false;
    }
    
    // QS Ranking filter
    if (university.qsRanking < filters.qsRankingRange[0] || 
        university.qsRanking > filters.qsRankingRange[1]) {
      return false;
    }

    // Ranking Type filter
    if (filters.rankingType && university.rankingType !== filters.rankingType) {
      return false;
    }

    // Region filter
    if (filters.region && university.region !== filters.region) {
      return false;
    }

    // Ranking Year filter
    if (filters.rankingYear && university.rankingYear.toString() !== filters.rankingYear) {
      return false;
    }

    // Acceptance Rate filter
    if (filters.acceptanceRate) {
      const rate = parseInt(university.acceptanceRate.replace('%', ''));
      if (filters.acceptanceRate === 'low' && rate > 10) return false;
      if (filters.acceptanceRate === 'medium' && (rate <= 10 || rate > 50)) return false;
      if (filters.acceptanceRate === 'high' && rate <= 50) return false;
    }

    // Student Population filter
    if (filters.studentPopulation) {
      const population = parseInt(university.studentPopulation.replace(',', ''));
      if (filters.studentPopulation === 'small' && population > 15000) return false;
      if (filters.studentPopulation === 'medium' && (population <= 15000 || population > 40000)) return false;
      if (filters.studentPopulation === 'large' && population <= 40000) return false;
    }

    // Campus Type filter
    if (filters.campusType && university.campusType !== filters.campusType) {
      return false;
    }

    // Research Output filter
    if (filters.researchOutput && university.researchOutput !== filters.researchOutput) {
      return false;
    }

    // Employment Rate filter
    if (filters.employmentRate) {
      const rate = parseInt(university.employmentRate.replace('%', ''));
      if (filters.employmentRate === 'high' && rate < 90) return false;
      if (filters.employmentRate === 'medium' && (rate < 80 || rate >= 90)) return false;
      if (filters.employmentRate === 'low' && rate >= 80) return false;
    }
    
    return true;
  });

  // Sort universities
  const sortedUniversities = [...filteredUniversities].sort((a, b) => {
    if (sortBy === 'qsRanking') {
      return a.qsRanking - b.qsRanking;
    } else if (sortBy === 'qsRankingDesc') {
      return b.qsRanking - a.qsRanking;
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'nameDesc') {
      return b.name.localeCompare(a.name);
    } else if (sortBy === 'country') {
      return a.country.localeCompare(b.country);
    }
    return 0;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedUniversities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUniversities = sortedUniversities.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, sortBy]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFilters(prevFilters => ({
        ...prevFilters,
        [name]: checked
      }));
    } else {
      setFilters(prevFilters => ({
        ...prevFilters,
        [name]: value
      }));
    }
  };

  const handleRangeChange = (name: string, values: [number, number]) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: values
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      country: '',
      qsRanking: [1, 500],
      tuitionFees: [0, 100000],
      minGPA: [0, 4],
      rankingType: '',
      region: '',
      rankingYear: '',
      acceptanceRate: '',
      studentPopulation: '',
      campusType: '',
      employmentRate: '',
      major: '',
      qsRankingRange: [1, 500],
      researchOutput: '',
      showOnlyOpenApplications: false,
      admissionDifficulty: '',
      testScores: ''
    });
    setCurrentPage(1);
  };

  const toggleCompare = (university: University) => {
    if (compareList.some(u => u.id === university.id)) {
      setCompareList(compareList.filter(u => u.id !== university.id));
    } else {
        setCompareList([...compareList, university]);
    }
  };

  // Animation variants
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

  // AI Analysis function
  const handleAIAnalysis = async () => {
    if (!user) {
      alert('Please log in to use AI Analysis');
      return;
    }

    // Check profile completion first
    if (userProfileCompletion < 50) {
      setShowProfileModal(true);
      return;
    }

    setIsLoadingAI(true);
    try {
      // Fetch user profile data from Supabase
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        setShowProfileModal(true);
        setIsLoadingAI(false);
        return;
      } else if (error) {
        console.error('Error fetching profile:', error);
        alert('Error fetching your profile. Please try again.');
        setIsLoadingAI(false);
        return;
      } else if (!profile) {
        setShowProfileModal(true);
        setIsLoadingAI(false);
        return;
      }

      // Prepare user data for AI analysis
      const userData = {
        name: profile.full_name,
        currentEducation: profile.current_education_level,
        institution: profile.current_institution,
        gpa: profile.current_gpa,
        gpaScale: profile.gpa_scale,
        graduationYear: profile.graduation_year,
        fieldOfStudy: profile.field_of_study,
        preferredField: profile.preferred_field,
        preferredDegree: profile.preferred_degree_level,
        budgetRange: profile.budget_range,
        preferredLocation: profile.preferred_study_location,
        testScores: {
          sat: profile.sat_score,
          act: profile.act_score,
          gre: profile.gre_score,
          gmat: profile.gmat_score,
          toefl: profile.toefl_score,
          ielts: profile.ielts_score,
          duolingo: profile.duolingo_score
        },
        extracurriculars: profile.extracurricular_activities,
        careerGoals: profile.career_goals,
        workExperience: profile.work_experience,
        researchExperience: profile.research_experience
      };

      const aiPrompt = `Please analyze this student's academic profile and provide a comprehensive analysis in XML format. Here is the student data:

${JSON.stringify(userData, null, 2)}

Please provide your analysis in the following XML structure:
<analysis>
  <academic_strength percentage="85">Strong academic performance with excellent GPA</academic_strength>
  <competitive_level>Highly Competitive</competitive_level>
  <budget_analysis>
    <level>Moderate Budget</level>
    <recommendation>Consider universities with good financial aid programs</recommendation>
    <affordable_options>15</affordable_options>
  </budget_analysis>
  <recommended_regions>
    <region>North America</region>
    <region>Europe</region>
  </recommended_regions>
  <suggestions>
    <suggestion>Focus on improving standardized test scores</suggestion>
    <suggestion>Consider applying for merit-based scholarships</suggestion>
    <suggestion>Build stronger research portfolio</suggestion>
  </suggestions>
</analysis>

Analyze their academic strength, competitiveness, budget considerations, recommended study regions, and provide actionable suggestions for improvement.`;

      // Call the AI API
      const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 95fad12c-0768-4de2-a4c2-83247337ea89',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "doubao-vision-pro-32k-241028",
          messages: [
            {
              role: "system",
              content: "You are an AI education consultant from Hong Kong helping students with university applications and academic planning. Provide detailed, personalized analysis based on student profiles. Always respond in the exact XML format requested."
            },
            {
              role: "user",
              content: aiPrompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const aiResponse = await response.json();
      const aiContent = aiResponse.choices[0].message.content;

      // Parse XML response
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(aiContent, 'text/xml');
      
      // Extract data from XML
      const academicStrengthElement = xmlDoc.querySelector('academic_strength');
      const academicStrength = academicStrengthElement?.getAttribute('percentage') || '75';
      const academicStrengthText = academicStrengthElement?.textContent || 'Good academic performance';
      
      const competitiveLevel = xmlDoc.querySelector('competitive_level')?.textContent || 'Competitive';
      
      const budgetLevel = xmlDoc.querySelector('budget_analysis level')?.textContent || 'Moderate Budget';
      const budgetRecommendation = xmlDoc.querySelector('budget_analysis recommendation')?.textContent || 'Consider financial aid options';
      const affordableOptions = xmlDoc.querySelector('budget_analysis affordable_options')?.textContent || '10';
      
      const regionElements = xmlDoc.querySelectorAll('recommended_regions region');
      const recommendedRegions = Array.from(regionElements).map(el => el.textContent || '');
      
      const suggestionElements = xmlDoc.querySelectorAll('suggestions suggestion');
      const suggestions = Array.from(suggestionElements).map(el => el.textContent || '');

      const analysis = {
        academicStrength: parseInt(academicStrength),
        academicStrengthText,
        competitiveLevel,
        budgetAnalysis: {
          level: budgetLevel,
          recommendation: budgetRecommendation,
          affordableOptions: affordableOptions
        },
        recommendedRegions,
        suggestions
      };

      setAiAnalysisData(analysis);
      setShowAIAnalysis(true);
    } catch (error) {
      console.error('Error in AI Analysis:', error);
      alert('Error performing AI Analysis. Please try again.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Get Recommendations function
  const handleGetRecommendations = async () => {
    if (!user) {
      alert('Please log in to get recommendations');
      return;
    }

    // Check profile completion first
    if (userProfileCompletion < 50) {
      setShowProfileModal(true);
      return;
    }

    setIsLoadingAI(true);
    try {
      // Fetch user profile data from Supabase
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        setShowProfileModal(true);
        setIsLoadingAI(false);
        return;
      } else if (error) {
        console.error('Error fetching profile:', error);
        alert('Error fetching your profile. Please try again.');
        setIsLoadingAI(false);
        return;
      } else if (!profile) {
        setShowProfileModal(true);
        setIsLoadingAI(false);
        return;
      }

      // Prepare user data and university list for AI
      const userData = {
        name: profile.full_name,
        currentEducation: profile.current_education_level,
        gpa: profile.current_gpa,
        gpaScale: profile.gpa_scale,
        fieldOfStudy: profile.field_of_study,
        preferredField: profile.preferred_field,
        preferredDegree: profile.preferred_degree_level,
        budgetRange: profile.budget_range,
        preferredLocation: profile.preferred_study_location,
        testScores: {
          sat: profile.sat_score,
          act: profile.act_score,
          gre: profile.gre_score,
          gmat: profile.gmat_score,
          toefl: profile.toefl_score,
          ielts: profile.ielts_score,
          duolingo: profile.duolingo_score
        },
        careerGoals: profile.career_goals
      };

      // Create a simplified university list for AI processing
      const universityList = universities.map(uni => ({
        id: uni.id,
        name: uni.name,
        country: uni.country,
        qsRanking: uni.qsRanking,
        tuitionFees: uni.tuitionFees,
        minGPA: uni.admissionRequirements.minGPA,
        majorStrengths: uni.majorStrengths,
        acceptanceRate: uni.acceptanceRate,
        region: uni.region
      }));

      const aiPrompt = `Based on this student's profile, please select the top 5 most suitable universities from the provided list and return them in XML format.

Student Profile:
${JSON.stringify(userData, null, 2)}

Available Universities:
${JSON.stringify(universityList, null, 2)}

Please analyze the student's academic profile, test scores, field preferences, budget, and location preferences to select the 5 best matching universities. Return your recommendations in this XML format:

<recommendations>
  <university id="1">
    <match_score>95</match_score>
    <reason>Excellent match for computer science with strong research programs and fits budget range</reason>
  </university>
  <university id="15">
    <match_score>88</match_score>
    <reason>Top engineering program with good financial aid options</reason>
  </university>
  <university id="23">
    <match_score>85</match_score>
    <reason>Strong in preferred field with moderate tuition fees</reason>
  </university>
  <university id="7">
    <match_score>82</match_score>
    <reason>Good academic fit with excellent career prospects</reason>
  </university>
  <university id="31">
    <match_score>80</match_score>
    <reason>Solid backup option with good acceptance rate</reason>
  </university>
</recommendations>

Consider factors like academic fit, budget compatibility, location preferences, admission requirements, and career alignment.`;

      // Call the AI API
      const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 95fad12c-0768-4de2-a4c2-83247337ea89',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "doubao-vision-pro-32k-241028",
          messages: [
            {
              role: "system",
              content: "You are an AI university admissions consultant from Hong Kong. Analyze student profiles and recommend the best matching universities from the provided list. Always respond in the exact XML format requested with university IDs that exist in the provided list."
            },
            {
              role: "user",
              content: aiPrompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const aiResponse = await response.json();
      const aiContent = aiResponse.choices[0].message.content;

      // Parse XML response
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(aiContent, 'text/xml');
      
      // Extract recommended university IDs
      const universityElements = xmlDoc.querySelectorAll('recommendations university');
      const recommendedIds = Array.from(universityElements).map(el => {
        const id = el.getAttribute('id');
        return id ? id : null; // Keep as string instead of parsing to int
      }).filter(id => id !== null);

      // Get the actual university objects
      const recommendations = recommendedIds
        .map(id => universities.find(uni => uni.id === id))
        .filter(uni => uni !== undefined)
        .slice(0, 5); // Ensure we only get top 5

      // If AI didn't return enough recommendations, fall back to algorithm
      if (recommendations.length < 5) {
        const fallbackRecommendations = generateUniversityRecommendations(profile, universities);
        const combined = [...recommendations, ...fallbackRecommendations]
          .filter((uni): uni is University => uni !== undefined)
          .filter((uni, index, self) => index === self.findIndex(u => u.id === uni.id))
          .slice(0, 5);
        setRecommendedUniversities(combined);
        
        // Add only the first recommended university to compare list
        if (combined.length > 0) {
          const topRecommendation = combined[0];
          setCompareList(prev => {
            const exists = prev.some(existing => existing.id === topRecommendation.id);
            if (!exists) {
              return [topRecommendation, ...prev];
            }
            return prev;
          });
        }
      } else {
        const validRecommendations = recommendations.filter((uni): uni is University => uni !== undefined);
        setRecommendedUniversities(validRecommendations);
        
        // Add only the first recommended university to compare list
        if (validRecommendations.length > 0) {
          const topRecommendation = validRecommendations[0];
          setCompareList(prev => {
            const exists = prev.some(existing => existing.id === topRecommendation.id);
            if (!exists) {
              return [topRecommendation, ...prev];
            }
            return prev;
          });
        }
      }

      setShowRecommendations(true);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      // Fall back to algorithm-based recommendations
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          const fallbackRecommendations = generateUniversityRecommendations(profile, universities);
          setRecommendedUniversities(fallbackRecommendations);
          
          // Add only the first recommended university to compare list
          if (fallbackRecommendations.length > 0) {
            const topRecommendation = fallbackRecommendations[0];
            setCompareList(prev => {
              const exists = prev.some(existing => existing.id === topRecommendation.id);
              if (!exists) {
                return [topRecommendation, ...prev];
              }
              return prev;
            });
          }
          
          setShowRecommendations(true);
        }
      } catch (fallbackError) {
        console.error('Fallback recommendation error:', fallbackError);
        alert('Unable to generate recommendations. Please try again later.');
      }
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Helper functions for AI analysis
  const calculateAcademicStrength = (profile: any) => {
    let score = 0;
    if (profile.current_gpa >= 3.7) score += 30;
    else if (profile.current_gpa >= 3.3) score += 20;
    else if (profile.current_gpa >= 3.0) score += 10;

    if (profile.sat_score >= 1400) score += 25;
    else if (profile.sat_score >= 1200) score += 15;
    else if (profile.sat_score >= 1000) score += 5;

    if (profile.gre_score >= 320) score += 20;
    else if (profile.gre_score >= 310) score += 10;

    if (profile.toefl_score >= 100) score += 15;
    else if (profile.toefl_score >= 80) score += 10;

    if (profile.ielts_score >= 7.0) score += 15;
    else if (profile.ielts_score >= 6.5) score += 10;

    return Math.min(score, 100);
  };

  const getRecommendedRegions = (profile: any) => {
    const regions = [];
    if (profile.budget_range === 'Under $20,000' || profile.budget_range === '$20,000 - $40,000') {
      regions.push('Europe', 'Asia');
    }
    if (profile.budget_range === '$40,000 - $60,000' || profile.budget_range === 'Above $60,000') {
      regions.push('North America', 'Australia');
    }
    if (profile.preferred_study_location) {
      regions.push(profile.preferred_study_location);
    }
    return Array.from(new Set(regions));
  };

  const analyzeBudget = (profile: any) => {
    const budget = profile.budget_range;
    if (budget === 'Under $20,000') {
      return {
        level: 'Budget-Conscious',
        recommendation: 'Consider universities in Germany, France, or Asia with lower tuition fees.',
        affordableOptions: universities.filter(u => 
          parseInt(u.tuitionFees.undergraduate.replace(/[^0-9]/g, '')) < 20000
        ).length
      };
    } else if (budget === '$20,000 - $40,000') {
      return {
        level: 'Moderate Budget',
        recommendation: 'You have good options in Europe and some US state universities.',
        affordableOptions: universities.filter(u => {
          const fee = parseInt(u.tuitionFees.undergraduate.replace(/[^0-9]/g, ''));
          return fee >= 20000 && fee <= 40000;
        }).length
      };
    } else {
      return {
        level: 'Flexible Budget',
        recommendation: 'You can consider top-tier universities worldwide.',
        affordableOptions: universities.length
      };
    }
  };

  const assessCompetitiveLevel = (profile: any) => {
    const academicStrength = calculateAcademicStrength(profile);
    if (academicStrength >= 80) return 'Highly Competitive';
    if (academicStrength >= 60) return 'Moderately Competitive';
    return 'Safety Schools Recommended';
  };

  const generateSuggestions = (profile: any) => {
    const suggestions = [];
    const academicStrength = calculateAcademicStrength(profile);
    
    if (academicStrength < 60) {
      suggestions.push('Consider improving your test scores (SAT/GRE/TOEFL)');
      suggestions.push('Look into universities with lower admission requirements');
    }
    
    if (!profile.work_experience) {
      suggestions.push('Gain relevant work or research experience');
    }
    
    if (!profile.extracurricular_activities || profile.extracurricular_activities.length === 0) {
      suggestions.push('Participate in extracurricular activities related to your field');
    }
    
    suggestions.push('Apply to a mix of reach, match, and safety schools');
    suggestions.push('Start your applications early to meet deadlines');
    
    return suggestions;
  };

  const generateUniversityRecommendations = (profile: any, allUniversities: University[]) => {
    const academicStrength = calculateAcademicStrength(profile);
    let recommendations = [];

    // Filter based on academic strength
    if (academicStrength >= 80) {
      // Highly competitive - top 50 universities
      recommendations = allUniversities.filter(u => u.qsRanking <= 50);
    } else if (academicStrength >= 60) {
      // Moderately competitive - top 100 universities
      recommendations = allUniversities.filter(u => u.qsRanking <= 100 && u.qsRanking > 20);
    } else {
      // Safety schools - universities ranked 100+
      recommendations = allUniversities.filter(u => u.qsRanking > 100);
    }

    // Filter by budget
    if (profile.budget_range) {
      recommendations = recommendations.filter(u => {
        const fee = parseInt(u.tuitionFees.undergraduate.replace(/[^0-9]/g, ''));
        if (profile.budget_range === 'Under $20,000') return fee < 20000;
        if (profile.budget_range === '$20,000 - $40,000') return fee >= 20000 && fee <= 40000;
        if (profile.budget_range === '$40,000 - $60,000') return fee >= 40000 && fee <= 60000;
        return true; // Above $60,000 - no filter
      });
    }

    // Filter by preferred field
    if (profile.preferred_field) {
      recommendations = recommendations.filter(u => 
        u.majorStrengths.some(major => 
          major.toLowerCase().includes(profile.preferred_field.toLowerCase())
        )
      );
    }

    // Sort by ranking and return top 5
    return recommendations
      .sort((a, b) => a.qsRanking - b.qsRanking)
      .slice(0, 5);
  };

  // Check user profile completion
  const checkProfileCompletion = async () => {
    if (!user) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('profile_completion_percentage, full_name, current_education_level, current_institution, current_gpa, graduation_year, field_of_study, preferred_field, preferred_degree_level, budget_range, preferred_study_location')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist
        setUserProfileCompletion(0);
        return;
      } else if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      const completion = profile?.profile_completion_percentage || 0;
      setUserProfileCompletion(completion);
    } catch (error) {
      console.error('Error checking profile completion:', error);
    }
  };

  // Check profile completion on component mount
  useEffect(() => {
    if (user) {
      checkProfileCompletion();
    }
  }, [user]);

  // Profile Completion Modal Component
  const ProfileCompletionModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <IconComponent icon={FaUser} className="text-orange-500 text-2xl" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Complete Your Profile</h3>
          <p className="text-gray-600 mb-6">
            To get personalized AI recommendations and analysis, please complete your academic profile first.
          </p>
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Profile Completion</span>
              <span>{userProfileCompletion}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${userProfileCompletion}%` }}
              ></div>
            </div>
          </div>
          <div className="flex gap-3">
            <motion.button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Later
            </motion.button>
            <motion.button
              onClick={() => {
                onClose();
                window.location.href = '/profile';
              }}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Complete Profile
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  // Auto-generate recommendation when compare modal is opened
  const autoGenerateRecommendation = async () => {
    if (!user || recommendedUniversities.length > 0) return;

    // Check profile completion first
    if (userProfileCompletion < 50) {
      setShowProfileModal(true);
      return;
    }

    setIsAutoGeneratingRecommendation(true);
    try {
      // Fetch user profile data from Supabase
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !profile) {
        // Use algorithmic fallback if profile fetch fails
        const fallbackRecommendations = generateUniversityRecommendations({}, universities);
        if (fallbackRecommendations.length > 0) {
          const topRecommendation = fallbackRecommendations[0];
          setRecommendedUniversities(fallbackRecommendations);
          setCompareList(prev => {
            const exists = prev.some(existing => existing.id === topRecommendation.id);
            if (!exists) {
              return [topRecommendation, ...prev];
            }
            return prev;
          });
        }
        setIsAutoGeneratingRecommendation(false);
        return;
      }

      // Quick AI recommendation for just the top university
      const userData = {
        name: profile.full_name,
        currentEducation: profile.current_education_level,
        gpa: profile.current_gpa,
        fieldOfStudy: profile.field_of_study,
        preferredField: profile.preferred_field,
        budgetRange: profile.budget_range,
        preferredLocation: profile.preferred_study_location,
        careerGoals: profile.career_goals
      };

      const universityList = universities.slice(0, 20).map(uni => ({
        id: uni.id,
        name: uni.name,
        country: uni.country,
        qsRanking: uni.qsRanking,
        majorStrengths: uni.majorStrengths
      }));

      const quickPrompt = `Based on this student profile, select the single best university from the list and return only the university ID in XML format:

Student: ${JSON.stringify(userData, null, 2)}
Universities: ${JSON.stringify(universityList, null, 2)}

Return format: <recommendation><university id="X"/></recommendation>`;

      try {
        const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer 95fad12c-0768-4de2-a4c2-83247337ea89',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "doubao-vision-pro-32k-241028",
            messages: [
              {
                role: "system",
                content: "You are an AI university consultant. Select the best matching university and return only the ID in the specified XML format."
              },
              {
                role: "user",
                content: quickPrompt
              }
            ],
            max_tokens: 500,
            temperature: 0.5
          })
        });

        if (response.ok) {
          const aiResponse = await response.json();
          const aiContent = aiResponse.choices[0].message.content;
          
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(aiContent, 'text/xml');
          const universityElement = xmlDoc.querySelector('recommendation university');
          
          if (universityElement) {
            const id = universityElement.getAttribute('id');
            const recommendedId = id ? id : null; // Keep as string instead of parsing to int
            
            if (recommendedId) {
              const recommendedUniversity = universities.find(uni => uni.id === recommendedId);
              if (recommendedUniversity) {
                setRecommendedUniversities([recommendedUniversity]);
                setCompareList(prev => {
                  const exists = prev.some(existing => existing.id === recommendedUniversity.id);
                  if (!exists) {
                    return [recommendedUniversity, ...prev];
                  }
                  return prev;
                });
                setIsAutoGeneratingRecommendation(false);
                return;
              }
            }
          }
        }
      } catch (aiError) {
        console.log('AI recommendation failed, using algorithmic fallback');
      }

      // Fallback to algorithmic recommendation
      const fallbackRecommendations = generateUniversityRecommendations(profile, universities);
      if (fallbackRecommendations.length > 0) {
        const topRecommendation = fallbackRecommendations[0];
        setRecommendedUniversities([topRecommendation]);
        setCompareList(prev => {
          const exists = prev.some(existing => existing.id === topRecommendation.id);
          if (!exists) {
            return [topRecommendation, ...prev];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Auto-recommendation error:', error);
    } finally {
      setIsAutoGeneratingRecommendation(false);
    }
  };

  // Handle opening compare modal with auto-generation
  const handleOpenCompare = async () => {
    setShowCompare(true);
    // Auto-generate recommendation if none exists and compare list is empty or has no AI recommendation
    if (compareList.length === 0 || !compareList.some(uni => uni.id === (recommendedUniversities.length > 0 ? recommendedUniversities[0].id : undefined))) {
      await autoGenerateRecommendation();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <main className="flex-grow">
        <motion.section 
          className="bg-gradient-to-r from-primary to-primary-dark text-white py-16 relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div 
              className="absolute w-96 h-96 bg-primary-light rounded-full opacity-20" 
              style={{ filter: 'blur(80px)', top: '-10%', right: '5%' }}
              animate={{
                scale: [1, 1.2, 1],
                x: [0, 30, 0],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
            <motion.div 
              className="absolute w-64 h-64 bg-secondary rounded-full opacity-20" 
              style={{ filter: 'blur(60px)', bottom: '-5%', left: '10%' }}
              animate={{
                scale: [1, 1.1, 1],
                y: [0, -20, 0],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
            <motion.div 
              className="absolute w-40 h-40 bg-secondary-light rounded-full opacity-20" 
              style={{ filter: 'blur(40px)', top: '30%', left: '25%' }}
              animate={{
                scale: [1, 1.3, 1],
                y: [0, 30, 0],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
            
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={gridPatternStyle}></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              className="flex flex-col lg:flex-row items-center justify-between gap-8 max-w-6xl mx-auto"
              variants={staggerContainer(0.1, 0.2)}
              initial="hidden"
              animate="show"
            >
              <motion.div className="lg:w-1/2 text-center lg:text-left" variants={fadeIn("right", 0.3)}>
                <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                  {t('database.title')}
                </h1>
                <p className="text-xl mb-8 text-gray-100 lg:pr-8">
                  {t('database.subtitle')}
                </p>
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                  <motion.button 
                    className="bg-secondary hover:bg-secondary-light text-white font-medium py-2 px-6 rounded-full flex items-center"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <IconComponent icon={HiOutlineAcademicCap} className="mr-2 text-xl" /> {t('database.explorePrograms')}
                  </motion.button>
                  <motion.button 
                    className="bg-transparent hover:bg-white/10 border border-white text-white font-medium py-2 px-6 rounded-full flex items-center"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <IconComponent icon={FaGlobe} className="mr-2" /> {t('database.topUniversities')}
                  </motion.button>
                </div>
              </motion.div>
              
              <motion.div 
                className="lg:w-1/2 w-full max-w-lg"
                variants={fadeIn("left", 0.4)}
              >
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/30">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <IconComponent icon={FaSearch} className="mr-2" /> {t('database.advancedSearch')}
                  </h3>
                  <div className="mb-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={t('database.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-5 py-3 pr-12 rounded-lg bg-white/80 backdrop-blur-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-secondary placeholder-gray-500"
                      />
                      <IconComponent icon={FaSearch} className="absolute right-4 top-3.5 text-gray-600" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <select
                        name="country"
                        value={filters.country}
                        onChange={handleFilterChange}
                        className="w-full p-2 border-0 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                      >
                        <option value="">{t('database.allCountries')}</option>
                        <option value="USA">USA</option>
                        <option value="UK">UK</option>
                        <option value="Canada">Canada</option>
                        <option value="Australia">Australia</option>
                        <option value="Germany">Germany</option>
                      </select>
                    </div>
                    <div>
                      <select
                        name="major"
                        value={filters.major}
                        onChange={handleFilterChange}
                        className="w-full p-2 border-0 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                      >
                        <option value="">{t('database.allMajors')}</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Business">Business</option>
                        <option value="Medicine">Medicine</option>
                        <option value="Law">Law</option>
                        <option value="AI">AI & Machine Learning</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="bg-secondary hover:bg-secondary-light text-white py-2 px-4 rounded-lg w-full flex items-center justify-center"
                    >
                      <IconComponent icon={FaSearch} className="mr-2" /> {t('common.search')}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={resetFilters}
                      className="bg-white/30 hover:bg-white/40 text-white py-2 px-4 rounded-lg flex items-center justify-center"
                    >
                      {t('database.reset')}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <motion.div 
              className="bg-white rounded-2xl shadow-xl overflow-hidden mb-10"
              variants={fadeIn("up", 0.3)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
            >
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center">
                    <IconComponent icon={FaFilter} className="text-primary mr-2" />
                    <h2 className="text-xl font-bold text-gray-800">{t('database.advancedFilters')}</h2>
                  </div>
                  <div className="flex items-center gap-3">
                   
                    
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                    >
                      <option value="qsRanking">{t('database.sortQSLowHigh')}</option>
                      <option value="qsRankingDesc">{t('database.sortQSHighLow')}</option>
                      <option value="name">{t('database.sortNameAZ')}</option>
                      <option value="nameDesc">{t('database.sortNameZA')}</option>
                      <option value="country">{t('database.sortCountryAZ')}</option>
                    </select>
                    
                    {/* AI Analysis Button */}
                    <motion.button
                      onClick={handleAIAnalysis}
                      disabled={isLoadingAI}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-2 rounded flex items-center text-sm disabled:opacity-50"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <IconComponent icon={FaRobot} className="mr-1" /> 
                      {isLoadingAI ? t('database.analyzing') : t('database.aiAnalysis')}
                    </motion.button>
                    
                    {/* Get Recommendations Button */}
                    <motion.button
                      onClick={handleGetRecommendations}
                      disabled={isLoadingAI}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-2 rounded flex items-center text-sm disabled:opacity-50"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <IconComponent icon={FaLightbulb} className="mr-1" /> 
                      {isLoadingAI ? t('common.loading') : t('database.getRecommendations')}
                    </motion.button>
                    
                 
                  </div>
                </div>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                        <IconComponent icon={HiOutlineLocationMarker} className="mr-2" /> Location
                      </h3>
                      <select
                        name="country"
                        value={filters.country}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary mb-3"
                      >
                        <option value="">All Countries</option>
                        <option value="USA">United States</option>
                        <option value="UK">United Kingdom</option>
                        <option value="Canada">Canada</option>
                        <option value="Australia">Australia</option>
                        <option value="Germany">Germany</option>
                        <option value="France">France</option>
                        <option value="Japan">Japan</option>
                        <option value="Singapore">Singapore</option>
                        <option value="Switzerland">Switzerland</option>
                        <option value="China">China</option>
                        <option value="Hong Kong">Hong Kong</option>
                      </select>
                      
                      <select
                        name="region"
                        value={filters.region}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">All Regions</option>
                        <option value="United States">United States</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Canada">Canada</option>
                        <option value="Australia">Australia</option>
                        <option value="Europe">Europe</option>
                        <option value="Asia">Asia</option>
                      </select>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                        <IconComponent icon={FaGraduationCap} className="mr-2" /> Field of Study
                      </h3>
                      <select
                        name="major"
                        value={filters.major}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">All Fields</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Business">Business & Management</option>
                        <option value="Medicine">Medicine & Health</option>
                        <option value="Law">Law</option>
                        <option value="AI">AI & Machine Learning</option>
                        <option value="Physics">Physics</option>
                        <option value="Economics">Economics</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Psychology">Psychology</option>
                      </select>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                        <IconComponent icon={FaTrophy} className="mr-2" /> Rankings
                      </h3>
                      <select
                        name="rankingType"
                        value={filters.rankingType}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary mb-3"
                      >
                        <option value="">All Rankings</option>
                        <option value="QS World University Rankings">QS World University Rankings</option>
                        <option value="TIMES World University Rankings">TIMES World University Rankings</option>
                        <option value="ARWU World University Rankings">ARWU World University Rankings</option>
                        <option value="US News World University Rankings">US News World University Rankings</option>
                      </select>
                      
                      <div className="px-2">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Top 1</span>
                          <span>Top 1000</span>
                        </div>
                        <input 
                          type="range"
                          min="1"
                          max="1000"
                          value={filters.qsRankingRange[1]}
                          onChange={(e) => handleRangeChange('qsRankingRange', [1, parseInt(e.target.value)])}
                          className="w-full accent-secondary"
                        />
                        <div className="text-center mt-1 text-sm font-medium text-primary">
                          Top {filters.qsRankingRange[1]}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                        <IconComponent icon={FaCalendarAlt} className="mr-2" /> Application & Year
                      </h3>
                      <div className="flex items-center mb-3">
                        <input
                          type="checkbox"
                          id="openApplications"
                          name="showOnlyOpenApplications"
                          checked={filters.showOnlyOpenApplications}
                          onChange={handleFilterChange}
                          className="mr-2 accent-secondary h-4 w-4"
                        />
                        <label htmlFor="openApplications" className="text-gray-700 text-sm">
                          Show only open applications
                        </label>
                      </div>
                      
                      <select
                        name="rankingYear"
                        value={filters.rankingYear}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">All Years</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                        <option value="2022">2022</option>
                        <option value="2021">2021</option>
                        <option value="2020">2020</option>
                      </select>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                        <IconComponent icon={FaGraduationCap} className="mr-2" /> Additional Filters
                      </h3>
                      <select
                        name="admissionDifficulty"
                        value={filters.admissionDifficulty}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary mb-3"
                      >
                        <option value="">Any Difficulty</option>
                        <option value="high">Highly Competitive</option>
                        <option value="medium">Moderately Competitive</option>
                        <option value="low">Less Competitive</option>
                      </select>
                      
                      <select
                        name="campusType"
                        value={filters.campusType}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary mb-3"
                      >
                        <option value="">All Campus Types</option>
                        <option value="Urban">Urban</option>
                        <option value="Suburban">Suburban</option>
                        <option value="Rural">Rural</option>
                      </select>
                      
                      <select
                        name="studentPopulation"
                        value={filters.studentPopulation}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary mb-3"
                      >
                        <option value="">All Sizes</option>
                        <option value="small">Small (≤15,000)</option>
                        <option value="medium">Medium (15,001-40,000)</option>
                        <option value="large">Large ({'>'}40,000)</option>
                      </select>
                      
                      <select
                        name="acceptanceRate"
                        value={filters.acceptanceRate}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">All Acceptance Rates</option>
                        <option value="low">Highly Selective (≤10%)</option>
                        <option value="medium">Moderately Selective (11-50%)</option>
                        <option value="high">Less Selective ({'>'}50%)</option>
                      </select>
                    </div>
                  </div>
                    </div>
                    
                <div className="md:col-span-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h2 className="text-lg font-bold text-primary">Results ({sortedUniversities.length})</h2>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                        <button 
                          onClick={() => setViewMode('list')} 
                          className={`p-2 ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-700'}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => setViewMode('grid')} 
                          className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-700'}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                        </button>
                      </div>
                      {compareList.length > 0 && (
                      <motion.button
                        onClick={handleOpenCompare}
                        className="bg-secondary text-white px-3 py-2 rounded flex items-center text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <IconComponent icon={FaTrophy} className="mr-1" /> Compare ({compareList.length})
                      </motion.button>
                    )}
                    
                    {compareList.length === 0 && (
                      <motion.button
                        onClick={handleOpenCompare}
                        className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-2 rounded flex items-center text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <IconComponent icon={FaRobot} className="mr-1" /> Smart Compare
                      </motion.button>
                    )}
                    
                   
                      {/* AI Analysis and Recommendation buttons */}
                 
                      
                    
                  </div>
                </div>
                  
                  {sortedUniversities.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <div className="text-gray-400 text-5xl mb-4">
                        <IconComponent icon={FaUniversity} className="mx-auto" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-700 mb-2">No Universities Found</h3>
                      <p className="text-gray-600 mb-4">
                        Try adjusting your filters or search criteria to see more results.
                      </p>
                      <button 
                        onClick={resetFilters}
                        className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded"
                      >
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    <motion.div
                      variants={staggerContainer(0.05, 0)}
                      initial="hidden"
                      animate="show"
                      className={viewMode === 'grid' ? 
                        (isMobile ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4') : 
                        'space-y-4'
                      }
                    >
                      {currentUniversities.map((university) => (
                        viewMode === 'grid' ? (
                          <UniversityCard 
                            key={university.id}
                            university={university}
                            onSelect={() => {
                              setSelectedUniversity(university);
                              setShowDetailModal(true);
                            }}
                            inCompareList={compareList.some(u => u.id === university.id)}
                            onToggleCompare={() => toggleCompare(university)}
                          />
                        ) : (
                          <UniversityListItem 
                            key={university.id}
                            university={university}
                            onSelect={() => {
                              setSelectedUniversity(university);
                              setShowDetailModal(true);
                            }}
                            inCompareList={compareList.some(u => u.id === university.id)}
                            onToggleCompare={() => toggleCompare(university)}
                          />
                        )
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <motion.div 
                className="flex flex-col sm:flex-row justify-center items-center mt-8 mb-10 space-y-4 sm:space-y-0 sm:space-x-4"
                variants={fadeIn("up", 0.2)}
                initial="hidden"
                animate="show"
              >
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPage === 1 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-primary text-white hover:bg-primary-dark'
                    }`}
                  >
                    Previous
                  </motion.button>

                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber: number;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }

                      return (
                        <motion.button
                          key={pageNumber}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                            currentPage === pageNumber
                              ? 'bg-primary text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {pageNumber}
                        </motion.button>
                      );
                    })}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPage === totalPages 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-primary text-white hover:bg-primary-dark'
                    }`}
                  >
                    Next
                  </motion.button>
                </div>

                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1}-{Math.min(endIndex, sortedUniversities.length)} of {sortedUniversities.length} universities
                </div>
              </motion.div>
            )}

            {/* Enhanced Filter Section - Removed and integrated into main filters */}

          </div>
        </section>
      </main>
      <Footer />
      
      {/* University Detail Modal */}
      {showDetailModal && selectedUniversity && (
        <UniversityDetailModal 
          university={selectedUniversity} 
          onClose={() => setShowDetailModal(false)}
          inCompareList={compareList.some(u => u.id === selectedUniversity.id)}
          onToggleCompare={() => toggleCompare(selectedUniversity)}
        />
      )}
      
      {/* Compare Universities Modal */}
      {showCompare && (
        <CompareUniversitiesModal 
          universities={compareList}
          onClose={() => setShowCompare(false)}
          onRemove={toggleCompare}
          aiRecommendedId={recommendedUniversities.length > 0 ? recommendedUniversities[0].id : undefined}
          isAutoGenerating={isAutoGeneratingRecommendation}
        />
      )}

      {/* AI Analysis Modal */}
      {showAIAnalysis && aiAnalysisData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <IconComponent icon={FaRobot} className="mr-3 text-2xl" />
                  <div>
                    <h2 className="text-2xl font-bold">AI Analysis Report</h2>
                    <p className="text-purple-100">Personalized insights based on your profile</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAIAnalysis(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                    <IconComponent icon={FaTrophy} className="mr-2" /> Academic Strength
                  </h3>
                  <div className="text-3xl font-bold text-blue-600 mb-2">{aiAnalysisData.academicStrength}%</div>
                  <div className="w-full bg-blue-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${aiAnalysisData.academicStrength}%` }}
                    ></div>
                  </div>
                  <p className="text-blue-700 mt-2 text-sm">
                    Competitive Level: <span className="font-semibold">{aiAnalysisData.competitiveLevel}</span>
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                    <IconComponent icon={FaDollarSign} className="mr-2" /> Budget Analysis
                  </h3>
                  <div className="text-lg font-bold text-green-600 mb-2">{aiAnalysisData.budgetAnalysis.level}</div>
                  <p className="text-green-700 text-sm mb-3">{aiAnalysisData.budgetAnalysis.recommendation}</p>
                  <div className="text-sm text-green-600">
                    <span className="font-semibold">{aiAnalysisData.budgetAnalysis.affordableOptions}</span> universities match your budget
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center">
                    <IconComponent icon={FaGlobe} className="mr-2" /> Recommended Regions
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {aiAnalysisData.recommendedRegions.map((region: string, index: number) => (
                      <span key={index} className="bg-orange-200 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                        {region}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center">
                    <IconComponent icon={FaLightbulb} className="mr-2" /> Suggestions
                  </h3>
                  <ul className="space-y-2">
                    {aiAnalysisData.suggestions.map((suggestion: string, index: number) => (
                      <li key={index} className="text-purple-700 text-sm flex items-start">
                        <span className="text-purple-500 mr-2">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Recommendations Modal */}
      {showRecommendations && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <IconComponent icon={FaLightbulb} className="mr-3 text-2xl" />
                  <div>
                    <h2 className="text-2xl font-bold">Personalized Recommendations</h2>
                    <p className="text-blue-100">Top 5 universities matched to your profile</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowRecommendations(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
              {recommendedUniversities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendedUniversities.map((university, index) => (
                    <motion.div
                      key={university.id}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center mb-4">
                        <div className="bg-white rounded-lg p-2 mr-3">
                          <img 
                            src={university.logo} 
                            alt={`${university.name} logo`} 
                            className="h-12 w-12 object-contain"
                          />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg">{university.name}</h3>
                          <p className="text-gray-600 text-sm flex items-center">
                            <IconComponent icon={HiOutlineLocationMarker} className="mr-1" />
                            {university.country}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">QS Ranking:</span>
                          <span className="font-semibold text-primary">#{university.qsRanking}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tuition:</span>
                          <span className="font-semibold text-green-600">{university.tuitionFees.undergraduate}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Min GPA:</span>
                          <span className="font-semibold">{university.admissionRequirements.minGPA}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-4">
                        {university.majorStrengths.slice(0, 3).map((major, idx) => (
                          <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {major}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            setSelectedUniversity(university);
                            setShowDetailModal(true);
                            setShowRecommendations(false);
                          }}
                          className="flex-1 bg-primary hover:bg-primary-dark text-white py-2 px-3 rounded-lg text-sm font-medium"
                        >
                          View Details
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => toggleCompare(university)}
                          className={`py-2 px-3 rounded-lg text-sm font-medium ${
                            compareList.some(u => u.id === university.id)
                              ? 'bg-secondary text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {compareList.some(u => u.id === university.id) ? 'Added' : 'Compare'}
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <IconComponent icon={FaUniversity} className="text-6xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-700 mb-2">No Recommendations Found</h3>
                  <p className="text-gray-600 mb-4">
                    Please complete your profile with academic scores and preferences to get personalized recommendations.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setShowRecommendations(false);
                      // Navigate to profile page
                      window.location.href = '/profile';
                    }}
                    className="bg-primary hover:bg-primary-dark text-white py-2 px-6 rounded-lg font-medium"
                  >
                    Complete Profile
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Profile Completion Modal */}
      {showProfileModal && (
        <ProfileCompletionModal onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  );
};

export default Database; 