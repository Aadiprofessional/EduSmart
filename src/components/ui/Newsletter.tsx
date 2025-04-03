import React, { useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import IconComponent from './IconComponent';

const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription logic
    console.log('Newsletter subscription for:', email);
    setIsSubmitted(true);
    setEmail('');
    // Reset submission status after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
    }, 3000);
  };

  return (
    <section className="py-12 bg-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-bold text-teal-800 mb-2">Subscribe To Newsletter</h2>
          <p className="text-gray-600 mb-6 text-center max-w-xl">
            Get the latest updates on university admissions, scholarships, and educational resources 
            delivered directly to your inbox.
          </p>
          
          <form onSubmit={handleSubmit} className="w-full max-w-md relative">
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
              required
            />
            <button
              type="submit"
              className="absolute right-0 top-0 h-full bg-orange-500 hover:bg-orange-600 text-white px-4 rounded-r-lg transition-colors"
            >
              <IconComponent icon={FaPaperPlane} />
            </button>
          </form>
          
          {isSubmitted && (
            <div className="mt-4 text-green-600">
              Thank you for subscribing to our newsletter!
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Newsletter; 