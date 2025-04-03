import React from 'react';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
  return (
    <section className="bg-gradient-to-r from-teal-700 to-teal-900 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Find Your Dream University with AI-Powered Guidance
            </h1>
            <p className="text-xl mb-8">
              Explore top universities, personalized recommendations, and real success stories—all driven by AI to simplify your journey to higher education.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                to="/courses"
                className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-lg transition-colors text-center"
              >
                Explore
              </Link>
              <Link
                to="/about"
                className="bg-transparent border-2 border-white hover:bg-white hover:text-teal-800 font-medium py-3 px-6 rounded-lg transition-colors text-center"
              >
                Learn More
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-80 flex items-center justify-center">
              <img 
                src="/images/hero-illustration.svg" 
                alt="University education illustration" 
                className="h-64 w-64 object-contain"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/300?text=EduSmart';
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero; 