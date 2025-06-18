import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { subscriptionAPI, SubscriptionStatus } from './subscriptionAPI';

interface ProStatusContextType {
  isProUser: boolean;
  responsesRemaining: number;
  subscriptionStatus: SubscriptionStatus | null;
  loading: boolean;
  lastChecked: Date | null;
  forceRefresh: () => Promise<void>;
  isStale: () => boolean;
}

const ProStatusContext = createContext<ProStatusContextType | undefined>(undefined);

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Storage keys
const STORAGE_KEYS = {
  PRO_STATUS: 'edumart_pro_status',
  LAST_CHECKED: 'edumart_pro_last_checked',
  RESPONSES_REMAINING: 'edumart_responses_remaining'
};

export const ProStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, session } = useAuth();
  const [isProUser, setIsProUser] = useState<boolean>(false);
  const [responsesRemaining, setResponsesRemaining] = useState<number>(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Check if cached data is stale
  const isStale = (): boolean => {
    if (!lastChecked) return true;
    return (Date.now() - lastChecked.getTime()) > CACHE_DURATION;
  };

  // Load from cache
  const loadFromCache = (): boolean => {
    try {
      const cachedProStatus = localStorage.getItem(STORAGE_KEYS.PRO_STATUS);
      const cachedLastChecked = localStorage.getItem(STORAGE_KEYS.LAST_CHECKED);
      const cachedResponses = localStorage.getItem(STORAGE_KEYS.RESPONSES_REMAINING);

      if (cachedProStatus && cachedLastChecked && cachedResponses) {
        const lastCheckedDate = new Date(cachedLastChecked);
        const now = new Date();
        
        // Check if cache is still valid (less than CACHE_DURATION old)
        if ((now.getTime() - lastCheckedDate.getTime()) < CACHE_DURATION) {
          setIsProUser(cachedProStatus === 'true');
          setResponsesRemaining(parseInt(cachedResponses));
          setLastChecked(lastCheckedDate);
          console.log('Loaded PRO status from cache:', {
            isProUser: cachedProStatus === 'true',
            responsesRemaining: parseInt(cachedResponses),
            lastChecked: lastCheckedDate
          });
          return true;
        }
      }
    } catch (error) {
      console.error('Error loading from cache:', error);
    }
    return false;
  };

  // Save to cache
  const saveToCache = (proStatus: boolean, responses: number) => {
    try {
      const now = new Date();
      localStorage.setItem(STORAGE_KEYS.PRO_STATUS, proStatus.toString());
      localStorage.setItem(STORAGE_KEYS.RESPONSES_REMAINING, responses.toString());
      localStorage.setItem(STORAGE_KEYS.LAST_CHECKED, now.toISOString());
      setLastChecked(now);
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  };

  // Fetch fresh data from API
  const fetchProStatus = async (useCache: boolean = true): Promise<void> => {
    // If no user, set defaults and clear cache
    if (!user || !session) {
      setIsProUser(false);
      setResponsesRemaining(0);
      setSubscriptionStatus(null);
      localStorage.removeItem(STORAGE_KEYS.PRO_STATUS);
      localStorage.removeItem(STORAGE_KEYS.RESPONSES_REMAINING);
      localStorage.removeItem(STORAGE_KEYS.LAST_CHECKED);
      setLastChecked(null);
      return;
    }

    // Try to use cache first if requested and not stale
    if (useCache && !isStale()) {
      const cacheLoaded = loadFromCache();
      if (cacheLoaded) {
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      console.log('Fetching fresh PRO status from API...');
      
      const result = await subscriptionAPI.getStatus(session);
      
      if (result.success && result.data) {
        const status = result.data;
        
        setSubscriptionStatus(status);
        setIsProUser(status.isPro || false);
        setResponsesRemaining(status.responsesRemaining || 0);
        
        // Save to cache
        saveToCache(status.isPro || false, status.responsesRemaining || 0);
        
        console.log('Updated PRO status:', {
          isPro: status.isPro,
          responsesRemaining: status.responsesRemaining
        });
      } else {
        console.error('Failed to fetch subscription status:', result.error);
        // Fallback to cache if API fails
        loadFromCache();
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      // Fallback to cache if API fails
      loadFromCache();
    } finally {
      setLoading(false);
    }
  };

  // Force refresh (ignores cache)
  const forceRefresh = async (): Promise<void> => {
    await fetchProStatus(false);
  };

  // Initialize on mount and when user changes
  useEffect(() => {
    fetchProStatus(true);
  }, [user, session]);

  // Periodically refresh if data is getting stale
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && session && isStale()) {
        console.log('PRO status cache is stale, refreshing...');
        fetchProStatus(false);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user, session, lastChecked]);

  const value: ProStatusContextType = {
    isProUser,
    responsesRemaining,
    subscriptionStatus,
    loading,
    lastChecked,
    forceRefresh,
    isStale
  };

  return (
    <ProStatusContext.Provider value={value}>
      {children}
    </ProStatusContext.Provider>
  );
};

export const useProStatus = () => {
  const context = useContext(ProStatusContext);
  if (context === undefined) {
    throw new Error('useProStatus must be used within a ProStatusProvider');
  }
  return context;
};

// HOC for components that require PRO status
export const withProStatus = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P & { fallback?: React.ReactNode }> => {
  return ({ fallback, ...props }) => {
    const { isProUser, loading } = useProStatus();

    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!isProUser) {
      return fallback ? (
        <>{fallback}</>
      ) : (
        <div className="text-center p-8">
          <div className="text-yellow-400 mb-2">⭐</div>
          <p className="text-gray-400">This feature requires a Pro subscription</p>
        </div>
      );
    }

    return <Component {...(props as P)} />;
  };
};

// Utility function to check if feature requires PRO
export const requiresProAccess = (featureId: string): boolean => {
  const freeFeatures = [
    'study-planner'  // Only study planner is truly free
  ];
  
  // All other features require PRO (including upload, citation generator, etc.)
  return !freeFeatures.includes(featureId);
};

// PRO Badge Component
export const ProBadge: React.FC<{ 
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}> = ({ 
  className = '', 
  size = 'md',
  position = 'top-right'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6'
  };

  const positionClasses = {
    'top-right': '-top-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-right': '-bottom-1 -right-1',
    'bottom-left': '-bottom-1 -left-1'
  };

  return (
    <div className={`absolute ${positionClasses[position]} bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1 ${className} z-10`}>
      <svg className={`${sizeClasses[size]} text-white`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z" clipRule="evenodd" />
      </svg>
    </div>
  );
}; 