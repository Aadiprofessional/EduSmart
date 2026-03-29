import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useUser } from '../contexts/UserContext';
import { subscriptionAPI, SubscriptionStatus, SubscriptionPlan, AddonPlan } from './subscriptionAPI';
import { supabaseSubscriptionService, SubscriptionWithAddons } from '../services/supabaseSubscriptionService';

type SubscriptionContextType = {
  subscriptionStatus: SubscriptionStatus | null;
  plans: SubscriptionPlan[];
  addons: AddonPlan[];
  loading: boolean;
  refreshStatus: () => Promise<void>;
  consumeResponse: (responseType: string, queryData: any, responsesUsed?: number) => Promise<boolean>;
  isProUser: boolean;
  responsesRemaining: number;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user: authUser, session } = useAuth();
  const { user: userContextUser } = useUser();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [addons, setAddons] = useState<AddonPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Determine which user to use - prioritize the one that has data
  const effectiveUser = authUser || userContextUser;
  const effectiveUserId = authUser?.id || userContextUser?.id;

  // Load subscription plans and addons (authenticated data)
  const loadPlansAndAddons = async () => {
    try {
      const plansResult = await subscriptionAPI.getPlans(session);

      if (plansResult.success && plansResult.data) {
        setPlans(plansResult.data);
        setAddons(
          plansResult.data
            .filter((plan) => plan.type === 'addon')
            .map((plan) => ({
              id: plan.id,
              name: plan.name,
              description: plan.description || '',
              price: plan.price,
              additional_responses: plan.coins ?? plan.response_limit ?? 0,
              coins: plan.coins,
              duration_days: plan.duration_days,
              type: plan.type,
              is_active: plan.is_active,
              created_at: plan.created_at,
              updated_at: plan.updated_at || plan.created_at
            }))
        );
      } else {
        setPlans([
          {
            id: 'basic',
            name: 'Basic Plan',
            description: 'Basic access with limited responses',
            price: 0,
            duration_days: 30,
            response_limit: 5,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'pro',
            name: 'Pro Plan',
            description: 'Unlimited access with premium features',
            price: 9.99,
            duration_days: 30,
            response_limit: 1000,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
        setAddons([
          {
            id: 'extra-responses',
            name: 'Extra Responses',
            description: 'Additional responses for your subscription',
            price: 2.99,
            additional_responses: 50,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading plans and addons:', error);
      setPlans([
        {
          id: 'basic',
          name: 'Basic Plan',
          description: 'Basic access with limited responses',
          price: 0,
          duration_days: 30,
          response_limit: 5,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
      setAddons([]);
    }
  };

  // Load subscription status from Supabase (single source of truth)
  const loadSubscriptionStatus = async () => {
    try {
      if (!effectiveUserId) {
        setSubscriptionStatus({
          hasActiveSubscription: false,
          isPro: false,
          subscription: null,
          addons: [],
          responsesRemaining: 5,
          totalResponses: 5,
          current_coins: 0
        });
        return;
      }

      const apiStatusResult = await subscriptionAPI.getStatus(session);
      if (apiStatusResult.success && apiStatusResult.data) {
        setSubscriptionStatus(apiStatusResult.data);
        return;
      }

      const supabaseData: SubscriptionWithAddons = await supabaseSubscriptionService.getUserSubscription(effectiveUserId);

      if (!supabaseData.subscription && !supabaseData.addons.length) {
        try {
          await supabaseSubscriptionService.createDefaultSubscription(effectiveUserId);
          const newData = await supabaseSubscriptionService.getUserSubscription(effectiveUserId);
          
          setSubscriptionStatus({
            hasActiveSubscription: newData.hasActiveSubscription,
            isPro: newData.isPro,
            subscription: newData.subscription,
            addons: newData.addons,
            responsesRemaining: newData.totalResponsesRemaining,
            totalResponses: newData.subscription?.responses_total || 5,
            current_coins: newData.subscription?.current_coins || 0
          });
        } catch (createError) {
          console.error('Error creating default subscription:', createError);
          // Fallback to basic free plan
          setSubscriptionStatus({
            hasActiveSubscription: false,
            isPro: false,
            subscription: null,
            addons: [],
            responsesRemaining: 5,
            totalResponses: 5,
            current_coins: 0
          });
        }
      } else {
        setSubscriptionStatus({
          hasActiveSubscription: supabaseData.hasActiveSubscription,
          isPro: supabaseData.isPro,
          subscription: supabaseData.subscription,
          addons: supabaseData.addons,
          responsesRemaining: supabaseData.totalResponsesRemaining,
          totalResponses: supabaseData.subscription?.responses_total || supabaseData.totalResponsesRemaining,
          current_coins: supabaseData.subscription?.current_coins || 0
        });
      }

    } catch (error) {
      console.error('Error loading subscription status:', error);
      // Fallback to basic free plan on any error
      setSubscriptionStatus({
        hasActiveSubscription: false,
        isPro: false,
        subscription: null,
        addons: [],
        responsesRemaining: 5,
        totalResponses: 5,
        current_coins: 0
      });
    }
  };

  // Refresh subscription status
  const refreshStatus = async () => {
    if (!effectiveUser || !effectiveUserId) {
      return;
    }

    setLoading(true);
    try {
      const subscriptionData = await supabaseSubscriptionService.getUserSubscription(effectiveUserId);
      
      const status: SubscriptionStatus = {
         hasActiveSubscription: subscriptionData.hasActiveSubscription,
         isPro: subscriptionData.isPro,
         responsesRemaining: subscriptionData.totalResponsesRemaining,
         totalResponses: subscriptionData.subscription?.responses_total || subscriptionData.totalResponsesRemaining,
         current_coins: subscriptionData.subscription?.current_coins || 0,
         addons: subscriptionData.addons,
         subscription: subscriptionData.subscription
       };
      
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error refreshing subscription status from Supabase:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use response function with Supabase
  const consumeResponse = async (responseType: string, queryData: any, responsesUsed: number = 1): Promise<boolean> => {
    if (!effectiveUser || !effectiveUserId || !subscriptionStatus?.hasActiveSubscription) {
      return false;
    }

    if (subscriptionStatus.responsesRemaining < responsesUsed) {
      return false;
    }

    try {
      const apiConsumeResult = await subscriptionAPI.useResponse(responseType, queryData, responsesUsed, session);
      if (apiConsumeResult.success) {
        const updatedStatus: SubscriptionStatus = {
          ...subscriptionStatus,
          responsesRemaining: Math.max(subscriptionStatus.responsesRemaining - responsesUsed, 0)
        };
        setSubscriptionStatus(updatedStatus);
        return true;
      }

      const success = await supabaseSubscriptionService.updateUserResponses(effectiveUserId, responsesUsed);
      
      if (success) {
        const updatedStatus: SubscriptionStatus = {
          ...subscriptionStatus,
          responsesRemaining: subscriptionStatus.responsesRemaining - responsesUsed
        };
        
        setSubscriptionStatus(updatedStatus);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error consuming response via Supabase:', error);
      return false;
    }
  };

  // Load data on mount and when user changes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadPlansAndAddons(),
        loadSubscriptionStatus()
      ]);
      setLoading(false);
    };

    loadData();
  }, [effectiveUserId, session?.user?.id]);

  const value = {
    subscriptionStatus,
    plans,
    addons,
    loading,
    refreshStatus,
    consumeResponse,
    isProUser: subscriptionStatus?.isPro || false,
    responsesRemaining: subscriptionStatus?.responsesRemaining || 0,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
