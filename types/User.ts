

export interface User {
  uid: string;
  walletAddress?: string;
  username: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
  createdAt: Date;
  lastLogin: Date;
  referralId?: string;
  telegramId?: string;
  
  // Auth method tracking
  authMethod?: 'metamask' | 'google' | 'simple';
  
  // Google OAuth specific fields
  googleId?: string;
  googleEmail?: string;
  googleName?: string;
  googlePicture?: string;
  
  // Additional metadata
  isEmailVerified?: boolean;
  locale?: string;
}

