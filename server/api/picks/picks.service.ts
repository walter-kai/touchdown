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
    playerLockTimes?: Record<string, number | string>; // Can be epoch milliseconds or ISO string
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

  const timestamp = new Date().toISOString(); // Use ISO 8601 format
  const players = args.picksState.players;

  // Convert timestamps to ISO 8601 format
  const convertToISO = (value: number | string | null | undefined): string | null => {
    if (!value) return null;
    if (typeof value === 'string') return value; // Already ISO format
    return new Date(value).toISOString(); // Convert epoch milliseconds to ISO
  };

  // Prepare the new pick entry with ISO timestamps
  const newPick = {
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
    lockedAt: convertToISO(args.picksState.lockedAt),
    playerLockTimes: args.picksState.playerLockTimes 
      ? Object.fromEntries(
          Object.entries(args.picksState.playerLockTimes).map(([id, time]) => [id, convertToISO(time)])
        )
      : {},
    playerHistory: args.picksState.playerHistory
      ? Object.fromEntries(
          Object.entries(args.picksState.playerHistory).map(([id, periods]) => [
            id,
            periods.map(p => ({
              start: convertToISO(p.start)!,
              end: p.end ? convertToISO(p.end)! : undefined,
            }))
          ])
        )
      : {},
    timestamp,
  };

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
