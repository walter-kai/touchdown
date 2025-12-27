/**
 * ESPN Play-by-Play Types
 * Shared between frontend and backend
 */

/**
 * Play types from ESPN NBA API
 */
export type PlayTypeNBA =
  | 'Jumpball'
  | 'Cutting Layup Shot'
  | 'Turnaround Jump Shot'
  | 'Defensive Rebound'
  | 'Offensive Rebound'
  | 'Three Point Jumper'
  | 'Driving Layup Shot'
  | 'Dunk Shot'
  | 'Alley Oop Dunk Shot'
  | 'Hook Shot'
  | 'Free Throw'
  | 'Block'
  | 'Steal'
  | 'Turnover'
  | 'Foul'
  | 'Timeout'
  | 'End Period'
  | 'Jump Shot'
  | 'Fadeaway Jump Shot'
  | 'Tip Shot'
  | 'Floating Jump Shot'
  | 'Pullup Jump Shot'
  | 'Running Layup Shot'
  | 'Step Back Jump Shot'
  | string; // Allow other types that might come from ESPN

export type NbaPositionType =
  | 'shooter'
  | 'assister'
  | 'blocker'
  | 'rebounder'
  | 'fouler'
  | 'fouledBy'
  | 'stealer'
  | string;

/**
 * Play types from ESPN NFL API
 */
export type PlayTypeNFL =
  | 'Rush'
  | 'Pass Reception'
  | 'Pass Incompletion'
  | 'Rushing Touchdown'
  | 'Passing Touchdown'
  | 'Field Goal Good'
  | 'Field Goal Missed'
  | 'Punt'
  | 'Kickoff'
  | 'Penalty'
  | 'Sack'
  | 'Pass Interception Return'
  | 'Fumble Recovery (Own)'
  | 'Fumble Recovery (Opponent)'
  | 'Official Timeout'
  | 'Two-minute warning'
  | 'End Period'
  | 'End of Half'
  | 'End of Game'
  | string; // Allow other types that might come from ESPN

export type NflPositionType =
  // Offensive player types
  | 'passer'
  | 'rusher'
  | 'receiver'
  | 'kicker'
  | 'punter'
  | 'scorer'
  | 'patScorer'
  // Defensive player types
  | 'tackler'
  | 'assistedBy'
  | 'passDefender'
  | 'sacker'
  // Fumble-related types
  | 'fumbler'
  | 'recoverer'
  | 'forcedBy'
  // Special teams types
  | 'returner'
  // Penalty types
  | 'penalized'
  // Team types (for teamParticipants)
  | 'offense'
  | 'defense'
  // Allow other types that might come from ESPN
  | string;

/**
 * Athlete involved in a play
 */
export interface PlayAthlete {
  id: string;
  displayName: string;
  shortName?: string;
  fullName?: string;
  position: string;
  jersey?: string;
  headshot?: string;
  team?: {
    id: string;
  };
}

/**
 * Individual play in a game
 */
export interface Play {
  /** Unique play identifier when available */
  id?: string;
  /** Play description text */
  text: string;
  
  /** Quarter/period number */
  quarter: number;
  
  /** Game clock time */
  clock: string;
  
  /** ISO 8601 timestamp string or Date object */
  timestamp: string | Date;
  
  /** Team ID that has possession */
  possession?: string;
  
  /** Team ID (may differ from possession for defensive plays) */
  team?: string;
  
  /** Type of play */
  type: PlayTypeNFL;
  
  /** Points scored on this play (0 if no score) */
  scoreValue?: number;
  
  /** Yard line position */
  yardLine?: number;

  /** Raw start spot (from ESPN) */
  start?: {
    yardLine?: number;
    team?: { id?: string };
  };

  /** Raw end spot (from ESPN) */
  end?: {
    yardLine?: number;
    team?: { id?: string };
  };
  
  /** Yards gained/lost on the play */
  yardage?: number;
  
  /** Athletes involved in the play */
  athletesInvolved?: PlayAthlete[];
}

/**
 * Play-by-play data for a game
 */
export interface PlayByPlayData {
  /** Game ID */
  gameId: string;
  
  /** Array of plays (most recent first) */
  plays: Play[];
  
  /** Total number of plays */
  totalPlays: number;
  
  /** ISO 8601 timestamp of last update */
  lastUpdated?: string;
}

/**
 * Active game summary
 */
export interface ActiveGame {
  /** Game ID */
  id: string;
  
  /** Total number of plays */
  totalPlays: number;
  
  /** Last update timestamp */
  lastUpdated?: string;
}
