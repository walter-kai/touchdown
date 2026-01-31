/**
 * Frontend score calculation utility
 * Replicates backend logic for calculating athlete scores from play-by-play data
 */

export interface Play {
  athletesInvolved?: Array<{ id: string; displayName: string }>;
  timestamp: string;
  text: string;
}

export interface Pick {
  players: Array<{ id: string; displayName: string }>;
  totalScore: number;
  timestamp: string;
}

export interface AthleteScores {
  gameScores: Record<string, number>;
  sessionScores: Record<string, number>;
  userScores: Record<string, number>;
  totalScore: number;
}

/**
 * Calculate athlete scores from picks and play-by-play data
 * Returns the same format as the backend for consistency
 */
export function calculateAthleteScoresFromPlays(
  picks: Pick[],
  playLog: Play[],
  gameId: string
): AthleteScores {
  if (picks.length === 0) {
    return { gameScores: {}, sessionScores: {}, userScores: {}, totalScore: 0 };
  }

  // If no play-by-play is available (old games / ESPN 404), fall back to stored pick total
  if (!playLog || playLog.length === 0) {
    const latestPick = picks[picks.length - 1];
    const storedTotal = Number(latestPick?.totalScore || 0);
    const userScores: Record<string, number> = {};
    
    // Initialize all picked athletes with 0
    latestPick?.players?.forEach((p: any) => {
      if (p?.id) userScores[p.id] = 0;
    });

    return {
      gameScores: {},
      sessionScores: {},
      userScores,
      totalScore: storedTotal,
    };
  }

  // Get the latest pick (current session)
  const latestPick = picks[picks.length - 1];
  const currentPlayers = new Set<string>(latestPick.players.map((p: any) => p.id as string));

  // Calculate game scores (all plays for each athlete)
  const gameScores: Record<string, number> = {};
  const athletePlayCounts: Record<string, number> = {};

  playLog.forEach(play => {
    try {
      if (play.athletesInvolved && play.athletesInvolved.length > 0) {
        play.athletesInvolved.forEach((athlete: any) => {
          if (athlete?.id) {
            if (!athletePlayCounts[athlete.id]) athletePlayCounts[athlete.id] = 0;
            athletePlayCounts[athlete.id]++;
          }
        });
      }
    } catch (err) {
      console.warn(`[Dashboard Scoring] Error processing play: ${err}`);
    }
  });

  Object.keys(athletePlayCounts).forEach(athleteId => {
    gameScores[athleteId] = athletePlayCounts[athleteId];
  });

  // Calculate session scores (time-filtered for current pick)
  const sessionScores: Record<string, number> = {};

  Array.from(currentPlayers).forEach((playerId: string) => {
    sessionScores[playerId] = 0;

    if (!latestPick.timestamp) {
      console.warn(`[Dashboard Scoring] No timestamp found for latest pick`);
      return;
    }

    try {
      const lockTimeMs = new Date(latestPick.timestamp).getTime();

      // Count plays that happened AFTER the pick was locked
      playLog.forEach(play => {
        try {
          if (!play.athletesInvolved) return;

          const hasPlayer = play.athletesInvolved.some((a: any) => a?.id === playerId);
          if (!hasPlayer) return;

          const playTime = new Date(play.timestamp).getTime();

          // Check if play happened after lock time
          if (playTime >= lockTimeMs) {
            sessionScores[playerId]++;
          }
        } catch (err) {
          // Skip plays with invalid timestamps
        }
      });
    } catch (err) {
      console.warn(`[Dashboard Scoring] Error calculating session score for player ${playerId}: ${err}`);
    }
  });

  // Calculate user scores (accumulated across all sessions)
  const userScores: Record<string, number> = {};

  // Track all players the user has ever picked in this game
  const allUserPlayers = new Set<string>();
  picks.forEach((pick: any) => {
    pick.players.forEach((p: any) => allUserPlayers.add(p.id));
  });

  // For each player the user has picked, calculate total score across all their sessions
  allUserPlayers.forEach(playerId => {
    userScores[playerId] = 0;

    // Build all lock time periods for this player across all picks
    const allLockPeriods: Array<{ start: number; end?: number }> = [];

    picks.forEach((pick: any, pickIndex: number) => {
      // Check if this player was in this pick
      const isInPick = pick.players.some((p: any) => p.id === playerId);
      if (!isInPick) return;

      // Use the pick's timestamp as the lock time
      if (pick.timestamp) {
        const nextPick = picks[pickIndex + 1];
        let endTime: number | undefined = undefined;

        if (nextPick) {
          const isInNextPick = nextPick.players.some((p: any) => p.id === playerId);
          if (!isInNextPick && nextPick.timestamp) {
            // Player was dropped, use next pick's timestamp as end time
            endTime = new Date(nextPick.timestamp).getTime();
          }
        }

        allLockPeriods.push({
          start: new Date(pick.timestamp).getTime(),
          end: endTime
        });
      }
    });

    // Count plays that happened during any locked period
    playLog.forEach(play => {
      if (!play.athletesInvolved) return;

      const hasPlayer = play.athletesInvolved.some((a: any) => a.id === playerId);
      if (!hasPlayer) return;

      const playTime = new Date(play.timestamp).getTime();

      const isDuringLockedPeriod = allLockPeriods.some(period => {
        if (period.end) {
          return playTime >= period.start && playTime <= period.end;
        } else {
          return playTime >= period.start;
        }
      });

      if (isDuringLockedPeriod) {
        userScores[playerId]++;
      }
    });
  });

  const totalScore = Object.values(userScores).reduce((sum, score) => sum + score, 0);

  return {
    gameScores,
    sessionScores,
    userScores,
    totalScore
  };
}

/**
 * Fetch play-by-play data from ESPN API for a game
 */
export async function fetchPlaysByPlayFromESPN(gameId: string, league: 'nfl' | 'nba'): Promise<Play[]> {
  try {
    const sport = league === 'nba' ? 'basketball' : 'football';
    const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/summary?event=${gameId}`;

    const response = await fetch(summaryUrl);
    if (!response.ok) {
      console.warn(`[Dashboard Scoring] ESPN API returned ${response.status} for game ${gameId}`);
      return [];
    }

    const summaryData = await response.json();

    if (!summaryData?.plays || summaryData.plays.length === 0) {
      return [];
    }

    // Transform plays to expected format
    const plays: Play[] = summaryData.plays.map((play: any) => {
      const athletesInvolved = (play.participants || [])
        .map((p: any) => {
          const athleteId = p.athlete?.id;
          if (!athleteId) return null;
          return { id: athleteId, displayName: play.text };
        })
        .filter(Boolean);

      return {
        athletesInvolved,
        timestamp: play.wallclock || new Date().toISOString(),
        text: play.text
      };
    });

    return plays;
  } catch (error) {
    console.error(`[Dashboard Scoring] Error fetching plays for game ${gameId}:`, error);
    return [];
  }
}
