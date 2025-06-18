import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { subscriptionAPI, SubscriptionStatus, SubscriptionPlan, AddonPlan } from './subscriptionAPI';

type SubscriptionContextType = {
  subscriptionStatus: SubscriptionStatus | null;
  plans: SubscriptionPlan[];
  addons: AddonPlan[];
  loading: boolean;
  refreshStatus: () => Promise<void>;
  useResponse: (responseType: string, queryData: any, responsesUsed?: number) => Promise<boolean>;
  isProUser: boolean;
  responsesRemaining: number;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, session } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [addons, setAddons] = useState<AddonPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Load subscription plans and addons (public data)
  const loadPlansAndAddons = async () => {
    try {
      console.log('Loading plans and addons...');
      const [plansResult, addonsResult] = await Promise.all([
        subscriptionAPI.getPlans(),
        subscriptionAPI.getAddons()
      ]);

      console.log('Plans API Response:', plansResult);
      console.log('Addons API Response:', addonsResult);

      if (plansResult.success && plansResult.data) {
        console.log('Setting plans:', plansResult.data);
        setPlans(plansResult.data);
      } else {
        console.error('Plans API failed:', plansResult.error, plansResult);
        setPlans([]);
      }

      if (addonsResult.success && addonsResult.data) {
        console.log('Setting addons:', addonsResult.data);
        setAddons(addonsResult.data);
      } else {
        console.error('Addons API failed:', addonsResult.error, addonsResult);
        setAddons([]);
      }
    } catch (error) {
      console.error('Error loading plans and addons:', error);
      setPlans([]);
      setAddons([]);
    }
  };

  // Load user subscription status
  const loadSubscriptionStatus = async () => {
    if (!user || !session) {
      setSubscriptionStatus({
        hasActiveSubscription: false,
        isPro: false,
        subscription: null,
        addons: [],
        responsesRemaining: 0,
        totalResponses: 0
      });
      return;
    }

    try {
      const result = await subscriptionAPI.getStatus(session);
      if (result.success && result.data) {
        setSubscriptionStatus(result.data);
      } else {
        console.error('Error loading subscription status:', result.error);
      }
    } catch (error) {
      console.error('Error loading subscription status:', error);
    }
  };

  // Refresh subscription status
  const refreshStatus = async () => {
    setLoading(true);
    await loadSubscriptionStatus();
    setLoading(false);
  };

  // Use response function
  const useResponse = async (responseType: string, queryData: any, responsesUsed: number = 1): Promise<boolean> => {
    if (!user || !session || !subscriptionStatus?.hasActiveSubscription) {
      return false;
    }

    try {
      const result = await subscriptionAPI.useResponse(responseType, queryData, responsesUsed, session);
      if (result.success) {
        // Update local subscription status
        await refreshStatus();
        return true;
      } else {
        console.error('Error using response:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error using response:', error);
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
  }, [user, session]);

  const value = {
    subscriptionStatus,
    plans,
    addons,
    loading,
    refreshStatus,
    useResponse,
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