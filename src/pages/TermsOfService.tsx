import React from 'react';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaGraduationCap, FaUsers, FaLock, FaHandshake, FaExclamationTriangle, FaBookOpen, FaRobot, FaDatabase, FaCertificate } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import IconComponent from '../components/ui/IconComponent';
import { useLanguage } from '../utils/LanguageContext';

const TermsOfService: React.FC = () => {
  const { t } = useLanguage();

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

  const sections = [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms',
      icon: FaHandshake,
      content: `By accessing and using MatrixAi Global's educational platform and services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these terms, please discontinue use of our services immediately.

Our platform provides AI-powered educational services, including but not limited to: university database access, scholarship information, course materials, application tracking, AI tutoring, content generation, and academic resources. These terms govern your use of all such services.`
    },
    {
      id: 'definitions',
      title: '2. Definitions',
      icon: FaBookOpen,
      content: `"MatrixAi Global," "we," "us," or "our" refers to MatrixAi Global Limited, a Hong Kong company.
"Platform" refers to our website, mobile applications, and all related services.
"User," "you," or "your" refers to any individual or entity using our services.
"Content" includes all text, data, information, software, graphics, and other materials.
"AI Services" refers to our artificial intelligence-powered features including tutoring, content generation, and analysis tools.
"Educational Data" includes academic records, progress tracking, and learning analytics.`
    },
    {
      id: 'eligibility',
      title: '3. User Eligibility and Registration',
      icon: FaUsers,
      content: `You must be at least 13 years old to use our services. Users under 18 require parental consent. By registering, you warrant that all information provided is accurate and current.

Registration Requirements:
• Valid email address
• Secure password meeting our security standards
• Accurate personal information for educational matching
• Compliance with applicable laws and regulations

You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.`
    },
    {
      id: 'services',
      title: '4. Educational Services',
      icon: FaGraduationCap,
      content: `MatrixAi Global provides comprehensive educational services including:

University Database: Access to extensive information about global universities, programs, admission requirements, and application processes.

AI-Powered Tutoring: Personalized learning assistance across various subjects with advanced AI technology.

Application Tracking: Tools to manage and track university applications, deadlines, and requirements.

Scholarship Resources: Database of scholarships, grants, and financial aid opportunities.

Course Materials: Educational content, assignments, and learning resources.

Analytics and Progress Tracking: Detailed insights into learning progress and performance metrics.

All services are provided subject to availability and may be modified or discontinued at our discretion.`
    },
    {
      id: 'ai-services',
      title: '5. AI Services and Academic Integrity',
      icon: FaRobot,
      content: `Our AI services are designed to enhance learning and provide educational assistance. Users must:

• Use AI tools as learning aids, not for academic dishonesty
• Properly cite AI-generated content when required by institutions
• Comply with their educational institution's policies on AI usage
• Understand that AI-generated content may contain errors or inaccuracies

We prohibit using our AI services to:
• Complete assignments meant to assess your own knowledge
• Generate content for plagiarism or cheating
• Violate academic integrity policies
• Create misleading or false academic credentials

Users are solely responsible for ensuring their use of AI services complies with their institution's academic integrity policies.`
    },
    {
      id: 'data-security',
      title: '6. Data Security and Privacy',
      icon: FaLock,
      content: `We implement industry-standard security measures to protect your data:

• End-to-end encryption for sensitive information
• Secure data storage with regular backups
• Access controls and authentication protocols
• Regular security audits and updates
• Compliance with GDPR, CCPA, and other privacy regulations

Educational Data Protection:
• Student records are encrypted and access-controlled
• Learning analytics are anonymized where possible
• Third-party integrations are vetted for security compliance
• Data retention policies ensure timely deletion of obsolete information

We never sell personal data and only share information as outlined in our Privacy Policy or as required by law.`
    },
    {
      id: 'intellectual-property',
      title: '7. Intellectual Property Rights',
      icon: FaCertificate,
      content: `All content on our platform, including text, graphics, logos, software, and AI models, is owned by MatrixAi Global or our licensors and protected by intellectual property laws.

User-Generated Content:
• You retain ownership of content you create using our services
• You grant us a license to use your content to improve our services
• You may not use our platform to infringe others' intellectual property rights

AI-Generated Content:
• Content generated by our AI tools may be used by you for educational purposes
• Commercial use of AI-generated content may require additional licensing
• We reserve rights to our AI models and underlying technology

Prohibited Uses:
• Reverse engineering our software or AI models
• Copying or distributing our proprietary content
• Using our services to create competing platforms
• Violating any third-party intellectual property rights`
    },
    {
      id: 'payment-terms',
      title: '8. Payment Terms and Subscriptions',
      icon: FaDatabase,
      content: `Subscription Services:
• Payment is due in advance for subscription periods
• Auto-renewal applies unless cancelled before the renewal date
• Refunds are provided according to our refund policy
• Price changes require 30 days' notice

Payment Processing:
• We use secure third-party payment processors
• All payments are processed in accordance with PCI DSS standards
• Failed payments may result in service suspension
• Taxes may apply based on your location

Cancellation:
• You may cancel your subscription at any time
• Cancellation takes effect at the end of the current billing period
• Access to premium features ends upon cancellation
• Data export options are available before account closure`
    },
    {
      id: 'prohibited-conduct',
      title: '9. Prohibited Conduct',
      icon: FaExclamationTriangle,
      content: `Users may not:

• Violate any applicable laws or regulations
• Harass, threaten, or harm other users
• Upload malicious software or content
• Attempt to gain unauthorized access to our systems
• Use our services for illegal or fraudulent activities
• Spam or send unsolicited communications
• Impersonate others or create false identities
• Interfere with the normal operation of our services

Academic Violations:
• Using our services to facilitate academic dishonesty
• Sharing account credentials with others
• Attempting to circumvent our security measures
• Misrepresenting academic credentials or achievements

Violations may result in account suspension or termination without refund.`
    },
    {
      id: 'liability-disclaimers',
      title: '10. Liability and Disclaimers',
      icon: FaShieldAlt,
      content: `Service Availability:
• Our services are provided "as is" without warranties
• We do not guarantee uninterrupted or error-free service
• Maintenance and updates may cause temporary interruptions
• Third-party services may affect our platform's availability

Educational Disclaimers:
• We do not guarantee admission to universities or scholarship awards
• AI-generated content may contain errors or inaccuracies
• Users must verify all information independently
• We are not responsible for decisions made based on our services

Limitation of Liability:
• Our liability is limited to the amount paid for services
• We are not liable for indirect, consequential, or punitive damages
• Some jurisdictions may not allow these limitations
• Users assume risk for their use of our educational services`
    },
    {
      id: 'termination',
      title: '11. Termination and Account Closure',
      icon: FaExclamationTriangle,
      content: `Account Termination:
• We may terminate accounts for terms violations
• Users may close their accounts at any time
• Termination may be immediate for serious violations
• Data deletion follows our data retention policies

Effect of Termination:
• Access to services ends immediately
• Subscription fees are non-refundable except as stated
• User-generated content may be deleted
• Some data may be retained for legal compliance

Data Portability:
• Users can export their data before termination
• Requests must be made within 30 days of account closure
• Some data may not be exportable due to technical limitations
• Personal data deletion requests are honored per privacy laws`
    },
    {
      id: 'governing-law',
      title: '12. Governing Law and Dispute Resolution',
      icon: FaHandshake,
      content: `These terms are governed by Hong Kong law. Disputes will be resolved through:

1. Direct negotiation in good faith
2. Mediation through a recognized mediation service
3. Arbitration under Hong Kong International Arbitration Centre rules
4. Court proceedings in Hong Kong jurisdiction as a last resort

Class Action Waiver:
• Disputes must be resolved individually
• No class action or representative proceedings
• No consolidation with other disputes
• Waiver applies to maximum extent permitted by law

For users in other jurisdictions, local consumer protection laws may provide additional rights that cannot be waived.`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Header />
      
      {/* Hero Section */}
      <motion.section 
        className="relative py-20 px-4 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <IconComponent icon={FaHandshake} className="text-6xl text-blue-400 mb-6 mx-auto" />
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Terms of <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Service</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Your agreement with MatrixAi Global for using our AI-powered educational platform and services
            </p>
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-4xl mx-auto border border-white/20"
          >
            <p className="text-gray-300 mb-4">
              <strong className="text-white">Last Updated:</strong> December 2024
            </p>
            <p className="text-gray-300 mb-4">
              <strong className="text-white">Company:</strong> MatrixAi Global Limited (Hong Kong)
            </p>
            <p className="text-gray-300">
              <strong className="text-white">Contact:</strong> info@matrixaiglobal.com | +852 66359879
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Terms Content */}
      <motion.section 
        className="py-16 px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container mx-auto max-w-6xl">
          <div className="space-y-12">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                variants={itemVariants}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <IconComponent icon={section.icon} className="text-2xl text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-6">{section.title}</h2>
                    <div className="prose prose-invert max-w-none">
                      {section.content.split('\n\n').map((paragraph, pIndex) => (
                        <p key={pIndex} className="text-gray-300 leading-relaxed mb-4 whitespace-pre-line">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Additional Information */}
          <motion.div
            variants={itemVariants}
            className="mt-16 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
          >
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Important Information</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-blue-400 mb-4">Contact Information</h3>
                <div className="space-y-2 text-gray-300">
                  <p><strong>Hong Kong Office:</strong></p>
                  <p>Unit G1, 35/F, Legend Tower</p>
                  <p>7 Shing Yip Street, Kwun Tong, KLN</p>
                  <p>Phone: +852 66359879</p>
                  <p>Email: info@matrixaiglobal.com</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-purple-400 mb-4">Changes to Terms</h3>
                <p className="text-gray-300 leading-relaxed">
                  We may update these terms periodically. Significant changes will be communicated via email or platform notifications. Continued use of our services after changes constitutes acceptance of the updated terms. We recommend reviewing these terms regularly to stay informed of any updates.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
};

export default TermsOfService; 