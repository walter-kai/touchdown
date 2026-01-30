import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../providers/AuthContext';
import { FaExclamationCircle, FaChevronDown, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { debugLog } from '@/utils/debugLog';

const GoogleLoginButton: React.FC = () => {
  const { login, isAuthenticated, user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [imageError, setImageError] = useState(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // Auto-hide tooltip after 5 seconds when error is set
  useEffect(() => {
    if (error && showTooltip) {
      tooltipTimeoutRef.current = setTimeout(() => {
        setShowTooltip(false);
      }, 5000);
    }
    
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, [error, showTooltip]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    setShowTooltip(false);
    
    let broadcastChannel: BroadcastChannel | null = null;
    let pollInterval: NodeJS.Timeout | null = null;
    let timeout: NodeJS.Timeout | null = null;
    
    try {
      const popupWidth = 500;
      const popupHeight = 600;
      const popupLeft = window.screenX + (window.outerWidth - popupWidth) / 2;
      const popupTop = window.screenY + (window.outerHeight - popupHeight) / 2;

      // Point to backend server
      const authUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:3001/auth/google/login'
        : '/auth/google/login';

      // Open popup to Google login
      const popup = window.open(
        authUrl,
        'Google Login',
        `width=${popupWidth},height=${popupHeight},left=${popupLeft},top=${popupTop}`
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Method 1: Listen for postMessage from the popup (sent by auth callback)
      const messageHandler = (event: MessageEvent) => {
        // Verify origin if needed (for security in production)
        // if (event.origin !== window.location.origin) return;

        if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          debugLog('[AUTH] Received postMessage:', event.data);
          cleanupListeners();
          
          const { token, user } = event.data;
          if (token && user) {
            login(token, user, 7 * 24 * 60 * 60);
          }
          setIsLoading(false);
        }
      };

      window.addEventListener('message', messageHandler);

      // Method 2: BroadcastChannel listener (modern browsers, works across tabs)
      try {
        broadcastChannel = new BroadcastChannel('google_auth_channel');
        broadcastChannel.onmessage = (event) => {
          debugLog('[AUTH] Received BroadcastChannel message:', event.data);
          if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            const { token, user } = event.data;
            if (token && user) {
              login(token, user, event.data.expiresIn || 7 * 24 * 60 * 60);
              setIsLoading(false);
              cleanupListeners();
            }
          }
        };
      } catch (e) {
        debugLog('[AUTH] BroadcastChannel not supported');
      }

      // Method 3: Listen for storage events (fallback mechanism from auth callback)
      const storageHandler = (event: StorageEvent) => {
        if (event.key === 'dexter_oauth_result' && event.newValue) {
          try {
            debugLog('[AUTH] Received storage event');
            const result = JSON.parse(event.newValue);
            if (result.type === 'GOOGLE_AUTH_SUCCESS' && result.token && result.user) {
              cleanupListeners();
              login(result.token, result.user, result.expiresIn || 7 * 24 * 60 * 60);
              setIsLoading(false);
              // Clean up the storage flag
              localStorage.removeItem('dexter_oauth_result');
            }
          } catch (e) {
            console.error('[AUTH] Error parsing storage event:', e);
          }
        }
      };

      window.addEventListener('storage', storageHandler);

      // Method 4: Polling check for localStorage (in case storage event doesn't fire)
      pollInterval = setInterval(() => {
        try {
          const oauthResult = localStorage.getItem('dexter_oauth_result');
          if (oauthResult) {
            debugLog('[AUTH] Found auth result via polling');
            const result = JSON.parse(oauthResult);
            if (result.type === 'GOOGLE_AUTH_SUCCESS' && result.token && result.user) {
              cleanupListeners();
              login(result.token, result.user, result.expiresIn || 7 * 24 * 60 * 60);
              setIsLoading(false);
              localStorage.removeItem('dexter_oauth_result');
            }
          }
        } catch (e) {
            console.error('[AUTH] Error in polling:', e);
        }
      }, 500);

      // Cleanup function
      const cleanupListeners = () => {
        if (timeout) clearTimeout(timeout);
        if (pollInterval) clearInterval(pollInterval);
        window.removeEventListener('message', messageHandler);
        window.removeEventListener('storage', storageHandler);
        if (broadcastChannel) broadcastChannel.close();
      };

      // Timeout fallback: if no response in 60 seconds, stop loading
      timeout = setTimeout(() => {
        cleanupListeners();
        setIsLoading(false);
        setError('Login timeout. Please try again.');
        setShowTooltip(true);
      }, 60000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setShowTooltip(true);
      setIsLoading(false);
    }
  };

  if (isAuthenticated && user) {
    // Get profile picture from multiple sources
    const profilePicture = user.photoUrl || user.googlePicture || user.providerData?.googlePicture;
    
    return (
      <div className="relative" ref={dropdownRef}>
        {/* User Profile Picture Button */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {profilePicture && !imageError ? (
            <img 
              src={profilePicture} 
              alt={user.displayName || user.username || 'User'} 
              className="w-9 h-9 rounded-full border-2 border-neon-cyan/50 hover:border-neon-cyan transition-colors shadow-[0_0_8px_rgba(0,255,231,0.3)] object-cover"
              onError={(e) => {
                console.error('Failed to load profile picture:', profilePicture);
                setImageError(true);
              }}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-9 h-9 rounded-full border-2 border-neon-cyan/50 hover:border-neon-cyan transition-colors shadow-[0_0_8px_rgba(0,255,231,0.3)] bg-bg-dark flex items-center justify-center">
              <FaUser className="text-neon-cyan text-sm" />
            </div>
          )}
          <FaChevronDown className={`text-neon-cyan text-xs transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu - Opens inward from the right */}
        {showDropdown && (
          <div className="absolute right-0 top-full mt-2 min-w-64 bg-bg-dark border border-neon-cyan/30 rounded-lg shadow-[0_0_20px_rgba(0,255,231,0.2)] overflow-hidden z-50 animate-fade-in">
            {/* User Info Section */}
            <div className="p-4 border-b border-neon-cyan/20 bg-gradient-to-r from-neon-cyan/5 to-transparent">
              <div className="flex items-center gap-3">
                {profilePicture && !imageError ? (
                  <img 
                    src={profilePicture} 
                    alt={user.displayName || user.username || 'User'} 
                    className="w-10 h-10 rounded-full border-2 border-neon-cyan/50 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full border-2 border-neon-cyan/50 bg-bg-dark flex items-center justify-center">
                    <FaUser className="text-neon-cyan text-sm" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">
                    {user.displayName || user.username || 'User'}
                  </div>
                  {user.email && (
                    <div className="text-xs text-gray-400 truncate">{user.email}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                setIsLoading(true);
                setShowDropdown(false);
                logout();
                setIsLoading(false);
              }}
              disabled={isLoading}
              className="w-full p-3 flex items-center gap-3 text-left hover:bg-red-600/10 transition-colors group disabled:opacity-50"
            >
              <FaSignOutAlt className="text-red-500 group-hover:text-red-400" />
              <span className="text-sm text-red-500 group-hover:text-red-400 font-medium">
                {isLoading ? 'Logging out...' : 'Log out'}
              </span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-2">
      {/* Error icon tooltip trigger (to the left of button) */}
      {error && (
        <div className="relative">
          <button
            onClick={() => setShowTooltip(!showTooltip)}
            className="text-red-500 hover:text-red-400 transition-colors"
            title="Show error details"
          >
            <FaExclamationCircle className="w-5 h-5" />
          </button>
          
          {/* Tooltip popup */}
          {showTooltip && (
            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 z-50 animate-fade-in">
              <div className="bg-bg-darkest border border-red-500/50 rounded-lg px-4 py-2 shadow-[0_0_15px_rgba(239,68,68,0.3)] min-w-[200px] max-w-[300px]">
                <div className="flex items-start gap-2">
                  <FaExclamationCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
                <button
                  onClick={() => setShowTooltip(false)}
                  className="absolute top-1 right-1 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Arrow pointing right */}
              <div className="absolute top-1/2 left-full -translate-y-1/2 w-0 h-0 border-t-[6px] border-b-[6px] border-l-[6px] border-t-transparent border-b-transparent border-l-bg-darkest" />
            </div>
          )}
        </div>
      )}
      
      {/* Login button */}
      <button
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="group flex items-center gap-3 px-5 py-2.5 rounded-md border border-neon-cyan/40 bg-bg-dark text-text-light shadow-[0_0_12px_rgba(0,255,231,0.15)] hover:shadow-[0_0_20px_rgba(0,255,231,0.35)] hover:border-neon-cyan/70 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        )}
        <span className="text-sm font-semibold tracking-wide">
          {isLoading ? 'Logging in…' : 'Log in'}
        </span>
      </button>
    </div>
  );
};

export default GoogleLoginButton;
