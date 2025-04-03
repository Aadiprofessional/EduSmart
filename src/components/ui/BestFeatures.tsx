import React from 'react';
import { FaRobot, FaChartLine, FaUserGraduate } from 'react-icons/fa';
import IconComponent from './IconComponent';

const BestFeatures: React.FC = () => {
  const features = [
    {
      id: 1,
      icon: <IconComponent icon={FaRobot} className="text-orange-500 text-4xl" />,
      title: 'AI-Powered University Matching',
      description: 'Find your ideal university with AI-driven recommendations tailored to your grades, budget, and career goals.'
    },
    {
      id: 2,
      icon: <IconComponent icon={FaUserGraduate} className="text-orange-500 text-4xl" />,
      title: 'Real Success Stories & Case Studies',
      description: 'Get inspired by students who overcame challenges and secured admission to top universities, with insights into their strategies.'
    },
    {
      id: 3,
      icon: <IconComponent icon={FaChartLine} className="text-orange-500 text-4xl" />,
      title: 'Smart Application Tracking',
      description: 'Keep your application process organized with real-time deadline reminders, document tracking, and offer status updates.'
    }
  ];

  return (
    <section className="py-16 bg-teal-900 text-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-12 text-center">Our Best Features</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.id} className="flex flex-col items-start p-6 border-l-4 border-orange-500">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BestFeatures; 