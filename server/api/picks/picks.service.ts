import admin from '../../utils/firebase';
import logger from '../../utils/logger';

type CreatePickArgs = {
  userId: string;
  homeTeamId?: string;
  awayTeamId?: string;
  picksState?: {
    players?: any[];
    totalScore?: number;
    lockedAt?: number | string | null; // Can be epoch milliseconds or ISO string
    playerHistory?: Record<string, Array<{ start: number | string; end?: number | string }>>; // Can be epoch milliseconds or ISO string
  };
  gameId?: string;
  selection?: string;
  multiplier?: number;
};

/**
 * Create picks using array-based structure (similar to play-by-play)
 * 
 * Structure:
 * gamePicks/{gameId}/users/{userId} - Contains a picks array with multiple pick sets
 * 
 * This allows:
 * 1. Single read to get all user's picks: gamePicks/{gameId}/users/{userId}
 * 2. Single read to get all picks for a game: gamePicks/{gameId}/users/*
 * 3. Multiple pick submissions per user stored as array entries
 */
export async function createPick(args: CreatePickArgs) {
  const db = admin.firestore();

  if (!args.gameId) {
    throw new Error('gameId is required');
  }

  if (!args.picksState?.players || args.picksState.players.length === 0) {
    throw new Error('No players in picksState');
  }

  const players = args.picksState.players;

  // Convert timestamps to ISO 8601 format
  const convertToISO = (value: number | string | null | undefined): string | null => {
    if (!value) return null;
    if (typeof value === 'string') return value; // Already ISO format
    return new Date(value).toISOString(); // Convert epoch milliseconds to ISO
  };

  // Use lockedAt as the timestamp (when pick was submitted/locked)
  const timestamp = convertToISO(args.picksState.lockedAt) || new Date().toISOString();

  // Prepare the new pick entry with ISO timestamps
  const newPick: any = {
    players: players.map(p => {
      const playerData: any = {
        id: p.id,
        displayName: p.displayName || p.shortName,
        shortName: p.shortName,
      };
      
      // Only add fields if they're defined
      if (p.position?.abbreviation !== undefined) playerData.position = p.position.abbreviation;
      if (p.jersey !== undefined) playerData.jersey = p.jersey;
      if (p.headshot !== undefined) playerData.headshot = p.headshot;
      if (p.team !== undefined) playerData.team = p.team;
      
      return playerData;
    }),
    totalScore: args.picksState.totalScore || 0,
    timestamp, // timestamp is when the pick was locked/submitted
  };

  // Only add playerHistory if it exists
  if (args.picksState.playerHistory && Object.keys(args.picksState.playerHistory).length > 0) {
    newPick.playerHistory = Object.fromEntries(
      Object.entries(args.picksState.playerHistory).map(([id, periods]) => [
        id,
        periods.map(p => ({
          start: convertToISO(p.start)!,
          end: p.end ? convertToISO(p.end)! : undefined,
        }))
      ])
    );
  }

  // Store user's picks as an array: gamePicks/{gameId}/users/{userId}
  const userPickRef = db.collection('gamePicks').doc(args.gameId).collection('users').doc(args.userId);
  
  // Use arrayUnion to append the new pick to the picks array
  await userPickRef.set({
    picks: admin.firestore.FieldValue.arrayUnion(newPick),
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  logger.info(`Successfully saved ${players.length} picks for user ${args.userId} in game ${args.gameId}`);

  return { 
    id: args.gameId,
    playersCount: players.length,
    userId: args.userId
  };
}

/**
 * Get all picks a user made for a specific game
 * Returns the user's pick array with all submissions
 */
export async function getUserPicksForGame(userId: string, gameId: string) {
  const db = admin.firestore();
  
  const userPickRef = db.collection('gamePicks').doc(gameId).collection('users').doc(userId);
  const userPickDoc = await userPickRef.get();

  if (!userPickDoc.exists) {
    logger.info(`No picks found for user ${userId} in game ${gameId}`);
    return null;
  }

  const data = userPickDoc.data();
  
  // Return the picks array with serialized timestamps
  return {
    picks: (data?.picks || []).map((pick: any) => ({
      ...pick,
      timestamp: pick.timestamp?.toDate ? pick.timestamp.toDate().toISOString() : pick.timestamp
    })),
    lastUpdated: data?.lastUpdated?.toDate ? data.lastUpdated.toDate().toISOString() : data?.lastUpdated,
    totalPicks: data?.picks?.length || 0
  };
}

/**
 * Get all picks for a specific game
 * Returns all user picks with their pick arrays for statistical analysis
 */
export async function getAllPicksForGame(gameId: string) {
  const db = admin.firestore();
  
  const usersSnapshot = await db.collection('gamePicks')
    .doc(gameId)
    .collection('users')
    .get();

  const allPicks = usersSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      userId: doc.id,
      picks: (data?.picks || []).map((pick: any) => ({
        ...pick,
        timestamp: pick.timestamp?.toDate ? pick.timestamp.toDate().toISOString() : pick.timestamp
      })),
      lastUpdated: data?.lastUpdated?.toDate ? data.lastUpdated.toDate().toISOString() : data?.lastUpdated,
      totalPicks: data?.picks?.length || 0
    };
  });

  logger.info(`Retrieved picks from ${allPicks.length} users for game ${gameId}`);

  return allPicks;
}

/**
 * Get the latest pick for a user in a specific game
 * Returns only the most recent pick submission
 */
export async function getLatestUserPick(userId: string, gameId: string) {
  const db = admin.firestore();
  
  const userPickRef = db.collection('gamePicks').doc(gameId).collection('users').doc(userId);
  const userPickDoc = await userPickRef.get();

  if (!userPickDoc.exists) {
    logger.info(`No picks found for user ${userId} in game ${gameId}`);
    return null;
  }

  const data = userPickDoc.data();
  const picks = data?.picks || [];
  
  if (picks.length === 0) {
    return null;
  }

  // Return the last pick in the array (most recent)
  const latestPick = picks[picks.length - 1];
  
  return {
    ...latestPick,
    timestamp: latestPick.timestamp?.toDate ? latestPick.timestamp.toDate().toISOString() : latestPick.timestamp
  };
}

/**
 * Get pick history for a user in a specific game
 * Returns all picks ordered by timestamp
 */
export async function getUserPickHistory(userId: string, gameId: string) {
  const result = await getUserPicksForGame(userId, gameId);
  
  if (!result || !result.picks) {
    return [];
  }

  // Sort picks by timestamp (oldest to newest)
  return result.picks.sort((a: any, b: any) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeA - timeB;
  });
}

/**
 * Calculate scores for athletes in a game
 * Returns three types of scores:
 * 1. gameScore - total points the athlete got in the entire game
 * 2. sessionScore - points the user got with the athlete since lock-in (time-filtered)
 * 3. userScore - total accumulated score that the athlete generated for the user (all sessions)
 */
export async function calculateAthleteScores(userId: string, gameId: string, playLog: any[]) {
  const db = admin.firestore();
  
  // Get user's pick history for this game
  const userPickRef = db.collection('gamePicks').doc(gameId).collection('users').doc(userId);
  const userPickDoc = await userPickRef.get();

  if (!userPickDoc.exists) {
    logger.info(`No picks found for user ${userId} in game ${gameId}`);
    return { gameScores: {}, sessionScores: {}, userScores: {}, totalScore: 0 };
  }

  const data = userPickDoc.data();
  const picks = data?.picks || [];
  
  if (picks.length === 0) {
    return { gameScores: {}, sessionScores: {}, userScores: {}, totalScore: 0 };
  }

  // Get the latest pick (current session)
  const latestPick = picks[picks.length - 1];
  const currentPlayers = new Set<string>(latestPick.players.map((p: any) => p.id as string));
  
  // Calculate game scores (all plays for each athlete)
  const gameScores: Record<string, number> = {};
  const athletePlayCounts: Record<string, number> = {};
  
  playLog.forEach(play => {
    if (play.athletesInvolved && play.athletesInvolved.length > 0) {
      play.athletesInvolved.forEach((athlete: any) => {
        if (!athletePlayCounts[athlete.id]) athletePlayCounts[athlete.id] = 0;
        athletePlayCounts[athlete.id]++;
      });
    }
  });
  
  Object.keys(athletePlayCounts).forEach(athleteId => {
    gameScores[athleteId] = athletePlayCounts[athleteId];
  });

  // Calculate session scores (time-filtered for current pick)
  const sessionScores: Record<string, number> = {};
  
  Array.from(currentPlayers).forEach((playerId: string) => {
    sessionScores[playerId] = 0;
    
    // All players in a pick submission share the same timestamp (when pick was locked)
    if (!latestPick.timestamp) {
      logger.warn(`No timestamp found for latest pick in session score calculation`);
      return;
    }
    
    const lockTimeMs = new Date(latestPick.timestamp).getTime();
    
    // Count plays that happened AFTER the pick was locked
    playLog.forEach(play => {
      if (!play.athletesInvolved) return;
      
      const hasPlayer = play.athletesInvolved.some((a: any) => a.id === playerId);
      if (!hasPlayer) return;
      
      const playTime = new Date(play.timestamp).getTime();
      
      // Check if play happened after lock time
      if (playTime >= lockTimeMs) {
        sessionScores[playerId]++;
      }
    });
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
      
      // Add from playerHistory if it exists
      if (pick.playerHistory && pick.playerHistory[playerId]) {
        pick.playerHistory[playerId].forEach((period: any) => {
          allLockPeriods.push({
            start: new Date(period.start).getTime(),
            end: period.end ? new Date(period.end).getTime() : undefined
          });
        });
      }
      
      // Use the pick's timestamp as the lock time
      // The end time is either:
      // 1. The next pick's timestamp (if this player is not in the next pick)
      // 2. undefined (if this is the latest pick or player continues in next pick)
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

  // Calculate total user score
  const totalScore = Object.values(userScores).reduce((sum, score) => sum + score, 0);

  logger.info(`Calculated scores for user ${userId} in game ${gameId}: ${Object.keys(gameScores).length} athletes, total score: ${totalScore}`);

  return {
    gameScores,
    sessionScores,
    userScores,
    totalScore
  };
}
