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
      console.log('Loading plans and addons...');
      const [plansResult, addonsResult] = await Promise.all([
        subscriptionAPI.getPlans(session),
        subscriptionAPI.getAddons(session)
      ]);

      console.log('Plans API Response:', plansResult);
      console.log('Addons API Response:', addonsResult);

      if (plansResult.success && plansResult.data) {
        console.log('Setting plans:', plansResult.data);
        setPlans(plansResult.data);
      } else {
        console.warn('Plans API failed, using fallback data:', plansResult.error);
        // Provide fallback plans data when API fails
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
      }

      if (addonsResult.success && addonsResult.data) {
        console.log('Setting addons:', addonsResult.data);
        setAddons(addonsResult.data);
      } else {
        console.warn('Addons API failed, using fallback data:', addonsResult.error);
        // Provide fallback addons data when API fails
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
      console.error('Error loading plans and addons, using fallback data:', error);
      // Provide fallback data for both plans and addons
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
      // Handle unauthenticated users with demo access
      if (!effectiveUserId) {
        console.log('No effective user ID found - providing demo access');
        setSubscriptionStatus({
          hasActiveSubscription: false,
          isPro: false,
          subscription: null,
          addons: [],
          responsesRemaining: 5,
          totalResponses: 5
        });
        return;
      }

      console.log('🔍 Loading subscription status for user:', effectiveUserId);

      // Fetch subscription data from Supabase (single source of truth)
      const supabaseData: SubscriptionWithAddons = await supabaseSubscriptionService.getUserSubscription(effectiveUserId);
      
      console.log('📊 Supabase subscription data:', supabaseData);

      // If no subscription found, create default one for new users
      if (!supabaseData.subscription && !supabaseData.addons.length) {
        console.log('🆕 Creating default subscription for new user');
        try {
          await supabaseSubscriptionService.createDefaultSubscription(effectiveUserId);
          // Refetch after creating default subscription
          const newData = await supabaseSubscriptionService.getUserSubscription(effectiveUserId);
          console.log('📊 New subscription data after creation:', newData);
          
          setSubscriptionStatus({
            hasActiveSubscription: newData.hasActiveSubscription,
            isPro: newData.isPro,
            subscription: newData.subscription,
            addons: newData.addons,
            responsesRemaining: newData.totalResponsesRemaining,
            totalResponses: newData.subscription?.responses_total || 5
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
            totalResponses: 5
          });
        }
      } else {
        // Use existing subscription data from Supabase
        console.log('✅ Using existing subscription data from Supabase');
        setSubscriptionStatus({
          hasActiveSubscription: supabaseData.hasActiveSubscription,
          isPro: supabaseData.isPro,
          subscription: supabaseData.subscription,
          addons: supabaseData.addons,
          responsesRemaining: supabaseData.totalResponsesRemaining,
          totalResponses: supabaseData.subscription?.responses_total || supabaseData.totalResponsesRemaining
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
        totalResponses: 5
      });
    }
  };

  // Refresh subscription status
  const refreshStatus = async () => {
    if (!effectiveUser || !effectiveUserId) {
      console.log('No user or user ID for refresh');
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Refreshing subscription status from Supabase...');
      const subscriptionData = await supabaseSubscriptionService.getUserSubscription(effectiveUserId);
      
      const status: SubscriptionStatus = {
         hasActiveSubscription: subscriptionData.hasActiveSubscription,
         isPro: subscriptionData.isPro,
         responsesRemaining: subscriptionData.totalResponsesRemaining,
         totalResponses: subscriptionData.subscription?.responses_total || subscriptionData.totalResponsesRemaining,
         addons: subscriptionData.addons,
         subscription: subscriptionData.subscription
       };
      
      setSubscriptionStatus(status);
      console.log('✅ Subscription status refreshed from Supabase:', status);
    } catch (error) {
      console.error('Error refreshing subscription status from Supabase:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use response function with Supabase
  const consumeResponse = async (responseType: string, queryData: any, responsesUsed: number = 1): Promise<boolean> => {
    console.log('🔄 consumeResponse called:', {
      responseType,
      responsesUsed,
      effectiveUser: !!effectiveUser,
      effectiveUserId,
      hasActiveSubscription: subscriptionStatus?.hasActiveSubscription,
      responsesRemaining: subscriptionStatus?.responsesRemaining
    });

    if (!effectiveUser || !effectiveUserId || !subscriptionStatus?.hasActiveSubscription) {
      console.log('❌ Cannot consume response - missing requirements:', {
        effectiveUser: !!effectiveUser,
        effectiveUserId: !!effectiveUserId,
        hasActiveSubscription: subscriptionStatus?.hasActiveSubscription
      });
      return false;
    }

    // Check if user has enough responses
    if (subscriptionStatus.responsesRemaining < responsesUsed) {
      console.log('❌ Not enough responses remaining:', subscriptionStatus.responsesRemaining, 'needed:', responsesUsed);
      return false;
    }

    try {
      console.log('🔄 Updating responses in Supabase...');
      
      // Use Supabase service to update responses
      const success = await supabaseSubscriptionService.updateUserResponses(effectiveUserId, responsesUsed);
      
      if (success) {
        console.log('✅ Supabase response consumption successful');
        
        // Update local subscription status by decrementing responses
        const updatedStatus: SubscriptionStatus = {
          ...subscriptionStatus,
          responsesRemaining: subscriptionStatus.responsesRemaining - responsesUsed
        };
        
        setSubscriptionStatus(updatedStatus);
        console.log('✅ Local state updated. Remaining responses:', updatedStatus.responsesRemaining);
        return true;
      } else {
        console.error('❌ Supabase response consumption failed');
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
  }, [effectiveUserId, session]);

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