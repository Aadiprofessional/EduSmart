import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaCrown, FaRocket, FaBrain, FaChartLine, FaShieldAlt, 
  FaLightbulb, FaGraduationCap, FaArrowRight, FaCheck 
} from 'react-icons/fa';
import IconComponent from '../ui/IconComponent';
import { useAuth } from '../../utils/AuthContext';
import { useSubscription } from '../../utils/SubscriptionContext';

const SubscriptionBanner: React.FC = () => {
  const { user } = useAuth();
  const { isProUser, responsesRemaining } = useSubscription();

  // Don't show banner if user is not logged in
  if (!user) {
    return null;
  }

  // Show addon banner for pro users with low responses
  const showAddonBanner = isProUser && responsesRemaining < 50;
  
  // Don't show banner if user is pro with enough responses
  if (isProUser && !showAddonBanner) {
    return null;
  }

  const features = [
    { icon: FaRocket, title: 'Unlimited AI Responses', description: '500+ responses per month' },
    { icon: FaBrain, title: 'Advanced AI Features', description: 'Access to premium AI tools' },
    { icon: FaChartLine, title: 'Progress Analytics', description: 'Track your learning journey' },
    { icon: FaShieldAlt, title: 'Priority Support', description: '24/7 premium assistance' },
    { icon: FaLightbulb, title: 'Smart Recommendations', description: 'Personalized learning paths' },
    { icon: FaGraduationCap, title: 'Academic Excellence', description: 'Advanced study tools' },
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.section 
      className="py-20 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          className="text-center mb-16"
          variants={itemVariants}
        >
          <div className="flex justify-center mb-6">
            <motion.div
              className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-full"
              animate={{
                rotate: [0, 5, -5, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <IconComponent icon={FaCrown} className="w-12 h-12 text-white" />
            </motion.div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent mb-6">
            {showAddonBanner ? 'Running Low on Responses?' : 'Unlock Your Learning Potential'}
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            {showAddonBanner 
              ? `You have ${responsesRemaining} responses remaining. Get more responses to continue your learning journey without interruption.`
              : 'Join thousands of students who have upgraded to Pro and accelerated their academic success with unlimited AI-powered assistance.'
            }
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <motion.div
              className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 px-6 py-4"
              whileHover={{ scale: 1.05 }}
            >
              <div className="flex items-center">
                <div className="bg-green-500/20 p-2 rounded-full mr-3">
                  <IconComponent icon={FaCheck} className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">Free Plan</p>
                  <p className="text-gray-400 text-sm">Limited features</p>
                </div>
              </div>
            </motion.div>
            
            <div className="flex items-center">
              <IconComponent icon={FaArrowRight} className="w-6 h-6 text-purple-400 mx-4" />
            </div>
            
            <motion.div
              className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl border border-yellow-500/30 px-6 py-4"
              whileHover={{ scale: 1.05 }}
            >
              <div className="flex items-center">
                <div className="bg-yellow-500/20 p-2 rounded-full mr-3">
                  <IconComponent icon={FaCrown} className="w-4 h-4 text-yellow-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">Pro Plan</p>
                  <p className="text-yellow-400 text-sm">Unlimited potential</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
          variants={itemVariants}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-purple-500/30 transition-all duration-300"
              whileHover={{ scale: 1.05, y: -5 }}
              variants={itemVariants}
            >
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-3 rounded-xl w-fit mb-4">
                <IconComponent icon={feature.icon} className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Pricing Preview */}
        <motion.div 
          className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 max-w-4xl mx-auto mb-12"
          variants={itemVariants}
        >
          {showAddonBanner ? (
            // Addon Pricing for Pro Users
            <div className="text-center">
              <h3 className="text-3xl font-bold text-white mb-6">Get More Responses</h3>
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-xl rounded-2xl border border-orange-500/30 p-6">
                <div className="flex items-center justify-center mb-4">
                  <span className="text-4xl font-bold text-white">$4.99</span>
                  <span className="text-gray-400 ml-2">one-time</span>
                </div>
                <h4 className="text-xl font-semibold text-white mb-4">Extra Responses Pack</h4>
                <ul className="space-y-2 text-left max-w-md mx-auto">
                  <li className="flex items-center text-gray-300">
                    <IconComponent icon={FaCheck} className="w-4 h-4 text-green-400 mr-2" />
                    50 additional AI responses
                  </li>
                  <li className="flex items-center text-gray-300">
                    <IconComponent icon={FaCheck} className="w-4 h-4 text-green-400 mr-2" />
                    No expiration date
                  </li>
                  <li className="flex items-center text-gray-300">
                    <IconComponent icon={FaCheck} className="w-4 h-4 text-green-400 mr-2" />
                    Instant activation
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            // Regular Subscription Pricing
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-4">Monthly Pro</h3>
                <div className="flex items-center justify-center mb-4">
                  <span className="text-4xl font-bold text-white">$9.99</span>
                  <span className="text-gray-400 ml-2">/month</span>
                </div>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center text-gray-300">
                    <IconComponent icon={FaCheck} className="w-4 h-4 text-green-400 mr-2" />
                    500 AI responses per month
                  </li>
                  <li className="flex items-center text-gray-300">
                    <IconComponent icon={FaCheck} className="w-4 h-4 text-green-400 mr-2" />
                    Priority support
                  </li>
                  <li className="flex items-center text-gray-300">
                    <IconComponent icon={FaCheck} className="w-4 h-4 text-green-400 mr-2" />
                    Advanced AI features
                  </li>
                </ul>
              </div>
              
              <div className="text-center relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                    Best Value
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Yearly Pro</h3>
                <div className="flex items-center justify-center mb-4">
                  <span className="text-4xl font-bold text-white">$99.99</span>
                  <span className="text-gray-400 ml-2">/year</span>
                </div>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center text-gray-300">
                    <IconComponent icon={FaCheck} className="w-4 h-4 text-green-400 mr-2" />
                    500 AI responses per month
                  </li>
                  <li className="flex items-center text-gray-300">
                    <IconComponent icon={FaCheck} className="w-4 h-4 text-green-400 mr-2" />
                    Save 2 months free
                  </li>
                  <li className="flex items-center text-gray-300">
                    <IconComponent icon={FaCheck} className="w-4 h-4 text-green-400 mr-2" />
                    All premium features
                  </li>
                </ul>
              </div>
            </div>
          )}
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          className="text-center"
          variants={itemVariants}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/subscription"
              className={`inline-flex items-center px-8 py-4 ${
                showAddonBanner 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600' 
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
              } text-white rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg ${
                showAddonBanner ? 'hover:shadow-orange-500/25' : 'hover:shadow-purple-500/25'
              }`}
            >
              <IconComponent icon={FaCrown} className="w-6 h-6 mr-3" />
              {showAddonBanner ? 'Buy More Responses' : 'Upgrade to Pro Now'}
              <IconComponent icon={FaArrowRight} className="w-5 h-5 ml-3" />
            </Link>
          </motion.div>
          
          <p className="text-gray-400 text-sm mt-4">
            Start your free trial today. Cancel anytime. No hidden fees.
          </p>
        </motion.div>

        {/* Success Stories Preview */}
        <motion.div 
          className="mt-20 text-center"
          variants={itemVariants}
        >
          <h3 className="text-2xl font-bold text-white mb-8">Join 10,000+ Successful Students</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Sarah M.", quote: "Pro features helped me ace my finals!", rating: 5 },
              { name: "John D.", quote: "The AI responses are incredibly accurate.", rating: 5 },
              { name: "Emma L.", quote: "Best investment for my education!", rating: 5 }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-black/20 backdrop-blur-xl rounded-xl border border-white/10 p-6"
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex justify-center mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <IconComponent key={i} icon={FaCheck} className="w-4 h-4 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 italic mb-4">"{testimonial.quote}"</p>
                <p className="text-white font-medium">- {testimonial.name}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default SubscriptionBanner; 