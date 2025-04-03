import React, { useState } from 'react';
import { FaSearch, FaFilter, FaSortAmountDown, FaExternalLinkAlt, FaUniversity } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

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

const Database: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    country: '',
    major: '',
    qsRankingRange: [0, 1000],
    tuitionRange: [0, 100000],
    showOnlyOpenApplications: false
  });
  const [sortBy, setSortBy] = useState('qsRanking');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
      logo: 'https://via.placeholder.com/150?text=MIT'
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
      logo: 'https://via.placeholder.com/150?text=Stanford'
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
      logo: 'https://via.placeholder.com/150?text=Oxford'
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
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'country') {
      return a.country.localeCompare(b.country);
    }
    return 0;
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value
    }));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <section className="bg-gradient-to-r from-teal-700 to-teal-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold mb-4">International University Database</h1>
              <p className="text-xl mb-8">
                Search and filter through top universities worldwide with comprehensive details on rankings, fees, 
                admission requirements, and more.
              </p>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for universities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-3 pr-12 bg-white rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <FaSearch className="absolute right-4 top-3.5 text-gray-500" />
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              <div className="md:w-1/4">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-teal-800">Filters</h2>
                    <button 
                      onClick={() => setIsFilterOpen(!isFilterOpen)} 
                      className="md:hidden text-teal-700"
                    >
                      <FaFilter />
                    </button>
                  </div>
                  
                  <div className={`${isFilterOpen ? 'block' : 'hidden md:block'} space-y-6`}>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Country</label>
                      <select
                        name="country"
                        value={filters.country}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-600"
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
                      <label className="block text-gray-700 font-medium mb-2">Major</label>
                      <select
                        name="major"
                        value={filters.major}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-600"
                      >
                        <option value="">All Majors</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Business">Business</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Medicine">Medicine</option>
                        <option value="Law">Law</option>
                        <option value="AI">AI</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">QS Ranking</label>
                      <div className="flex items-center gap-2">
                        <span>1</span>
                        <input
                          type="range"
                          min="1"
                          max="1000"
                          value={filters.qsRankingRange[1]}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            qsRankingRange: [1, parseInt(e.target.value)]
                          }))}
                          className="w-full"
                        />
                        <span>{filters.qsRankingRange[1]}</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Sort By</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-600"
                      >
                        <option value="qsRanking">QS Ranking</option>
                        <option value="name">University Name</option>
                        <option value="country">Country</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="md:w-3/4">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-teal-800">Results ({sortedUniversities.length})</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-600"
                    >
                      <option value="qsRanking">QS Ranking</option>
                      <option value="name">University Name</option>
                      <option value="country">Country</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {sortedUniversities.length > 0 ? (
                    sortedUniversities.map(university => (
                      <div key={university.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                        <div className="p-6">
                          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                            <div className="shrink-0 w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                              <img 
                                src={university.logo} 
                                alt={`${university.name} logo`} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-grow">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                <h3 className="text-xl font-bold text-teal-800">{university.name}</h3>
                                <div className="flex items-center gap-3">
                                  <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-medium">
                                    QS Rank: #{university.qsRanking}
                                  </span>
                                  <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                                    {university.country}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold text-gray-700 mb-1">Tuition Fees</h4>
                                  <p className="text-sm text-gray-600">
                                    Undergraduate: {university.tuitionFees.undergraduate}<br />
                                    Graduate: {university.tuitionFees.graduate}
                                  </p>
                                </div>
                                
                                <div>
                                  <h4 className="font-semibold text-gray-700 mb-1">Application Deadlines</h4>
                                  <p className="text-sm text-gray-600">
                                    Fall: {university.applicationDeadlines.fall}<br />
                                    Spring: {university.applicationDeadlines.spring}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="mt-4">
                                <h4 className="font-semibold text-gray-700 mb-1">Requirements</h4>
                                <div className="flex flex-wrap gap-2">
                                  <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs">
                                    Min GPA: {university.admissionRequirements.minGPA}
                                  </span>
                                  {university.admissionRequirements.testScores.map((test, index) => (
                                    <span key={index} className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs">
                                      {test.name}: {test.score}
                                    </span>
                                  ))}
                                  {university.admissionRequirements.languageRequirements.map((lang, index) => (
                                    <span key={index} className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs">
                                      {lang.test}: {lang.score}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="mt-4">
                                <h4 className="font-semibold text-gray-700 mb-1">Top Majors</h4>
                                <div className="flex flex-wrap gap-2">
                                  {university.majorStrengths.map((major, index) => (
                                    <span key={index} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                                      {major}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="mt-6 flex justify-end">
                                <a 
                                  href={university.applicationLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
                                >
                                  <span>Apply Now</span>
                                  <FaExternalLinkAlt size={12} />
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                      <FaUniversity className="text-5xl text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">No universities match your criteria</h3>
                      <p className="text-gray-600">Try adjusting your filters or search query.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Database; 