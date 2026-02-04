import { supabase } from '../utils/supabase';
import { UserSubscription, UserAddon, SubscriptionStatus } from '../utils/subscriptionAPI';

// Supabase-specific interfaces that match our actual database schema
export interface SupabaseUserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  start_date: string;
  end_date: string | null;
  responses_remaining: number | null;
  responses_total: number | null;
  current_coins: number | null;
  last_response_refresh: string | null;
  is_pro: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupabaseUserAddon {
  id: string;
  user_id: string;
  addon_id: string;
  addon_name: string;
  additional_responses: number;
  status: 'active' | 'inactive' | 'expired';
  purchase_date: string;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionWithAddons {
  subscription: UserSubscription | null;
  addons: UserAddon[];
  totalResponsesRemaining: number;
  hasActiveSubscription: boolean;
  isPro: boolean;
}

export const PRO_PLAN_IDS = [
  '427fe1b7-2753-4b15-8a5d-2c856339aba2', // Monthly Pro
  '8d45e90f-af8c-4643-a923-9d68072a174a'  // Yearly Pro
];

class SupabaseSubscriptionService {
  
  /**
   * Convert Supabase subscription to API format
   */
  private convertSupabaseSubscription(supabaseSubscription: SupabaseUserSubscription): UserSubscription {
    const responsesTotal = supabaseSubscription.responses_total || 0;
    const responsesRemaining = supabaseSubscription.responses_remaining || 0;
    const responsesUsed = Math.max(0, responsesTotal - responsesRemaining);
    
    // Check if user should be pro based on flag OR plan ID
    // This ensures users with Pro plan IDs are correctly identified as Pro
    const isPro = supabaseSubscription.is_pro || PRO_PLAN_IDS.includes(supabaseSubscription.plan_id);
    
    return {
      id: supabaseSubscription.id,
      user_id: supabaseSubscription.user_id,
      plan_id: supabaseSubscription.plan_id,
      status: supabaseSubscription.status,
      start_date: supabaseSubscription.start_date,
      end_date: supabaseSubscription.end_date || '',
      responses_remaining: responsesRemaining,
      responses_total: responsesTotal,
      responses_used: responsesUsed,
      current_coins: supabaseSubscription.current_coins || 0,
      last_response_refresh: supabaseSubscription.last_response_refresh,
      is_pro: isPro,
      created_at: supabaseSubscription.created_at,
      updated_at: supabaseSubscription.updated_at
    };
  }

  /**
   * Convert Supabase addon to API format
   */
  private convertSupabaseAddon(supabaseAddon: SupabaseUserAddon): UserAddon {
    return {
      id: supabaseAddon.id,
      user_id: supabaseAddon.user_id,
      subscription_id: '', // Will be populated if needed
      addon_id: supabaseAddon.addon_id,
      responses_added: supabaseAddon.additional_responses,
      status: supabaseAddon.status,
      expires_at: supabaseAddon.expiry_date,
      created_at: supabaseAddon.created_at
    };
  }

  /**
   * Get user subscription data with addons
   */
  async getUserSubscription(userId: string): Promise<SubscriptionWithAddons> {
    try {
      console.log('🔍 Fetching subscription data for user:', userId);

      // Fetch user subscription (get the most recent active one)
      const { data: supabaseSubscriptions, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      const supabaseSubscription = supabaseSubscriptions && supabaseSubscriptions.length > 0 ? supabaseSubscriptions[0] : null;

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        console.error('Error fetching subscription:', subscriptionError);
        throw subscriptionError;
      }

      // Note: user_subscription_addons table does not exist in actual database
      // So we'll work with empty addons array
      const supabaseAddons: SupabaseUserAddon[] = [];

      // Self-healing: If user has Pro Plan ID but low responses (likely from the bug/trial setup), fix it.
      if (supabaseSubscription && PRO_PLAN_IDS.includes(supabaseSubscription.plan_id) && supabaseSubscription.responses_total === 5) {
        console.log('🔧 Fixing incorrect response limit for Pro user...');
        const { error: updateError } = await supabase
            .from('user_subscriptions')
            .update({ 
                responses_total: 500, 
                responses_remaining: 500,
                is_pro: true // Ensure is_pro is true as well in DB
            })
            .eq('id', supabaseSubscription.id);
            
        if (!updateError) {
             supabaseSubscription.responses_total = 500;
             supabaseSubscription.responses_remaining = 500;
             supabaseSubscription.is_pro = true;
        }
      }

      // Convert to API format
      const subscription = supabaseSubscription ? this.convertSupabaseSubscription(supabaseSubscription) : null;
      const addons = supabaseAddons.map(addon => this.convertSupabaseAddon(addon));

      // Calculate total responses from addons
      const addonResponses = addons.reduce((total, addon) => {
        return total + addon.responses_added;
      }, 0);

      // Calculate total responses remaining
      const subscriptionResponses = subscription?.responses_remaining || 0;
      const totalResponsesRemaining = subscriptionResponses + addonResponses;

      // Determine if user has active subscription
      const hasActiveSubscription = !!subscription || addons.length > 0;
      const isPro = subscription?.is_pro || false;

      console.log('📊 Subscription calculation:', {
        subscriptionResponses,
        addonResponses,
        totalResponsesRemaining,
        hasActiveSubscription,
        isPro
      });

      return {
        subscription,
        addons,
        totalResponsesRemaining,
        hasActiveSubscription,
        isPro
      };

    } catch (error) {
      console.error('Error in getUserSubscription:', error);
      
      // Return default free subscription on error
      return {
        subscription: null,
        addons: [],
        totalResponsesRemaining: 5,
        hasActiveSubscription: false,
        isPro: false
      };
    }
  }

  /**
   * Create default subscription for new user
   */
  async createDefaultSubscription(userId: string): Promise<UserSubscription> {
    try {
      // Use the Monthly Pro plan ID from the database (from console logs)
      // TODO: Create a proper free plan in the database
      const freePlanId = '427fe1b7-2753-4b15-8a5d-2c856339aba2'; // Monthly Pro plan ID
      
      const insertData: any = {
        user_id: userId,
        plan_id: freePlanId,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days trial
        responses_remaining: 500,
        responses_total: 500,
        is_pro: true // Grant Pro status for the trial period
      };

      try {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error('Error creating default subscription:', error);
          throw error;
        }

        console.log('✅ Created default subscription for user:', userId);
        return this.convertSupabaseSubscription(data);
      } catch (insertError) {
        console.error('Error in createDefaultSubscription:', insertError);
        throw insertError;
      }
    } catch (error) {
      console.error('Error in createDefaultSubscription:', error);
      throw error;
    }
  }

  /**
   * Update user subscription responses
   */
  async updateUserResponses(userId: string, responsesUsed: number): Promise<boolean> {
    try {
      console.log('🔄 Updating responses for user:', userId, 'Used:', responsesUsed);

      // Get current subscription
      const { data: subscription, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (fetchError) {
        console.error('Error fetching subscription for update:', fetchError);
        return false;
      }

      if (!subscription) {
        console.error('No active subscription found for user:', userId);
        return false;
      }

      // Handle nullable values
      const currentRemaining = subscription.responses_remaining || 0;

      // Check if user has enough responses
      if (currentRemaining < responsesUsed) {
        console.error('Not enough responses remaining:', currentRemaining, 'needed:', responsesUsed);
        return false;
      }

      // Update responses (only responses_remaining since responses_used doesn't exist)
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          responses_remaining: currentRemaining - responsesUsed
        })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (updateError) {
        console.error('Error updating responses:', updateError);
        return false;
      }

      console.log('✅ Successfully updated responses for user:', userId);
      return true;
    } catch (error) {
      console.error('Error in updateUserResponses:', error);
      return false;
    }
  }

  /**
   * Add responses to user subscription (for purchases)
   */
  async addResponsesToUser(userId: string, additionalResponses: number, addonId?: string): Promise<boolean> {
    try {
      console.log('➕ Adding responses to user:', userId, 'Amount:', additionalResponses);

      // Since user_subscription_addons table doesn't exist, always add to main subscription
      const { data: subscription, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (fetchError || !subscription) {
        console.error('Error fetching subscription for adding responses:', fetchError);
        return false;
      }

      const currentRemaining = subscription.responses_remaining || 0;
      const currentTotal = subscription.responses_total || 0;

      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          responses_remaining: currentRemaining + additionalResponses,
          responses_total: currentTotal + additionalResponses
        })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (updateError) {
        console.error('Error updating subscription with additional responses:', updateError);
        return false;
      }

      console.log('✅ Successfully added responses to user:', userId);
      return true;
    } catch (error) {
      console.error('Error in addResponsesToUser:', error);
      return false;
    }
  }

  /**
   * Upgrade user to pro subscription
   */
  async upgradeUserToPro(userId: string, responses: number = 1000): Promise<boolean> {
    try {
      console.log('⬆️ Upgrading user to pro:', userId);

      // Create a UUID for pro plan_id since it's required to be UUID
      const proPlanId = '00000000-0000-0000-0000-000000000002'; // Use a consistent UUID for pro plan

      const { error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          plan_id: proPlanId,
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          responses_remaining: responses,
          responses_total: responses,
          is_pro: true
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error upgrading to pro:', error);
        return false;
      }

      console.log('✅ Successfully upgraded user to pro:', userId);
      return true;
    } catch (error) {
      console.error('Error in upgradeUserToPro:', error);
      return false;
    }
  }

  /**
   * Get subscription statistics
   */
  async getSubscriptionStats(userId: string): Promise<{
    totalUsers: number;
    proUsers: number;
    freeUsers: number;
    totalResponsesUsed: number;
  }> {
    try {
      // This would typically be admin-only functionality
      const { data: stats, error } = await supabase
        .from('user_subscriptions')
        .select('plan_id, responses_used, is_pro');

      if (error) {
        console.error('Error fetching subscription stats:', error);
        throw error;
      }

      const totalUsers = stats?.length || 0;
      const proUsers = stats?.filter(s => s.is_pro).length || 0;
      const freeUsers = totalUsers - proUsers;
      const totalResponsesUsed = stats?.reduce((total, s) => total + s.responses_used, 0) || 0;

      return {
        totalUsers,
        proUsers,
        freeUsers,
        totalResponsesUsed
      };
    } catch (error) {
      console.error('Error in getSubscriptionStats:', error);
      return {
        totalUsers: 0,
        proUsers: 0,
        freeUsers: 0,
        totalResponsesUsed: 0
      };
    }
  }
}

export const supabaseSubscriptionService = new SupabaseSubscriptionService();