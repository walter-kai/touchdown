// JWT token management utility

const JWT_STORAGE_KEY = 'dexter_access_token';
const JWT_EXPIRY_KEY = 'dexter_token_expiry';

export const jwtStorage = {
  // Store JWT token
  setToken: (token: string, expiresIn: number) => {
    const expiryTime = Date.now() + (expiresIn * 1000);
    localStorage.setItem(JWT_STORAGE_KEY, token);
    localStorage.setItem(JWT_EXPIRY_KEY, expiryTime.toString());
  },

  // Get JWT token
  getToken: (): string | null => {
    const token = localStorage.getItem(JWT_STORAGE_KEY);
    const expiry = localStorage.getItem(JWT_EXPIRY_KEY);
    
    if (!token || !expiry) {
      return null;
    }

    // Check if token is expired
    if (Date.now() > parseInt(expiry)) {
      jwtStorage.clearToken();
      return null;
    }

    return token;
  },

  // Clear JWT token
  clearToken: () => {
    localStorage.removeItem(JWT_STORAGE_KEY);
    localStorage.removeItem(JWT_EXPIRY_KEY);
  },

  // Force clear all authentication data
  forceLogout: () => {
    localStorage.removeItem(JWT_STORAGE_KEY);
    localStorage.removeItem(JWT_EXPIRY_KEY);
    console.log('JWT tokens cleared during force logout');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return jwtStorage.getToken() !== null;
  }
};

// Add Authorization header to fetch requests
export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = jwtStorage.getToken();
  
  if (!token) {
    throw new Error('No authentication token available');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
};
