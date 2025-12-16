// Picks API Types
// Based on server/api/picks/picks.service.ts

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
