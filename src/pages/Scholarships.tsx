import React, { useState } from 'react';
import { FaGraduationCap, FaGlobe, FaSearch, FaCalendarAlt, FaUniversity, FaDollarSign, FaFilter, FaArrowRight, FaRegBookmark, FaBookmark } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import IconComponent from '../components/ui/IconComponent';

interface Scholarship {
  id: number;
  title: string;
  university: string;
  country: string;
  description: string;
  amount: string;
  deadline: string;
  eligibility: string[];
  academicLevel: 'undergraduate' | 'postgraduate' | 'phd' | 'all';
  fields: string[];
  international: boolean;
  scholarshipType: 'full' | 'partial' | 'tuition' | 'research' | 'merit' | 'need-based';
  featured?: boolean;
  link: string;
  image: string;
}

const Scholarships: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [academicLevel, setAcademicLevel] = useState('all');
  const [scholarshipType, setScholarshipType] = useState('all');
  const [country, setCountry] = useState('all');
  const [isInternational, setIsInternational] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [savedScholarships, setSavedScholarships] = useState<number[]>([]);
  
  // Sample scholarships data
  const scholarships: Scholarship[] = [
    {
      id: 1,
      title: "Stanford Knight-Hennessy Scholars Program",
      university: "Stanford University",
      country: "USA",
      description: "The Knight-Hennessy Scholars program funds up to three years of graduate education at Stanford, and provides access to leadership development, mentorship, and experiential learning opportunities.",
      amount: "Full tuition and stipend",
      deadline: "October 12, 2025",
      eligibility: ["Bachelor's degree", "Apply to Stanford graduate program", "Demonstrated leadership", "English proficiency"],
      academicLevel: "postgraduate",
      fields: ["All fields"],
      international: true,
      scholarshipType: "full",
      featured: true,
      link: "https://knight-hennessy.stanford.edu/",
      image: "https://via.placeholder.com/300x200?text=Stanford"
    },
    {
      id: 2,
      title: "Fulbright Foreign Student Program",
      university: "Various US Universities",
      country: "USA",
      description: "The Fulbright Program provides grants for graduate study, advanced research, university teaching, and teaching in elementary and secondary schools.",
      amount: "Full tuition, living stipend, health insurance",
      deadline: "Varies by country",
      eligibility: ["Bachelor's degree", "English proficiency", "Country-specific requirements"],
      academicLevel: "postgraduate",
      fields: ["All fields"],
      international: true,
      scholarshipType: "full",
      featured: true,
      link: "https://foreign.fulbrightonline.org/",
      image: "https://via.placeholder.com/300x200?text=Fulbright"
    },
    {
      id: 3,
      title: "Gates Cambridge Scholarship",
      university: "Cambridge University",
      country: "UK",
      description: "The Gates Cambridge Scholarship program offers full-cost scholarships to outstanding applicants from countries outside the UK to pursue a postgraduate degree in any subject at the University of Cambridge.",
      amount: "Full tuition, living stipend, travel allowance",
      deadline: "December 1, 2025",
      eligibility: ["Bachelor's degree", "Non-UK resident", "Apply to Cambridge", "Academic excellence"],
      academicLevel: "postgraduate",
      fields: ["All fields"],
      international: true,
      scholarshipType: "full",
      link: "https://www.gatescambridge.org/",
      image: "https://via.placeholder.com/300x200?text=Cambridge"
    },
    {
      id: 4,
      title: "Clarendon Scholarship",
      university: "Oxford University",
      country: "UK",
      description: "Clarendon Scholarships are awarded to academically excellent students with the potential to have a positive impact on the world after graduation.",
      amount: "Full tuition and living expenses",
      deadline: "January 2024 (Varies by program)",
      eligibility: ["Apply to Oxford", "Academic excellence"],
      academicLevel: "postgraduate",
      fields: ["All fields"],
      international: true,
      scholarshipType: "full",
      link: "https://www.ox.ac.uk/clarendon",
      image: "https://via.placeholder.com/300x200?text=Oxford"
    },
    {
      id: 5,
      title: "DAAD Scholarships for International Students",
      university: "Various German Universities",
      country: "Germany",
      description: "DAAD scholarships promote international academic exchange through funding study and research opportunities for students and academics in Germany.",
      amount: "€850-1,200 monthly + allowances",
      deadline: "Varies by program",
      eligibility: ["Bachelor's degree", "English/German proficiency"],
      academicLevel: "postgraduate",
      fields: ["All fields"],
      international: true,
      scholarshipType: "full",
      featured: true,
      link: "https://www.daad.de/en/",
      image: "https://via.placeholder.com/300x200?text=DAAD"
    },
    {
      id: 6,
      title: "Vanier Canada Graduate Scholarship",
      university: "Various Canadian Universities",
      country: "Canada",
      description: "The Vanier CGS program aims to attract and retain world-class doctoral students by supporting students who demonstrate both leadership skills and a high standard of scholarly achievement.",
      amount: "CAD $50,000 per year (3 years)",
      deadline: "November 2025",
      eligibility: ["PhD candidate", "Academic excellence", "Leadership skills", "Research potential"],
      academicLevel: "phd",
      fields: ["Health", "Natural Sciences", "Engineering", "Social Sciences", "Humanities"],
      international: true,
      scholarshipType: "research",
      link: "https://vanier.gc.ca/",
      image: "https://via.placeholder.com/300x200?text=Vanier"
    },
    {
      id: 7,
      title: "Chevening Scholarship",
      university: "Various UK Universities",
      country: "UK",
      description: "Chevening is the UK government's global scholarship program that offers future leaders the opportunity to study in the UK for one year.",
      amount: "Full tuition, living expenses, travel costs",
      deadline: "November 2, 2025",
      eligibility: ["2+ years work experience", "Bachelor's degree", "Return to home country"],
      academicLevel: "postgraduate",
      fields: ["All fields"],
      international: true,
      scholarshipType: "full",
      link: "https://www.chevening.org/",
      image: "https://via.placeholder.com/300x200?text=Chevening"
    },
    {
      id: 8,
      title: "Berkeley International Office Scholarship",
      university: "UC Berkeley",
      country: "USA",
      description: "Scholarships offered by Berkeley International Office to assist international students with demonstrated financial need.",
      amount: "$1,000 - $10,000",
      deadline: "February 1, 2024",
      eligibility: ["International student", "Financial need", "Good academic standing"],
      academicLevel: "undergraduate",
      fields: ["All fields"],
      international: true,
      scholarshipType: "partial",
      link: "https://internationaloffice.berkeley.edu/",
      image: "https://via.placeholder.com/300x200?text=Berkeley"
    },
    {
      id: 9,
      title: "MEXT Scholarship",
      university: "Various Japanese Universities",
      country: "Japan",
      description: "Japanese government scholarship that covers full tuition, monthly stipend, and round-trip flight to Japan for international students.",
      amount: "Full tuition + monthly stipend",
      deadline: "Varies by country",
      eligibility: ["Age requirements", "Academic requirements", "Japanese/English proficiency"],
      academicLevel: "all",
      fields: ["All fields"],
      international: true,
      scholarshipType: "full",
      link: "https://www.mext.go.jp/en/",
      image: "https://via.placeholder.com/300x200?text=MEXT"
    },
    {
      id: 10,
      title: "Rhodes Scholarship",
      university: "Oxford University",
      country: "UK",
      description: "The Rhodes Scholarship is the oldest and perhaps most prestigious international scholarship program, enabling exceptional students from around the world to study at the University of Oxford.",
      amount: "Full tuition and stipend",
      deadline: "Varies by country",
      eligibility: ["Bachelor's degree", "Age requirements", "Country-specific"],
      academicLevel: "postgraduate",
      fields: ["All fields"],
      international: true,
      scholarshipType: "full",
      featured: true,
      link: "https://www.rhodeshouse.ox.ac.uk/",
      image: "https://via.placeholder.com/300x200?text=Rhodes"
    }
  ];

  // Filter scholarships based on all filters
  const filteredScholarships = scholarships.filter(scholarship => {
    // Search filter
    if (searchQuery && !scholarship.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !scholarship.university.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !scholarship.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !scholarship.fields.some(field => field.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }
    
    // Academic level filter
    if (academicLevel !== 'all' && scholarship.academicLevel !== academicLevel && scholarship.academicLevel !== 'all') {
      return false;
    }
    
    // Scholarship type filter
    if (scholarshipType !== 'all' && scholarship.scholarshipType !== scholarshipType) {
      return false;
    }
    
    // Country filter
    if (country !== 'all' && scholarship.country !== country) {
      return false;
    }
    
    // International students filter
    if (isInternational && !scholarship.international) {
      return false;
    }
    
    return true;
  });

  // Get unique countries for filter
  const countries = Array.from(new Set(scholarships.map(scholarship => scholarship.country)));

  // Toggle saved scholarship
  const toggleSaveScholarship = (id: number) => {
    if (savedScholarships.includes(id)) {
      setSavedScholarships(savedScholarships.filter(scholarshipId => scholarshipId !== id));
    } else {
      setSavedScholarships([...savedScholarships, id]);
    }
  };

  // Format eligibility requirements as a readable list
  const formatEligibility = (eligibility: string[]) => {
    return eligibility.join(' • ');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <section className="bg-gradient-to-r from-teal-700 to-teal-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold mb-4">Scholarship Opportunities</h1>
              <p className="text-xl mb-8">
                Discover global scholarship opportunities to fund your educational journey
                at top universities worldwide.
              </p>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search scholarships by university, field of study, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-3 pr-12 bg-white rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <IconComponent icon={FaSearch} className="absolute right-4 top-3.5 text-gray-500" />
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-teal-800">Available Scholarships</h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <IconComponent icon={FaFilter} /> {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
            
            {/* Filters */}
            {showFilters && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Academic Level</label>
                  <select
                    value={academicLevel}
                    onChange={(e) => setAcademicLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="all">All Levels</option>
                    <option value="undergraduate">Undergraduate</option>
                    <option value="postgraduate">Postgraduate/Masters</option>
                    <option value="phd">PhD/Doctoral</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Scholarship Type</label>
                  <select
                    value={scholarshipType}
                    onChange={(e) => setScholarshipType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="all">All Types</option>
                    <option value="full">Full Scholarship</option>
                    <option value="partial">Partial Scholarship</option>
                    <option value="tuition">Tuition Fee Waiver</option>
                    <option value="research">Research Grant</option>
                    <option value="merit">Merit-Based</option>
                    <option value="need-based">Need-Based</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="all">All Countries</option>
                    {countries.map((country, index) => (
                      <option key={index} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternational}
                      onChange={() => setIsInternational(!isInternational)}
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Available for International Students</span>
                  </label>
                </div>
              </div>
            )}

            {/* Featured Scholarships */}
            {!searchQuery && academicLevel === 'all' && scholarshipType === 'all' && country === 'all' && !isInternational && (
              <div className="mb-10">
                <h2 className="text-xl font-bold text-teal-800 mb-6">Featured Scholarships</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {scholarships.filter(scholarship => scholarship.featured).map(scholarship => (
                    <div key={scholarship.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 flex flex-col md:flex-row">
                      <div className="md:w-1/3">
                        <img 
                          src={scholarship.image} 
                          alt={scholarship.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="md:w-2/3 p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-teal-100 text-teal-800 text-xs font-medium px-2.5 py-0.5 rounded">
                              {scholarship.scholarshipType === 'full' ? 'Full Scholarship' : scholarship.scholarshipType === 'partial' ? 'Partial Scholarship' : scholarship.scholarshipType}
                            </span>
                            {scholarship.international && (
                              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                International
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => toggleSaveScholarship(scholarship.id)}
                            className="text-gray-400 hover:text-teal-600 transition-colors"
                            aria-label={savedScholarships.includes(scholarship.id) ? "Unsave scholarship" : "Save scholarship"}
                          >
                            {savedScholarships.includes(scholarship.id) ? <IconComponent icon={FaBookmark} className="text-teal-600" /> : <IconComponent icon={FaRegBookmark} />}
                          </button>
                        </div>
                        <h3 className="text-xl font-bold text-teal-800 mb-1">{scholarship.title}</h3>
                        <div className="flex items-center text-sm text-gray-600 mb-3">
                          <IconComponent icon={FaUniversity} className="mr-1" /> {scholarship.university} • <IconComponent icon={FaGlobe} className="mx-1" /> {scholarship.country}
                        </div>
                        <p className="text-gray-600 text-sm mb-4">{scholarship.description}</p>
                        <div className="flex flex-col gap-2 mb-4">
                          <div className="flex items-center text-sm">
                            <IconComponent icon={FaDollarSign} className="text-teal-600 mr-2" />
                            <span className="font-medium">Amount:</span>
                            <span className="ml-1">{scholarship.amount}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <IconComponent icon={FaCalendarAlt} className="text-orange-500 mr-2" />
                            <span className="font-medium">Deadline:</span>
                            <span className="ml-1">{scholarship.deadline}</span>
                          </div>
                          <div className="flex items-start text-sm">
                            <IconComponent icon={FaGraduationCap} className="text-blue-600 mr-2 mt-1" />
                            <div>
                              <span className="font-medium">Eligibility:</span>
                              <span className="ml-1">{formatEligibility(scholarship.eligibility)}</span>
                            </div>
                          </div>
                        </div>
                        <a
                          href={scholarship.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
                        >
                          Apply Now <IconComponent icon={FaArrowRight} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scholarship Listing */}
            {filteredScholarships.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredScholarships.map(scholarship => (
                  <div key={scholarship.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 flex flex-col h-full">
                    <div className="h-40 overflow-hidden relative">
                      <img 
                        src={scholarship.image} 
                        alt={scholarship.title} 
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => toggleSaveScholarship(scholarship.id)}
                        className="absolute top-2 right-2 bg-white p-2 rounded-full shadow text-gray-400 hover:text-teal-600 transition-colors"
                        aria-label={savedScholarships.includes(scholarship.id) ? "Unsave scholarship" : "Save scholarship"}
                      >
                        {savedScholarships.includes(scholarship.id) ? <IconComponent icon={FaBookmark} className="text-teal-600" /> : <IconComponent icon={FaRegBookmark} />}
                      </button>
                    </div>
                    <div className="p-5 flex-grow flex flex-col">
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="bg-teal-100 text-teal-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          {scholarship.scholarshipType === 'full' ? 'Full Scholarship' : 
                           scholarship.scholarshipType === 'partial' ? 'Partial Scholarship' : 
                           scholarship.scholarshipType === 'tuition' ? 'Tuition Waiver' : 
                           scholarship.scholarshipType === 'research' ? 'Research Grant' : 
                           scholarship.scholarshipType === 'merit' ? 'Merit-Based' : 'Need-Based'}
                        </span>
                        <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          {scholarship.academicLevel === 'undergraduate' ? 'Undergraduate' : 
                           scholarship.academicLevel === 'postgraduate' ? 'Postgraduate' : 
                           scholarship.academicLevel === 'phd' ? 'PhD' : 'All Levels'}
                        </span>
                        {scholarship.international && (
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            International
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-teal-800 mb-1">{scholarship.title}</h3>
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <IconComponent icon={FaUniversity} className="mr-1" /> {scholarship.university} • <IconComponent icon={FaGlobe} className="mx-1" /> {scholarship.country}
                      </div>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{scholarship.description}</p>
                      
                      <div className="flex flex-col gap-1 mb-4">
                        <div className="flex items-center text-sm">
                          <IconComponent icon={FaDollarSign} className="text-teal-600 mr-2" />
                          <span className="font-medium">Amount:</span>
                          <span className="ml-1 text-gray-600">{scholarship.amount}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <IconComponent icon={FaCalendarAlt} className="text-orange-500 mr-2" />
                          <span className="font-medium">Deadline:</span>
                          <span className="ml-1 text-gray-600">{scholarship.deadline}</span>
                        </div>
                      </div>
                      
                      <a
                        href={scholarship.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-auto bg-orange-500 hover:bg-orange-600 text-white text-center py-2 rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                      >
                        Apply Now <IconComponent icon={FaArrowRight} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <IconComponent icon={FaSearch} className="text-5xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No scholarships match your criteria</h3>
                <p className="text-gray-600">Try adjusting your filters or search terms to find more opportunities.</p>
              </div>
            )}
          </div>
        </section>

        {/* Scholarship Tips */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-teal-800 mb-2">Scholarship Application Tips</h2>
              <p className="text-gray-600">
                Maximize your chances of securing financial support for your educational journey.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-teal-800 mb-3">Start Early</h3>
                <p className="text-gray-600 mb-4">
                  Begin your scholarship search and application process at least 12-18 months before your 
                  intended start date. Many prestigious scholarships have early deadlines.
                </p>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  <li>Create a timeline with all application deadlines</li>
                  <li>Gather required documents well in advance</li>
                  <li>Allow time for recommendation letters</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-teal-800 mb-3">Craft a Compelling Personal Statement</h3>
                <p className="text-gray-600 mb-4">
                  Your personal statement should tell a unique story about who you are, your aspirations, 
                  and why you're the perfect candidate for the scholarship.
                </p>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  <li>Be authentic and showcase your personality</li>
                  <li>Address the specific scholarship criteria</li>
                  <li>Proofread thoroughly and get feedback</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-teal-800 mb-3">Apply for Multiple Scholarships</h3>
                <p className="text-gray-600 mb-4">
                  Don't put all your eggs in one basket. Apply for multiple scholarships to increase your 
                  chances of receiving financial support.
                </p>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  <li>Focus on scholarships that match your profile</li>
                  <li>Include a mix of competitive and less competitive options</li>
                  <li>Consider smaller, lesser-known scholarships</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-teal-800 mb-3">Follow Instructions Carefully</h3>
                <p className="text-gray-600 mb-4">
                  One of the most common reasons applications get rejected is failure to follow the 
                  application instructions precisely.
                </p>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  <li>Pay attention to word counts and formatting requirements</li>
                  <li>Submit all requested documents</li>
                  <li>Meet every deadline without exception</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <a 
                href="/resources"
                className="inline-flex items-center gap-2 text-teal-600 font-medium hover:text-teal-700 transition-colors"
              >
                View our scholarship resources for more tips <IconComponent icon={FaArrowRight} className="text-xs" />
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Scholarships; 