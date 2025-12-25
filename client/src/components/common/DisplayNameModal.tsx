import React, { useState, useEffect, useCallback } from 'react';
import { FaUser, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import axios from 'axios';
import { jwtStorage } from '../../utils/jwtStorage';

interface DisplayNameModalProps {
  currentName: string;
  onSubmit: (displayName: string) => Promise<void>;
  onClose?: () => void;
}

const DisplayNameModal: React.FC<DisplayNameModalProps> = ({ currentName, onSubmit, onClose }) => {
  const [displayName, setDisplayName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [checkTimeout, setCheckTimeout] = useState<NodeJS.Timeout | null>(null);
  const [hasChanged, setHasChanged] = useState(false);

  // Check username availability with debounce
  const checkUsernameAvailability = useCallback(async (username: string) => {
    if (!username.trim() || username.trim().length < 2) {
      setIsAvailable(null);
      return;
    }

    try {
      setCheckingAvailability(true);
      const token = jwtStorage.getToken();
      const response = await axios.get(`/api/user/checkName?username=${encodeURIComponent(username.trim())}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setIsAvailable(response.data.available);
      }
    } catch (err) {
      console.error('Error checking username availability:', err);
      setIsAvailable(null);
    } finally {
      setCheckingAvailability(false);
    }
  }, []);

  // Debounced check when displayName changes
  useEffect(() => {
    // Clear previous timeout
    if (checkTimeout) {
      clearTimeout(checkTimeout);
    }

    // Reset availability check if name is too short
    if (displayName.trim().length < 2) {
      setIsAvailable(null);
      return;
    }

    // Don't check if the name hasn't changed from the initial value
    if (displayName.trim() === currentName.trim()) {
      setIsAvailable(null); // Don't show any message for initial name
      setHasChanged(false); // Mark as not changed
      return;
    }

    // Mark as changed when user modifies the name
    setHasChanged(true);

    // Set new timeout for checking
    const timeout = setTimeout(() => {
      checkUsernameAvailability(displayName);
    }, 500); // Wait 500ms after user stops typing

    setCheckTimeout(timeout);

    // Cleanup
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [displayName, currentName, checkUsernameAvailability]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }

    if (displayName.trim().length < 2) {
      setError('Display name must be at least 2 characters');
      return;
    }

    if (displayName.trim().length > 50) {
      setError('Display name must be less than 50 characters');
      return;
    }

    if (isAvailable === false) {
      setError('This display name is already taken');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(displayName.trim());
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update display name');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-bg-dark border-2 border-neon-cyan/50 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-neon-cyan/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-neon-cyan/10 rounded-full border border-neon-cyan/30">
            <FaUser className="text-2xl text-neon-cyan" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Set Your Display Name</h2>
            <p className="text-sm text-gray-400">This can only be changed once!</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-semibold text-gray-300 mb-2">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setError(null);
                setHasChanged(true);
                setIsAvailable(null); // Reset availability immediately on change
              }}
              className="w-full px-4 py-3 bg-bg-darker border border-neon-cyan/30 rounded-lg text-white focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all"
              placeholder="Enter your display name"
              disabled={loading}
              autoFocus
            />
            {checkingAvailability && (
              <p className="mt-2 text-sm text-gray-400 flex items-center gap-2">
                <FaSpinner className="text-xs animate-spin" />
                Checking availability...
              </p>
            )}
            {!checkingAvailability && isAvailable === true && displayName.trim().length >= 2 && (
              <p className="mt-2 text-sm text-green-400 flex items-center gap-1">
                <FaCheck className="text-xs" />
                This display name is available!
              </p>
            )}
            {!checkingAvailability && isAvailable === false && (
              <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                <FaTimes className="text-xs" />
                This display name is already taken
              </p>
            )}
            {error && (
              <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                <FaTimes className="text-xs" />
                {error}
              </p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              This will be shown on the leaderboard and throughout the app.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || !displayName.trim() || !hasChanged || (hasChanged && isAvailable !== true) || checkingAvailability}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                loading || !displayName.trim() || !hasChanged || (hasChanged && isAvailable !== true) || checkingAvailability
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-neon-cyan text-bg-dark hover:bg-neon-cyan/90 hover:shadow-lg hover:shadow-neon-cyan/30'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-bg-dark/30 border-t-bg-dark rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FaCheck />
                  Confirm
                </>
              )}
            </button>
          </div>

          <p className="text-center text-xs text-gray-500 pt-2">
            ⚠️ You can only set this <strong>once</strong> - choose wisely!
          </p>
        </form>
      </div>
    </div>
  );
};

export default DisplayNameModal;
