import React from 'react';
import { Link } from 'react-router-dom';
import { FaUniversity, FaMoneyBillWave } from 'react-icons/fa';

const AdmissionInfo: React.FC = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="md:w-1/2">
            <div className="bg-gray-100 rounded-lg h-80 w-full flex items-center justify-center">
              <img 
                src="/images/admission-illustration.svg" 
                alt="Admission and Financial Aid" 
                className="h-64 w-64 object-contain"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/400?text=Admission+%26+Aid';
                }}
              />
            </div>
          </div>
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold text-teal-800 mb-4">Admission & Aid</h2>
            <p className="text-gray-700 mb-4">
              Our comprehensive database provides detailed information on admission requirements for universities worldwide, including GPA thresholds, standardized test scores, language proficiency needs, and application deadlines.
            </p>
            <p className="text-gray-700 mb-6">
              Navigate the complex world of financial aid with our scholarship finder, tuition comparison tools, and ROI calculators. We help you discover merit-based scholarships, need-based grants, and education loans available for international students.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
              <div className="flex items-center">
                <FaUniversity className="text-orange-500 mr-2 text-xl" />
                <span className="text-gray-700">10,000+ universities</span>
              </div>
              <div className="flex items-center">
                <FaMoneyBillWave className="text-orange-500 mr-2 text-xl" />
                <span className="text-gray-700">5,000+ scholarships</span>
              </div>
            </div>
            <Link
              to="/admission"
              className="inline-block bg-teal-700 hover:bg-teal-800 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Explore Options
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdmissionInfo; 