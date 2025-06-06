import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaFilter, FaMapMarkerAlt, FaDollarSign, FaGraduationCap, FaUsers, FaStar, FaHeart, FaEye, FaPlus, FaTimes, FaChevronDown, FaChevronUp, FaRobot, FaLightbulb, FaUser, FaSpinner, FaExternalLinkAlt, FaUniversity, FaGlobe, FaCalendarAlt, FaBookOpen, FaAward, FaChartLine, FaBuilding, FaPhone, FaEnvelope, FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaBookmark, FaSortAmountDown, FaTrophy } from 'react-icons/fa';
import { HiOutlineAcademicCap, HiOutlineLocationMarker } from 'react-icons/hi';
import { RiArrowDropDownLine, RiArrowDropUpLine } from 'react-icons/ri';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import IconComponent from '../components/ui/IconComponent';
import { fadeIn, staggerContainer, slideIn } from '../utils/animations';
import { useAuth } from '../utils/AuthContext';
import { universityAPI } from '../utils/apiService';
import { useLanguage } from '../utils/LanguageContext';
import { userProfileAPI, UserProfile } from '../utils/userProfileAPI';

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
  // Additional admission requirements fields
  min_gpa_required: number;
  sat_score_required: string;
  act_score_required: string;
  ielts_score_required: string;
  toefl_score_required: string;
  gre_score_required: string;
  gmat_score_required: string;
  application_deadline_fall: string;
  application_deadline_spring: string;
  application_deadline_summer: string;
  tuition_fee_graduate: number;
  scholarship_available: boolean;
  financial_aid_available: boolean;
  application_requirements: string[];
  admission_essay_required: boolean;
  letters_of_recommendation_required: number;
  interview_required: boolean;
  work_experience_required: boolean;
  portfolio_required: boolean;
  // Additional properties used in the component
  qsRanking: number;
  majorStrengths: string[];
  applicationDeadlines: {
    fall: string;
    spring: string;
    summer?: string;
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
    essayRequired: boolean;
    lettersOfRecommendation: number;
    interviewRequired: boolean;
    workExperienceRequired: boolean;
    portfolioRequired: boolean;
    applicationRequirements: string[];
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
  scholarshipInfo: {
    available: boolean;
    financialAidAvailable: boolean;
  };
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
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header with university image */}
        <div className="relative">
          {university.image && (
            <div className="h-48 bg-gradient-to-r from-gray-100 to-gray-200 overflow-hidden">
              <img 
                src={university.image} 
                alt={`${university.name} campus`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-5">
            <div className="flex justify-between items-start">
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
                  <h2 className="text-xl font-bold text-white">{university.name}</h2>
                  <div className="flex items-center text-white/80 text-sm">
                    <IconComponent icon={HiOutlineLocationMarker} className="mr-1" />
                    <span>{university.city}, {university.state ? `${university.state}, ` : ''}{university.country}</span>
                    <span className="mx-2">•</span>
                    <span>Rank #{university.ranking || university.qsRanking}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
          {/* Action buttons */}
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
            
            {university.website && (
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
            )}
            
            {university.applicationLink && university.applicationLink !== '#' && (
              <motion.a
                href={university.applicationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors font-medium text-sm flex items-center"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Apply Now <IconComponent icon={FaExternalLinkAlt} className="ml-2" />
              </motion.a>
            )}
          </div>

          {/* University Description */}
          {university.description && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                <IconComponent icon={FaInfoCircle} className="mr-2 text-primary" /> About University
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed">{university.description}</p>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div>
              {/* Basic Information */}
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <IconComponent icon={FaUniversity} className="mr-2 text-primary" /> Basic Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Established</span>
                    <span className="font-medium text-gray-800">{university.established_year || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Type</span>
                    <span className="font-medium text-gray-800">{university.type || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Campus Type</span>
                    <span className="font-medium text-gray-800">{university.campus_type || university.campusType || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Campus Size</span>
                    <span className="font-medium text-gray-800">{university.campus_size || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Accreditation</span>
                    <span className="font-medium text-gray-800">{university.accreditation || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Tuition & Fees */}
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <IconComponent icon={FaDollarSign} className="mr-2 text-primary" /> Tuition & Fees
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Annual Tuition</span>
                    <span className="font-medium text-gray-800">{formatTuitionFee(university.tuition_fee)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Application Fee</span>
                    <span className="font-medium text-gray-800">{university.application_fee ? `$${university.application_fee}` : 'Contact for details'}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Graduate Tuition</span>
                    <span className="font-medium text-gray-800">{university.tuitionFees?.graduate || 'Contact for details'}</span>
                  </div>
                </div>
              </div>
              
              {/* Application Deadlines */}
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <IconComponent icon={FaCalendarAlt} className="mr-2 text-primary" /> Application Deadlines
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Fall Intake</span>
                    <span className="font-medium text-gray-800">{university.applicationDeadlines?.fall || 'Contact University'}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Spring Intake</span>
                    <span className="font-medium text-gray-800">{university.applicationDeadlines?.spring || 'Contact University'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column */}
            <div>
              {/* Statistics */}
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <IconComponent icon={FaChartLine} className="mr-2 text-primary" /> Statistics
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Acceptance Rate</span>
                    <span className="font-medium text-gray-800">{formatAcceptanceRate(university.acceptance_rate)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Student Population</span>
                    <span className="font-medium text-gray-800">{formatStudentPopulation(university.student_population)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Faculty Count</span>
                    <span className="font-medium text-gray-800">{university.faculty_count?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Student-Faculty Ratio</span>
                    <span className="font-medium text-gray-800">
                      {university.student_population && university.faculty_count 
                        ? `${Math.round(university.student_population / university.faculty_count)}:1`
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Admission Requirements */}
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <IconComponent icon={FaGraduationCap} className="mr-2 text-primary" /> Admission Requirements
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Minimum GPA</span>
                    <span className="font-medium text-gray-800">{university.admissionRequirements?.minGPA || 'Contact University'}</span>
                  </div>
                  
                  {university.admissionRequirements?.testScores && university.admissionRequirements.testScores.length > 0 && (
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
                  )}
                  
                  {university.admissionRequirements?.languageRequirements && university.admissionRequirements.languageRequirements.length > 0 && (
                    <div className="py-2 border-b border-gray-200">
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
                  )}

                  {/* Additional Requirements */}
                  <div className="py-2 border-b border-gray-200">
                    <p className="text-gray-600 mb-2">Additional Requirements</p>
                    <div className="space-y-2">
                      {university.admissionRequirements?.essayRequired && (
                        <div className="flex items-center text-sm">
                          <IconComponent icon={FaCheckCircle} className="text-green-500 mr-2" />
                          <span className="text-gray-700">Admission Essay Required</span>
                        </div>
                      )}
                      {university.admissionRequirements?.lettersOfRecommendation > 0 && (
                        <div className="flex items-center text-sm">
                          <IconComponent icon={FaCheckCircle} className="text-green-500 mr-2" />
                          <span className="text-gray-700">
                            {university.admissionRequirements.lettersOfRecommendation} Letter(s) of Recommendation
                          </span>
                        </div>
                      )}
                      {university.admissionRequirements?.interviewRequired && (
                        <div className="flex items-center text-sm">
                          <IconComponent icon={FaCheckCircle} className="text-green-500 mr-2" />
                          <span className="text-gray-700">Interview Required</span>
                        </div>
                      )}
                      {university.admissionRequirements?.workExperienceRequired && (
                        <div className="flex items-center text-sm">
                          <IconComponent icon={FaCheckCircle} className="text-green-500 mr-2" />
                          <span className="text-gray-700">Work Experience Required</span>
                        </div>
                      )}
                      {university.admissionRequirements?.portfolioRequired && (
                        <div className="flex items-center text-sm">
                          <IconComponent icon={FaCheckCircle} className="text-green-500 mr-2" />
                          <span className="text-gray-700">Portfolio Required</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Application Requirements List */}
                  {university.admissionRequirements?.applicationRequirements && university.admissionRequirements.applicationRequirements.length > 0 && (
                    <div className="py-2">
                      <p className="text-gray-600 mb-2">Application Requirements</p>
                      <div className="space-y-1">
                        {university.admissionRequirements.applicationRequirements.map((req, index) => (
                          <div key={index} className="flex items-start text-sm">
                            <span className="text-gray-400 mr-2">•</span>
                            <span className="text-gray-700">{req}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <IconComponent icon={FaPhone} className="mr-2 text-primary" /> Contact Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  {university.contact_email && (
                    <div className="flex items-center py-2 border-b border-gray-200">
                      <IconComponent icon={FaEnvelope} className="mr-2 text-gray-500" />
                      <span className="text-gray-600 mr-2">Email:</span>
                      <a href={`mailto:${university.contact_email}`} className="font-medium text-primary hover:underline">
                        {university.contact_email}
                      </a>
                    </div>
                  )}
                  {university.contact_phone && (
                    <div className="flex items-center py-2 border-b border-gray-200">
                      <IconComponent icon={FaPhone} className="mr-2 text-gray-500" />
                      <span className="text-gray-600 mr-2">Phone:</span>
                      <a href={`tel:${university.contact_phone}`} className="font-medium text-primary hover:underline">
                        {university.contact_phone}
                      </a>
                    </div>
                  )}
                  {university.address && (
                    <div className="flex items-start py-2">
                      <IconComponent icon={HiOutlineLocationMarker} className="mr-2 text-gray-500 mt-1" />
                      <div>
                        <span className="text-gray-600">Address:</span>
                        <p className="font-medium text-gray-800">{university.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Scholarship & Financial Aid */}
              {(university.scholarshipInfo?.available || university.scholarshipInfo?.financialAidAvailable) && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <IconComponent icon={FaDollarSign} className="mr-2 text-primary" /> Scholarships & Financial Aid
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-3">
                      {university.scholarshipInfo.available && (
                        <div className="flex items-center py-2">
                          <IconComponent icon={FaCheckCircle} className="text-green-500 mr-2" />
                          <span className="text-gray-700">Scholarships Available</span>
                        </div>
                      )}
                      {university.scholarshipInfo.financialAidAvailable && (
                        <div className="flex items-center py-2">
                          <IconComponent icon={FaCheckCircle} className="text-green-500 mr-2" />
                          <span className="text-gray-700">Financial Aid Available</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Programs Offered */}
          {university.programs_offered && university.programs_offered.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <IconComponent icon={FaBookOpen} className="mr-2 text-primary" /> Programs Offered
              </h3>
              <div className="flex flex-wrap gap-2">
                {university.programs_offered.map((program, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm">
                    {program}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Facilities */}
          {university.facilities && university.facilities.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <IconComponent icon={FaBuilding} className="mr-2 text-primary" /> Facilities
              </h3>
              <div className="flex flex-wrap gap-2">
                {university.facilities.map((facility, index) => (
                  <span key={index} className="bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm">
                    {facility}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notable Alumni */}
          {university.notable_alumni && university.notable_alumni.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <IconComponent icon={FaAward} className="mr-2 text-primary" /> Notable Alumni
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {university.notable_alumni.map((alumni, index) => (
                    <div key={index} className="text-gray-700">• {alumni}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Gallery */}
          {university.gallery && university.gallery.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <IconComponent icon={FaEye} className="mr-2 text-primary" /> Campus Gallery
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {university.gallery.slice(0, 6).map((image, index) => (
                  <div key={index} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={image} 
                      alt={`${university.name} campus ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
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
  const { user, session } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    country: '',
    qsRanking: [1, 2000],
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
    qsRankingRange: [1, 2000],
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
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);
  const [availableRankingTypes, setAvailableRankingTypes] = useState<string[]>([]);
  const [availableCampusTypes, setAvailableCampusTypes] = useState<string[]>([]);
  const [availableUniversityTypes, setAvailableUniversityTypes] = useState<string[]>([]);
  const [availableMajors, setAvailableMajors] = useState<string[]>([]);
  const [availableRankingYears, setAvailableRankingYears] = useState<number[]>([]);
  const [qsRankingRange, setQsRankingRange] = useState<[number, number]>([1, 2000]);
  const [tuitionFeeRange, setTuitionFeeRange] = useState<[number, number]>([0, 100000]);

  const extractFilterOptions = (universitiesData: University[]) => {
    // Extract unique countries
    const countries = Array.from(new Set(universitiesData.map(uni => uni.country).filter(Boolean)));
    setAvailableCountries(countries);

    // Extract unique regions
    const regions = Array.from(new Set(universitiesData.map(uni => uni.region).filter(Boolean)));
    setAvailableRegions(regions);

    // Extract unique ranking types
    const rankingTypes = Array.from(new Set(universitiesData.map(uni => uni.rankingType).filter(Boolean)));
    setAvailableRankingTypes(rankingTypes);

    // Extract unique campus types
    const campusTypes = Array.from(new Set(universitiesData.map(uni => uni.campusType || uni.campus_type).filter(Boolean)));
    setAvailableCampusTypes(campusTypes);

    // Extract unique university types
    const universityTypes = Array.from(new Set(universitiesData.map(uni => uni.type).filter(Boolean)));
    setAvailableUniversityTypes(universityTypes);

    // Extract unique majors from programs_offered
    const allMajors = universitiesData.flatMap(uni => uni.programs_offered || uni.majorStrengths || []);
    const uniqueMajors = Array.from(new Set(allMajors.filter(Boolean)));
    setAvailableMajors(uniqueMajors);

    // Extract unique ranking years
    const rankingYears = Array.from(new Set(universitiesData.map(uni => uni.rankingYear).filter(Boolean)));
    setAvailableRankingYears(rankingYears.sort((a, b) => b - a)); // Sort descending

    // Calculate QS ranking range
    const rankings = universitiesData.map(uni => uni.qsRanking || uni.ranking).filter(r => r && r > 0);
    if (rankings.length > 0) {
      const minRanking = Math.min(...rankings);
      const maxRanking = Math.max(...rankings);
      setQsRankingRange([minRanking, maxRanking]);
    }

    // Calculate tuition fee range
    const tuitionFees = universitiesData.map(uni => uni.tuition_fee).filter(f => f && f > 0);
    if (tuitionFees.length > 0) {
      const minFee = Math.min(...tuitionFees);
      const maxFee = Math.max(...tuitionFees);
      setTuitionFeeRange([minFee, maxFee]);
    }
  };

  const testAPICall = async () => {
    console.log('Testing API call manually...');
    try {
      const response = await universityAPI.getAll(1, 100);
      console.log('Manual API test result:', response);
    } catch (error) {
      console.error('Manual API test error:', error);
    }
  };

  // Fetch available countries for filter dropdown
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await universityAPI.getCountries();
        if (response.success && response.data && response.data.countries) {
          setAvailableCountries(response.data.countries);
        }
      } catch (error) {
        console.error('Error fetching countries:', error);
      }
    };

    fetchCountries();
  }, []);

  // Fetch universities data
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        setIsLoading(true);
        
        // Simplify the API call - get all universities first, then filter on frontend
        console.log('Fetching universities...');
        const response = await universityAPI.getAll(1, 100);
        
        console.log('API Response:', response);
        
        if (response.success && response.data) {
          let universitiesData = [];
          
          console.log('Response data structure:', response.data);
          
          // Handle both paginated and non-paginated responses
          if (response.data.universities) {
            // Paginated response
            universitiesData = response.data.universities;
            console.log('Using paginated response, universities:', universitiesData.length);
          } else if (Array.isArray(response.data)) {
            // Direct array response
            universitiesData = response.data;
            console.log('Using direct array response, universities:', universitiesData.length);
          } else {
            console.log('Unexpected response structure:', response.data);
          }
          
          // Transform the data to match our interface
          const transformedData = universitiesData.map((uni: any) => ({
            ...uni,
            // Fix QS ranking - use actual ranking or set to high number if not available
            qsRanking: uni.ranking && uni.ranking > 0 ? uni.ranking : 999,
            // Use programs_offered as majorStrengths
            majorStrengths: uni.programs_offered || [],
            applicationDeadlines: {
              fall: uni.application_deadline_fall || 'September 1',
              spring: uni.application_deadline_spring || 'January 15',
              summer: uni.application_deadline_summer || 'May 1'
            },
            admissionRequirements: {
              minGPA: uni.min_gpa_required || 3.0,
              testScores: [
                ...(uni.sat_score_required ? [{ name: 'SAT', score: uni.sat_score_required }] : []),
                ...(uni.act_score_required ? [{ name: 'ACT', score: uni.act_score_required }] : []),
                ...(uni.gre_score_required ? [{ name: 'GRE', score: uni.gre_score_required }] : []),
                ...(uni.gmat_score_required ? [{ name: 'GMAT', score: uni.gmat_score_required }] : [])
              ].filter(test => test.score),
              languageRequirements: [
                ...(uni.ielts_score_required ? [{ test: 'IELTS', score: uni.ielts_score_required }] : []),
                ...(uni.toefl_score_required ? [{ test: 'TOEFL', score: uni.toefl_score_required }] : [])
              ].filter(lang => lang.score),
              essayRequired: uni.admission_essay_required || false,
              lettersOfRecommendation: uni.letters_of_recommendation_required || 0,
              interviewRequired: uni.interview_required || false,
              workExperienceRequired: uni.work_experience_required || false,
              portfolioRequired: uni.portfolio_required || false,
              applicationRequirements: uni.application_requirements || []
            },
            tuitionFees: {
              undergraduate: `$${uni.tuition_fee?.toLocaleString() || '25,000'}/year`,
              graduate: `$${(uni.tuition_fee_graduate || uni.tuition_fee * 1.2 || 30000)?.toLocaleString()}/year`
            },
            applicationLink: uni.website || '#',
            rankingType: uni.ranking_type || 'QS World University Rankings',
            // Fix region mapping
            region: uni.region || (
              uni.country === 'United States' || uni.country === 'USA' ? 'North America' : 
              uni.country === 'United Kingdom' ? 'Europe' : 
              uni.country === 'Canada' ? 'North America' : 
              uni.country === 'india' || uni.country === 'India' ? 'Asia' :
              'Other'
            ),
            rankingYear: uni.ranking_year || 2024,
            acceptanceRate: `${uni.acceptance_rate || 50}%`,
            studentPopulation: uni.student_population?.toLocaleString() || '10,000',
            researchOutput: 'High',
            employmentRate: '85%',
            campusType: uni.campus_type || 'Urban',
            scholarshipInfo: {
              available: uni.scholarship_available || false,
              financialAidAvailable: uni.financial_aid_available || false
            }
          }));
          
          console.log('Transformed universities:', transformedData);
          setUniversities(transformedData);
          
          // Extract filter options from the fetched data
          extractFilterOptions(transformedData);
        } else {
          console.log('API call failed or no data:', response);
          setUniversities([]);
        }
      } catch (error) {
        console.error('Error fetching universities:', error);
        // Set empty array as fallback
        setUniversities([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUniversities();
  }, []); // Remove dependencies for now to avoid infinite loops

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
    
    // QS Ranking filter - be more inclusive for high rankings
    if (university.qsRanking > 0 && university.qsRanking < filters.qsRankingRange[0]) {
      return false;
    }
    
    // Only apply upper limit if it's not the maximum (2000)
    if (filters.qsRankingRange[1] < 2000 && university.qsRanking > filters.qsRankingRange[1]) {
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

  console.log('Universities from API:', universities.length);
  console.log('Filtered universities:', filteredUniversities.length);
  console.log('Current filters:', filters);

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
      qsRanking: [1, 2000],
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
      qsRankingRange: [1, 2000],
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
      alert('Please log in to get AI analysis');
      return;
    }

    // Check profile completion first
    if (userProfileCompletion < 50) {
      setShowProfileModal(true);
      return;
    }

    setIsLoadingAI(true);
    try {
      // Fetch user profile data using the userProfileAPI
      const profileResult = await userProfileAPI.getUserProfile(session);

      if (!profileResult.success || !profileResult.profile) {
        console.error('Error fetching profile:', profileResult.error);
        setShowProfileModal(true);
        setIsLoadingAI(false);
        return;
      }

      const profile = profileResult.profile;

      // Prepare user data for AI analysis
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

      const aiPrompt = `Please analyze this student's academic profile and provide detailed insights in XML format:

Student Profile:
${JSON.stringify(userData, null, 2)}

Please provide your analysis in this exact XML format:

<analysis>
  <academic_strength percentage="85">Strong academic performance with excellent GPA and test scores</academic_strength>
  <competitive_level>Highly Competitive</competitive_level>
  <budget_analysis>
    <level>Moderate Budget</level>
    <recommendation>Consider applying for merit-based scholarships</recommendation>
    <affordable_options>15</affordable_options>
  </budget_analysis>
  <recommended_regions>
    <region>North America</region>
    <region>Europe</region>
    <region>Australia</region>
  </recommended_regions>
  <suggestions>
    <suggestion>Focus on improving standardized test scores</suggestion>
    <suggestion>Consider applying for merit-based scholarships</suggestion>
    <suggestion>Build stronger research portfolio</suggestion>
  </suggestions>
</analysis>

Analyze their academic strength, competitiveness, budget considerations, recommended study regions, and provide actionable suggestions for improvement.`;

      // Call the AI API with streaming
      const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-80beadf6603b4832981d0d65896b1ae0',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "qvq-max",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: aiPrompt
                }
              ]
            }
          ],
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      let aiContent = '';
      let isAnswering = false;
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                  const delta = parsed.choices[0].delta;
                  
                  // Skip reasoning content, only collect the final answer
                  if (delta.reasoning_content) {
                    // This is the thinking process, we can skip it for analysis
                    continue;
                  } else if (delta.content) {
                    // This is the actual answer content
                    if (!isAnswering && delta.content.trim() !== '') {
                      isAnswering = true;
                    }
                    if (isAnswering) {
                      aiContent += delta.content;
                      // Update UI in real-time
                      setAiAnalysisData(aiContent);
                    }
                  }
                }
              } catch (parseError) {
                // Skip invalid JSON chunks
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

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
      // Fetch user profile data using the userProfileAPI
      const profileResult = await userProfileAPI.getUserProfile(session);

      if (!profileResult.success || !profileResult.profile) {
        console.error('Error fetching profile:', profileResult.error);
        setShowProfileModal(true);
        setIsLoadingAI(false);
        return;
      }

      const profile = profileResult.profile;

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

      // Call the AI API with streaming
      const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-80beadf6603b4832981d0d65896b1ae0',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "qvq-max",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: aiPrompt
                }
              ]
            }
          ],
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      let aiContent = '';
      let isAnswering = false;
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                  const delta = parsed.choices[0].delta;
                  
                  // Skip reasoning content, only collect the final answer
                  if (delta.reasoning_content) {
                    // This is the thinking process, we can skip it for recommendations
                    continue;
                  } else if (delta.content) {
                    // This is the actual answer content
                    if (!isAnswering && delta.content.trim() !== '') {
                      isAnswering = true;
                    }
                    if (isAnswering) {
                      aiContent += delta.content;
                    }
                  }
                }
              } catch (parseError) {
                // Skip invalid JSON chunks
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

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
        const profileResult = await userProfileAPI.getUserProfile(session);
        
        if (profileResult.success && profileResult.profile) {
          const fallbackRecommendations = generateUniversityRecommendations(profileResult.profile, universities);
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
      const result = await userProfileAPI.getProfileCompletion(session);
      
      if (result.success && result.completion_percentage !== undefined) {
        setUserProfileCompletion(result.completion_percentage);
      } else {
        // Fallback: try to get profile and calculate completion
        const profileResult = await userProfileAPI.getUserProfile(session);
        
        if (profileResult.success && profileResult.profile) {
          // Calculate completion based on required fields
          const requiredFields = [
            'full_name',
            'current_education_level', 
            'current_institution',
            'current_gpa',
            'graduation_year',
            'field_of_study',
            'preferred_field',
            'preferred_degree_level',
            'budget_range',
            'preferred_study_location'
          ];
          
          const totalFields = requiredFields.length;
          const completedFields = requiredFields.filter(field => {
            const value = profileResult.profile![field as keyof UserProfile];
            return value !== null && value !== undefined && value !== '' && value !== '0';
          }).length;
          
          const completion = Math.round((completedFields / totalFields) * 100);
          setUserProfileCompletion(completion);
        } else {
          // Profile doesn't exist
          setUserProfileCompletion(0);
        }
      }
    } catch (error) {
      console.error('Error checking profile completion:', error);
      setUserProfileCompletion(0);
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

  // Auto-generate recommendation for compare modal
  const autoGenerateRecommendation = async () => {
    if (!user) return;
    
    setIsAutoGeneratingRecommendation(true);
    
    try {
      const profileResult = await userProfileAPI.getUserProfile(session);
      
      if (!profileResult.success || !profileResult.profile) {
        console.error('Error fetching profile for auto-recommendation');
        setIsAutoGeneratingRecommendation(false);
        return;
      }

      const profile = profileResult.profile;

      const userData = {
        name: profile.full_name,
        currentEducation: profile.current_education_level,
        gpa: profile.current_gpa,
        fieldOfStudy: profile.field_of_study,
        preferredField: profile.preferred_field,
        budgetRange: profile.budget_range,
        preferredLocation: profile.preferred_study_location
      };

      // Use a smaller subset for faster processing
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
        const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer sk-80beadf6603b4832981d0d65896b1ae0',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "qvq-max",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: quickPrompt
                  }
                ]
              }
            ],
            stream: true
          })
        });

        if (response.ok) {
          // Handle streaming response
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body reader available');
          }

          let aiContent = '';
          let isAnswering = false;
          
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = new TextDecoder().decode(value);
              const lines = chunk.split('\n').filter(line => line.trim() !== '');
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') continue;
                  
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                      const delta = parsed.choices[0].delta;
                      
                      // Skip reasoning content, only collect the final answer
                      if (delta.reasoning_content) {
                        // This is the thinking process, we can skip it for quick recommendations
                        continue;
                      } else if (delta.content) {
                        // This is the actual answer content
                        if (!isAnswering && delta.content.trim() !== '') {
                          isAnswering = true;
                        }
                        if (isAnswering) {
                          aiContent += delta.content;
                        }
                      }
                    }
                  } catch (parseError) {
                    // Skip invalid JSON chunks
                    continue;
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }
          
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
                        {availableCountries.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
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
                        {availableMajors.slice(0, 10).map((major) => (
                          <option key={major} value={major}>
                            {major}
                          </option>
                        ))}
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
                   
                    
                 
                    
                    <motion.button
                      onClick={resetFilters}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm flex items-center"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {t('database.resetFilters')}
                    </motion.button>
                    
                    {/* AI Analysis Button */}
                    <motion.button
                      onClick={handleAIAnalysis}
                      disabled={isLoadingAI}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded text-sm flex items-center disabled:opacity-50"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <IconComponent icon={FaRobot} className="mr-2" />
                      {isLoadingAI ? t('common.loading') : t('database.aiAnalysis')}
                    </motion.button>
                    
                    {compareList.length > 0 && (
                      <motion.button
                        onClick={handleOpenCompare}
                        className="bg-secondary hover:bg-secondary-light text-white px-4 py-2 rounded text-sm flex items-center"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {t('database.compareUniversities')} ({compareList.length})
                      </motion.button>
                    )}
                    
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
                        {availableCountries.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                      
                      <select
                        name="region"
                        value={filters.region}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">All Regions</option>
                        {availableRegions.map((region) => (
                          <option key={region} value={region}>
                            {region}
                          </option>
                        ))}
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
                        {availableMajors.map((major) => (
                          <option key={major} value={major}>
                            {major}
                          </option>
                        ))}
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
                        {availableRankingTypes.map((rankingType) => (
                          <option key={rankingType} value={rankingType}>
                            {rankingType}
                          </option>
                        ))}
                      </select>
                      
                      <div className="px-2">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Top {qsRankingRange[0]}</span>
                          <span>Top {qsRankingRange[1]}</span>
                        </div>
                        <input 
                          type="range"
                          min={qsRankingRange[0]}
                          max={qsRankingRange[1]}
                          value={filters.qsRankingRange[1]}
                          onChange={(e) => handleRangeChange('qsRankingRange', [qsRankingRange[0], parseInt(e.target.value)])}
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
                        {availableRankingYears.map((year) => (
                          <option key={year} value={year.toString()}>
                            {year}
                          </option>
                        ))}
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
                        {availableCampusTypes.map((campusType) => (
                          <option key={campusType} value={campusType}>
                            {campusType}
                          </option>
                        ))}
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
                      <h3 className="text-xl font-bold text-gray-700 mb-2">
                        {isLoading ? 'Loading Universities...' : 'No Universities Found'}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {isLoading 
                          ? 'Please wait while we fetch university data...' 
                          : 'Try adjusting your filters or search criteria to see more results.'
                        }
                      </p>
                      {!isLoading && (
                        <button 
                          onClick={resetFilters}
                          className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded"
                        >
                          Reset Filters
                        </button>
                      )}
                      {isLoading && (
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      )}
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