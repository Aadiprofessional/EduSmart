import React from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaRobot, FaMoneyBillWave, FaUsers, FaCalendarCheck, FaUniversity } from 'react-icons/fa';
import IconComponent from './IconComponent';

const UpcomingEvents: React.FC = () => {
  const upcomingFeatures = [
    {
      id: 1,
      title: 'AI-Powered Interview Prep',
      description: 'Get personalized mock interviews with AI feedback to help you ace university admissions and scholarship interviews.',
      status: 'In Development',
      release: 'Coming Soon',
      icon: <IconComponent icon={FaRobot} />,
      link: '/features/interview-prep'
    },
    {
      id: 2,
      title: 'Study Abroad Cost Calculator',
      description: 'Estimate your total expenses, including tuition, living costs, and travel, based on your destination and lifestyle preferences.',
      status: 'In Progress',
      release: 'Q3 2025',
      icon: <IconComponent icon={FaMoneyBillWave} />,
      link: '/features/cost-calculator'
    },
    {
      id: 3,
      title: 'University Networking Hub',
      description: 'Connect with current students and alumni to get real insights into university life, courses, and career opportunities.',
      status: 'Planning Stage',
      release: 'To Be Announced',
      icon: <IconComponent icon={FaUsers} />,
      link: '/features/networking-hub'
    },
    {
      id: 4,
      title: 'AI-Generated Study Plan',
      description: 'Receive a personalized study plan based on your target universities, application deadlines, and preparation timeline.',
      status: 'Beta Testing',
      release: 'Early 2026',
      icon: <IconComponent icon={FaCalendarCheck} />,
      link: '/features/study-plan'
    },
    {
      id: 5,
      title: 'Virtual Campus Tours',
      description: 'Explore universities around the world with 360° virtual tours and interactive campus experiences.',
      status: 'Concept Development',
      release: 'Future Update',
      icon: <IconComponent icon={FaUniversity} />,
      link: '/features/virtual-tours'
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-teal-800 mb-12 text-center">Upcoming Features</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingFeatures.slice(0, 6).map((feature) => (
            <div key={feature.id} className="bg-white rounded-lg shadow-md overflow-hidden relative border border-gray-200">
              <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs py-1 px-2 rounded">
                NEW
              </div>
              <div className="h-40 bg-gray-100 flex items-center justify-center">
                <div className="text-orange-500 text-5xl">
                  {feature.icon}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-teal-700 mb-2">{feature.title}</h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <div className="flex items-center text-gray-600 mb-1">
                  <IconComponent icon={FaCalendarAlt} className="mr-2 text-orange-500" />
                  <span className="text-sm">Status: {feature.status}</span>
                </div>
                <p className="text-gray-600 mb-4 text-sm">Expected Release: {feature.release}</p>
                <Link 
                  to={feature.link}
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

export default UpcomingEvents; 