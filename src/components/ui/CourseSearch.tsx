import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaGraduationCap } from 'react-icons/fa';

const CourseSearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    country: '',
    major: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Build query string
    const queryParams = new URLSearchParams();
    if (searchParams.keyword) queryParams.append('keyword', searchParams.keyword);
    if (searchParams.country) queryParams.append('country', searchParams.country);
    if (searchParams.major) queryParams.append('major', searchParams.major);
    
    // Navigate to database page with search params
    navigate(`/database?${queryParams.toString()}`);
  };

  return (
    <section className="py-16 bg-teal-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-2">Search For Universities</h2>
          <p className="text-gray-300">
            Find your ideal university based on your preferences, location, and academic interests
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Search Keywords"
                  name="keyword"
                  value={searchParams.keyword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                />
              </div>
              
              <div>
                <select
                  name="country"
                  value={searchParams.country}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                >
                  <option value="">Select Country</option>
                  <option value="usa">United States</option>
                  <option value="uk">United Kingdom</option>
                  <option value="canada">Canada</option>
                  <option value="australia">Australia</option>
                  <option value="germany">Germany</option>
                  <option value="france">France</option>
                  <option value="japan">Japan</option>
                  <option value="china">China</option>
                </select>
              </div>
              
              <div>
                <select
                  name="major"
                  value={searchParams.major}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                >
                  <option value="">Select Major</option>
                  <option value="ai">Artificial Intelligence</option>
                  <option value="business">Business</option>
                  <option value="engineering">Engineering</option>
                  <option value="medicine">Medicine</option>
                  <option value="arts">Arts & Humanities</option>
                  <option value="science">Natural Sciences</option>
                  <option value="social-science">Social Sciences</option>
                  <option value="law">Law</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-md transition-colors flex items-center justify-center font-medium"
              >
                <FaSearch className="mr-2" />
                Search Universities
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default CourseSearch; 