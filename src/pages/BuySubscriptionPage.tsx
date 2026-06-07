import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AiOutlineCheck, AiOutlineCreditCard, AiOutlineSafety, AiOutlineArrowLeft } from 'react-icons/ai';
import { useAuth } from '../utils/AuthContext';
import { subscriptionAPI, SubscriptionPlan } from '../utils/subscriptionAPI';
import { Header } from '../components/layout';
import { Skeleton } from '../components/ui/Skeleton';

const BuySubscriptionPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, session } = useAuth();
  
  const [plan, setPlan] = useState<SubscriptionPlan | null>((location.state as any)?.plan || null);
  const [loading, setLoading] = useState(!plan);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('STRIPE');

  useEffect(() => {
    // If we don't have the plan from navigation state, fetch it
    if (!plan && planId) {
      const fetchPlan = async () => {
        try {
          const response = await subscriptionAPI.getPlans(session, user?.id);
          
          if (response.success && response.data) {
            const foundPlan = response.data.find(p => p.id === planId);
            if (foundPlan) {
              setPlan(foundPlan);
            } else {
              setError('Plan not found');
            }
          } else {
            setError(response.error || 'Failed to load plan details');
          }
        } catch (err) {
          setError('An unexpected error occurred');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchPlan();
    }
  }, [plan, planId, user, session]);

  const handlePurchase = async () => {
    if (!plan || !user) return;

    setProcessing(true);
    setError(null);

    try {
      if (paymentMethod === 'STRIPE') {
        if (!plan.stripe_product_id) {
          throw new Error('Stripe is not configured for this plan in production yet. Please contact support or use a different payment method.');
        }

        const origin = window.location.origin;
        const successUrl = `${origin}/thank-you`;
        const cancelUrl = `${origin}/pricing`;

        const response = await subscriptionAPI.createStripeCheckoutSession(
          plan.id,
          successUrl,
          cancelUrl,
          session
        );

        if (response.success && response.data?.url) {
          window.location.href = response.data.url;
          return;
        } else {
          throw new Error(response.error || 'Failed to create Stripe checkout session');
        }
      }

      const transactionId = `txn_manual_${Date.now()}`;
      const amount = plan.price;
      const uid = user.id;

      const response = await subscriptionAPI.buySubscription(
        plan.id,
        transactionId,
        amount,
        paymentMethod,
        session,
        uid
      );

      if (response.success) {
        // Success! Navigate to dashboard or success page
        navigate('/dashboard', { 
          state: { 
            message: `Successfully subscribed to ${plan.name}!` 
          } 
        });
      } else {
        setError(response.error || 'Transaction failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Purchase error:', err);
      setError(err.message || 'An unexpected error occurred during purchase');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#111111] text-gray-900 dark:text-white font-sans">
        <Header />
        <div className="pt-24 px-4 max-w-4xl mx-auto">
          <Skeleton className="w-1/3 h-10 mb-8" />
          <div className="grid md:grid-cols-2 gap-8">
             <Skeleton className="h-96 rounded-2xl" />
             <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#111111] text-gray-900 dark:text-white font-sans">
        <Header />
        <div className="pt-24 px-4 text-center">
          <div className="p-8 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800 max-w-2xl mx-auto">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Error</h3>
            <p className="text-gray-600 dark:text-gray-300">{error || 'Plan not found'}</p>
            <button 
              onClick={() => navigate('/pricing')}
              className="mt-4 px-6 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              Back to Pricing
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111111] text-gray-900 dark:text-white font-sans">
      <Header />
      
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <button 
          onClick={() => navigate('/pricing')}
          className="flex items-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-8 transition-colors"
        >
          <AiOutlineArrowLeft className="mr-2" /> Back to Plans
        </button>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column: Plan Summary */}
          <div className="md:col-span-1">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 border border-gray-200 dark:border-white/10 sticky top-24"
            >
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Order Summary</h2>
              
              <div className="pb-4 border-b border-gray-100 dark:border-white/5 mb-4">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Selected Plan</div>
                <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                  {plan.name}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Duration</span>
                  <span className="font-medium">{plan.duration_days} days</span>
                </div>
                {plan.coins && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Coins</span>
                    <span className="font-medium">{plan.coins}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-white/5">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-bold">{`HK$${plan.price}`}</span>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl flex items-start gap-3">
                <AiOutlineSafety className="text-blue-500 text-xl mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  Your payment is secure. You can cancel your subscription at any time from your dashboard.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Checkout Form */}
          <div className="md:col-span-2">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-8 border border-gray-200 dark:border-white/10"
            >
              <h1 className="text-3xl font-bold mb-8">Complete Purchase</h1>
              
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <AiOutlineCreditCard className="text-gray-500" />
                  Payment Method
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() => setPaymentMethod('STRIPE')}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                      paymentMethod === 'STRIPE'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    <span className="font-bold">Stripe</span>
                    <span className="text-xs text-center opacity-75">Credit Card</span>
                  </button>
                </div>
              </div>

              {/* User Details Confirmation */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Account Details</h3>
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Email</span>
                    <span className="font-medium">{user?.email}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePurchase}
                disabled={processing}
                className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] ${
                  processing 
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-purple-500/25'
                }`}
              >
                {processing ? 'Processing Payment...' : `Confirm Payment (HK$${plan.price})`}
              </button>
              
              <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
                By clicking "Confirm Payment", you agree to our Terms of Service and Privacy Policy.
              </p>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BuySubscriptionPage;
