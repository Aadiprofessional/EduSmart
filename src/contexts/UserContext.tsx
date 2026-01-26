import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../utils/AuthContext';

export interface User {
  id: string;
  email?: string;
  name?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
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
    console.log('🔄 Syncing UserContext with AuthContext...', { authUser, authLoading });
    
    if (!authLoading) {
      if (authUser) {
        console.log('✅ Setting user from AuthContext:', authUser);
        const userData: User = {
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || authUser.email
        };
        setUser(userData);
      } else {
        console.log('❌ No user in AuthContext, setting to null');
        setUser(null);
      }
      setIsLoading(false);
    }
  }, [authUser, authLoading]);

  const value = {
    user,
    setUser,
    isLoading,
    isAuthenticated: !!user
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};