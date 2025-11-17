import { authenticatedFetch } from './jwtStorage';
import { User } from '../types/User';

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  telegramId?: string;
  photoUrl?: string;
  referralId?: string;
}

/**
 * User API service for user operations that require server updates
 */
export const userApi = {
  /**
   * Update user profile
   */
  updateUser: async (userData: UpdateUserRequest): Promise<User> => {
    const response = await authenticatedFetch('/api/user/update', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update user');
    }

    const result = await response.json();
    return result.user;
  },

  /**
   * Check if username is available
   */
  checkUsernameAvailability: async (username: string): Promise<boolean> => {
    const response = await fetch(`/api/user/checkName?username=${encodeURIComponent(username)}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to check username');
    }

    const result = await response.json();
    return result.available;
  },

  /**
   * Set user chat ID for Telegram
   */
  setUserChatId: async (telegramId: string, chatId: string): Promise<void> => {
    const response = await authenticatedFetch(`/api/user/${telegramId}/setChatId/${chatId}`, {
      method: 'PUT',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to set chat ID');
    }
  },
};
