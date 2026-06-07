import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaCheckCircle,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaWhatsapp,
  FaYoutube,
} from 'react-icons/fa';
import MatrixEduNavbar from '../components/layout/MatrixEduNavbar';
import Footer from '../components/layout/Footer';
import matrixEduImage from '../assets/matrixedu.png';

const Contact: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    institution: '',
    hearAbout: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate submission — replace with your backend/email service call
    await new Promise(resolve => setTimeout(resolve, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  const socialLinks = [
    { icon: FaInstagram, href: '#', label: 'Instagram', color: 'text-pink-500' },
    { icon: FaFacebook, href: '#', label: 'Facebook', color: 'text-blue-500' },
    { icon: FaLinkedin, href: '#', label: 'LinkedIn', color: 'text-sky-600' },
    { icon: FaYoutube, href: '#', label: 'YouTube', color: 'text-red-500' },
    { icon: FaWhatsapp, href: '#', label: 'WhatsApp', color: 'text-green-500' },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fb] dark:bg-[#050505] text-gray-900 dark:text-white">
      <MatrixEduNavbar />
      <section className="pt-28 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-5xl font-semibold text-gray-900 dark:text-white">Contact Us</h1>
            <p className="mt-3 text-gray-500 dark:text-gray-400 text-sm md:text-base">
              Have a question or want to get in touch? We'd love to hear from you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white dark:bg-[#101010] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm"
            >
              {submitted ? (
                <div className="flex flex-col items-center text-center py-14">
                  <FaCheckCircle className="text-5xl text-green-500 mb-4" />
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Message Sent</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Thank you for reaching out. We'll get back to you at <strong>{form.email}</strong> shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#121212] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#121212] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Institution/Organization</label>
                    <input
                      type="text"
                      name="institution"
                      value={form.institution}
                      onChange={handleChange}
                      placeholder="Your institution or organization"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#121212] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">When did you hear about us?</label>
                    <select
                      name="hearAbout"
                      value={form.hearAbout}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#121212] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                      <option value="">Select an option</option>
                      <option value="search">Search Engine</option>
                      <option value="social">Social Media</option>
                      <option value="friend">Friend / Referral</option>
                      <option value="school">School / Teacher</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      placeholder="Optional subject"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#121212] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Message</label>
                    <textarea
                      name="message"
                      required
                      rows={4}
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Your message..."
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#121212] focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#1e88e5] hover:bg-[#1976d2] disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>

                  <div className="pt-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Follow us on social media</p>
                    <div className="flex items-center gap-3">
                      {socialLinks.map((item) => (
                        <a
                          key={item.label}
                          href={item.href}
                          aria-label={item.label}
                          className={`text-xl ${item.color} hover:opacity-80 transition-opacity`}
                        >
                          <item.icon />
                        </a>
                      ))}
                    </div>
                  </div>
                </form>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="hidden lg:flex justify-center"
            >
              <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#101010] p-4 shadow-sm">
                <img
                  src={matrixEduImage}
                  alt="Contact illustration"
                  className="w-full h-auto rounded-xl object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
