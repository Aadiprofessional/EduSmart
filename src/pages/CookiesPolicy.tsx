import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCookie, FaToggleOn, FaToggleOff, FaShieldAlt, FaChartLine, FaGlobe, FaCog, FaCheck, FaTimes } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import IconComponent from '../components/ui/IconComponent';
import { useLanguage } from '../utils/LanguageContext';

const CookiesPolicy: React.FC = () => {
  const { t } = useLanguage();
  const [cookieSettings, setCookieSettings] = useState({
    essential: true,
    functional: true,
    analytics: false,
    marketing: false
  });

  const toggleCookie = (type: keyof typeof cookieSettings) => {
    if (type === 'essential') return; // Essential cookies cannot be disabled
    setCookieSettings(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
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

  const cookieTypes = [
    {
      id: 'essential',
      name: 'Essential Cookies',
      icon: FaShieldAlt,
      description: 'Required for basic website functionality and security',
      required: true,
      examples: [
        'Authentication and login sessions',
        'Security tokens and CSRF protection',
        'Load balancing and performance optimization',
        'Shopping cart and payment processing',
        'Language and region preferences'
      ],
      retention: 'Session to 12 months',
      thirdParty: false
    },
    {
      id: 'functional',
      name: 'Functional Cookies',
      icon: FaCog,
      description: 'Enhance user experience and provide personalized features',
      required: false,
      examples: [
        'User interface customization',
        'Accessibility settings',
        'Form auto-completion',
        'Chat widget preferences',
        'Feature usage tracking'
      ],
      retention: '6 to 24 months',
      thirdParty: false
    },
    {
      id: 'analytics',
      name: 'Analytics Cookies',
      icon: FaChartLine,
      description: 'Help us understand how users interact with our platform',
      required: false,
      examples: [
        'Google Analytics tracking',
        'Page view and session analytics',
        'User journey and behavior analysis',
        'Performance monitoring',
        'A/B testing and optimization'
      ],
      retention: '2 to 26 months',
      thirdParty: true
    },
    {
      id: 'marketing',
      name: 'Marketing Cookies',
      icon: FaGlobe,
      description: 'Enable personalized advertising and content recommendations',
      required: false,
      examples: [
        'Social media integration pixels',
        'Targeted advertising preferences',
        'Campaign effectiveness tracking',
        'Cross-site behavioral tracking',
        'Personalized content delivery'
      ],
      retention: '3 to 24 months',
      thirdParty: true
    }
  ];

  const sections = [
    {
      id: 'overview',
      title: '1. Cookie Policy Overview',
      content: `This Cookie Policy explains how MatrixAi Global ("we," "us," or "our") uses cookies and similar tracking technologies when you visit our website and use our educational platform services.

Cookies are small text files that are placed on your device when you visit a website. They help us provide you with a better user experience by remembering your preferences, analyzing how you use our services, and improving our platform's functionality.

By continuing to use our website and services, you consent to our use of cookies as described in this policy. You can control and manage cookies through your browser settings or our cookie preference center.`
    },
    {
      id: 'what-are-cookies',
      title: '2. What Are Cookies?',
      content: `Cookies are small data files that websites store on your device (computer, tablet, or mobile phone) when you visit them. They serve various purposes:

Session Cookies: Temporary cookies that are deleted when you close your browser. They help maintain your session while navigating our platform.

Persistent Cookies: Remain on your device for a specified period or until you delete them. They remember your preferences across multiple visits.

First-Party Cookies: Set directly by our website and used only by us to improve your experience on our platform.

Third-Party Cookies: Set by external services we use, such as analytics providers, social media platforms, or advertising networks.

Similar Technologies: We also use web beacons, pixels, and local storage technologies that function similarly to cookies for tracking and personalization purposes.`
    },
    {
      id: 'how-we-use-cookies',
      title: '3. How We Use Cookies',
      content: `We use cookies for several important purposes:

Platform Functionality:
• Maintaining your login session and authentication
• Remembering your language and regional preferences
• Storing your course progress and learning analytics
• Managing your application tracking data
• Personalizing your dashboard and user interface

Security and Protection:
• Preventing fraud and unauthorized access
• Protecting against cross-site request forgery (CSRF) attacks
• Implementing rate limiting and abuse prevention
• Monitoring for suspicious activity
• Securing payment transactions

Performance Optimization:
• Load balancing across our servers
• Caching frequently accessed content
• Optimizing page loading times
• Improving mobile responsiveness
• Managing bandwidth and server resources

Analytics and Insights:
• Understanding user behavior and preferences
• Measuring platform performance and usage
• Identifying popular features and content
• Tracking conversion rates and goal completion
• Conducting A/B tests for feature improvements

Personalization:
• Providing relevant university recommendations
• Customizing course suggestions based on your interests
• Tailoring scholarship opportunities to your profile
• Delivering personalized content and notifications
• Remembering your search and filter preferences`
    },
    {
      id: 'third-party-cookies',
      title: '4. Third-Party Cookies and Services',
      content: `We work with trusted third-party services that may set their own cookies:

Analytics Services:
• Google Analytics: Tracks website usage and user behavior
• Hotjar: Provides heatmaps and user session recordings
• Mixpanel: Analyzes user engagement and feature adoption
• These services help us improve our platform and user experience

Payment Processors:
• Stripe: Handles secure payment processing
• PayPal: Manages alternative payment methods
• These services use cookies for fraud prevention and transaction security

Communication Tools:
• Intercom: Powers our customer support chat
• Mailchimp: Manages email communications and newsletters
• Zoom: Facilitates video consultations and webinars

Social Media Integration:
• Facebook Pixel: Enables social media features and advertising
• LinkedIn Insights: Tracks professional network engagement
• Twitter Analytics: Measures social media effectiveness

Educational Partners:
• University application portals integration
• Scholarship provider platforms
• Academic content delivery networks
• Learning management system connections

Each third-party service has its own privacy policy and cookie practices. We require all partners to maintain appropriate security measures and use data only for specified purposes.`
    },
    {
      id: 'cookie-management',
      title: '5. Managing Your Cookie Preferences',
      content: `You have several options for controlling cookies:

Browser Settings:
• Most browsers allow you to view, delete, and block cookies
• You can set your browser to notify you when cookies are being set
• Private/incognito browsing prevents most cookies from being stored
• Browser-specific instructions are available in your browser's help section

Our Cookie Preference Center:
• Access through the cookie banner or account settings
• Granular controls for different cookie categories
• Real-time updates to your preferences
• Option to withdraw consent at any time

Cookie Categories You Can Control:
• Functional Cookies: Can be disabled (may affect user experience)
• Analytics Cookies: Can be disabled (limits our ability to improve services)
• Marketing Cookies: Can be disabled (reduces personalized content)
• Essential Cookies: Cannot be disabled (required for basic functionality)

Impact of Disabling Cookies:
• Some features may not work properly
• You may need to re-enter information frequently
• Personalized recommendations may be less accurate
• We may not be able to remember your preferences
• Security features may be affected

Alternative Privacy Tools:
• Do Not Track browser settings (we respect these signals)
• Ad blockers and privacy extensions
• VPN services for additional privacy
• Regular clearing of browser data`
    },
    {
      id: 'data-retention',
      title: '6. Cookie Data Retention and Security',
      content: `We implement strict data retention and security practices:

Retention Periods:
• Session cookies: Deleted when you close your browser
• Authentication cookies: 30 days or until logout
• Preference cookies: 12 months or until changed
• Analytics cookies: 26 months maximum
• Marketing cookies: 12 months maximum

Security Measures:
• Encryption of sensitive cookie data
• Secure transmission over HTTPS
• HttpOnly flags to prevent JavaScript access
• SameSite attributes for CSRF protection
• Regular security audits and updates

Data Minimization:
• We collect only necessary cookie data
• Personal information is not stored in cookies when possible
• Regular review and deletion of unnecessary data
• Anonymization of analytics data where feasible
• Opt-in consent for non-essential cookies

Cross-Border Transfers:
• Cookie data may be processed in different countries
• Appropriate safeguards are in place for international transfers
• Compliance with GDPR, CCPA, and other privacy regulations
• Standard Contractual Clauses with third-party processors

User Rights:
• Right to access cookie data
• Right to delete cookie data
• Right to withdraw consent
• Right to data portability
• Right to object to processing`
    },
    {
      id: 'compliance',
      title: '7. Legal Compliance and Updates',
      content: `Our cookie practices comply with applicable privacy laws:

GDPR Compliance (European Union):
• Explicit consent for non-essential cookies
• Clear information about cookie purposes
• Easy withdrawal of consent mechanisms
• Data subject rights protection
• Regular compliance assessments

CCPA Compliance (California):
• Disclosure of cookie data sharing practices
• Opt-out rights for cookie-based tracking
• Non-discrimination for exercising privacy rights
• Consumer request handling procedures

Other Jurisdictions:
• PIPEDA compliance for Canadian users
• LGPD compliance for Brazilian users
• Local privacy law compliance where applicable
• Regular monitoring of regulatory changes

Cookie Policy Updates:
• We may update this policy to reflect changes in our practices
• Material changes will be communicated via email or platform notifications
• Continued use constitutes acceptance of updated terms
• Previous versions available upon request

Enforcement and Monitoring:
• Regular audits of cookie practices
• Staff training on privacy and compliance
• Incident response procedures for privacy breaches
• Cooperation with regulatory authorities
• Transparent reporting of compliance efforts

Contact Information:
• Privacy questions: privacy@matrixaiglobal.com
• Data protection officer: dpo@matrixaiglobal.com
• Compliance inquiries: compliance@matrixaiglobal.com
• General support: support@matrixaiglobal.com`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-pink-900">
      <Header />
      
      {/* Hero Section */}
      <motion.section 
        className="relative py-20 px-4 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-pink-600/20"></div>
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <IconComponent icon={FaCookie} className="text-6xl text-orange-400 mb-6 mx-auto" />
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Cookies <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">Policy</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Understanding how MatrixAi Global uses cookies to enhance your educational experience
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
              <strong className="text-white">Cookie Controller:</strong> MatrixAi Global Limited (Hong Kong)
            </p>
            <p className="text-gray-300">
              <strong className="text-white">Privacy Contact:</strong> privacy@matrixaiglobal.com | +852 66359879
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Cookie Preference Center */}
      <motion.section 
        className="py-16 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 mb-12">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Cookie Preference Center</h2>
            <p className="text-gray-300 text-center mb-8">
              Manage your cookie preferences below. Essential cookies cannot be disabled as they are required for basic website functionality.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              {cookieTypes.map((type) => (
                <div key={type.id} className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <IconComponent icon={type.icon} className="text-xl text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{type.name}</h3>
                        {type.required && <span className="text-xs text-orange-400">Required</span>}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => toggleCookie(type.id as keyof typeof cookieSettings)}
                      disabled={type.required}
                      className={`${type.required ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    >
                      <IconComponent 
                        icon={cookieSettings[type.id as keyof typeof cookieSettings] ? FaToggleOn : FaToggleOff}
                        className={`text-3xl ${
                          cookieSettings[type.id as keyof typeof cookieSettings] 
                            ? 'text-green-400' 
                            : 'text-gray-400'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-4">{type.description}</p>
                  
                  <div className="space-y-2">
                    <div className="text-xs text-gray-400">
                      <strong>Retention:</strong> {type.retention}
                    </div>
                    <div className="text-xs text-gray-400">
                      <strong>Third-party:</strong> {type.thirdParty ? 'Yes' : 'No'}
                    </div>
                  </div>
                  
                  <details className="mt-4">
                    <summary className="text-sm text-orange-400 cursor-pointer hover:text-orange-300">
                      Examples of use
                    </summary>
                    <ul className="mt-2 space-y-1">
                      {type.examples.map((example, index) => (
                        <li key={index} className="text-xs text-gray-400 flex items-start gap-2">
                          <span className="text-orange-400 mt-1">•</span>
                          {example}
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              ))}
            </div>
            
            <div className="flex justify-center gap-4 mt-8">
              <button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-300">
                Save Preferences
              </button>
              <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-300 border border-white/20">
                Accept All
              </button>
              <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-300">
                Reject Non-Essential
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Policy Content */}
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
                <h2 className="text-2xl font-bold text-white mb-6">{section.title}</h2>
                <div className="prose prose-invert max-w-none">
                  {section.content.split('\n\n').map((paragraph, pIndex) => (
                    <p key={pIndex} className="text-gray-300 leading-relaxed mb-4 whitespace-pre-line">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Additional Information */}
          <motion.div
            variants={itemVariants}
            className="mt-16 bg-gradient-to-r from-orange-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
          >
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Cookie Management Resources</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-orange-400 mb-4">Browser Guides</h3>
                <div className="space-y-2 text-gray-300">
                  <p><a href="#" className="hover:text-white transition-colors">Chrome Cookie Settings</a></p>
                  <p><a href="#" className="hover:text-white transition-colors">Firefox Cookie Management</a></p>
                  <p><a href="#" className="hover:text-white transition-colors">Safari Privacy Settings</a></p>
                  <p><a href="#" className="hover:text-white transition-colors">Edge Cookie Controls</a></p>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-pink-400 mb-4">Privacy Tools</h3>
                <div className="space-y-2 text-gray-300">
                  <p><a href="#" className="hover:text-white transition-colors">Do Not Track Settings</a></p>
                  <p><a href="#" className="hover:text-white transition-colors">Ad Blocker Options</a></p>
                  <p><a href="#" className="hover:text-white transition-colors">Privacy Extensions</a></p>
                  <p><a href="#" className="hover:text-white transition-colors">VPN Recommendations</a></p>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-red-400 mb-4">Your Rights</h3>
                <div className="space-y-2 text-gray-300">
                  <p>• Access your cookie data</p>
                  <p>• Delete stored cookies</p>
                  <p>• Withdraw consent anytime</p>
                  <p>• File privacy complaints</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-white/5 rounded-xl border border-white/10 text-center">
              <h3 className="text-lg font-semibold text-white mb-3">Need Help with Cookie Settings?</h3>
              <p className="text-gray-300 mb-4">
                Our support team is available to help you manage your privacy preferences and understand our cookie practices.
              </p>
              <button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-300">
                Contact Privacy Team
              </button>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
};

export default CookiesPolicy; 