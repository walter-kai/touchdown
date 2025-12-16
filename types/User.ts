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

export interface PlayerPick {
  id: string;
  displayName: string;
  position: string;
  jersey: string;
  headshot?: string;
  fullName?: string;
  shortName?: string;
  team?: {
    id: string;
    abbreviation?: string;
    displayName?: string;
    color?: string;
  };
}

export interface PickSubmission {
  players: PlayerPick[];
  lockedAt: string; // ISO 8601 format (e.g., "2025-12-14T19:57:16.314Z")
  playerLockTimes: Record<string, string>; // playerId -> ISO timestamp
  playerHistory: Record<string, Array<{ start: string; end?: string }>>; // playerId -> periods with ISO timestamps
}

export interface UserPicksDocument {
  userId: string;
  gameId: string;
  picks: PickSubmission[];
  createdAt: string; // ISO 8601 format
  updatedAt: string; // ISO 8601 format
}

