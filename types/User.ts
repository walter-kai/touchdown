export interface ProviderData {
  authTime: Date;
  googleEmail: string;
  googleId: string;
  googleName: string;
  googlePicture: string;
  isEmailVerified: boolean;
  locale: string;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoUrl: string;
  authMethod: 'google' | 'metamask' | 'simple';
  provider: 'google' | 'metamask' | 'simple';
  createdAt: Date;
  lastLogin: Date;
  providerData: ProviderData;
  
  // Optional fields for backward compatibility
  username?: string;
  referralId?: string;
  
  // Deprecated fields (kept for backward compatibility)
  googleId?: string;
  googleEmail?: string;
  googleName?: string;
  googlePicture?: string;
  isEmailVerified?: boolean;
  locale?: string;
}
