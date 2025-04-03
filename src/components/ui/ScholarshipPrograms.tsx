import React from 'react';
import { Link } from 'react-router-dom';

const ScholarshipPrograms: React.FC = () => {
  return (
    <section className="py-16 bg-teal-800 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Scholarship Programs</h2>
          <p className="text-lg text-gray-300">
            Discover global scholarship opportunities tailored to your academic profile. Our comprehensive database features merit-based, need-based, and specialized scholarships to help fund your international education.
          </p>
          <Link 
            to="/scholarships"
            className="inline-block mt-6 bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-lg transition-colors"
          >
            Explore Scholarships
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ScholarshipPrograms; 