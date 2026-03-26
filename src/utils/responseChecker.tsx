import React from 'react';
import { useSubscription } from './SubscriptionContext';
import { useAuth } from './AuthContext';

export interface ResponseCheckResult {
  canProceed: boolean;
  showUpgradeModal?: boolean;
  message?: string;
  ctaType?: 'coins' | 'subscription';
}

export interface UseResponseCheckProps {
  responseType: string;
  queryData?: any;
  responsesUsed?: number;
  consumeCredits?: boolean;
  requireCoins?: boolean;
  noCoinsMessage?: string;
}

// Hook for checking responses before AI operations
export const useResponseCheck = () => {
  const { consumeResponse, responsesRemaining, isProUser, subscriptionStatus } = useSubscription();
  const { user } = useAuth();

  const checkAndUseResponse = async ({
    responseType,
    queryData = {},
    responsesUsed = 1,
    consumeCredits = true,
    requireCoins = false,
    noCoinsMessage = 'Please buy more coins to continue.'
  }: UseResponseCheckProps): Promise<ResponseCheckResult> => {
    if (!user) {
      return {
        canProceed: false,
        showUpgradeModal: true,
        message: 'Please log in to use AI features',
        ctaType: 'subscription'
      };
    }

    const hasActiveSubscription = !!subscriptionStatus?.hasActiveSubscription;
    const availableResponses = subscriptionStatus?.responsesRemaining ?? responsesRemaining;
    const availableCoins = subscriptionStatus?.current_coins ?? subscriptionStatus?.subscription?.current_coins ?? 0;
    const hasEnoughResponses = availableResponses >= responsesUsed;
    const hasCoins = availableCoins > 0;

    if (requireCoins && !hasCoins) {
      return {
        canProceed: false,
        showUpgradeModal: true,
        message: noCoinsMessage,
        ctaType: 'coins'
      };
    }

    if (!hasActiveSubscription && !hasCoins) {
      return {
        canProceed: false,
        showUpgradeModal: true,
        message: 'Please buy more coins to continue.',
        ctaType: 'coins'
      };
    }

    if (!hasEnoughResponses && !hasCoins) {
      return {
        canProceed: false,
        showUpgradeModal: true,
        message: 'Please buy more coins to continue.',
        ctaType: 'coins'
      };
    }

    if (!consumeCredits) {
      return {
        canProceed: true
      };
    }

    if (hasEnoughResponses && hasActiveSubscription) {
      try {
        const success = await consumeResponse(responseType, queryData, responsesUsed);
        if (success) {
          return {
            canProceed: true
          };
        }
        if (hasCoins) {
          return {
            canProceed: true
          };
        }
        return {
          canProceed: false,
          showUpgradeModal: true,
          message: 'Please buy more coins to continue.',
          ctaType: 'coins'
        };
      } catch (error) {
        console.error('Error using response:', error);
        if (hasCoins) {
          return {
            canProceed: true
          };
        }
        return {
          canProceed: false,
          showUpgradeModal: true,
          message: 'An error occurred. Please try again.',
          ctaType: 'subscription'
        };
      }
    }

    try {
      if (hasCoins) {
        return {
          canProceed: true
        };
      }
      return {
        canProceed: false,
        showUpgradeModal: true,
        message: 'Please buy more coins to continue.',
        ctaType: 'coins'
      };
    } catch (error) {
      console.error('Error using response:', error);
      return {
        canProceed: false,
        showUpgradeModal: true,
        message: 'An error occurred. Please try again.',
        ctaType: 'subscription'
      };
    }
  };

  return {
    checkAndUseResponse,
    responsesRemaining,
    isProUser
  };
};

interface ResponseUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  ctaType?: 'coins' | 'subscription';
}

// Component for showing upgrade modal
export const ResponseUpgradeModal: React.FC<ResponseUpgradeModalProps> = ({ isOpen, onClose, message, ctaType = 'subscription' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#0f0f0f] shadow-[0_25px_80px_rgba(0,0,0,0.55)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.22),transparent_52%)]" />
        <div className="relative p-7 sm:p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-900/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-2">Action Required</h3>
          <p className="text-slate-300 mb-7">{message}</p>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                window.location.href = ctaType === 'coins' ? '/subscription#addons' : '/subscription';
              }}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-orange-500 hover:from-indigo-600 hover:to-orange-600 text-white rounded-xl transition-all shadow-lg shadow-indigo-900/30"
            >
              {ctaType === 'coins' ? 'Buy More Coins' : 'Buy Subscription'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 
