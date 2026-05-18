import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaEnvelope, FaMapMarkerAlt, FaPhone, FaPaperPlane, FaCheckCircle } from 'react-icons/fa';
import MatrixEduNavbar from '../components/layout/MatrixEduNavbar';
import Footer from '../components/layout/Footer';
import IconComponent from '../components/ui/IconComponent';

const Contact: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
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

  const offices = [
    {
      city: 'Hong Kong',
      address: 'Unit 1, 6/F, Cyberport 2, 100 Cyberport Road, Hong Kong',
      phone: '+852 1234 5678',
      color: 'from-blue-500 to-indigo-600',
      dotColor: 'bg-blue-500',
    },
    {
      city: 'Shenzhen',
      address: 'Floor 12, Building A, Tencent Binhai Tower, Nanshan District, Shenzhen',
      phone: '+86 755 1234 5678',
      color: 'from-purple-500 to-pink-600',
      dotColor: 'bg-purple-500',
    },
  ];

  const contactCards = [
    {
      icon: FaEnvelope,
      title: 'Email Support',
      value: 'support@matrixaiglobal.com',
      href: 'mailto:support@matrixaiglobal.com',
      color: 'text-pink-500',
      bg: 'bg-pink-500/10',
      border: 'border-pink-500/20',
    },
    {
      icon: FaPhone,
      title: 'Hong Kong Office',
      value: '+852 1234 5678',
      href: 'tel:+85212345678',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      icon: FaMapMarkerAlt,
      title: 'Headquarters',
      value: 'Hong Kong & Shenzhen',
      href: '#offices',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
  ];

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay: i * 0.1, ease: [0, 0, 0.58, 1] as const },
    }),
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-gray-900 dark:text-white">
      <MatrixEduNavbar />

      {/* Hero */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-[#0a0a1a] dark:via-[#050505] dark:to-[#0a0014] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 rounded-full px-4 py-1.5 text-sm font-medium mb-6"
          >
            <IconComponent icon={FaEnvelope} className="text-xs" />
            Contact MatrixEdu
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
          >
            Get in{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Touch
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-gray-600 dark:text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12"
          >
            Have a question about MatrixEdu, need support, or want to partner with us?
            Our team at MatrixAI Company Limited is here to help.
          </motion.p>

          {/* Contact cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {contactCards.map((card, i) => (
              <motion.a
                key={card.title}
                href={card.href}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className={`flex flex-col items-center gap-3 p-5 rounded-2xl border ${card.border} ${card.bg} hover:scale-105 transition-transform duration-300 cursor-pointer`}
              >
                <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <IconComponent icon={card.icon} className={`text-xl ${card.color}`} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{card.title}</p>
                <p className={`text-sm font-semibold ${card.color}`}>{card.value}</p>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form + Offices */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-3xl font-bold mb-2">Send Us a Message</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                Fill out the form and our team will respond within 1 business day.
              </p>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center text-center p-12 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl"
                >
                  <IconComponent icon={FaCheckCircle} className="text-5xl text-emerald-500 mb-4" />
                  <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">Message Sent!</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Thank you for reaching out. We'll get back to you at <strong>{form.email}</strong> shortly.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Your Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={form.name}
                        onChange={handleChange}
                        placeholder="John Smith"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="subject"
                      required
                      value={form.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                    >
                      <option value="" disabled>Select a topic</option>
                      <option value="general">General Enquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="billing">Billing & Subscription</option>
                      <option value="privacy">Privacy & Data</option>
                      <option value="partnership">Partnership / Business</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      required
                      value={form.message}
                      onChange={handleChange}
                      rows={6}
                      placeholder="Describe your question or issue in detail..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 resize-none"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/20"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <IconComponent icon={FaPaperPlane} className="text-sm" />
                        Send Message
                      </>
                    )}
                  </motion.button>

                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                    By submitting, you agree to our{' '}
                    <a href="/privacy" className="text-indigo-500 hover:underline">Privacy Policy</a>.
                  </p>
                </form>
              )}
            </motion.div>

            {/* Offices */}
            <motion.div
              id="offices"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-3xl font-bold mb-2">Our Offices</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  MatrixAI Company Limited operates globally with offices in Hong Kong and Shenzhen.
                </p>
              </div>

              {offices.map((office, i) => (
                <motion.div
                  key={office.city}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className="p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-white/20 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${office.color} flex items-center justify-center flex-shrink-0`}>
                      <IconComponent icon={FaMapMarkerAlt} className="text-white text-sm" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${office.dotColor}`} />
                        <h3 className="font-bold text-gray-900 dark:text-white">{office.city} Office</h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{office.address}</p>
                      <a href={`tel:${office.phone.replace(/\s/g, '')}`} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                        {office.phone}
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Direct email */}
              <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-500/30">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <IconComponent icon={FaEnvelope} className="text-indigo-500" />
                  Direct Email
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  For support, privacy requests, or account deletion:
                </p>
                <a
                  href="mailto:support@matrixaiglobal.com"
                  className="inline-block text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  support@matrixaiglobal.com
                </a>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                  We respond to all enquiries within 1–2 business days.
                </p>
              </div>

              {/* About the company */}
              <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">About MatrixAI</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  MatrixEdu is a product of <strong className="text-gray-800 dark:text-white">MatrixAI Company Limited</strong>, 
                  an EdTech company dedicated to making quality education accessible worldwide through AI-powered tools, 
                  scholarship discovery, and personalised learning experiences.
                </p>
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
