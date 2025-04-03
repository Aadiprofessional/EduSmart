import React, { useState } from 'react';
import { FaGraduationCap, FaUniversity, FaChartLine, FaStar, FaFilter, FaSearch } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

interface CaseStudy {
  id: number;
  name: string;
  profilePic: string;
  background: {
    gpa: string;
    testScores: {
      name: string;
      score: string;
    }[];
    extracurriculars: string[];
    challenges?: string;
  };
  results: {
    universitiesApplied: {
      name: string;
      country: string;
      admitted: boolean;
    }[];
    acceptedTo: string[];
    scholarship?: string;
  };
  strategy: string[];
  testimonial: string;
  isLowGPA?: boolean;
  isInternational?: boolean;
  hasScholarship?: boolean;
}

const CaseStudies: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    lowGPA: false,
    international: false,
    scholarship: false,
  });
  const [activeTab, setActiveTab] = useState('all');

  // Sample case studies data
  const caseStudies: CaseStudy[] = [
    {
      id: 1,
      name: 'James L.',
      profilePic: 'https://via.placeholder.com/150?text=James+L',
      background: {
        gpa: '3.2/4.0 (Low for top universities)',
        testScores: [
          { name: 'GRE', score: '326 (V: 158, Q: 168)' },
          { name: 'TOEFL', score: '102' }
        ],
        extracurriculars: [
          'Internship at local tech company',
          'University AI research lab assistant',
          'Open-source contributor to ML frameworks'
        ],
        challenges: 'Low undergraduate GPA due to personal challenges during sophomore year'
      },
      results: {
        universitiesApplied: [
          { name: 'Stanford University', country: 'USA', admitted: false },
          { name: 'MIT', country: 'USA', admitted: false },
          { name: 'UC Berkeley', country: 'USA', admitted: true },
          { name: 'Carnegie Mellon University', country: 'USA', admitted: true },
          { name: 'Cornell University', country: 'USA', admitted: true }
        ],
        acceptedTo: ['UC Berkeley', 'Carnegie Mellon', 'Cornell'],
      },
      strategy: [
        'Focused on exceptional projects showcasing AI expertise',
        'Secured strong recommendation letters from research advisor',
        'Addressed GPA directly in statement of purpose',
        'Highlighted growth and improved performance in junior/senior years'
      ],
      testimonial: "EduSmart helped me overcome my low GPA by highlighting my strengths. Their application strategy made all the difference — I still can't believe I got into UC Berkeley!",
      isLowGPA: true
    },
    {
      id: 2,
      name: 'Sophia H.',
      profilePic: 'https://via.placeholder.com/150?text=Sophia+H',
      background: {
        gpa: '3.9/4.0',
        testScores: [
          { name: 'GMAT', score: '740' },
          { name: 'IELTS', score: '8.0' }
        ],
        extracurriculars: [
          'Founded university entrepreneur club',
          'Volunteer consultant for local businesses',
          'Summer internship at multinational corporation'
        ]
      },
      results: {
        universitiesApplied: [
          { name: 'Harvard Business School', country: 'USA', admitted: true },
          { name: 'Stanford GSB', country: 'USA', admitted: false },
          { name: 'Wharton', country: 'USA', admitted: true },
          { name: 'INSEAD', country: 'France', admitted: true },
          { name: 'London Business School', country: 'UK', admitted: true }
        ],
        acceptedTo: ['Harvard Business School', 'Wharton', 'INSEAD', 'London Business School'],
        scholarship: '$50,000 scholarship from Wharton'
      },
      strategy: [
        'Created compelling personal brand focused on social entrepreneurship',
        'Demonstrated leadership through multiple examples',
        'Connected past experiences to future goals',
        'Applied in Round 1 for best scholarship opportunities'
      ],
      testimonial: "Using EduSmart's AI matching tool, I identified MBA programs that aligned perfectly with my goals. Their scholarship strategy worked - I received a substantial offer from my dream school!",
      hasScholarship: true
    },
    {
      id: 3,
      name: 'Raj P.',
      profilePic: 'https://via.placeholder.com/150?text=Raj+P',
      background: {
        gpa: '3.7/4.0',
        testScores: [
          { name: 'TOEFL', score: '110' },
          { name: 'GRE', score: '329 (V: 161, Q: 168)' }
        ],
        extracurriculars: [
          'Research publication in computer vision',
          'Internship at tech startup',
          'Online course certificates in ML and AI'
        ],
        challenges: 'Limited access to research opportunities in home country'
      },
      results: {
        universitiesApplied: [
          { name: 'Carnegie Mellon University', country: 'USA', admitted: true },
          { name: 'University of Toronto', country: 'Canada', admitted: true },
          { name: 'ETH Zurich', country: 'Switzerland', admitted: false },
          { name: 'Georgia Tech', country: 'USA', admitted: true },
          { name: 'University of Washington', country: 'USA', admitted: true }
        ],
        acceptedTo: ['Carnegie Mellon', 'University of Toronto', 'Georgia Tech', 'University of Washington'],
        scholarship: 'Full tuition waiver + stipend at Carnegie Mellon'
      },
      strategy: [
        'Focused application on computer vision specialization',
        'Connected with potential research advisors before applying',
        'Showcased independent projects demonstrating technical skills',
        'Highlighted adaptability and cross-cultural experiences'
      ],
      testimonial: "As an international student, I was overwhelmed by the US application process. EduSmart guided me through each step and helped me secure not just admission but full funding at my top choice program!",
      isInternational: true,
      hasScholarship: true
    },
    {
      id: 4,
      name: 'Emma L.',
      profilePic: 'https://via.placeholder.com/150?text=Emma+L',
      background: {
        gpa: '3.1/4.0',
        testScores: [
          { name: 'LSAT', score: '172' }
        ],
        extracurriculars: [
          'Paralegal experience at immigration law firm',
          'Volunteer at legal aid clinic',
          'Student government representative'
        ],
        challenges: 'Low GPA due to working full-time during undergraduate years'
      },
      results: {
        universitiesApplied: [
          { name: 'Harvard Law School', country: 'USA', admitted: false },
          { name: 'Columbia Law School', country: 'USA', admitted: false },
          { name: 'Georgetown Law', country: 'USA', admitted: true },
          { name: 'UCLA Law', country: 'USA', admitted: true },
          { name: 'Fordham Law', country: 'USA', admitted: true }
        ],
        acceptedTo: ['Georgetown Law', 'UCLA Law', 'Fordham Law'],
        scholarship: '$25,000/year at Georgetown Law'
      },
      strategy: [
        'Exceptional LSAT score to offset GPA',
        'Compelling personal statement about immigrant background',
        'Strong work experience in legal field',
        'Explained GPA circumstances without making excuses'
      ],
      testimonial: "Despite my below-average GPA, EduSmart helped me build a strategy that got me into a T14 law school with scholarship! Their application tracker kept me organized through the whole process.",
      isLowGPA: true,
      hasScholarship: true
    }
  ];

  // Filter case studies based on search and active filters
  const filteredCaseStudies = caseStudies.filter(study => {
    // Search filter
    if (searchQuery && !study.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Tab filter
    if (activeTab === 'lowGPA' && !study.isLowGPA) {
      return false;
    }
    
    if (activeTab === 'international' && !study.isInternational) {
      return false;
    }
    
    if (activeTab === 'scholarship' && !study.hasScholarship) {
      return false;
    }
    
    // Active filters
    if (activeFilters.lowGPA && !study.isLowGPA) {
      return false;
    }
    
    if (activeFilters.international && !study.isInternational) {
      return false;
    }
    
    if (activeFilters.scholarship && !study.hasScholarship) {
      return false;
    }
    
    return true;
  });

  const toggleFilter = (filter: keyof typeof activeFilters) => {
    setActiveFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <section className="bg-gradient-to-r from-teal-700 to-teal-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold mb-4">Success Case Studies</h1>
              <p className="text-xl mb-8">
                Discover inspiring stories of students who achieved their dreams, from overcoming low GPAs to securing 
                full scholarships at top universities worldwide.
              </p>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search success stories..."
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
            {/* Filters and Tabs */}
            <div className="mb-10">
              <div className="flex flex-wrap justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-teal-800">Browse Success Stories</h2>
                
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => toggleFilter('lowGPA')}
                    className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
                      activeFilters.lowGPA
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <FaChartLine /> Low GPA Success
                  </button>
                  <button
                    onClick={() => toggleFilter('international')}
                    className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
                      activeFilters.international
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <FaUniversity /> International Students
                  </button>
                  <button
                    onClick={() => toggleFilter('scholarship')}
                    className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
                      activeFilters.scholarship
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <FaGraduationCap /> Scholarship Winners
                  </button>
                </div>
              </div>
              
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`py-4 px-1 font-medium text-sm border-b-2 ${
                      activeTab === 'all'
                        ? 'border-orange-500 text-orange-500'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    All Case Studies
                  </button>
                  <button
                    onClick={() => setActiveTab('lowGPA')}
                    className={`py-4 px-1 font-medium text-sm border-b-2 ${
                      activeTab === 'lowGPA'
                        ? 'border-orange-500 text-orange-500'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Low GPA Success
                  </button>
                  <button
                    onClick={() => setActiveTab('international')}
                    className={`py-4 px-1 font-medium text-sm border-b-2 ${
                      activeTab === 'international'
                        ? 'border-orange-500 text-orange-500'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    International Students
                  </button>
                  <button
                    onClick={() => setActiveTab('scholarship')}
                    className={`py-4 px-1 font-medium text-sm border-b-2 ${
                      activeTab === 'scholarship'
                        ? 'border-orange-500 text-orange-500'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Scholarship Winners
                  </button>
                </nav>
              </div>
            </div>
            
            {/* Case Studies */}
            {filteredCaseStudies.length > 0 ? (
              <div className="space-y-10">
                {filteredCaseStudies.map((study) => (
                  <div key={study.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Left column: Student profile */}
                        <div className="lg:w-1/3">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-full overflow-hidden">
                              <img 
                                src={study.profilePic} 
                                alt={study.name} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-teal-800">{study.name}</h3>
                              <div className="flex gap-2 mt-1">
                                {study.isLowGPA && (
                                  <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs">
                                    Low GPA Success
                                  </span>
                                )}
                                {study.isInternational && (
                                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                                    International
                                  </span>
                                )}
                                {study.hasScholarship && (
                                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                                    Scholarship
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-1">Academic Background</h4>
                              <p className="text-sm text-gray-600">
                                GPA: {study.background.gpa}
                              </p>
                              <div className="mt-1">
                                {study.background.testScores.map((test, index) => (
                                  <p key={index} className="text-sm text-gray-600">
                                    {test.name}: {test.score}
                                  </p>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-1">Activities & Experience</h4>
                              <ul className="list-disc list-inside text-sm text-gray-600">
                                {study.background.extracurriculars.map((activity, index) => (
                                  <li key={index}>{activity}</li>
                                ))}
                              </ul>
                            </div>
                            
                            {study.background.challenges && (
                              <div>
                                <h4 className="font-semibold text-gray-700 mb-1">Challenges</h4>
                                <p className="text-sm text-gray-600">{study.background.challenges}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Right column: Results and strategy */}
                        <div className="lg:w-2/3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-3">Application Results</h4>
                              <div className="space-y-2">
                                {study.results.universitiesApplied.map((uni, index) => (
                                  <div 
                                    key={index} 
                                    className={`p-3 rounded-lg flex justify-between items-center ${
                                      uni.admitted ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                                    }`}
                                  >
                                    <div>
                                      <p className="font-medium text-sm">{uni.name}</p>
                                      <p className="text-xs text-gray-500">{uni.country}</p>
                                    </div>
                                    <span 
                                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                                        uni.admitted 
                                          ? 'bg-green-100 text-green-700' 
                                          : 'bg-gray-200 text-gray-700'
                                      }`}
                                    >
                                      {uni.admitted ? 'Admitted' : 'Rejected'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              
                              {study.results.scholarship && (
                                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                  <p className="font-medium text-orange-700 text-sm">
                                    <span className="font-bold">Scholarship:</span> {study.results.scholarship}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-3">Success Strategy</h4>
                              <ul className="space-y-2">
                                {study.strategy.map((point, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span className="text-sm text-gray-600">{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-700 mb-2">Testimonial</h4>
                            <div className="flex gap-1 text-yellow-400 mb-2">
                              <FaStar />
                              <FaStar />
                              <FaStar />
                              <FaStar />
                              <FaStar />
                            </div>
                            <p className="text-gray-600 italic">"{study.testimonial}"</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <FaUniversity className="text-5xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No case studies match your criteria</h3>
                <p className="text-gray-600">Try adjusting your filters or search query.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CaseStudies; 