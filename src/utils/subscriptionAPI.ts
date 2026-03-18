import { Session } from '@supabase/supabase-js';
import { API_BASE_URL, getDefaultHeaders } from '../config/api';

// Helper function to make API calls with authentication
const apiCall = async (method: string, endpoint: string, data: any = null, session?: Session | null, requireAuth: boolean = true) => {
  try {
    const headers = getDefaultHeaders(!!session, session);

    if (requireAuth) {
      if (!session) {
        return { 
          success: false, 
          error: 'No authentication session provided',
          status: 401 
        };
      }

      if (!session.access_token) {
        return { 
          success: false, 
          error: 'No access token in session',
          status: 401 
        };
      }
    }

    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers,
      ...(data && { data })
    };
    
    const axios = (await import('axios')).default;
    const response = await axios(config);

    if (response.data && typeof response.data === 'object') {
      if (response.data.hasOwnProperty('success') && response.data.hasOwnProperty('data')) {
        return response.data;
      }
      return { success: true, data: response.data };
    }
    
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Subscription API Call Error:', {
      method,
      endpoint,
      url: `${API_BASE_URL}${endpoint}`,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    let errorMessage = error.message;
    if (error.response?.data) {
      if (typeof error.response.data === 'string') {
        errorMessage = error.response.data;
      } else if (typeof error.response.data === 'object') {
        errorMessage = error.response.data.message || error.response.data.error || JSON.stringify(error.response.data);
      }
    }

    return { 
      success: false, 
      error: errorMessage,
      status: error.response?.status 
    };
  }
};

// Types for subscription data
export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  type?: string;
  price: number;
  coins?: number;
  duration_days: number;
  response_limit?: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AddonPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  additional_responses: number;
  coins?: number;
  duration_days?: number;
  type?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string | null;
  status: string;
  start_date: string | null;
  end_date: string;
  yearly_end_date?: string | null;
  current_coins?: number;
  responses_remaining?: number; // Legacy?
  responses_total?: number; // Legacy?
  responses_used?: number; // Legacy?
  last_response_refresh?: string | null;
  is_pro?: boolean;
  created_at: string;
  updated_at: string;
  subscription_plans?: SubscriptionPlan;
}

export interface UserAddon {
  id: string;
  user_id: string;
  subscription_id: string;
  addon_id: string;
  responses_added: number;
  status: string;
  expires_at: string | null;
  created_at: string;
  addon_plans?: AddonPlan;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type?: string; // e.g., 'purchase', 'refund', 'spend'
  description?: string;
  transaction_ref_id?: string | null;
  created_at: string;
  
  // Legacy fields
  subscription_id?: string;
  plan_id?: string;
  transaction_type?: string;
  currency?: string;
  payment_method?: string;
  transaction_id?: string;
  status?: string;
  subscription_plans?: {
    name: string;
    description: string;
  };
}

export interface ResponseUsage {
  id: string;
  user_id: string;
  subscription_id: string;
  response_type: string;
  query_data: any;
  responses_used: number;
  created_at: string;
}

export interface UsageLog {
  id: string;
  user_id: string;
  subscription_id: string;
  addon_id: string | null;
  action: string;
  responses_count: number;
  remaining_responses: number;
  description: string;
  metadata: any;
  created_at: string;
}

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  isPro: boolean;
  subscription: UserSubscription | null;
  addons: UserAddon[];
  responsesRemaining: number;
  totalResponses: number;
}

// Subscription API functions
export const subscriptionAPI = {
  // Authenticated endpoints (require session)
  getPlans: async (session?: Session | null, uid?: string): Promise<{ success: boolean; data?: SubscriptionPlan[]; error?: string }> => {
    const queryParams = uid ? `?uid=${uid}` : (session?.user?.id ? `?uid=${session.user.id}` : '');
    return apiCall('GET', `/api/subscriptions/plans${queryParams}`, null, session, false);
  },

  getAddons: async (session?: Session | null): Promise<{ success: boolean; data?: AddonPlan[]; error?: string }> => {
    const plansResult = await subscriptionAPI.getPlans(session);

    if (!plansResult.success) {
      return {
        success: false,
        error: plansResult.error
      };
    }

    const addons: AddonPlan[] = (plansResult.data || [])
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
      }));

    return {
      success: true,
      data: addons
    };
  },

  createCheckoutSession: async (planId: string, session?: Session | null): Promise<{ success: boolean; data?: { checkoutUrl: string }; error?: string }> => {
    return apiCall('POST', '/api/subscriptions/checkout', { planId }, session);
  },

  createStripeCheckoutSession: async (planId: string, successUrl: string, cancelUrl: string, session?: Session | null): Promise<{ success: boolean; data?: { url: string; sessionId: string }; error?: string }> => {
    return apiCall('POST', '/api/stripe/create-checkout-session', { 
      planId,
      successUrl,
      cancelUrl
    }, session);
  },

  // Authenticated endpoints
  getStatus: async (session?: Session | null): Promise<{ success: boolean; data?: SubscriptionStatus; error?: string }> => {
    return apiCall('GET', '/api/subscriptions/status', null, session);
  },

  buySubscription: async (planId: string, transactionId: string, amount: number, paymentMethod: string, session?: Session | null, uid?: string): Promise<{ success: boolean; data?: any; error?: string }> => {
    const requestData = {
      planId,
      transactionId,
      amount,
      paymentMethod,
      ...(uid && { uid }) // Include uid if provided
    };
    return apiCall('POST', '/api/subscriptions/buy', requestData, session);
  },

  buyAddon: async (addonId: string, transactionId: string, amount: number, paymentMethod: string, session?: Session | null): Promise<{ success: boolean; data?: any; error?: string }> => {
    return apiCall('POST', '/api/subscriptions/buy-addon', {
      addonId,
      transactionId,
      amount,
      paymentMethod
    }, session);
  },

  // Antom payment methods
  createAntomPaymentSession: async (
    planId: string | undefined,
    addonId: string | undefined,
    amount: number,
    paymentMethod: string,
    session?: Session | null
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    // Validate inputs
    if (!amount || amount <= 0) {
      return { success: false, error: 'Invalid payment amount' };
    }
    
    if (!paymentMethod) {
      return { success: false, error: 'Payment method is required' };
    }
    
    if (!session?.user?.id) {
      return { success: false, error: 'User authentication required' };
    }
    
    // Validate plan or addon
    if (!planId && !addonId) {
      return { success: false, error: 'Plan or addon is required' };
    }
    
    const requestData = {
      planId,
      addonId,
      amount,
      currency: 'USD',
      paymentMethod,
      orderDescription: planId ? 'EduSmart Pro Subscription' : 'EduSmart Response Add-on',
      buyerInfo: {
        email: session.user.email || '',
        name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
        userId: session.user.id
      }
    };
    
    console.log('Creating Antom payment session:', requestData);
    
    return apiCall('POST', '/api/antom/create-payment-session', requestData, session);
  },

  inquireAntomPayment: async (paymentRequestId: string, session?: Session | null): Promise<{ success: boolean; data?: any; error?: string }> => {
    if (!paymentRequestId) {
      return { success: false, error: 'Payment request ID is required' };
    }
    
    if (!session?.user?.id) {
      return { success: false, error: 'User authentication required' };
    }
    
    console.log('Inquiring Antom payment status:', paymentRequestId);
    
    return apiCall('POST', '/api/antom/inquire-payment', {
      paymentRequestId
    }, session);
  },

  useResponse: async (responseType: string, queryData: any, responsesUsed: number = 1, session?: Session | null): Promise<{ success: boolean; data?: any; error?: string }> => {
    return apiCall('POST', '/api/subscriptions/use-response', {
      responseType,
      queryData,
      responsesUsed
    }, session);
  },

  getResponseHistory: async (page: number = 1, limit: number = 10, session?: Session | null): Promise<{ success: boolean; data?: { responses: ResponseUsage[]; pagination: any }; error?: string }> => {
    return apiCall('GET', `/api/subscriptions/responses?page=${page}&limit=${limit}`, null, session);
  },

  getTransactionHistory: async (page: number = 1, limit: number = 10, session?: Session | null, uid?: string): Promise<{ success: boolean; data?: { transactions: Transaction[]; pagination: any }; error?: string }> => {
    const uidParam = uid ? `&uid=${uid}` : (session?.user?.id ? `&uid=${session.user.id}` : '');
    return apiCall('GET', `/api/subscriptions/transactions?page=${page}&limit=${limit}${uidParam}`, null, session);
  },

  getUsageLogs: async (page: number = 1, limit: number = 10, session?: Session | null): Promise<{ success: boolean; data?: { logs: UsageLog[]; pagination: any }; error?: string }> => {
    return apiCall('GET', `/api/subscriptions/usage-logs?page=${page}&limit=${limit}`, null, session);
  }
};

export default subscriptionAPI;
