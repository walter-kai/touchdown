import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { jwtStorage } from '../utils/jwtStorage';
import { User } from '../types/User';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  currentRoute: string;
  showLoginModal: boolean;
  triggerLoginModal: () => void;
  closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const location = useLocation();
  const currentRoute = location.pathname;

  // Check for existing JWT token on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user has valid JWT token
        if (jwtStorage.isAuthenticated()) {
          console.log('Found existing JWT token - user session restored');
          
          // Fetch current user profile to restore session
          try {
            const response = await fetch('/api/user/profile', {
              headers: {
                'Authorization': `Bearer ${jwtStorage.getToken()}`
              }
            });
            
            if (response.ok) {
              const { user } = await response.json();
              setUser(user);
              console.log('User session restored:', user.walletAddress);
            } else {
              console.log('Failed to restore user session, clearing token');
              jwtStorage.clearToken();
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
            jwtStorage.clearToken();
          }
        } else {
          console.log('No valid JWT token found');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        jwtStorage.clearToken();
      }
    };

    initializeAuth();
  }, []);

  const logout = async () => {
    try {
      // Clear JWT token
      jwtStorage.clearToken();
      
      // Clear user state
      setUser(null);
      
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const triggerLoginModal = () => setShowLoginModal(true);
  const closeLoginModal = () => {
    setShowLoginModal(false);
  };

  const value = {
    user,
    setUser: (newUser: User | null) => {
      setUser(newUser);
    },
    logout,
    currentRoute,
    showLoginModal,
    triggerLoginModal,
    closeLoginModal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
