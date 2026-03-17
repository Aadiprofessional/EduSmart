import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineCheck, AiOutlineCrown, AiOutlineStar } from 'react-icons/ai';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useAuth } from '../utils/AuthContext';
import { subscriptionAPI, SubscriptionPlan } from '../utils/subscriptionAPI';
import { Header } from '../components/layout';
import { Skeleton } from '../components/ui/Skeleton';
import { useLanguage } from '../utils/LanguageContext';

// Floating Particle Component
const FloatingParticle = ({ delay = 0, size = 4, color = "bg-white" }: { delay?: number, size?: number, color?: string }) => (
  <motion.div
    className={`absolute ${color} rounded-full opacity-20`}
    style={{
      width: size,
      height: size,
      left: Math.random() * 100 + '%',
      top: Math.random() * 100 + '%'
    }}
    animate={{
      y: [0, -100],
      opacity: [0, 0.5, 0]
    }}
    transition={{
      duration: 3 + Math.random() * 2,
      repeat: Infinity,
      delay: delay,
      ease: "linear"
    }}
  />
);

// Holographic Card Component
const HolographicCard = ({ children, className = "", ...props }: { children: React.ReactNode, className?: string } & React.ComponentProps<typeof motion.div>) => (
  <motion.div
    className={`relative group ${className} h-full`}
    whileHover={{ y: -5 }}
    transition={{ duration: 0.3 }}
    {...props}
  >
    <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
    <div className="relative h-full bg-[#0A0A0A] backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden group-hover:border-purple-500/30 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative z-10 h-full flex flex-col">
        {children}
      </div>
    </div>
  </motion.div>
);

const PricingPage: React.FC = () => {
  const { user, session } = useAuth();
  const { t } = useLanguage();
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
          setError(response.error || t('pricingPage.failedToLoadPlans'));
        }
      } catch (err) {
        setError(t('pricingPage.unexpectedError'));
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
    <div className="flex flex-col min-h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-purple-500 selection:text-white">
      <Header />
      
      {/* Floating Particles Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {[...Array(30)].map((_, i) => (
          <FloatingParticle 
            key={i} 
            delay={i * 0.2} 
            size={Math.random() * 3 + 1}
            color="bg-white"
          />
        ))}
      </div>

      <main className="flex-grow relative z-10 pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60"
          >
            {t('pricingPage.chooseYourPlan')}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            {t('pricingPage.subtitle')}
          </motion.p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[1, 2].map((i) => (
              <div key={i} className="bg-[#0A0A0A] rounded-2xl p-8 border border-white/10 h-96 flex flex-col">
                <Skeleton className="w-1/2 h-8 mb-4" dark={true} />
                <Skeleton className="w-1/3 h-12 mb-8" dark={true} />
                <div className="space-y-4 flex-1">
                  <Skeleton className="w-full h-4" dark={true} />
                  <Skeleton className="w-full h-4" dark={true} />
                  <Skeleton className="w-3/4 h-4" dark={true} />
                </div>
                <Skeleton className="w-full h-12 rounded-xl mt-8" dark={true} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center p-8 bg-red-900/10 rounded-xl border border-red-800 max-w-2xl mx-auto backdrop-blur-sm">
            <h3 className="text-lg font-bold text-red-400 mb-2">{t('pricingPage.errorLoadingPlans')}</h3>
            <p className="text-gray-300">{error}</p>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
          >
            {plans.map((plan) => (
              <HolographicCard
                key={plan.id}
                variants={itemVariants}
                className={plan.name.toLowerCase().includes('pro') ? 'border-purple-500/30' : ''}
              >
                <div className="p-8 flex flex-col h-full">
                    {plan.name.toLowerCase().includes('pro') && (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-blue-600 text-white text-xs font-bold px-4 py-1 rounded-bl-xl z-20">
                        {t('pricingPage.popular')}
                      </div>
                    )}

                    <div className="mb-8">
                      <h3 className="text-2xl font-bold mb-2 flex items-center text-white">
                        {plan.name.toLowerCase().includes('pro') && (
                          <AiOutlineCrown className="text-purple-500 mr-2" />
                        )}
                        {plan.name}
                      </h3>
                      <div className="flex items-baseline mb-4">
                        <span className="text-4xl font-extrabold text-white">${plan.price}</span>
                        <span className="text-gray-400 ml-2">/{plan.type || t('pricingPage.month')}</span>
                      </div>
                      <p className="text-gray-400">
                        {plan.description || t('pricingPage.defaultPlanDescription')}
                      </p>
                    </div>

                    <ul className="space-y-4 mb-8 flex-grow">
                      {plan.coins && (
                        <li className="flex items-start">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/10 flex items-center justify-center mt-0.5 mr-3">
                            <span className="text-xs">🪙</span>
                          </div>
                          <span className="text-gray-300 font-medium">
                            {t('pricingPage.coinsIncluded', { values: { coins: plan.coins } })}
                          </span>
                        </li>
                      )}
                      <li className="flex items-start">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center mt-0.5 mr-3">
                          <AiOutlineCheck className="w-3.5 h-3.5 text-green-500" />
                        </div>
                        <span className="text-gray-300">
                          {t('pricingPage.durationDays', { values: { days: plan.duration_days } })}
                        </span>
                      </li>
                      <li className="flex items-start">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center mt-0.5 mr-3">
                          <AiOutlineCheck className="w-3.5 h-3.5 text-green-500" />
                        </div>
                        <span className="text-gray-300">
                          {t('pricingPage.fullAccessToAiTutor')}
                        </span>
                      </li>
                      <li className="flex items-start">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center mt-0.5 mr-3">
                          <AiOutlineCheck className="w-3.5 h-3.5 text-green-500" />
                        </div>
                        <span className="text-gray-300">
                          {t('pricingPage.unlimitedStudySets')}
                        </span>
                      </li>
                    </ul>

                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={!!subscribing}
                      className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                        plan.name.toLowerCase().includes('pro')
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40'
                          : 'bg-white/10 text-white border border-white/10 hover:bg-white/20'
                      }`}
                    >
                      {subscribing === plan.id ? t('pricingPage.processing') : (user ? t('pricingPage.subscribeNow') : t('pricingPage.loginToSubscribe'))}
                    </button>
                </div>
              </HolographicCard>
            ))}
          </motion.div>
        )}

        {/* Features Grid */}
        <div className="mt-24 mb-16">
            <h2 className="text-3xl font-bold text-center mb-12 text-white">{t('pricingPage.whyPro')}</h2>
            <div className="grid md:grid-cols-3 gap-8">
                {[
                    { title: t('pricingPage.features.advancedAiModels.title'), desc: t('pricingPage.features.advancedAiModels.description'), icon: <AiOutlineStar className="w-8 h-8 text-yellow-500" /> },
                    { title: t('pricingPage.features.prioritySupport.title'), desc: t('pricingPage.features.prioritySupport.description'), icon: <AiOutlineCrown className="w-8 h-8 text-purple-500" /> },
                    { title: t('pricingPage.features.unlimitedHistory.title'), desc: t('pricingPage.features.unlimitedHistory.description'), icon: <AiOutlineCheck className="w-8 h-8 text-green-500" /> }
                ].map((feature, i) => (
                    <HolographicCard key={i}>
                        <div className="p-6 text-center h-full flex flex-col items-center">
                            <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                            <p className="text-gray-400">{feature.desc}</p>
                        </div>
                    </HolographicCard>
                ))}
            </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-white">{t('pricingPage.faqTitle')}</h2>
            <p className="text-gray-400">{t('pricingPage.faqSubtitle')}</p>
          </div>
          
          <div className="space-y-4">
            {[
              { q: t('pricingPage.faq.cancelAnytime.question'), a: t('pricingPage.faq.cancelAnytime.answer') },
              { q: t('pricingPage.faq.unusedCoins.question'), a: t('pricingPage.faq.unusedCoins.answer') },
              { q: t('pricingPage.faq.studentDiscount.question'), a: t('pricingPage.faq.studentDiscount.answer') },
              { q: t('pricingPage.faq.paymentSecurity.question'), a: t('pricingPage.faq.paymentSecurity.answer') }
            ].map((faq, index) => (
              <motion.div 
                key={index} 
                className="bg-[#0A0A0A] rounded-xl border border-white/10 overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none hover:bg-white/5 transition-colors"
                >
                  <span className="font-semibold text-lg text-white">{faq.q}</span>
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
                      <p className="text-gray-400 pt-2 border-t border-white/5">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PricingPage;
