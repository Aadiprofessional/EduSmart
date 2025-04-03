import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaSortAmountDown, FaExternalLinkAlt, FaUniversity, FaGlobe, FaGraduationCap, FaCalendarAlt, FaDollarSign, FaTrophy, FaChevronDown, FaChevronUp, FaBookmark } from 'react-icons/fa';
import { HiOutlineAcademicCap, HiOutlineLocationMarker } from 'react-icons/hi';
import { RiArrowDropDownLine, RiArrowDropUpLine } from 'react-icons/ri';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import IconComponent from '../components/ui/IconComponent';
import { motion } from 'framer-motion';
import { fadeIn, staggerContainer, slideIn } from '../utils/animations';

interface University {
  id: number;
  name: string;
  country: string;
  qsRanking: number;
  tuitionFees: {
    undergraduate: string;
    graduate: string;
  };
  admissionRequirements: {
    minGPA: number;
    testScores: {
      name: string;
      score: string;
    }[];
    languageRequirements: {
      test: string;
      score: string;
    }[];
  };
  applicationDeadlines: {
    fall: string;
    spring: string;
  };
  majorStrengths: string[];
  applicationLink: string;
  logo: string;
}

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
  return (
    <motion.div 
      className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300"
      variants={fadeIn("up", 0)}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className="relative h-36 bg-gradient-to-r from-gray-100 to-gray-200 flex justify-center items-center">
        <img 
          src={university.logo} 
          alt={`${university.name} logo`}
          className="h-24 w-24 object-contain"
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare();
            }}
            className={`p-2 rounded-full ${inCompareList ? 'bg-secondary text-white' : 'bg-white text-gray-600'}`}
          >
            <FaBookmark className="text-sm" />
          </motion.button>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-800 line-clamp-2">{university.name}</h3>
          <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-medium">#{university.qsRanking}</span>
        </div>
        
        <div className="text-sm text-gray-600 flex items-center mb-2">
          <HiOutlineLocationMarker className="mr-1" /> {university.country}
        </div>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {university.majorStrengths.slice(0, 3).map((major, index) => (
            <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
              {major}
            </span>
          ))}
          {university.majorStrengths.length > 3 && (
            <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
              +{university.majorStrengths.length - 3}
            </span>
          )}
        </div>
        
        <div className="text-xs text-gray-500 mb-4">
          <div className="flex justify-between mb-1">
            <span>Undergrad Tuition:</span>
            <span className="font-medium text-gray-700">{university.tuitionFees.undergraduate}</span>
          </div>
          <div className="flex justify-between">
            <span>Min GPA:</span>
            <span className="font-medium text-gray-700">{university.admissionRequirements.minGPA}</span>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onSelect}
          className="w-full bg-primary hover:bg-primary-dark text-white py-2 rounded-lg transition-colors font-medium text-sm flex items-center justify-center"
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
  return (
    <motion.div 
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-100"
      variants={fadeIn("up", 0)}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
    >
      <div className="flex flex-col sm:flex-row p-4 gap-4">
        <div className="sm:w-24 flex justify-center">
          <div className="bg-gray-50 rounded-lg p-2 h-20 w-20 flex items-center justify-center">
            <img 
              src={university.logo} 
              alt={`${university.name} logo`} 
              className="h-16 w-16 object-contain"
            />
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
            <h3 className="text-lg font-bold text-gray-800">{university.name}</h3>
            <div className="flex items-center mt-1 sm:mt-0 gap-2">
              <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-medium">Rank #{university.qsRanking}</span>
              <span className="text-gray-700 text-sm flex items-center">
                <HiOutlineLocationMarker className="mr-1" /> {university.country}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm mb-2">
            <div className="text-gray-600">
              <span className="font-medium text-gray-700">Undergrad:</span> {university.tuitionFees.undergraduate}
            </div>
            <div className="text-gray-600">
              <span className="font-medium text-gray-700">Grad:</span> {university.tuitionFees.graduate}
            </div>
            <div className="text-gray-600">
              <span className="font-medium text-gray-700">Min GPA:</span> {university.admissionRequirements.minGPA}
            </div>
            <div className="text-gray-600">
              <span className="font-medium text-gray-700">Fall Deadline:</span> {university.applicationDeadlines.fall}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1 mb-3">
            {university.majorStrengths.map((major, index) => (
              <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                {major}
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
                  <FaBookmark className="mr-1" /> Saved
                </>
              ) : (
                <>
                  <FaBookmark className="mr-1" /> Add to Compare
                </>
              )}
            </motion.button>
            
            <motion.a
              href={university.applicationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-secondary-dark font-medium text-sm flex items-center transition-colors"
              whileHover={{ x: 3 }}
            >
              Visit Website <FaExternalLinkAlt className="ml-1 text-xs" />
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
                src={university.logo} 
                alt={`${university.name} logo`} 
                className="h-12 w-12 object-contain"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold">{university.name}</h2>
              <div className="flex items-center text-white/80 text-sm">
                <HiOutlineLocationMarker className="mr-1" />
                <span>{university.country}</span>
                <span className="mx-2">•</span>
                <span>Rank #{university.qsRanking}</span>
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
                  <FaBookmark className="mr-2" /> Remove from Compare
                </>
              ) : (
                <>
                  <FaBookmark className="mr-2" /> Add to Compare
                </>
              )}
            </motion.button>
            
            <motion.a
              href={university.applicationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-lg transition-colors font-medium text-sm flex items-center"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Visit Official Website <FaExternalLinkAlt className="ml-2" />
            </motion.a>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <FaDollarSign className="mr-2 text-primary" /> Tuition & Fees
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Undergraduate</span>
                  <span className="font-medium text-gray-800">{university.tuitionFees.undergraduate}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Graduate</span>
                  <span className="font-medium text-gray-800">{university.tuitionFees.graduate}</span>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-gray-800 mt-6 mb-4 flex items-center">
                <FaCalendarAlt className="mr-2 text-primary" /> Application Deadlines
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
                <FaGraduationCap className="mr-2 text-primary" /> Admission Requirements
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
              <FaTrophy className="mr-2 text-primary" /> Major Strengths
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
}

const CompareUniversitiesModal: React.FC<CompareUniversitiesModalProps> = ({ universities, onClose, onRemove }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        className="bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center bg-gradient-to-r from-primary to-primary-dark text-white p-5">
          <h2 className="text-xl font-bold flex items-center">
            <FaTrophy className="mr-2" /> Compare Universities
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-x-auto">
          <table className="w-full min-w-[800px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="p-3 text-left bg-gray-50 sticky left-0 z-10 border-b border-r border-gray-200 min-w-[200px]">
                  <span className="text-gray-800 font-bold">University</span>
                </th>
                {universities.map((university) => (
                  <th key={university.id} className="p-3 border-b border-r border-gray-200 min-w-[250px]">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-white rounded-full p-2 mb-2 flex justify-center items-center shadow-sm">
                        <img 
                          src={university.logo} 
                          alt={`${university.name} logo`} 
                          className="h-12 w-12 object-contain"
                        />
                      </div>
                      <div className="font-bold text-primary text-center">{university.name}</div>
                      <div className="text-sm text-gray-600 flex items-center mt-1">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                          Rank #{university.qsRanking}
                        </span>
                      </div>
                      <button 
                        onClick={() => onRemove(university)}
                        className="mt-2 text-xs text-gray-500 hover:text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 bg-gray-50 sticky left-0 z-10 border-b border-r border-gray-200 font-medium text-gray-700">
                  Country
                </td>
                {universities.map((university) => (
                  <td key={university.id} className="p-3 text-center border-b border-r border-gray-200 text-gray-800">
                    {university.country}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 bg-gray-50 sticky left-0 z-10 border-b border-r border-gray-200 font-medium text-gray-700">
                  Undergrad Tuition
                </td>
                {universities.map((university) => (
                  <td key={university.id} className="p-3 text-center border-b border-r border-gray-200 text-gray-800">
                    {university.tuitionFees.undergraduate}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 bg-gray-50 sticky left-0 z-10 border-b border-r border-gray-200 font-medium text-gray-700">
                  Graduate Tuition
                </td>
                {universities.map((university) => (
                  <td key={university.id} className="p-3 text-center border-b border-r border-gray-200 text-gray-800">
                    {university.tuitionFees.graduate}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 bg-gray-50 sticky left-0 z-10 border-b border-r border-gray-200 font-medium text-gray-700">
                  Minimum GPA
                </td>
                {universities.map((university) => (
                  <td key={university.id} className="p-3 text-center border-b border-r border-gray-200 text-gray-800">
                    {university.admissionRequirements.minGPA}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 bg-gray-50 sticky left-0 z-10 border-b border-r border-gray-200 font-medium text-gray-700">
                  Language Requirements
                </td>
                {universities.map((university) => (
                  <td key={university.id} className="p-3 text-center border-b border-r border-gray-200 text-sm text-gray-800">
                    {university.admissionRequirements.languageRequirements.map((lang, i) => (
                      <div key={i}>
                        {lang.test}: {lang.score}
                      </div>
                    ))}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 bg-gray-50 sticky left-0 z-10 border-b border-r border-gray-200 font-medium text-gray-700">
                  Application Deadlines
                </td>
                {universities.map((university) => (
                  <td key={university.id} className="p-3 text-center border-b border-r border-gray-200 text-sm text-gray-800">
                    <div>Fall: {university.applicationDeadlines.fall}</div>
                    <div>Spring: {university.applicationDeadlines.spring}</div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 bg-gray-50 sticky left-0 z-10 border-b border-r border-gray-200 font-medium text-gray-700">
                  Major Strengths
                </td>
                {universities.map((university) => (
                  <td key={university.id} className="p-3 border-b border-r border-gray-200 text-sm text-gray-800">
                    <div className="flex flex-wrap justify-center gap-1">
                      {university.majorStrengths.map((major, i) => (
                        <span key={i} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                          {major}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 bg-gray-50 sticky left-0 z-10 border-r border-gray-200 font-medium text-gray-700">
                  Apply
                </td>
                {universities.map((university) => (
                  <td key={university.id} className="p-3 text-center border-r border-gray-200">
                    <a
                      href={university.applicationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-primary hover:bg-primary-dark text-white text-sm py-1.5 px-3 rounded-lg transition-colors"
                    >
                      Apply Now
                    </a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

const Database: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    country: '',
    major: '',
    qsRankingRange: [0, 1000],
    tuitionRange: [0, 100000],
    showOnlyOpenApplications: false,
    testScores: '',
    admissionDifficulty: ''
  });
  const [sortBy, setSortBy] = useState('qsRanking');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [compareList, setCompareList] = useState<University[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  // Sample university data
  const universities: University[] = [
    {
      id: 1,
      name: 'Massachusetts Institute of Technology (MIT)',
      country: 'USA',
      qsRanking: 1,
      tuitionFees: {
        undergraduate: '$55,878/year',
        graduate: '$58,240/year'
      },
      admissionRequirements: {
        minGPA: 4.0,
        testScores: [
          { name: 'SAT', score: '1500-1570' },
          { name: 'ACT', score: '34-36' },
          { name: 'GRE', score: '320+ (Graduate)' }
        ],
        languageRequirements: [
          { test: 'TOEFL', score: '100+' },
          { test: 'IELTS', score: '7.5+' }
        ]
      },
      applicationDeadlines: {
        fall: 'January 1',
        spring: 'October 1'
      },
      majorStrengths: ['Computer Science', 'Engineering', 'Physics', 'Mathematics', 'AI'],
      applicationLink: 'https://mitadmissions.org/',
      logo: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80'
    },
    {
      id: 2,
      name: 'Stanford University',
      country: 'USA',
      qsRanking: 3,
      tuitionFees: {
        undergraduate: '$56,169/year',
        graduate: '$57,861/year'
      },
      admissionRequirements: {
        minGPA: 3.95,
        testScores: [
          { name: 'SAT', score: '1480-1570' },
          { name: 'ACT', score: '33-35' },
          { name: 'GRE', score: '320+ (Graduate)' }
        ],
        languageRequirements: [
          { test: 'TOEFL', score: '100+' },
          { test: 'IELTS', score: '7.0+' }
        ]
      },
      applicationDeadlines: {
        fall: 'December 1',
        spring: 'October 15'
      },
      majorStrengths: ['Computer Science', 'Business', 'Engineering', 'Psychology', 'AI'],
      applicationLink: 'https://admission.stanford.edu/',
      logo: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80'
    },
    {
      id: 3,
      name: 'University of Oxford',
      country: 'UK',
      qsRanking: 2,
      tuitionFees: {
        undergraduate: '£28,370-£39,010/year',
        graduate: '£29,700-£45,520/year'
      },
      admissionRequirements: {
        minGPA: 3.8,
        testScores: [
          { name: 'SAT', score: '1470+' },
          { name: 'ACT', score: '33+' },
          { name: 'GMAT', score: '720+ (MBA)' }
        ],
        languageRequirements: [
          { test: 'TOEFL', score: '100+' },
          { test: 'IELTS', score: '7.0-7.5' }
        ]
      },
      applicationDeadlines: {
        fall: 'October 15',
        spring: 'N/A'
      },
      majorStrengths: ['Philosophy', 'Medicine', 'Law', 'Economics', 'History'],
      applicationLink: 'https://www.ox.ac.uk/admissions',
      logo: 'https://images.unsplash.com/photo-1580537659466-0a9bfa916a54?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80'
    }
  ];

  // Filter universities based on search and filters
  const filteredUniversities = universities.filter(university => {
    // Search query filter
    if (searchQuery && !university.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !university.country.toLowerCase().includes(searchQuery.toLowerCase())) {
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
      country: '',
      major: '',
      qsRankingRange: [0, 1000],
      tuitionRange: [0, 100000],
      showOnlyOpenApplications: false,
      testScores: '',
      admissionDifficulty: ''
    });
    setSearchQuery('');
  };

  const toggleCompare = (university: University) => {
    if (compareList.some(u => u.id === university.id)) {
      setCompareList(compareList.filter(u => u.id !== university.id));
    } else {
      if (compareList.length < 3) {
        setCompareList([...compareList, university]);
      } else {
        // Show notification that max 3 universities can be compared
        alert('You can compare maximum 3 universities at once');
      }
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
                  Global <span className="text-secondary">University</span> Explorer
                </h1>
                <p className="text-xl mb-8 text-gray-100 lg:pr-8">
                  Discover your perfect academic match with our comprehensive database of top universities worldwide.
                </p>
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                  <motion.button 
                    className="bg-secondary hover:bg-secondary-light text-white font-medium py-2 px-6 rounded-full flex items-center"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <HiOutlineAcademicCap className="mr-2 text-xl" /> Explore Programs
                  </motion.button>
                  <motion.button 
                    className="bg-transparent hover:bg-white/10 border border-white text-white font-medium py-2 px-6 rounded-full flex items-center"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <FaGlobe className="mr-2" /> Top Universities
                  </motion.button>
                </div>
              </motion.div>
              
              <motion.div 
                className="lg:w-1/2 w-full max-w-lg"
                variants={fadeIn("left", 0.4)}
              >
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/30">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <FaSearch className="mr-2" /> Advanced Search
                  </h3>
                  <div className="mb-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search for universities, programs, locations..."
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
                        <option value="">All Countries</option>
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
                        <option value="">All Majors</option>
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
                      <FaSearch className="mr-2" /> Search
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={resetFilters}
                      className="bg-white/30 hover:bg-white/40 text-white py-2 px-4 rounded-lg flex items-center justify-center"
                    >
                      Reset
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
                    <FaFilter className="text-primary mr-2" />
                    <h2 className="text-xl font-bold text-gray-800">Advanced Filters</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                      <button 
                        onClick={() => setViewMode('grid')} 
                        className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-700'}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => setViewMode('list')} 
                        className={`p-2 ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-700'}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>
                    </div>
                    
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                    >
                      <option value="qsRanking">QS Ranking: Low to High</option>
                      <option value="qsRankingDesc">QS Ranking: High to Low</option>
                      <option value="name">University Name: A to Z</option>
                      <option value="nameDesc">University Name: Z to A</option>
                      <option value="country">Country: A to Z</option>
                    </select>
                    
                    {compareList.length > 0 && (
                      <motion.button
                        onClick={() => setShowCompare(true)}
                        className="bg-secondary text-white px-3 py-2 rounded flex items-center text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FaTrophy className="mr-1" /> Compare ({compareList.length})
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                        <HiOutlineLocationMarker className="mr-2" /> Location
                      </h3>
                      <select
                        name="country"
                        value={filters.country}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
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
                      </select>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                        <FaGraduationCap className="mr-2" /> Field of Study
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
                        <FaTrophy className="mr-2" /> QS Ranking Range
                      </h3>
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
                        <FaCalendarAlt className="mr-2" /> Application Status
                      </h3>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="openApplications"
                          name="showOnlyOpenApplications"
                          checked={filters.showOnlyOpenApplications}
                          onChange={handleFilterChange}
                          className="mr-2 accent-secondary h-4 w-4"
                        />
                        <label htmlFor="openApplications" className="text-gray-700">
                          Show only open applications
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                        <FaGraduationCap className="mr-2" /> Admission Difficulty
                      </h3>
                      <select
                        name="admissionDifficulty"
                        value={filters.admissionDifficulty}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Any Difficulty</option>
                        <option value="high">Highly Competitive</option>
                        <option value="medium">Moderately Competitive</option>
                        <option value="low">Less Competitive</option>
                      </select>
                    </div>
                    
                    <motion.button
                      whileHover="hover"
                      whileTap="tap"
                      variants={buttonVariants}
                      onClick={resetFilters}
                      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition-colors font-medium flex items-center justify-center"
                    >
                      Reset All Filters
                    </motion.button>
                  </div>
                </div>
                
                <div className="md:col-span-3">
                  <h2 className="text-lg font-bold text-primary mb-4">Results ({sortedUniversities.length})</h2>
                  
                  {sortedUniversities.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <div className="text-gray-400 text-5xl mb-4">
                        <FaUniversity className="mx-auto" />
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
                      className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}
                    >
                      {sortedUniversities.map((university) => (
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
        />
      )}
    </div>
  );
};

export default Database; 