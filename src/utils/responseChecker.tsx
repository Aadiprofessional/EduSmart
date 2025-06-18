import React from 'react';
import { useSubscription } from './SubscriptionContext';
import { useAuth } from './AuthContext';

export interface ResponseCheckResult {
  canProceed: boolean;
  showUpgradeModal?: boolean;
  message?: string;
}

export interface UseResponseCheckProps {
  responseType: string;
  queryData?: any;
  responsesUsed?: number;
}

// Hook for checking responses before AI operations
export const useResponseCheck = () => {
  const { useResponse, responsesRemaining, isProUser } = useSubscription();
  const { user } = useAuth();

  const checkAndUseResponse = async ({
    responseType,
    queryData = {},
    responsesUsed = 1
  }: UseResponseCheckProps): Promise<ResponseCheckResult> => {
    // If user is not logged in
    if (!user) {
      return {
        canProceed: false,
        showUpgradeModal: true,
        message: 'Please log in to use AI features'
      };
    }

    // If user is not pro
    if (!isProUser) {
      return {
        canProceed: false,
        showUpgradeModal: true,
        message: 'Upgrade to Pro to access AI features'
      };
    }

    // If user doesn't have enough responses
    if (responsesRemaining < responsesUsed) {
      return {
        canProceed: false,
        showUpgradeModal: true,
        message: 'No responses left. Please buy additional responses.'
      };
    }

    // Try to use the response
    try {
      const success = await useResponse(responseType, queryData, responsesUsed);
      
      if (success) {
        return {
          canProceed: true
        };
      } else {
        return {
          canProceed: false,
          showUpgradeModal: true,
          message: 'Failed to deduct responses. Please try again.'
        };
      }
    } catch (error) {
      console.error('Error using response:', error);
      return {
        canProceed: false,
        showUpgradeModal: true,
        message: 'An error occurred. Please try again.'
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
}

// Component for showing upgrade modal
export const ResponseUpgradeModal: React.FC<ResponseUpgradeModalProps> = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 max-w-md w-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">Upgrade Required</h3>
          <p className="text-slate-300 mb-6">{message}</p>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                window.location.href = '/subscription';
              }}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg transition-all"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 