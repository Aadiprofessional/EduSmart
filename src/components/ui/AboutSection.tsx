import React from 'react';
import { Link } from 'react-router-dom';

const AboutSection: React.FC = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-teal-800 mb-2">A Few Words About the <span className="text-orange-500">EduSmart</span> WEBSITE</h2>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3 bg-gray-200 rounded-lg h-64 flex items-center justify-center">
            <img 
              src="/images/about-illustration.svg" 
              alt="About EduSmart" 
              className="h-48 w-48 object-contain"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/300?text=About+EduSmart';
              }}
            />
          </div>
          <div className="md:w-2/3">
            <p className="text-gray-700 mb-4">
              EduSmart Guide is an AI-powered platform designed to help students find their ideal university, track applications, and access expert resources. With intelligent search tools, real success stories, and personalized recommendations, we make higher education planning seamless and stress-free.
            </p>
            <p className="text-gray-700 mb-6">
              Our smart platform combines AI-driven insights, university rankings, and real student experiences to help you make informed decisions. From school matching to application tracking, we simplify every step of your academic path.
            </p>
            <div className="flex flex-wrap gap-6 mt-6">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center text-white mr-3">
                  <span className="text-xl">1K+</span>
                </div>
                <span className="text-gray-800 font-medium">Universities</span>
              </div>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center text-white mr-3">
                  <span className="text-xl">10K+</span>
                </div>
                <span className="text-gray-800 font-medium">Programs</span>
              </div>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center text-white mr-3">
                  <span className="text-xl">100+</span>
                </div>
                <span className="text-gray-800 font-medium">Students Daily</span>
              </div>
            </div>
            <div className="mt-8">
              <Link
                to="/about"
                className="inline-block bg-teal-700 hover:bg-teal-800 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Read More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection; 