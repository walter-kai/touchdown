import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../providers/AuthContext';
import { FaExclamationCircle } from 'react-icons/fa';

const GoogleLoginButton: React.FC = () => {
  const { login, isAuthenticated, user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    try {
      const popupWidth = 500;
      const popupHeight = 600;
      const popupLeft = window.screenX + (window.outerWidth - popupWidth) / 2;
      const popupTop = window.screenY + (window.outerHeight - popupHeight) / 2;

      // Open popup to Google login
      const popup = window.open(
        '/auth/google/login',
        'Google Login',
        `width=${popupWidth},height=${popupHeight},left=${popupLeft},top=${popupTop}`
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Listen for postMessage from the popup (sent by auth callback)
      const messageHandler = (event: MessageEvent) => {
        // Verify origin if needed (for security in production)
        // if (event.origin !== window.location.origin) return;

        if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          window.removeEventListener('message', messageHandler);
          
          const { token, user } = event.data;
          if (token && user) {
            login(token, user, 7 * 24 * 60 * 60);
          }
          setIsLoading(false);
        }
      };

      window.addEventListener('message', messageHandler);

      // Also listen for storage events (fallback mechanism from auth callback)
      const storageHandler = (event: StorageEvent) => {
        if (event.key === 'dexter_oauth_result' && event.newValue) {
          try {
            const result = JSON.parse(event.newValue);
            if (result.type === 'GOOGLE_AUTH_SUCCESS' && result.token && result.user) {
              window.removeEventListener('storage', storageHandler);
              window.removeEventListener('message', messageHandler);
              login(result.token, result.user, result.expiresIn || 7 * 24 * 60 * 60);
              setIsLoading(false);
              // Clean up the storage flag
              localStorage.removeItem('dexter_oauth_result');
            }
          } catch {}
        }
      };

      window.addEventListener('storage', storageHandler);

      // Timeout fallback: if no response in 60 seconds, stop loading
      const timeout = setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        window.removeEventListener('storage', storageHandler);
        setIsLoading(false);
        setError('Login timeout. Please try again.');
        setShowTooltip(true);
      }, 60000);

      // Clean up on unmount
      return () => {
        clearTimeout(timeout);
        window.removeEventListener('message', messageHandler);
        window.removeEventListener('storage', storageHandler);
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setShowTooltip(true);
      setIsLoading(false);
    }
  };

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center ">
        {user.photoUrl && (
          <img src={user.photoUrl} alt={user.displayName || user.username || 'User'} className="w-8 h-8 rounded-full border border-[#00ffe7]/50 mr-2" />
        )}
        <div className="text-sm">
          <div className="text-white font-medium">Logged in as {user.displayName || user.username || user.email}</div>
          {user.email && <div className="text-gray-400">{user.email}</div>}
        </div>
        <button
          onClick={() => {
            setIsLoading(true);
            logout();
            setIsLoading(false);
          }}
          className="ml-2 px-5 py-2 rounded-md bg-red-600/80 hover:bg-red-600 text-white"
        >
          Log out
        </button>
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
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 animate-fade-in">
              <div className="bg-[#1a1d2e] border border-red-500/50 rounded-lg px-4 py-2 shadow-[0_0_15px_rgba(239,68,68,0.3)] min-w-[200px] max-w-[300px]">
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
              {/* Arrow pointing down */}
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#1a1d2e] mx-auto" />
            </div>
          )}
        </div>
      )}
      
      {/* Login button */}
      <button
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="group flex items-center gap-3 px-5 py-2.5 rounded-md border border-[#00ffe7]/40 bg-[#0b0e17] text-[#e0e7ef] shadow-[0_0_12px_rgba(0,255,231,0.15)] hover:shadow-[0_0_20px_rgba(0,255,231,0.35)] hover:border-[#00ffe7]/70 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-[#00ffe7]/30 border-t-[#00ffe7] rounded-full animate-spin" />
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
