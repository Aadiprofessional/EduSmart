import React from 'react';
import { motion } from 'framer-motion';
import { FaUserShield, FaLock, FaEye, FaDatabase, FaShieldAlt, FaCookie, FaUsers, FaGlobe, FaEnvelope, FaFileContract } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import IconComponent from '../components/ui/IconComponent';
import { useLanguage } from '../utils/LanguageContext';

const PrivacyPolicy: React.FC = () => {
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
      id: 'overview',
      title: '1. Privacy Overview',
      icon: FaUserShield,
      content: `MatrixAi Global is committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, store, and protect your data when you use our AI-powered educational platform.

We collect only the information necessary to provide our educational services, including university database access, AI tutoring, application tracking, and personalized learning experiences. Your trust is paramount to us, and we implement industry-leading security measures to safeguard your information.

This policy applies to all users of our website, mobile applications, and related services. By using our platform, you consent to the data practices described in this policy.`
    },
    {
      id: 'information-collected',
      title: '2. Information We Collect',
      icon: FaDatabase,
      content: `Personal Information:
• Name, email address, and contact details
• Educational background and academic interests
• University preferences and application data
• Profile photos and biographical information
• Payment information for subscription services

Educational Data:
• Learning progress and performance metrics
• Course completion rates and assessment scores
• Study patterns and engagement analytics
• AI interaction logs and tutoring sessions
• Application tracking information and deadlines

Technical Information:
• Device information (type, operating system, browser)
• IP address and location data
• Usage patterns and feature preferences
• Session recordings for support purposes
• Cookies and similar tracking technologies

Third-Party Data:
• Information from educational institutions (with consent)
• Social media profile data (when linking accounts)
• Scholarship and financial aid information
• University application status updates`
    },
    {
      id: 'data-usage',
      title: '3. How We Use Your Information',
      icon: FaEye,
      content: `Educational Services:
• Providing personalized university recommendations
• Powering AI tutoring and learning assistance
• Tracking application deadlines and requirements
• Matching you with relevant scholarships and opportunities
• Generating progress reports and analytics

Platform Improvement:
• Enhancing our AI algorithms and recommendations
• Developing new features and educational tools
• Conducting research to improve learning outcomes
• Analyzing usage patterns to optimize user experience
• Testing and improving platform security

Communication:
• Sending educational updates and notifications
• Providing customer support and assistance
• Sharing important account and service information
• Marketing relevant educational opportunities (with consent)
• Conducting user surveys and feedback collection

Legal and Safety:
• Complying with legal obligations and regulations
• Protecting against fraud and unauthorized access
• Enforcing our Terms of Service and policies
• Responding to legal requests and investigations`
    },
    {
      id: 'data-sharing',
      title: '4. Information Sharing and Disclosure',
      icon: FaUsers,
      content: `We do not sell your personal information to third parties. We may share your information in the following limited circumstances:

Educational Partners:
• Universities and institutions (with your explicit consent)
• Scholarship providers and funding organizations
• Academic counselors and advisors
• Educational content providers and course instructors

Service Providers:
• Cloud hosting and storage services (with data processing agreements)
• Payment processors and billing services
• Email and communication service providers
• Analytics and performance monitoring tools
• Customer support and chat services

Legal Requirements:
• Government agencies and law enforcement (when required by law)
• Legal proceedings and court orders
• Protection of rights, property, or safety
• Fraud prevention and security investigations

Business Transfers:
• Mergers, acquisitions, or asset sales
• Corporate restructuring or bankruptcy proceedings
• Due diligence processes (with confidentiality agreements)

All third-party partners are required to maintain appropriate security measures and use your information only for specified purposes.`
    },
    {
      id: 'data-security',
      title: '5. Data Security and Protection',
      icon: FaLock,
      content: `We implement comprehensive security measures to protect your information:

Technical Safeguards:
• End-to-end encryption for data transmission
• Advanced encryption standards (AES-256) for data storage
• Multi-factor authentication for account access
• Regular security audits and penetration testing
• Automated threat detection and response systems

Administrative Controls:
• Strict access controls and employee training
• Regular security awareness programs
• Background checks for personnel with data access
• Incident response and breach notification procedures
• Data minimization and retention policies

Physical Security:
• Secure data centers with 24/7 monitoring
• Biometric access controls and surveillance
• Environmental controls and backup power systems
• Disaster recovery and business continuity plans

Compliance Standards:
• GDPR compliance for European users
• CCPA compliance for California residents
• FERPA compliance for educational records
• ISO 27001 and SOC 2 Type II certifications
• Regular compliance audits and assessments

Despite these measures, no method of transmission or storage is 100% secure. We continuously monitor and update our security practices to address emerging threats.`
    },
    {
      id: 'user-rights',
      title: '6. Your Privacy Rights',
      icon: FaShieldAlt,
      content: `You have the following rights regarding your personal information:

Access Rights:
• Request copies of your personal data
• Review how your information is being used
• Obtain information about data sharing practices
• Access your learning analytics and progress data

Correction Rights:
• Update or correct inaccurate information
• Modify your educational preferences and interests
• Change your communication preferences
• Update your profile and account settings

Deletion Rights:
• Request deletion of your personal information
• Close your account and remove associated data
• Withdraw consent for specific data processing
• Request anonymization of learning analytics

Portability Rights:
• Export your data in machine-readable formats
• Transfer your information to other educational platforms
• Receive copies of your application tracking data
• Download your learning progress and achievements

Objection Rights:
• Opt out of marketing communications
• Object to automated decision-making and profiling
• Restrict processing of your information
• Withdraw consent for data collection

To exercise these rights, contact us at privacy@matrixaiglobal.com. We will respond within 30 days of receiving your request.`
    },
    {
      id: 'cookies-tracking',
      title: '7. Cookies and Tracking Technologies',
      icon: FaCookie,
      content: `We use cookies and similar technologies to enhance your experience:

Essential Cookies:
• Authentication and account management
• Security and fraud prevention
• Load balancing and performance optimization
• Shopping cart and payment processing

Functional Cookies:
• Language and region preferences
• User interface customization
• Feature accessibility settings
• Learning progress tracking

Analytics Cookies:
• Usage statistics and engagement metrics
• Performance monitoring and optimization
• A/B testing and feature experimentation
• Conversion tracking and goal measurement

Marketing Cookies:
• Personalized content and recommendations
• Targeted advertising (with consent)
• Social media integration
• Campaign effectiveness measurement

You can control cookie settings through your browser preferences. Note that disabling certain cookies may limit platform functionality.

Third-Party Tracking:
• Google Analytics for usage insights
• Social media pixels for engagement tracking
• Payment processor cookies for transaction security
• Support chat widgets for customer assistance

We provide clear notice and obtain consent before using non-essential cookies.`
    },
    {
      id: 'international-transfers',
      title: '8. International Data Transfers',
      icon: FaGlobe,
      content: `As a global educational platform, we may transfer your information across international borders:

Data Processing Locations:
• Primary servers located in Hong Kong and Singapore
• Backup and disaster recovery systems in multiple regions
• Content delivery networks for global performance
• Partner integrations in various countries

Transfer Safeguards:
• Standard Contractual Clauses (SCCs) for EU data
• Adequacy decisions where available
• Binding Corporate Rules for internal transfers
• Specific consent for sensitive data transfers

Regional Compliance:
• GDPR compliance for European users
• CCPA compliance for California residents
• PIPEDA compliance for Canadian users
• Local data protection laws where applicable

Data Localization:
• Certain data types may be kept within specific regions
• Educational records subject to local retention requirements
• Payment data processed according to regional regulations
• Government data requests handled per local laws

We ensure that all international transfers maintain appropriate levels of protection for your personal information.`
    },
    {
      id: 'data-retention',
      title: '9. Data Retention and Deletion',
      icon: FaFileContract,
      content: `We retain your information only as long as necessary for legitimate purposes:

Account Data:
• Active accounts: Retained while account is active
• Inactive accounts: Deleted after 3 years of inactivity
• Closed accounts: Most data deleted within 30 days
• Some data retained for legal compliance (7 years maximum)

Educational Records:
• Learning progress: Retained for 5 years after course completion
• Transcripts and certificates: Retained for 10 years
• Application tracking: Retained until successful admission + 2 years
• Analytics data: Anonymized after 2 years

Communication Data:
• Support tickets: Retained for 3 years
• Marketing communications: Until unsubscribe + 30 days
• Transaction records: Retained for 7 years for tax purposes
• Security logs: Retained for 1 year

Automated Deletion:
• System logs purged automatically after retention periods
• Temporary files and caches cleared regularly
• Backup data subject to same retention policies
• Anonymization processes applied to aggregate data

Legal Holds:
• Data may be retained longer for legal proceedings
• Regulatory investigations may extend retention periods
• User requests for deletion honored except where legally prohibited
• Court orders and subpoenas may require data preservation`
    },
    {
      id: 'children-privacy',
      title: '10. Children\'s Privacy Protection',
      icon: FaUsers,
      content: `We take special care to protect the privacy of young users:

Age Requirements:
• Users must be at least 13 years old
• Users under 18 require parental consent
• Additional protections for users under 16 (GDPR)
• School-based accounts managed through institutions

Parental Controls:
• Parents can access their child's account information
• Consent required for data collection from minors
• Parents can request deletion of child's data
• Communication preferences controlled by parents

Educational Context:
• FERPA compliance for educational records
• Limited data collection from student users
• No behavioral advertising to children under 13
• Enhanced security for school district integrations

Data Minimization:
• Collect only information necessary for educational purposes
• No profiling or automated decision-making for minors
• Restricted third-party sharing of children's data
• Regular review of data collection from young users

If we learn that we have collected information from a child under 13 without proper consent, we will delete that information immediately.`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Header />
      
      {/* Hero Section */}
      <motion.section 
        className="relative py-20 px-4 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20"></div>
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <IconComponent icon={FaUserShield} className="text-6xl text-purple-400 mb-6 mx-auto" />
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Privacy <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">Policy</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Your privacy and data security are our top priorities at MatrixAi Global
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
              <strong className="text-white">Data Controller:</strong> MatrixAi Global Limited (Hong Kong)
            </p>
            <p className="text-gray-300">
              <strong className="text-white">Privacy Contact:</strong> privacy@matrixaiglobal.com | +852 66359879
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Privacy Content */}
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
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
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

          {/* Contact Information */}
          <motion.div
            variants={itemVariants}
            className="mt-16 bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
          >
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Privacy Contact Information</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-purple-400 mb-4">Data Protection Officer</h3>
                <div className="space-y-2 text-gray-300">
                  <p><strong>Email:</strong> privacy@matrixaiglobal.com</p>
                  <p><strong>Phone:</strong> +852 66359879</p>
                  <p><strong>Response Time:</strong> Within 30 days</p>
                  <p><strong>Languages:</strong> English, Chinese</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-blue-400 mb-4">Your Rights</h3>
                <div className="space-y-2 text-gray-300">
                  <p>• Right to access your data</p>
                  <p>• Right to rectification and deletion</p>
                  <p>• Right to data portability</p>
                  <p>• Right to object to processing</p>
                  <p>• Right to lodge a complaint with supervisory authorities</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">Quick Actions</h3>
              <div className="flex flex-wrap gap-4">
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors duration-300">
                  Download My Data
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-300">
                  Update Preferences
                </button>
                <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-300">
                  Delete Account
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy; 