import React, { useState } from 'react';

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Form submitted with data:', formData);
    // Reset form
    setFormData({
      name: '',
      email: '',
      message: ''
    });
    // Show success message
    alert('Thank you for your message! We will get back to you soon.');
  };

  const faqs = [
    {
      question: 'How does the AI university matching algorithm work?',
      answer: 'Our AI system analyzes your academic background, test scores, budget, and preferences to match you with universities where you have the best chance of admission and fit.'
    },
    {
      question: 'Can I access university rankings and admission requirements?',
      answer: 'Yes, our database includes comprehensive information on QS rankings, tuition fees, GPA requirements, language proficiency needs, and application deadlines for universities worldwide.'
    },
    {
      question: 'Are the success stories and case studies real?',
      answer: 'Absolutely. All our case studies feature real students who have used our platform, though some details may be anonymized to protect privacy.'
    },
    {
      question: 'How can I track my university applications?',
      answer: 'Our application tracker provides real-time status updates, document submission countdowns, and deadline alerts to keep your applications organized.'
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* FAQ Section */}
          <div className="lg:w-1/2">
            <h2 className="text-3xl font-bold text-teal-800 mb-8">Get some simple answers here.</h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-teal-700 mb-2">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Contact Form */}
          <div className="lg:w-1/2 bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-teal-800 mb-6">Make An Inquiry</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                  required
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                  required
                ></textarea>
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-md transition-colors font-medium"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm; 