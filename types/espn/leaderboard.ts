/**
 * Leaderboard entry for a single user
 */
export interface LeaderboardEntry {
  userId: string;
  displayName?: string;
  photoUrl?: string;
  totalScore: number;
  gamesPlayed: number;
  rank?: number;
  lastUpdated?: string;
}

/**
 * Leaderboard document structure stored in Firestore
 * Collection: leaderboards
 * Document: totalScore
 */
export interface LeaderboardDocument {
  leaderboard: LeaderboardEntry[];
  lastCalculated: string;
  totalUsers: number;
  metadata?: {
    calculationDuration?: number;
    version?: string;
  };
}
