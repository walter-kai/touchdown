import admin from '../../utils/firebase';
import logger from '../../utils/logger';

type CreatePickArgs = {
  userId: string;
  homeTeamId?: string;
  awayTeamId?: string;
  picksState?: {
    players?: any[];
    totalScore?: number;
    lockedAt?: number | null;
  };
  gameId?: string;
  selection?: string;
  multiplier?: number;
};

/**
 * Create picks using simplified game-centric structure
 * 
 * Structure:
 * gamePicks/{gameId}/users/{userId} - Contains only the array of player picks
 * 
 * This allows:
 * 1. Single read to get user's picks: gamePicks/{gameId}/users/{userId}
 * 2. Single read to get all picks for a game: gamePicks/{gameId}/users/*
 */
export async function createPick(args: CreatePickArgs) {
  const db = admin.firestore();

  if (!args.gameId) {
    throw new Error('gameId is required');
  }

  if (!args.picksState?.players || args.picksState.players.length === 0) {
    throw new Error('No players in picksState');
  }

  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const players = args.picksState.players;

  // Store user's picks: gamePicks/{gameId}/users/{userId}
  const userPickRef = db.collection('gamePicks').doc(args.gameId).collection('users').doc(args.userId);
  
  await userPickRef.set({
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
    timestamp,
  });

  logger.info(`Successfully saved ${players.length} picks for user ${args.userId} in game ${args.gameId}`);

  return { 
    id: args.gameId,
    playersCount: players.length,
    userId: args.userId
  };
}

/**
 * Get all picks a user made for a specific game
 * Returns the user's player selections
 */
export async function getUserPicksForGame(userId: string, gameId: string) {
  const db = admin.firestore();
  
  const userPickRef = db.collection('gamePicks').doc(gameId).collection('users').doc(userId);
  const userPickDoc = await userPickRef.get();

  if (!userPickDoc.exists) {
    logger.info(`No picks found for user ${userId} in game ${gameId}`);
    return null;
  }

  return userPickDoc.data();
}

/**
 * Get all picks for a specific game
 * Returns all user picks for statistical analysis
 */
export async function getAllPicksForGame(gameId: string) {
  const db = admin.firestore();
  
  const usersSnapshot = await db.collection('gamePicks')
    .doc(gameId)
    .collection('users')
    .get();

  const allPicks = usersSnapshot.docs.map(doc => ({
    userId: doc.id,
    ...doc.data(),
  }));

  logger.info(`Retrieved picks from ${allPicks.length} users for game ${gameId}`);

  return allPicks;
}
