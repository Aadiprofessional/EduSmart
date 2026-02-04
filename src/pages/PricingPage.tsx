import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineCheck, AiOutlineCrown, AiOutlineStar, AiOutlineQuestionCircle } from 'react-icons/ai';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useAuth } from '../utils/AuthContext';
import { subscriptionAPI, SubscriptionPlan } from '../utils/subscriptionAPI';
import { Header } from '../components/layout';
import { Skeleton } from '../components/ui/Skeleton';

const PricingPage: React.FC = () => {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        // Use 'fake-user-for-plans' if user is not logged in, as per user instructions
        const uid = user?.id || 'fake-user-for-plans';
        const response = await subscriptionAPI.getPlans(session, uid);
        
        if (response.success && response.data) {
          setPlans(response.data);
        } else {
          setError(response.error || 'Failed to load subscription plans');
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [user, session]);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!user) {
      navigate('/login', { state: { from: '/pricing' } });
      return;
    }
    
    // Navigate to the new checkout page
    navigate(`/subscription/buy/${plan.id}`, { state: { plan } });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111111] text-gray-900 dark:text-white font-sans">
      <Header />
      
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500"
          >
            Choose Your Plan
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
          >
            Unlock the full potential of your AI learning companion with our premium plans.
          </motion.p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-8 border border-gray-200 dark:border-white/10 h-96 flex flex-col">
                <Skeleton className="w-1/2 h-8 mb-4" />
                <Skeleton className="w-1/3 h-12 mb-8" />
                <div className="space-y-4 flex-1">
                  <Skeleton className="w-full h-4" />
                  <Skeleton className="w-full h-4" />
                  <Skeleton className="w-3/4 h-4" />
                </div>
                <Skeleton className="w-full h-12 rounded-xl mt-8" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center p-8 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800 max-w-2xl mx-auto">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Error Loading Plans</h3>
            <p className="text-gray-600 dark:text-gray-300">{error}</p>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
          >
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                variants={itemVariants}
                className={`relative overflow-hidden bg-white dark:bg-[#1a1a1a] rounded-3xl p-8 border transition-all duration-300 hover:shadow-2xl ${
                  plan.name.toLowerCase().includes('pro') 
                    ? 'border-purple-500/50 dark:border-purple-500/50 shadow-purple-500/10 scale-105 z-10' 
                    : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                }`}
              >
                {plan.name.toLowerCase().includes('pro') && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-blue-600 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
                    POPULAR
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-2 flex items-center">
                    {plan.name.toLowerCase().includes('pro') && (
                      <AiOutlineCrown className="text-purple-500 mr-2" />
                    )}
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline mb-4">
                    <span className="text-4xl font-extrabold">${plan.price}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">/{plan.type || 'month'}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {plan.description || 'Unlock premium features and accelerate your learning.'}
                  </p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.coins && (
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/10 flex items-center justify-center mt-0.5 mr-3">
                        <span className="text-xs">🪙</span>
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        {plan.coins} Coins included
                      </span>
                    </li>
                  )}
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center mt-0.5 mr-3">
                      <AiOutlineCheck className="w-3.5 h-3.5 text-green-500" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">
                      Duration: {plan.duration_days} days
                    </span>
                  </li>
                  {/* Add more features based on plan type if available, or static features */}
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center mt-0.5 mr-3">
                      <AiOutlineCheck className="w-3.5 h-3.5 text-green-500" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">
                      Full Access to AI Tutor
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center mt-0.5 mr-3">
                      <AiOutlineCheck className="w-3.5 h-3.5 text-green-500" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">
                      Unlimited Study Sets
                    </span>
                  </li>
                </ul>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={!!subscribing}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                    plan.name.toLowerCase().includes('pro')
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40'
                      : 'bg-white dark:bg-white/10 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/20'
                  }`}
                >
                  {subscribing === plan.id ? 'Processing...' : (user ? 'Subscribe Now' : 'Log in to Subscribe')}
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Features Grid */}
        <div className="mt-24 mb-16">
            <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">Why MatrixEdu Pro?</h2>
            <div className="grid md:grid-cols-3 gap-8">
                {[
                    { title: "Advanced AI Models", desc: "Access to GPT-4 and Claude 3 Opus for superior reasoning.", icon: <AiOutlineStar className="w-8 h-8 text-yellow-500" /> },
                    { title: "Priority Support", desc: "Get your questions answered faster with our priority queue.", icon: <AiOutlineCrown className="w-8 h-8 text-purple-500" /> },
                    { title: "Unlimited History", desc: "Save and search through all your past learning sessions.", icon: <AiOutlineCheck className="w-8 h-8 text-green-500" /> }
                ].map((feature, i) => (
                    <div key={i} className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-200 dark:border-white/10 text-center hover:shadow-lg transition-shadow">
                        <div className="bg-gray-50 dark:bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            {feature.icon}
                        </div>
                        <h3 className="text-xl font-bold mb-2 dark:text-white">{feature.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400">{feature.desc}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 dark:text-white">Frequently Asked Questions</h2>
            <p className="text-gray-600 dark:text-gray-400">Everything you need to know about our plans.</p>
          </div>
          
          <div className="space-y-4">
            {[
              { q: "Can I cancel my subscription at any time?", a: "Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period." },
              { q: "What happens to my unused coins?", a: "Unused coins roll over to the next month as long as you maintain an active subscription." },
              { q: "Do you offer student discounts?", a: "Yes! We offer special rates for students. Please contact our support team with your valid student ID." },
              { q: "Is my payment information secure?", a: "Absolutely. We use industry-standard encryption and do not store your credit card details on our servers." }
            ].map((faq, index) => (
              <div key={index} className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="font-semibold text-lg dark:text-white">{faq.q}</span>
                  {openFaq === index ? <FaChevronUp className="text-blue-500" /> : <FaChevronDown className="text-gray-400" />}
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-6 pb-4"
                    >
                      <p className="text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-white/5">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PricingPage;
