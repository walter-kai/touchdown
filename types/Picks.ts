// Picks API Types
// Based on server/api/picks/picks.service.ts
//
// Database Structure (Single Collection):
// picks/{gameId}:{userId}
//   - userId: string
//   - gameId: string
//   - picks: PickSubmission[]
//   - timestamp: Firestore server timestamp
//   - teamData?: { league, team info }
//   - teamLogos?: { awayLogo, homeLogo }
//
// users/{userId}
//   - gameIds: string[] (array of game IDs user has picks in)
//   - lastUpdated: Firestore server timestamp
//   - totalScore, gamesPlayed: leaderboard aggregates (optional)
//   - [other user data]
//
// Query Patterns:
// 1. Game leaderboard: picks.where('gameId', '==', gameId) (one query)
// 2. User history: picks.where('userId', '==', userId) (one query)
// 3. Single pick: picks.doc(`${gameId}:${userId}`)
//
// Indexes Required:
// - Single-field index on 'gameId'
// - Single-field index on 'userId'

export interface PlayerPick {
  id: string;
  displayName: string;
  shortName: string;
  position?: string;
  jersey?: string;
  headshot?: string;
  team?: {
    id: string;
  };
}

export interface PickSubmission {
  players: PlayerPick[];
  totalScore: number;
  timestamp: string; // ISO 8601 timestamp - when pick was locked/submitted
  playerHistory?: Record<string, Array<{
    start: string; // ISO 8601 timestamp
    end?: string; // ISO 8601 timestamp
  }>>;
}

export interface UserPicksResponse {
  ok: boolean;
  picks: {
    picks: PickSubmission[];
    lastUpdated: string; // ISO 8601 timestamp
    totalPicks: number;
  } | null;
}

export interface LatestPickResponse {
  ok: boolean;
  pick: PickSubmission | null;
}

export interface PickHistoryResponse {
  ok: boolean;
  history: PickSubmission[];
  totalPicks: number;
}

export interface GameStatsResponse {
  ok: boolean;
  picks: Array<{
    userId: string;
    picks: PickSubmission[];
    lastUpdated: string;
    totalPicks: number;
  }>;
  totalUsers: number;
}

export interface GamePickDocument {
  picks: PickSubmission[];
  timestamp: any; // Firestore timestamp
  teamLogos?: {
    awayLogo: string;
    homeLogo: string;
  };
}

export interface CreatePickRequest {
  homeTeamId?: string;
  awayTeamId?: string;
  picksState: {
    players: Array<{
      id: string;
      displayName?: string;
      shortName: string;
      position?: {
        abbreviation: string;
      };
      jersey?: string;
      headshot?: string;
      team?: {
        id: string;
      };
    }>;
    totalScore?: number;
    lockedAt?: number | string | null; // Input as lockedAt, stored as timestamp in Firebase
    playerHistory?: Record<string, Array<{
      start: number | string;
      end?: number | string;
    }>>;
    teamLogos?: {
      awayLogo: string;
      homeLogo: string;
    };
  };
  gameId: string;
  selection?: string;
  multiplier?: number;
}

export interface CreatePickResponse {
  ok: boolean;
  id: string;
  collection: string;
}

export interface AthleteScores {
  gameScores: Record<string, number>; // athleteId -> game score (all plays)
  sessionScores: Record<string, number>; // athleteId -> session score (time-filtered for current pick)
  userScores: Record<string, number>; // athleteId -> user score (accumulated across all sessions)
  totalScore: number; // sum of all user scores
}

export interface ScoresResponse {
  ok: boolean;
  gameScores: Record<string, number>;
  sessionScores: Record<string, number>;
  userScores: Record<string, number>;
  totalScore: number;
}
