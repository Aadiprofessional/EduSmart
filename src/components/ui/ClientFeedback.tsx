import React from 'react';
import { FaStar } from 'react-icons/fa';
import IconComponent from './IconComponent';

const ClientFeedback: React.FC = () => {
  const testimonials = [
    {
      id: 1,
      name: 'Sarah J.',
      role: 'Computer Science Student',
      university: 'MIT (Admitted)',
      content: 'EduSmart\'s AI matching tool helped me find programs that perfectly aligned with my interests. Their application tracking kept me organized through the whole process!',
      rating: 5
    },
    {
      id: 2,
      name: 'Michael L.',
      role: 'International Student',
      university: 'Oxford University',
      content: 'As an international student, I was overwhelmed by options until I found EduSmart. Their database made comparing universities across countries so much easier.',
      rating: 5
    },
    {
      id: 3,
      name: 'Emma R.',
      role: 'Scholarship Recipient',
      university: 'Stanford University',
      content: 'Thanks to EduSmart\'s scholarship finder, I discovered and applied for funding I didn\'t know existed. Now I\'m studying at my dream university with a full scholarship!',
      rating: 5
    }
  ];

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, index) => (
      <IconComponent 
        key={index} 
        icon={FaStar}
        className={`${index < rating ? 'text-yellow-500' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-teal-800 mb-12 text-center">Client Feedback</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <div className="flex text-yellow-500 mb-4">
                {renderStars(testimonial.rating)}
              </div>
              <p className="text-gray-700 mb-6">"{testimonial.content}"</p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full mr-4 flex items-center justify-center text-orange-500 font-bold">
                  {testimonial.name.split(' ')[0][0]}{testimonial.name.split(' ')[1][0]}
                </div>
                <div>
                  <h4 className="font-semibold text-teal-700">{testimonial.name}</h4>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                  <p className="text-orange-500 text-sm">{testimonial.university}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ClientFeedback; 