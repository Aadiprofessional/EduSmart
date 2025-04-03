import React from 'react';
import { Link } from 'react-router-dom';

const GraduatePrograms: React.FC = () => {
  const programs = [
    {
      id: 1,
      title: 'International University Database',
      description: 'Search top universities worldwide with detailed rankings, tuition fees, and admission requirements',
      link: '/database'
    },
    {
      id: 2,
      title: 'AI Education Courses',
      description: 'Explore AI-focused programs, online certifications, and expert tutorials',
      link: '/ai-courses'
    },
    {
      id: 3,
      title: 'Success Case Studies',
      description: 'Learn from real student experiences, strategies, and admission success stories',
      link: '/case-studies'
    },
    {
      id: 4,
      title: 'Application Tracking',
      description: 'Manage your applications with real-time status updates and deadline alerts',
      link: '/tracking'
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-teal-800 mb-4">Graduate Programs</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our comprehensive database of international universities and resources designed to help you find the perfect program for your educational goals.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {programs.map((program) => (
            <div key={program.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                <img 
                  src={`/images/program-${program.id}.svg`} 
                  alt={program.title} 
                  className="h-24 w-24 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/150?text=Program';
                  }}
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-teal-700 mb-2">{program.title}</h3>
                <p className="text-gray-600 mb-4">{program.description}</p>
                <Link 
                  to={program.link}
                  className="text-orange-500 hover:text-orange-600 font-medium"
                >
                  Learn More →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GraduatePrograms; 