import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaQuestionCircle, FaChevronDown, FaChevronUp, FaGraduationCap, FaRobot, FaLock, FaCreditCard, FaUsers, FaSearch } from 'react-icons/fa';
import { Header } from '../components/layout';
import Footer from '../components/layout/Footer';
import IconComponent from '../components/ui/IconComponent';
import { useLanguage } from '../utils/LanguageContext';

const FAQ: React.FC = () => {
  const { t } = useLanguage();
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6 } }
  };

  const categories = [
    { id: 'all', name: 'All Questions', icon: FaQuestionCircle },
    { id: 'general', name: 'General', icon: FaGraduationCap },
    { id: 'ai-services', name: 'AI Services', icon: FaRobot },
    { id: 'security', name: 'Security & Privacy', icon: FaLock },
    { id: 'billing', name: 'Billing & Subscriptions', icon: FaCreditCard },
    { id: 'account', name: 'Account Management', icon: FaUsers }
  ];

  const faqData = [
    {
      id: 'what-is-matrixai',
      category: 'general',
      question: 'What is MatrixAi Global and what services do you offer?',
      answer: `MatrixAi Global is a cutting-edge educational technology platform that leverages artificial intelligence to revolutionize learning experiences. We offer comprehensive educational services including:

• University Database: Access to information about 10,000+ universities worldwide with detailed admission requirements, program details, and application processes.

• AI-Powered Tutoring: Personalized learning assistance across various subjects with advanced AI technology that adapts to your learning style.

• Application Tracking: Complete tools to manage and track university applications, deadlines, requirements, and submission status.

• Scholarship Resources: Extensive database of scholarships, grants, and financial aid opportunities with AI-powered matching.

• Course Materials: High-quality educational content, interactive assignments, and comprehensive learning resources.

• Analytics Dashboard: Detailed insights into your learning progress, performance metrics, and improvement recommendations.

Our platform serves students, educators, and institutions globally, providing secure, scalable, and innovative educational solutions.`
    },
    {
      id: 'how-ai-works',
      category: 'ai-services',
      question: 'How does your AI tutoring system work?',
      answer: `Our AI tutoring system uses advanced machine learning algorithms and natural language processing to provide personalized educational assistance:

Learning Analysis:
• Analyzes your learning patterns, strengths, and areas for improvement
• Adapts content difficulty based on your progress and comprehension
• Identifies knowledge gaps and provides targeted recommendations

Personalized Content:
• Generates customized explanations based on your learning style
• Provides step-by-step solutions and detailed explanations
• Creates practice problems tailored to your skill level
• Offers multiple approaches to solve complex problems

Interactive Features:
• Real-time Q&A with instant, accurate responses
• Voice-to-text and text-to-speech capabilities
• Visual learning aids including diagrams and animations
• Progress tracking with detailed performance analytics

Subject Coverage:
• Mathematics (algebra, calculus, statistics, geometry)
• Sciences (physics, chemistry, biology, earth science)
• Languages (English, Spanish, French, Mandarin, and more)
• Social Studies (history, geography, economics, political science)
• Computer Science (programming, algorithms, data structures)

Our AI is continuously learning and improving, ensuring accurate and up-to-date educational content across all subjects.`
    },
    {
      id: 'data-security',
      category: 'security',
      question: 'How secure is my personal and educational data?',
      answer: `We implement industry-leading security measures to protect your data:

Encryption & Protection:
• End-to-end encryption for all data transmission (TLS 1.3)
• AES-256 encryption for data storage
• Zero-knowledge architecture for sensitive information
• Regular security audits and penetration testing

Access Controls:
• Multi-factor authentication (MFA) for all accounts
• Role-based access controls for different user types
• Biometric authentication options where available
• Session management with automatic timeouts

Compliance Standards:
• GDPR compliance for European users
• CCPA compliance for California residents
• FERPA compliance for educational records
• ISO 27001 and SOC 2 Type II certifications

Data Centers:
• Tier 4 data centers with 24/7 physical security
• Redundant backup systems across multiple locations
• Disaster recovery plans with 99.9% uptime guarantee
• Environmental monitoring and fire suppression systems

Privacy Controls:
• You control what data is shared and with whom
• Complete data portability options
• Right to deletion and data correction
• Transparent privacy policy with regular updates

We never sell your personal data and only share information as outlined in our Privacy Policy or as required by law.`
    },
    {
      id: 'university-database',
      category: 'general',
      question: 'How comprehensive is your university database?',
      answer: `Our university database is one of the most comprehensive educational databases available:

Global Coverage:
• 10,000+ universities and colleges worldwide
• Covering 150+ countries and territories
• Regular updates with new institutions and programs
• Verified information from official university sources

Detailed Information:
• Complete program catalogs with course descriptions
• Admission requirements and application deadlines
• Tuition fees and living cost estimates
• Campus facilities and student life information
• Faculty profiles and research opportunities
• Graduate employment statistics and outcomes

Search & Filtering:
• Advanced search with 50+ filter options
• AI-powered university matching based on your profile
• Program recommendations tailored to your interests
• Comparison tools for multiple universities
• Save favorites and create custom lists

Application Support:
• Step-by-step application guides
• Required document checklists
• Application deadline tracking
• Status monitoring and updates
• Common application integration

Real-Time Updates:
• Daily updates from university partners
• Application deadline notifications
• Program availability changes
• Scholarship opportunity alerts
• Admissions news and announcements

Our database is continuously expanding and improving to provide you with the most accurate and up-to-date educational information available.`
    },
    {
      id: 'ai-academic-integrity',
      category: 'ai-services',
      question: 'How do you ensure AI usage complies with academic integrity policies?',
      answer: `Academic integrity is fundamental to educational success. Here's how we address it:

Clear Guidelines:
• Comprehensive academic integrity guidelines for AI usage
• Institution-specific policy integration
• Clear distinctions between appropriate and inappropriate AI use
• Regular updates based on evolving academic standards

Educational Approach:
• AI tools designed as learning aids, not assignment completers
• Emphasis on understanding concepts rather than getting answers
• Step-by-step explanations to promote learning
• Encouragement of critical thinking and analysis

Usage Tracking:
• Transparent logs of AI interactions
• Citation guidelines for AI-assisted work
• Integration with plagiarism detection systems
• Honor code acknowledgments and reminders

Institutional Cooperation:
• Partnerships with educational institutions
• Faculty training on AI integration in education
• Student workshops on ethical AI usage
• Regular policy reviews and updates

Responsible AI Features:
• AI responses include learning prompts and questions
• Encouragement to verify information independently
• Multiple solution approaches to promote understanding
• Links to additional learning resources

Student Responsibility:
• Clear terms of service regarding appropriate usage
• Regular reminders about institutional policies
• Resources for understanding academic integrity
• Support for students navigating AI usage policies

We believe AI should enhance learning while maintaining the integrity of educational assessments and assignments.`
    },
    {
      id: 'subscription-plans',
      category: 'billing',
      question: 'What subscription plans do you offer and what are the differences?',
      answer: `We offer flexible subscription plans to meet different educational needs:

Free Plan:
• Basic university search functionality
• Limited AI responses (5 per day)
• Access to scholarship database
• Basic application tracking
• Community forum access
• Email support

Student Pro (HK$9.99/month):
• Unlimited AI tutoring and assistance
• Advanced university search and filtering
• Complete application tracking system
• Scholarship matching and alerts
• Progress analytics and reports
• Priority email support
• Study scheduling tools
• Essay writing assistance

Premium (HK$19.99/month):
• Everything in Student Pro
• Advanced AI features and models
• Personal academic advisor consultations
• Priority customer support (phone & chat)
• Early access to new features
• Custom learning path creation
• Advanced analytics and insights
• Integration with university application systems

Family Plan (HK$24.99/month):
• Up to 6 family member accounts
• All Premium features for each account
• Parental controls and monitoring
• Shared resources and progress tracking
• Family communication tools
• Educational goal setting for children

Student Discounts:
• 50% off with valid student ID verification
• Special pricing for developing countries
• Bulk discounts for schools and institutions
• Seasonal promotions and offers

All plans include:
• 14-day free trial
• No setup fees or hidden costs
• Cancel anytime
• Data export options
• GDPR and privacy compliance`
    },
    {
      id: 'cancel-subscription',
      category: 'billing',
      question: 'How can I cancel my subscription and what happens to my data?',
      answer: `Canceling your subscription is straightforward and we respect your data ownership:

Cancellation Process:
• Cancel anytime through your account settings
• No cancellation fees or penalties
• Email confirmation of cancellation
• Cancellation takes effect at the end of current billing period

During Cancellation Period:
• Continue to access premium features until period ends
• Download and export your data
• Complete any ongoing activities
• Access to customer support continues

After Cancellation:
• Account automatically downgraded to Free plan
• Access to basic features continues
• Data remains secure and accessible
• Option to reactivate subscription anytime

Data Handling:
• Your data remains intact after cancellation
• Export options available for 30 days post-cancellation
• Personal data retained according to privacy policy
• Option to delete account and all data

Reactivation:
• Easy reactivation process
• Previous data and settings restored
• No penalties for returning customers
• Same pricing unless plan changes occurred

Refund Policy:
• Pro-rated refunds for annual subscriptions (first 30 days)
• Full refund during 14-day trial period
• Refunds processed within 5-7 business days
• Special circumstances considered case-by-case

We aim to make the cancellation process as smooth as possible while protecting your data and providing flexibility for future needs.`
    },
    {
      id: 'mobile-app',
      category: 'general',
      question: 'Do you have a mobile app? What features are available?',
      answer: `Yes, we offer comprehensive mobile applications for both iOS and Android:

Mobile App Features:
• Full AI tutoring functionality
• University search and comparison
• Application tracking and notifications
• Scholarship alerts and matching
• Offline content access
• Push notifications for deadlines
• Voice-to-text and text-to-speech
• Dark mode and accessibility features

Cross-Platform Sync:
• Seamless synchronization across all devices
• Real-time data updates
• Consistent user experience
• Cloud-based progress tracking
• Offline mode with automatic sync

Mobile-Specific Features:
• Biometric authentication (fingerprint, face recognition)
• Location-based university recommendations
• Camera integration for document scanning
• QR code scanning for quick access
• Mobile-optimized user interface
• Gesture controls and navigation

Download Information:
• Available on Apple App Store and Google Play Store
• Regular updates with new features
• Supports iOS 12+ and Android 8+
• 4.8/5 star rating from users
• Free download with subscription access

Offline Capabilities:
• Download content for offline study
• Cached university information
• Offline AI responses for common questions
• Local progress tracking
• Automatic sync when reconnected

Security Features:
• End-to-end encryption on mobile
• Secure local storage
• Remote wipe capabilities
• Session timeout controls
• VPN compatibility

The mobile app provides the full MatrixAi Global experience optimized for smartphones and tablets, ensuring you can access our educational tools anywhere, anytime.`
    },
    {
      id: 'ai-accuracy',
      category: 'ai-services',
      question: 'How accurate are the AI responses and recommendations?',
      answer: `Our AI systems are designed for high accuracy, but we maintain transparency about limitations:

Accuracy Metrics:
• 95%+ accuracy for factual information
• 90%+ accuracy for mathematical problem solving
• 85%+ accuracy for complex analytical questions
• Continuous monitoring and improvement
• Regular third-party validation

AI Training:
• Trained on curated educational content
• Regular updates with latest academic information
• Peer-reviewed sources and textbooks
• Expert validation of responses
• Multiple model verification

Quality Assurance:
• Human expert review of AI responses
• Feedback loops from users and educators
• Regular accuracy testing across subjects
• Correction mechanisms for errors
• Transparent error reporting

Limitations:
• AI may occasionally provide incorrect information
• Complex topics may require human expert consultation
• Cultural and linguistic nuances may vary
• Real-time information may not be current
• Creative and subjective topics have inherent variability

Verification Encouragement:
• Always recommend verifying important information
• Provide multiple sources for fact-checking
• Encourage critical thinking and analysis
• Link to authoritative sources
• Suggest consulting with human experts when needed

Continuous Improvement:
• Machine learning from user interactions
• Regular model updates and refinements
• Incorporation of user feedback
• Integration of latest educational research
• Collaboration with academic institutions

We're committed to providing the most accurate AI educational assistance while being transparent about the technology's current capabilities and limitations.`
    },
    {
      id: 'technical-support',
      category: 'account',
      question: 'What technical support options are available?',
      answer: `We provide comprehensive technical support through multiple channels:

Support Channels:
• 24/7 Email support (support@matrixaiglobal.com)
• Live chat (Premium subscribers)
• Phone support (Premium subscribers)
• Community forums and knowledge base
• Video tutorials and guides

Response Times:
• Email support: Within 24 hours
• Live chat: Immediate during business hours
• Phone support: Within 15 minutes (Premium)
• Community forums: Peer and staff responses
• Emergency issues: Within 4 hours

Support Categories:
• Technical troubleshooting
• Account and billing assistance
• Feature usage guidance
• Data and privacy questions
• Educational content inquiries
• Integration and API support

Self-Service Resources:
• Comprehensive help center with 500+ articles
• Video tutorial library
• Interactive feature tours
• Troubleshooting guides
• FAQ database with search functionality

Premium Support Benefits:
• Priority queue access
• Dedicated account manager
• Screen sharing sessions
• Custom training sessions
• Direct developer access for complex issues

Languages Supported:
• English (primary)
• Chinese (Mandarin and Cantonese)
• Spanish
• French
• Additional languages through translation services

Technical Expertise:
• Certified technical specialists
• Educational technology experts
• AI and machine learning specialists
• Data security professionals
• Accessibility consultants

We're committed to providing excellent support to ensure you get the most out of our platform.`
    }
  ];

  const filteredFAQs = faqData.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <Header />
      
      {/* Hero Section */}
      <motion.section 
        className="relative py-20 px-4 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-pink-600/20"></div>
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <IconComponent icon={FaQuestionCircle} className="text-6xl text-indigo-400 mb-6 mx-auto" />
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Frequently Asked <span className="bg-gradient-to-r from-indigo-400 to-pink-500 bg-clip-text text-transparent">Questions</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Find answers to common questions about MatrixAi Global's educational platform and services
            </p>
          </motion.div>
          
          {/* Search Bar */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <div className="relative">
              <IconComponent icon={FaSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search frequently asked questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all duration-300"
              />
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Categories */}
      <motion.section className="py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <IconComponent icon={category.icon} />
                {category.name}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.section>

      {/* FAQ Content */}
      <motion.section 
        className="py-16 px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container mx-auto max-w-4xl">
          <AnimatePresence>
            <div className="space-y-6">
              {filteredFAQs.map((faq) => (
                <motion.div
                  key={faq.id}
                  variants={itemVariants}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <button
                    onClick={() => toggleItem(faq.id)}
                    className="w-full p-6 text-left hover:bg-white/5 transition-all duration-300 flex items-center justify-between"
                  >
                    <h3 className="text-lg font-semibold text-white pr-4">{faq.question}</h3>
                    <IconComponent 
                      icon={openItems.has(faq.id) ? FaChevronUp : FaChevronDown} 
                      className="text-indigo-400 flex-shrink-0"
                    />
                  </button>
                  
                  <AnimatePresence>
                    {openItems.has(faq.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6">
                          <div className="prose prose-invert max-w-none">
                            {faq.answer.split('\n\n').map((paragraph, pIndex) => (
                              <p key={pIndex} className="text-gray-300 leading-relaxed mb-4 whitespace-pre-line">
                                {paragraph}
                              </p>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>

          {filteredFAQs.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-gray-400 text-lg">No questions found matching your search criteria.</p>
            </motion.div>
          )}

          {/* Contact Support */}
          <motion.div
            variants={itemVariants}
            className="mt-16 bg-gradient-to-r from-indigo-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Still have questions?</h2>
            <p className="text-gray-300 mb-6">
              Can't find the answer you're looking for? Our support team is here to help you succeed.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-300">
                Contact Support
              </button>
              <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-300 border border-white/20">
                Schedule a Demo
              </button>
            </div>
            
            <div className="mt-8 grid md:grid-cols-2 gap-6 text-left">
              <div>
                <h3 className="text-lg font-semibold text-indigo-400 mb-2">Quick Support</h3>
                <p className="text-gray-300 text-sm">Email: support@matrixaiglobal.com</p>
                <p className="text-gray-300 text-sm">Response time: Within 24 hours</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-pink-400 mb-2">Premium Support</h3>
                <p className="text-gray-300 text-sm">Phone: +852 66359879</p>
                <p className="text-gray-300 text-sm">Live chat available 24/7</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
};

export default FAQ; 