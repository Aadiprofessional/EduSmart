
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../utils/AuthContext';

export interface User {
  id: string;
  email?: string;
  name?: string;
  uid?: string; // Add uid alias for compatibility
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  userData?: any; // Mock property
  isPro?: boolean; // Mock property
  refreshUserData?: () => void; // Mock property
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user: authUser, loading: authLoading } = useAuth();

  // Sync with AuthContext
  useEffect(() => {
    if (!authLoading) {
      if (authUser) {
        const userData: User = {
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || authUser.email,
          uid: authUser.id // Alias id to uid
        };
        setUser(userData);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    }
  }, [authUser, authLoading]);

  const value = {
    user,
    setUser,
    isLoading,
    isAuthenticated: !!user,
    userData: user, // Mock
    isPro: false, // Mock
    refreshUserData: () => {} // Mock
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
