import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ErrorState {
  isOffline: boolean;
  hasApiErrors: boolean;
  errorMessage: string | null;
  lastErrorTime: Date | null;
}

interface ErrorContextType {
  errorState: ErrorState;
  setApiError: (message: string) => void;
  clearError: () => void;
  setOfflineStatus: (offline: boolean) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [errorState, setErrorState] = useState<ErrorState>({
    isOffline: false,
    hasApiErrors: false,
    errorMessage: null,
    lastErrorTime: null,
  });

  // Check online/offline status
  useEffect(() => {
    const handleOnline = () => setErrorState(prev => ({ ...prev, isOffline: false }));
    const handleOffline = () => setErrorState(prev => ({ ...prev, isOffline: true }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setErrorState(prev => ({ ...prev, isOffline: !navigator.onLine }));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const setApiError = (message: string) => {
    setErrorState(prev => ({
      ...prev,
      hasApiErrors: true,
      errorMessage: message,
      lastErrorTime: new Date(),
    }));

    // Auto-clear error after 10 seconds
    setTimeout(() => {
      setErrorState(prev => ({
        ...prev,
        hasApiErrors: false,
        errorMessage: null,
      }));
    }, 10000);
  };

  const clearError = () => {
    setErrorState(prev => ({
      ...prev,
      hasApiErrors: false,
      errorMessage: null,
    }));
  };

  const setOfflineStatus = (offline: boolean) => {
    setErrorState(prev => ({ ...prev, isOffline: offline }));
  };

  return (
    <ErrorContext.Provider value={{ errorState, setApiError, clearError, setOfflineStatus }}>
      {children}
    </ErrorContext.Provider>
  );
};