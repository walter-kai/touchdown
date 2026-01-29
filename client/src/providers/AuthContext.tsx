import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { jwtStorage } from '../utils/jwtStorage';
import { userStorage } from '../utils/userStorage';
import { debugLog } from '@/utils/debugLog';
import { User } from '../../../types/User';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasEmoji: boolean;
  setUser: (user: User | null) => void;
  login: (token: string, user: User, expiresIn?: number) => void;
  logout: () => void;
  currentRoute: string;
  showLoginModal: boolean;
  triggerLoginModal: () => void;
  closeLoginModal: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Utility function to detect emojis in a string
const hasEmojiCharacters = (str: string | undefined | null): boolean => {
  if (!str) return false;
  // Emoji regex pattern covering most common emoji ranges
  const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{FE00}-\u{FE0F}]/u;
  return emojiRegex.test(str);
};

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
  const [user, setUserState] = useState<User | null>(null);
  const [hasEmoji, setHasEmoji] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const pathname = usePathname();
  const currentRoute = pathname;

  // Wrapper to detect emojis when setting user
  const setUser = (userData: User | null) => {
    setUserState(userData);
    if (userData?.displayName) {
      const containsEmoji = hasEmojiCharacters(userData.displayName);
      setHasEmoji(containsEmoji);
      debugLog(`Display name "${userData.displayName}" ${containsEmoji ? 'contains' : 'does not contain'} emojis`);
    } else {
      setHasEmoji(false);
    }
  };

  // Check for existing JWT token on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user has valid JWT token
        if (jwtStorage.isAuthenticated()) {
          debugLog('Found existing JWT token - user session restored');
          // Optimistically hydrate from localStorage
          const cached = userStorage.getUser();
          if (cached) {
            setUser(cached);
          }
          
          // Fetch current user profile to restore session
          try {
            const response = await fetch('/api/user/profile', {
              headers: {
                'Authorization': `Bearer ${jwtStorage.getToken()}`
              }
            });
            
            if (response.ok) {
              const { user: userData } = await response.json();
              setUser(userData);
              userStorage.setUser(userData);
              debugLog('User session restored:', userData.email || userData.walletAddress);

              // No extra upsert/verification call; rely on `/auth/google/*` flow
            } else {
              debugLog('Failed to restore user session, clearing token');
              jwtStorage.clearToken();
              userStorage.clear();
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
            jwtStorage.clearToken();
            userStorage.clear();
          }
        } else {
          debugLog('No valid JWT token found');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        jwtStorage.clearToken();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Minimal, standard listener for popup postMessage
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as any;
      if (!data || typeof data !== 'object' || !data.type) return;
      if (data.type === 'GOOGLE_AUTH_SUCCESS') {
        const { token, user: userData, expiresIn } = data as { token: string; user: User; expiresIn?: number };
        const ttl = typeof expiresIn === 'number' ? expiresIn : 7 * 24 * 60 * 60;
        jwtStorage.setToken(token, ttl);
        userStorage.setUser(userData);
        setUser(userData);
        setShowLoginModal(false);
        debugLog('Google auth success via postMessage (minimal listener)');
      }
      if (data.type === 'GOOGLE_AUTH_ERROR') {
        console.warn('Google auth error:', data.error);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const login = (token: string, userData: User, expiresIn: number = 7 * 24 * 60 * 60) => {
    jwtStorage.setToken(token, expiresIn);
    userStorage.setUser(userData);
    setUser(userData);
    debugLog('User logged in:', userData.email);
  };

  const logout = async () => {
    try {
      // Clear JWT token
      jwtStorage.clearToken();
      userStorage.clear();
      
      // Clear user state
      setUser(null);
      
      debugLog('User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const refreshUser = async () => {
    if (!jwtStorage.isAuthenticated()) {
      return;
    }

    try {
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${jwtStorage.getToken()}`
        }
      });
      
      if (response.ok) {
        const { user: userData } = await response.json();
        setUser(userData);
        userStorage.setUser(userData);
      } else {
        jwtStorage.clearToken();
        userStorage.clear();
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const triggerLoginModal = () => setShowLoginModal(true);
  const closeLoginModal = () => {
    setShowLoginModal(false);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    hasEmoji,
    setUser,
    login,
    logout,
    refreshUser,
    currentRoute,
    showLoginModal,
    triggerLoginModal,
    closeLoginModal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
