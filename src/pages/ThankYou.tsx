import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaCheckCircle, FaCrown, FaRocket, FaStar, FaGift, 
  FaHome, FaHeart, FaMagic
} from 'react-icons/fa';
import { AiOutlineGift } from 'react-icons/ai';
import IconComponent from '../components/ui/IconComponent';
import { useAuth } from '../utils/AuthContext';
import { useSubscription } from '../utils/SubscriptionContext';

interface ThankYouState {
  planName?: string;
  planPrice?: number;
  isAddon?: boolean;
  transactionId?: string;
}

const ThankYou: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { subscriptionStatus, refreshStatus } = useSubscription();
  
  const state = location.state as ThankYouState;

  // Redirect to home if no user or no purchase state
  useEffect(() => {
    if (!user || !state) {
      navigate('/', { replace: true });
      return;
    }

    // Refresh subscription status
    refreshStatus();

    // Prevent back navigation - redirect to home
    const handlePopState = () => {
      navigate('/', { replace: true });
    };

    window.addEventListener('popstate', handlePopState);
    
    // Replace current history entry to prevent back navigation
    window.history.replaceState(null, '', '/thank-you');

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [user, state, navigate, refreshStatus]);

  // Auto redirect to home after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/', { replace: true });
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      rotate: [-5, 5, -5],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const sparkleVariants = {
    animate: {
      scale: [1, 1.2, 1],
      rotate: [0, 180, 360],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  if (!user || !state) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-yellow-400/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-pink-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-32 w-40 h-40 bg-green-400/20 rounded-full blur-xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-blue-400/20 rounded-full blur-xl animate-pulse delay-500"></div>
      </div>

      {/* Floating Sparkles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          variants={sparkleVariants}
          animate="animate"
          transition={{ delay: i * 0.5 }}
        >
          <IconComponent icon={FaMagic} className="w-4 h-4 text-yellow-300/60" />
        </motion.div>
      ))}

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          className="max-w-2xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Success Icon */}
          <motion.div
            className="mb-8"
            variants={itemVariants}
          >
            <motion.div
              className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mb-6"
              variants={floatingVariants}
              animate="animate"
            >
              <IconComponent icon={FaCheckCircle} className="w-16 h-16 text-white" />
            </motion.div>
          </motion.div>

          {/* Thank You Message */}
          <motion.div variants={itemVariants}>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-6">
              Thank You!
            </h1>
            <p className="text-2xl md:text-3xl text-white mb-4 font-semibold">
              {state.isAddon ? 'Addon Purchase Successful!' : 'Welcome to Pro!'}
            </p>
            <p className="text-lg text-gray-300 mb-8 max-w-xl mx-auto">
              {state.isAddon 
                ? `You've successfully added more responses to your plan. Your extra responses are now available!`
                : `You've successfully upgraded to our Pro plan. Get ready to unlock unlimited learning potential!`
              }
            </p>
          </motion.div>

          {/* Purchase Details */}
          <motion.div
            className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/20 p-8 mb-8 max-w-lg mx-auto"
            variants={itemVariants}
          >
            <div className="flex items-center justify-center mb-6">
              <motion.div
                className="bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-full mr-4"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <IconComponent icon={state.isAddon ? FaGift : FaCrown} className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-white">{state.planName}</h3>
                <p className="text-2xl font-bold text-green-400">${state.planPrice}</p>
              </div>
            </div>
            
            {state.transactionId && (
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-1">Transaction ID</p>
                <p className="text-white font-mono text-sm bg-gray-800/50 px-3 py-1 rounded-lg inline-block">
                  {state.transactionId}
                </p>
              </div>
            )}
          </motion.div>

          {/* Features Unlocked */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
            variants={itemVariants}
          >
            {!state.isAddon && (
              <>
                <motion.div
                  className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <IconComponent icon={FaRocket} className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                  <h4 className="text-white font-semibold mb-2">Unlimited AI</h4>
                  <p className="text-gray-300 text-sm">500+ responses per month</p>
                </motion.div>
                
                <motion.div
                  className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <IconComponent icon={FaStar} className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                  <h4 className="text-white font-semibold mb-2">Premium Features</h4>
                  <p className="text-gray-300 text-sm">Advanced AI tools</p>
                </motion.div>
                
                <motion.div
                  className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <IconComponent icon={FaHeart} className="w-8 h-8 text-pink-400 mx-auto mb-3" />
                  <h4 className="text-white font-semibold mb-2">Priority Support</h4>
                  <p className="text-gray-300 text-sm">24/7 assistance</p>
                </motion.div>
              </>
            )}
            
            {state.isAddon && (
              <motion.div
                className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:col-span-3"
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <IconComponent icon={AiOutlineGift} className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h4 className="text-white font-semibold mb-2 text-xl">Extra Responses Added!</h4>
                <p className="text-gray-300">Your additional responses are now available and ready to use.</p>
              </motion.div>
            )}
          </motion.div>

          {/* Current Status */}
          {subscriptionStatus && (
            <motion.div
              className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6 mb-8"
              variants={itemVariants}
            >
              <div className="flex items-center justify-center mb-4">
                <IconComponent icon={FaCrown} className="w-6 h-6 text-yellow-400 mr-2" />
                <span className="text-white font-semibold">Pro Member</span>
              </div>
              <p className="text-green-300 text-lg font-semibold">
                {subscriptionStatus.responsesRemaining} responses remaining
              </p>
            </motion.div>
          )}

          {/* Action Button */}
          <motion.div variants={itemVariants}>
            <motion.button
              onClick={handleGoHome}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-8 rounded-2xl text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <IconComponent icon={FaHome} className="w-5 h-5 mr-2 inline" />
              Start Learning Now
            </motion.button>
            
            <p className="text-gray-400 text-sm mt-4">
              Redirecting to home in <span className="text-white font-semibold">10 seconds</span>
            </p>
          </motion.div>

          {/* Celebration Message */}
          <motion.div
            className="mt-8"
            variants={itemVariants}
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="inline-block"
            >
              <span className="text-4xl">🎉</span>
            </motion.div>
            <p className="text-gray-300 mt-2">
              Welcome to the EduSmart Pro family!
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ThankYou; 