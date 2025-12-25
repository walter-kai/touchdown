import React, { useEffect, useState } from 'react';
import { useAuth } from '../providers/AuthContext';
import DisplayNameModal from '../components/common/DisplayNameModal';
import axios from 'axios';
import { jwtStorage } from '../utils/jwtStorage';
import { userStorage } from '../utils/userStorage';

interface DisplayNameCheckerProps {
  children: React.ReactNode;
}

const DisplayNameChecker: React.FC<DisplayNameCheckerProps> = ({ children }) => {
  const { user, setUser } = useAuth();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check whenever user changes
    if (user) {
      // Only show modal if displayNameSet is explicitly false or undefined
      // Hide modal if displayNameSet is true
      if (user.displayNameSet === true) {
        setShowModal(false);
      } else if (user.displayNameSet === false || user.displayNameSet === undefined) {
        setShowModal(true);
      }
    } else {
      setShowModal(false);
    }
  }, [user]);

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
