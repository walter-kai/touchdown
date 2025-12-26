import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../providers/AuthContext';
import DisplayNameModal from '../components/common/DisplayNameModal';
import axios from 'axios';
import { jwtStorage } from '../utils/jwtStorage';
import { userStorage } from '../utils/userStorage';

interface DisplayNameCheckerProps {
  children: React.ReactNode;
}

const DisplayNameChecker: React.FC<DisplayNameCheckerProps> = ({ children }) => {
  const { user, setUser, isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const wasAuthenticated = useRef<boolean>(false);

  useEffect(() => {
    // Only consider showing the modal on a fresh login transition
    const justLoggedIn = !wasAuthenticated.current && isAuthenticated;
    wasAuthenticated.current = isAuthenticated;

    if (!justLoggedIn) {
      // Do not change modal visibility outside of login event
      return;
    }

    // At login time: show only if user exists and displayNameSet is explicitly false
    if (user && user.displayNameSet === false) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [isAuthenticated, user]);

  const handleSubmit = async (displayName: string) => {
    try {
      const token = jwtStorage.getToken();
      const response = await axios.put(
        '/api/user/display-name',
        { displayName },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Update user in context and storage
        const updatedUser = response.data.user;
        setUser(updatedUser);
        userStorage.setUser(updatedUser);
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error updating display name:', error);
      throw error;
    }
  };

  return (
    <>
      {children}
      {showModal && user && (
        <DisplayNameModal
          currentName={user.displayName || user.providerData?.googleName || ''}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
};

export default DisplayNameChecker;
