import React, { useState } from 'react';
import { FaSearch, FaFilter, FaDollarSign, FaGraduationCap, FaCalendarAlt, FaGlobe, FaUniversity, FaExternalLinkAlt, FaBookmark, FaUsers, FaClock } from 'react-icons/fa';
import { HiOutlineAcademicCap, HiOutlineLocationMarker } from 'react-icons/hi';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import IconComponent from '../components/ui/IconComponent';
import { motion } from 'framer-motion';
import { fadeIn, staggerContainer } from '../utils/animations';

interface Scholarship {
  id: number;
  name: string;
  provider: string;
  amount: string;
  type: 'Merit-based' | 'Need-based' | 'Field-specific' | 'Country-specific' | 'University-specific';
  eligibility: string[];
  deadline: string;
  description: string;
  applicationLink: string;
  country: string;
  field: string;
  level: 'Undergraduate' | 'Graduate' | 'PhD' | 'All';
}

const scholarships: Scholarship[] = [
  {
    id: 1,
    name: "Gates Cambridge Scholarship",
    provider: "University of Cambridge",
    amount: "Full funding + stipend",
    type: "Merit-based",
    eligibility: ["Outstanding academic merit", "Leadership potential", "Commitment to improving lives"],
    deadline: "December 1, 2024",
    description: "The Gates Cambridge Scholarship is one of the most prestigious international scholarships, providing full funding for graduate study at Cambridge.",
    applicationLink: "https://www.gatescambridge.org/",
    country: "UK",
    field: "All fields",
    level: "Graduate"
  },
  {
    id: 2,
    name: "Fulbright Foreign Student Program",
    provider: "U.S. Department of State",
    amount: "$25,000 - $45,000",
    type: "Merit-based",
    eligibility: ["International students", "Academic excellence", "Leadership experience"],
    deadline: "October 15, 2024",
    description: "The Fulbright Program provides funding for international students to pursue graduate study in the United States.",
    applicationLink: "https://foreign.fulbrightonline.org/",
    country: "USA",
    field: "All fields",
    level: "Graduate"
  },
  {
    id: 3,
    name: "DAAD Scholarships",
    provider: "German Academic Exchange Service",
    amount: "€850 - €1,200/month",
    type: "Merit-based",
    eligibility: ["International students", "Good academic record", "German language skills (for some programs)"],
    deadline: "Various deadlines",
    description: "DAAD offers various scholarship programs for international students to study in Germany.",
    applicationLink: "https://www.daad.de/en/",
    country: "Germany",
    field: "All fields",
    level: "All"
  },
  {
    id: 4,
    name: "Australia Awards Scholarships",
    provider: "Australian Government",
    amount: "Full funding",
    type: "Merit-based",
    eligibility: ["Developing country citizens", "Leadership potential", "Academic merit"],
    deadline: "April 30, 2024",
    description: "Australia Awards Scholarships provide opportunities for people from developing countries to study in Australia.",
    applicationLink: "https://www.australiaawards.gov.au/",
    country: "Australia",
    field: "All fields",
    level: "All"
  },
  {
    id: 5,
    name: "Chevening Scholarships",
    provider: "UK Government",
    amount: "Full funding",
    type: "Merit-based",
    eligibility: ["Leadership potential", "Academic excellence", "Work experience"],
    deadline: "November 2, 2024",
    description: "Chevening Scholarships are the UK government's global scholarship programme for future leaders.",
    applicationLink: "https://www.chevening.org/",
    country: "UK",
    field: "All fields",
    level: "Graduate"
  },
  {
    id: 6,
    name: "Erasmus Mundus Joint Master Degrees",
    provider: "European Commission",
    amount: "€1,400/month + travel costs",
    type: "Merit-based",
    eligibility: ["Academic excellence", "Motivation", "Language skills"],
    deadline: "Various deadlines",
    description: "Erasmus Mundus provides scholarships for joint master's programmes delivered by consortia of European universities.",
    applicationLink: "https://ec.europa.eu/programmes/erasmus-plus/",
    country: "Europe",
    field: "Various fields",
    level: "Graduate"
  },
  {
    id: 7,
    name: "Rhodes Scholarship",
    provider: "Rhodes Trust",
    amount: "Full funding",
    type: "Merit-based",
    eligibility: ["Academic excellence", "Leadership", "Service to others"],
    deadline: "October 1, 2024",
    description: "The Rhodes Scholarship is one of the oldest and most prestigious international scholarship programmes.",
    applicationLink: "https://www.rhodeshouse.ox.ac.uk/",
    country: "UK",
    field: "All fields",
    level: "Graduate"
  },
  {
    id: 8,
    name: "Swiss Government Excellence Scholarships",
    provider: "Swiss Government",
    amount: "CHF 1,920/month",
    type: "Merit-based",
    eligibility: ["Academic excellence", "Research proposal", "Language skills"],
    deadline: "Various deadlines",
    description: "The Swiss Government Excellence Scholarships promote international exchange and research cooperation.",
    applicationLink: "https://www.sbfi.admin.ch/",
    country: "Switzerland",
    field: "All fields",
    level: "Graduate"
  },
  {
    id: 9,
    name: "MEXT Scholarships",
    provider: "Japanese Government",
    amount: "¥143,000 - ¥145,000/month",
    type: "Merit-based",
    eligibility: ["Academic excellence", "Japanese language ability", "Health certificate"],
    deadline: "May 2024",
    description: "MEXT Scholarships are provided by the Japanese government for international students.",
    applicationLink: "https://www.mext.go.jp/",
    country: "Japan",
    field: "All fields",
    level: "All"
  },
  {
    id: 10,
    name: "Vanier Canada Graduate Scholarships",
    provider: "Government of Canada",
    amount: "CAD $50,000/year",
    type: "Merit-based",
    eligibility: ["Academic excellence", "Research potential", "Leadership"],
    deadline: "November 1, 2024",
    description: "The Vanier CGS program attracts and retains world-class doctoral students in Canada.",
    applicationLink: "https://vanier.gc.ca/",
    country: "Canada",
    field: "All fields",
    level: "PhD"
  }
];

const Scholarships: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    country: '',
    field: '',
    level: '',
    amount: ''
  });
  const [savedScholarships, setSavedScholarships] = useState<number[]>([]);

  const filteredScholarships = scholarships.filter(scholarship => {
    const matchesSearch = scholarship.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         scholarship.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         scholarship.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = !filters.type || scholarship.type === filters.type;
    const matchesCountry = !filters.country || scholarship.country === filters.country;
    const matchesField = !filters.field || scholarship.field.toLowerCase().includes(filters.field.toLowerCase());
    const matchesLevel = !filters.level || scholarship.level === filters.level || scholarship.level === 'All';

    return matchesSearch && matchesType && matchesCountry && matchesField && matchesLevel;
  });

  const handleSaveScholarship = (id: number) => {
    setSavedScholarships(prev => 
      prev.includes(id) 
        ? prev.filter(scholarshipId => scholarshipId !== id)
        : [...prev, id]
    );
  };

  const resetFilters = () => {
    setFilters({
      type: '',
      country: '',
      field: '',
      level: '',
      amount: ''
    });
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        {/* Hero Section */}
        <motion.section 
          className="relative bg-gradient-to-br from-primary via-primary-dark to-secondary py-20 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute top-32 right-20 w-32 h-32 bg-secondary/20 rounded-full blur-2xl"></div>
            <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              className="text-center text-white max-w-4xl mx-auto"
              variants={fadeIn("up", 0.2)}
              initial="hidden"
              animate="show"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Scholarship <span className="text-secondary">Opportunities</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-200 leading-relaxed">
                Discover funding opportunities to make your dream education affordable
              </p>
              
              {/* Statistics */}
              <motion.div 
                className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12"
                variants={staggerContainer(0.1, 0.2)}
                initial="hidden"
                animate="show"
              >
                <motion.div 
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
                  variants={fadeIn("up", 0.1)}
                >
                  <div className="text-2xl md:text-3xl font-bold text-secondary mb-2">10+</div>
                  <div className="text-sm md:text-base text-gray-200">Scholarships</div>
                </motion.div>
                <motion.div 
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
                  variants={fadeIn("up", 0.2)}
                >
                  <div className="text-2xl md:text-3xl font-bold text-secondary mb-2">$2M+</div>
                  <div className="text-sm md:text-base text-gray-200">Total Funding</div>
                </motion.div>
                <motion.div 
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
                  variants={fadeIn("up", 0.3)}
                >
                  <div className="text-2xl md:text-3xl font-bold text-secondary mb-2">15+</div>
                  <div className="text-sm md:text-base text-gray-200">Countries</div>
                </motion.div>
                <motion.div 
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
                  variants={fadeIn("up", 0.4)}
                >
                  <div className="text-2xl md:text-3xl font-bold text-secondary mb-2">All</div>
                  <div className="text-sm md:text-base text-gray-200">Fields</div>
                </motion.div>
              </motion.div>
            </motion.div>
            
            {/* Search Bar */}
            <motion.div 
              className="max-w-2xl mx-auto mt-12"
              variants={fadeIn("up", 0.4)}
              initial="hidden"
              animate="show"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <IconComponent icon={FaSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70" />
                    <input
                      type="text"
                      placeholder="Search scholarships..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-0 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-secondary text-gray-800 placeholder-gray-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <select
                      value={filters.type}
                      onChange={(e) => setFilters({...filters, type: e.target.value})}
                      className="p-2 border-0 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-secondary text-sm"
                    >
                      <option value="">All Types</option>
                      <option value="Merit-based">Merit-based</option>
                      <option value="Need-based">Need-based</option>
                      <option value="Field-specific">Field-specific</option>
                      <option value="Country-specific">Country-specific</option>
                    </select>
                    <select
                      value={filters.country}
                      onChange={(e) => setFilters({...filters, country: e.target.value})}
                      className="p-2 border-0 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-secondary text-sm"
                    >
                      <option value="">All Countries</option>
                      <option value="USA">USA</option>
                      <option value="UK">UK</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="Europe">Europe</option>
                    </select>
                    <select
                      value={filters.level}
                      onChange={(e) => setFilters({...filters, level: e.target.value})}
                      className="p-2 border-0 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-secondary text-sm"
                    >
                      <option value="">All Levels</option>
                      <option value="Undergraduate">Undergraduate</option>
                      <option value="Graduate">Graduate</option>
                      <option value="PhD">PhD</option>
                    </select>
                    <select
                      value={filters.field}
                      onChange={(e) => setFilters({...filters, field: e.target.value})}
                      className="p-2 border-0 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-secondary text-sm"
                    >
                      <option value="">All Fields</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Business">Business</option>
                      <option value="Medicine">Medicine</option>
                      <option value="Computer Science">Computer Science</option>
                    </select>
                  </div>
                  
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="bg-secondary hover:bg-secondary-light text-white py-2 px-4 rounded-lg w-full flex items-center justify-center"
                    >
                      <IconComponent icon={FaSearch} className="mr-2" /> Search
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
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Scholarships Grid */}
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
                    <IconComponent icon={FaGraduationCap} className="text-primary mr-2" />
                    <h2 className="text-xl font-bold text-gray-800">Available Scholarships</h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-gray-600">
                      Showing {filteredScholarships.length} of {scholarships.length} scholarships
                    </div>
                    <motion.button
                      onClick={() => window.location.href = '/application-tracker'}
                      className="bg-gradient-to-r from-secondary to-secondary-light text-white px-4 py-2 rounded-lg font-medium flex items-center hover:shadow-lg transition-all duration-300"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <IconComponent icon={FaBookmark} className="mr-2" />
                      Track Applications
                    </motion.button>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {filteredScholarships.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <div className="text-gray-400 text-5xl mb-4">
                      <IconComponent icon={FaGraduationCap} className="mx-auto" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">No Scholarships Found</h3>
                    <p className="text-gray-600 mb-4">
                      Try adjusting your search criteria or filters to see more results.
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
                    variants={staggerContainer(0.1, 0)}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.25 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {filteredScholarships.map((scholarship) => (
                      <motion.div
                        key={scholarship.id}
                        variants={fadeIn("up", 0.1)}
                        className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group"
                      >
                        <div className="p-6">
                          {/* Header */}
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-primary transition-colors">
                                {scholarship.name}
                              </h3>
                              <p className="text-sm text-gray-600 flex items-center">
                                <IconComponent icon={FaUniversity} className="mr-1" />
                                {scholarship.provider}
                              </p>
                            </div>
                            <motion.button
                              onClick={() => handleSaveScholarship(scholarship.id)}
                              className={`p-2 rounded-full transition-colors ${
                                savedScholarships.includes(scholarship.id)
                                  ? 'bg-secondary text-white'
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                              }`}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <IconComponent icon={FaBookmark} className="text-sm" />
                            </motion.button>
                          </div>

                          {/* Amount and Type */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                              <IconComponent icon={FaDollarSign} className="mr-1" />
                              {scholarship.amount}
                            </div>
                            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                              {scholarship.type}
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                            {scholarship.description}
                          </p>

                          {/* Details */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <IconComponent icon={FaGlobe} className="mr-2 text-gray-400" />
                              {scholarship.country}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <IconComponent icon={HiOutlineAcademicCap} className="mr-2 text-gray-400" />
                              {scholarship.level} • {scholarship.field}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <IconComponent icon={FaCalendarAlt} className="mr-2 text-gray-400" />
                              Deadline: {scholarship.deadline}
                            </div>
                          </div>

                          {/* Eligibility */}
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Requirements:</h4>
                            <div className="flex flex-wrap gap-1">
                              {scholarship.eligibility.slice(0, 2).map((req, index) => (
                                <span
                                  key={index}
                                  className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                                >
                                  {req}
                                </span>
                              ))}
                              {scholarship.eligibility.length > 2 && (
                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                  +{scholarship.eligibility.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Button */}
                          <motion.a
                            href={scholarship.applicationLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-gradient-to-r from-primary to-primary-dark text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center hover:shadow-lg transition-all duration-300"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Apply Now
                            <IconComponent icon={FaExternalLinkAlt} className="ml-2 text-sm" />
                          </motion.a>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Scholarships; 