import type { User } from '../../../types/User';

const USER_STORAGE_KEY = 'dexter_user';

export const userStorage = {
  setUser: (user: User) => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch {}
  },
  getUser: (): User | null => {
    try {
      if (typeof window === 'undefined') return null;
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
  clear: () => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {}
  }
};
