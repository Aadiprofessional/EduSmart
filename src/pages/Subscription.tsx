import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCrown, FaCheck, FaTimes, FaRocket, FaStar, FaInfinity, 
  FaLightbulb, FaBrain, FaGraduationCap, FaChartLine, FaShieldAlt,
  FaSpinner, FaPlus
} from 'react-icons/fa';
import { AiOutlineCrown, AiOutlineClose } from 'react-icons/ai';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import IconComponent from '../components/ui/IconComponent';
import { useAuth } from '../utils/AuthContext';
import { useSubscription } from '../utils/SubscriptionContext';
import { subscriptionAPI, SubscriptionPlan, AddonPlan } from '../utils/subscriptionAPI';

const Subscription: React.FC = () => {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { subscriptionStatus, plans, addons, loading, refreshStatus } = useSubscription();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    navigate('/payment', {
      state: {
        selectedPlan: plan
      }
    });
  };

  const handleAddonSelect = (addon: AddonPlan) => {
    navigate('/payment', {
      state: {
        selectedAddon: addon
      }
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
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

  const planCardVariants = {
    hover: {
      scale: 1.05,
      y: -10,
      transition: { duration: 0.3 }
    }
  };

  const features = [
    { icon: FaRocket, title: 'AI-Powered Responses', description: 'Get intelligent answers to your questions' },
    { icon: FaBrain, title: 'Smart Learning', description: 'Personalized learning recommendations' },
    { icon: FaGraduationCap, title: 'Academic Support', description: 'Help with courses and assignments' },
    { icon: FaChartLine, title: 'Progress Tracking', description: 'Monitor your learning journey' },
    { icon: FaShieldAlt, title: 'Priority Support', description: '24/7 premium customer support' },
    { icon: FaLightbulb, title: 'Advanced Features', description: 'Access to all premium tools' },
  ];

  if (!user) {
    return null;
  }

  // Show loading spinner while data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header />
        <div className="pt-20 pb-16 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
              className="inline-block"
            >
              <IconComponent icon={FaSpinner} className="w-12 h-12 text-purple-400 mb-4" />
            </motion.div>
            <p className="text-white text-lg">Loading subscription plans...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <div className="pt-20 pb-16">
        <motion.div
          className="container mx-auto px-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Hero Section */}
          <motion.div 
            className="text-center mb-16"
            variants={itemVariants}
          >
            <div className="flex justify-center mb-6">
              <motion.div
                className="bg-gradient-to-r from-yellow-400 to-indigo-500 p-4 rounded-full"
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: [0.42, 0, 0.58, 1] as const
                }}
              >
                <IconComponent icon={FaCrown} className="w-12 h-12 text-white" />
              </motion.div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-6">
              Upgrade to Pro
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Unlock unlimited potential with our premium features. Get more responses, advanced AI tools, and priority support.
            </p>
          </motion.div>

          {/* Current Status */}
          {subscriptionStatus && (
            <motion.div 
              className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-12 max-w-4xl mx-auto"
              variants={itemVariants}
            >
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center mb-4 md:mb-0">
                  <IconComponent 
                    icon={subscriptionStatus.isPro ? FaCrown : FaRocket} 
                    className={`w-8 h-8 mr-4 ${subscriptionStatus.isPro ? 'text-yellow-400' : 'text-blue-400'}`} 
                  />
                  <div>
                    <h3 className={`text-xl font-bold ${subscriptionStatus.isPro ? 'text-yellow-400' : 'text-white'}`}>
                      {subscriptionStatus.isPro ? 'Pro Member' : 'Free Plan'}
                    </h3>
                    <p className="text-gray-400">
                      {subscriptionStatus.isPro 
                        ? `${subscriptionStatus.responsesRemaining} responses remaining`
                        : 'Limited features available'
                      }
                    </p>
                  </div>
                </div>
                {subscriptionStatus.isPro && subscriptionStatus.subscription && (
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">Valid until</p>
                    <p className="text-white font-medium">
                      {new Date(subscriptionStatus.subscription.end_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Features Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
            variants={itemVariants}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-black/20 backdrop-blur-xl rounded-xl border border-white/10 p-6 hover:border-purple-500/30 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
              >
                <IconComponent icon={feature.icon} className="w-8 h-8 text-purple-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Subscription Plans */}
          <motion.div variants={itemVariants}>
            <h2 className="text-3xl font-bold text-center text-white mb-12">Choose Your Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
              {Array.isArray(plans) && plans.map((plan) => (
                <motion.div
                  key={plan.id}
                  className="relative bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-8 hover:border-purple-500/50 transition-all duration-300 flex flex-col h-full"
                  variants={planCardVariants}
                  whileHover="hover"
                >
                  {plan.name.toLowerCase().includes('yearly') && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                        Best Value
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-gray-400 mb-4">{plan.description}</p>
                    <div className="flex items-center justify-center mb-4">
                      <span className="text-4xl font-bold text-white">${plan.price}</span>
                      <span className="text-gray-400 ml-2">
                        /{plan.duration_days === 30 ? 'month' : 'year'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-8 flex-grow">
                    <div className="flex items-center">
                      <IconComponent icon={FaCheck} className="w-5 h-5 text-green-400 mr-3" />
                      <span className="text-gray-300">{plan.response_limit} AI responses</span>
                    </div>
                    <div className="flex items-center">
                      <IconComponent icon={FaCheck} className="w-5 h-5 text-green-400 mr-3" />
                      <span className="text-gray-300">Priority support</span>
                    </div>
                    <div className="flex items-center">
                      <IconComponent icon={FaCheck} className="w-5 h-5 text-green-400 mr-3" />
                      <span className="text-gray-300">Advanced AI features</span>
                    </div>
                    <div className="flex items-center">
                      <IconComponent icon={FaCheck} className="w-5 h-5 text-green-400 mr-3" />
                      <span className="text-gray-300">Usage analytics</span>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <button
                      onClick={() => handlePlanSelect(plan)}
                      disabled={subscriptionStatus?.isPro}
                      className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                        subscriptionStatus?.isPro
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transform hover:scale-105'
                      }`}
                    >
                      {subscriptionStatus?.isPro ? 'Already Pro' : 'Get Started'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Show message if no plans available */}
            {(!Array.isArray(plans) || plans.length === 0) && (
              <div className="text-center py-12">
                <IconComponent icon={FaRocket} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No subscription plans available at the moment.</p>
                <p className="text-gray-500 text-sm mt-2">Please try again later.</p>
              </div>
            )}
          </motion.div>

          {/* Addon Plans */}
          {subscriptionStatus?.isPro && Array.isArray(addons) && addons.length > 0 && (
            <motion.div variants={itemVariants}>
              <h2 className="text-3xl font-bold text-center text-white mb-12">Boost Your Plan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {addons.map((addon) => (
                  <motion.div
                    key={addon.id}
                    className="bg-black/20 backdrop-blur-xl rounded-xl border border-white/10 p-6 hover:border-blue-500/50 transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-center mb-6">
                      <IconComponent icon={FaRocket} className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">{addon.name}</h3>
                      <p className="text-gray-400 mb-4">{addon.description}</p>
                      <div className="text-2xl font-bold text-white">${addon.price}</div>
                    </div>

                    <div className="space-y-2 mb-6">
                      <div className="flex items-center justify-center">
                        <IconComponent icon={FaPlus} className="w-4 h-4 text-green-400 mr-2" />
                        <span className="text-gray-300">{addon.additional_responses} extra responses</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddonSelect(addon)}
                      className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105"
                    >
                      Add to Plan
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Success/Error Messages */}
          <AnimatePresence>
            {success && (
              <motion.div
                className="fixed top-20 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
              >
                <div className="flex items-center">
                  <IconComponent icon={FaCheck} className="w-5 h-5 mr-2" />
                  {success}
                </div>
              </motion.div>
            )}
            {error && (
              <motion.div
                className="fixed top-20 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <IconComponent icon={FaTimes} className="w-5 h-5 mr-2" />
                    {error}
                  </div>
                  <button onClick={() => setError(null)} className="ml-4">
                    <IconComponent icon={AiOutlineClose} className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default Subscription; 
