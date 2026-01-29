import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../providers/AuthContext";

import { User } from "@/types/User";
import StatusPopup from '../common/StatusPopup';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { setUser, user, closeLoginModal } = useAuth();

  const [show, setShow] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [referral, setReferral] = useState('');
  const [statusMessage, setStatusMessage] = useState<{type: 'loading' | 'success' | 'error', message: string} | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameCheckTimeout, setUsernameCheckTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [profilePictureId, setProfilePictureId] = useState<number>(Math.floor(Math.random() * 10000));
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setShow(false);
      setTimeout(() => setShow(true), 10);
      setUsername('');
      setEmail('');
      setReferral('');
      setStatusMessage(null);
      setIsConnecting(false);
      setProfilePictureId(Math.floor(Math.random() * 10000));
    } else {
      setShow(false);
      setStatusMessage(null);
      setIsConnecting(false);
    }
  }, [isOpen]);


  // Update error state when authError changes
  const createAccount = async () => {
    try {
      setStatusMessage(null);
      setIsConnecting(true);
      
      // Generate a random wallet address for the user
      const randomWalletAddress = '0x' + Array.from({length: 40}, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      
      // Create a simple authentication request without signature
      const response = await fetch('/auth/simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: randomWalletAddress,
          username: username.trim(),
          email: email.trim() || undefined,
          referralId: referral.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create account');
      }

      const { data } = await response.json();
      const authenticatedUser = data.user as User;
      
      // Store the JWT token
      localStorage.setItem('jwt_token', data.accessToken);
      
      // Update context state
      setUser(authenticatedUser);
      
      // Close modal and redirect to dashboard
      closeLoginModal();
      navigate("/i/dashboard");
      onClose();
    } catch (err: any) {
      console.error('Account creation error:', err);
      const errorMessage = err?.message || err?.toString() || "Failed to create account.";
      setStatusMessage({ type: 'error', message: errorMessage });
    } finally {
      setIsConnecting(false);
    }
  };


  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || username.length < 3) {
      setStatusMessage({ type: 'error', message: 'Username must be at least 3 characters' });
      return;
    }

    if (usernameAvailable !== true) {
      setStatusMessage({ type: 'error', message: 'Please choose an available username' });
      return;
    }

    if (email.trim() && emailValid !== true) {
      setStatusMessage({ type: 'error', message: 'Please enter a valid email address' });
      return;
    }

    await createAccount();
  };
  const checkUsernameAvailability = async (usernameToCheck: string) => {
    if (usernameToCheck.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const response = await fetch(`/api/user/checkName?username=${usernameToCheck}`);
      const data = await response.json();
      setUsernameAvailable(data.available);
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const validateEmail = (emailToValidate: string) => {
    if (!emailToValidate.trim()) {
      setEmailValid(null); // Empty email is valid (optional field)
      return;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(emailRegex.test(emailToValidate.trim()));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    validateEmail(newEmail);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);

    // Clear previous timeout
    if (usernameCheckTimeout) {
      clearTimeout(usernameCheckTimeout);
    }

    // Set new timeout for username check
    const timeout = setTimeout(() => {
      checkUsernameAvailability(newUsername);
    }, 500);

    setUsernameCheckTimeout(timeout);
  };

  const regenerateProfilePicture = () => {
    setProfilePictureId(Math.floor(Math.random() * 10000));
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={`fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[30] transition-opacity duration-500 ${show ? 'opacity-100' : 'opacity-0'}`}>
        <div className="bg-bg-darker w-full max-w-lg rounded-lg p-8 relative border border-neon-cyan/30 shadow-[0_0_24px_#00ffe7]">
          <button
            onClick={() => {
              closeLoginModal();
              onClose();
            }}
            className="absolute z-10 top-4 right-4 bg-bg-dark p-2 rounded-full hover:bg-neon-cyan hover:text-bg-dark text-neon-cyan shadow-[0_0_8px_#00ffe7] transition"
          >
            ✕
          </button>
          
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-neon-cyan mb-6 drop-shadow-[0_0_8px_#00ffe7]">
              Create Your Account
            </h2>

            {/* Registration Form */}
            <form onSubmit={handleUsernameSubmit} className="space-y-6">
              {(() => {
                const isSubmitDisabled = username.length < 3 || usernameAvailable !== true || checkingUsername || (email.trim() !== '' && emailValid === false) || isConnecting;
                
                return (
                  <div className="bg-gradient-to-r from-bg-dark to-bg-darker border border-neon-cyan/50 rounded-lg p-6 shadow-[0_0_16px_#00ffe7/20]">
                    <div className="flex items-start space-x-4">
                      {/* Profile Picture */}
                      <div className="flex-shrink-0">
                        <div className="relative">
                          <div className="w-30 h-40 rounded-lg border-2 border-neon-cyan shadow-lg bg-gradient-to-br from-neon-cyan/20 to-neon-pink/20 flex items-center justify-center transition-all duration-500">
                            <span className="text-4xl">👤</span>
                          </div>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <label className="block text-text-light text-sm font-semibold mb-1 flex items-center justify-between">
                            <span>USERNAME</span>
                            <span>
                            {username.length < 3 && (
                              <span className="text-xs text-amber-400">
                              Minimum 3 characters
                              </span>
                            )}
                            {checkingUsername && username.length >= 3 && (
                              <span className="text-xs text-neon-cyan">Verifying availability...</span>
                            )}
                            {username && username.length >= 3 && usernameAvailable === false && !checkingUsername && (
                              <span className="text-xs text-red-400">❌ Name unavailable</span>
                            )}
                            {username && username.length >= 3 && usernameAvailable === true && !checkingUsername && (
                              <span className="text-xs text-green-400">✅ Name available</span>
                            )}
                            </span>
                          </label>
                          <input
                            type="text"
                            value={username}
                            onChange={handleUsernameChange}
                            className="w-full px-3 py-2 bg-bg-dark border border-neon-cyan/30 rounded text-text-light focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan text-sm"
                            placeholder="Enter your citizen name"
                            required
                            autoFocus
                          />
                          
                        </div>

                        <div>
                          <label className="block text-text-light text-sm font-semibold mb-1 flex items-center justify-between">
                            <span>EMAIL</span>
                            <span>
                              {email.trim() && emailValid === false && (
                                <span className="text-xs text-red-400">❌ Invalid email format</span>
                              )}
                              {email.trim() && emailValid === true && (
                                <span className="text-xs text-green-400">✅ Valid email</span>
                              )}
                              {!email.trim() && (
                                <span className="text-xs text-neon-cyan/50">Optional field</span>
                              )}
                            </span>
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            className={`w-full px-3 py-2 bg-bg-dark border rounded text-text-light focus:outline-none focus:ring-1 text-sm transition-colors ${
                              email.trim() && emailValid === false 
                                ? 'border-red-400/50 focus:border-red-400 focus:ring-red-400/50' 
                                : email.trim() && emailValid === true
                                ? 'border-green-400/50 focus:border-green-400 focus:ring-green-400/50'
                                : 'border-neon-cyan/30 focus:border-neon-cyan focus:ring-neon-cyan'
                            }`}
                            placeholder="Optional email address"
                          />
                        </div>

                        <div>
                          <label className="block text-text-light text-sm font-semibold mb-1 flex items-center justify-between">
                            <span>REFERRAL CODE</span>
                            <span>
                            {!referral.trim() && (
                              <span className="text-xs text-neon-cyan/50">Optional field</span>
                            )}
                            </span>
                          </label>
                          <input
                            type="text"
                            value={referral}
                            onChange={e => setReferral(e.target.value)}
                            className="w-full px-3 py-2 bg-bg-dark border border-neon-cyan/30 rounded text-text-light focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan text-sm"
                            placeholder="Optional referral code"
                          />
                          <span className="text-xs text-neon-cyan">Get 1000 commission-free trades</span>
                        </div>

                        
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Submit Button */}
              <div className="space-y-4">
                {(() => {
                  const isSubmitDisabled = username.length < 3 || usernameAvailable !== true || checkingUsername || (email.trim() !== '' && emailValid === false) || isConnecting;
                  
                  return (
                    <button
                      type="submit"
                      disabled={isSubmitDisabled}
                      className={`w-full font-bold py-3 px-6 rounded transition-all duration-500 ${
                        isSubmitDisabled
                          ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                          : "bg-neon-cyan text-bg-dark hover:bg-neon-pink-dark hover:text-white shadow-[0_0_8px_#00ffe7] hover:shadow-[0_0_16px_#ff005c]"
                      }`}
                    >
                      {isConnecting ? "Creating Account..." : checkingUsername ? "Verifying..." : "Create Account"}
                    </button>
                  );
                })()}

                <div className="text-center text-text-light text-sm">
                  <p>Get started with your Touchdown account</p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {statusMessage && (
        <StatusPopup
          type={statusMessage.type}
          message={statusMessage.message}
          onClose={() => setStatusMessage(null)}
        />
      )}
    </>
  );
};



export default LoginModal;
