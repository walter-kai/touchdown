import admin from '../../utils/firebase';
import logger from '../../utils/logger';
import { Play, PlayByPlayData, ActiveGame } from '../../../types/espn/playByplay';

const db = admin.firestore();
const COLLECTION_NAME = 'playByPlay';

/**
 * Get play-by-play data for a specific game from Firebase
 * New simplified structure: playByPlay/{gameId} contains a plays array
 */
export const getGamePlayByPlay = async (gameId: string): Promise<PlayByPlayData | null> => {
  try {
    // Get the game document which now contains the plays array
    const gameDoc = await db.collection(COLLECTION_NAME).doc(gameId).get();

    if (!gameDoc.exists) {
      return null;
    }

    const gameData = gameDoc.data();
    
    // Convert Firestore timestamps to serializable format (ISO 8601)
    const plays = (gameData?.plays || []).map((play: any) => ({
      ...play,
      possession: play.possession?.id || play.possession || play.team,
      // timestamp should already be ISO string, but handle legacy Firestore Timestamp objects
      timestamp: play.timestamp?.toDate ? play.timestamp.toDate().toISOString() : play.timestamp
    }));
    
    return {
      gameId,
      plays,
      totalPlays: plays.length,
      lastUpdated: gameData?.lastUpdated?.toDate ? gameData.lastUpdated.toDate().toISOString() : gameData?.lastUpdated
    };
  } catch (error) {
    console.error(`Error fetching play-by-play for game ${gameId}:`, error);
    throw error;
  }
};

/**
 * Get all games with play-by-play data (useful for finding active games)
 */
export const getActiveGames = async (): Promise<ActiveGame[]> => {
  try {
    const snapshot = await db.collection(COLLECTION_NAME)
      .orderBy('lastUpdated', 'desc')
      .limit(20)
      .get();

    const games: ActiveGame[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      games.push({
        id: doc.id,
        totalPlays: data.plays?.length || 0,
        lastUpdated: data.lastUpdated
      });
    });

    return games;
  } catch (error) {
    console.error('Error fetching active games:', error);
    throw error;
  }
};

/**
 * Save play-by-play data for a game
 * Stores plays as an array in the game document
 */
export const saveGamePlayByPlay = async (gameId: string, plays: any[]): Promise<{ gameId: string; totalPlays: number }> => {
  try {
    const gameRef = db.collection(COLLECTION_NAME).doc(gameId);
    
    // Simplify play data - only keep essential fields, store timestamps in ISO 8601 format
    const simplifiedPlays: Play[] = plays.map(play => ({
      text: play.text || '',
      quarter: play.quarter || 0,
      clock: play.clock || '0:00',
      // Use wallclock (ISO string) from ESPN, fallback to now in ISO format
      timestamp: play.wallclock || (typeof play.timestamp === 'string' ? play.timestamp : new Date().toISOString()),
      team: play.team?.id || null,
      possession: play.possession?.id || play.possession || play.team?.id || null,
      type: play.type?.text || play.type?.abbreviation || '',
      scoreValue: play.scoreValue || 0,
      yardLine: play.start?.yardLine || play.end?.yardLine || null,
      yardage: play.statYardage || null,
      athletesInvolved: play.athletesInvolved?.map((athlete: any) => ({
        id: athlete.id,
        displayName: athlete.displayName,
        position: athlete.position
      })) || []
    }));

    await gameRef.set({
      plays: simplifiedPlays,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      totalPlays: simplifiedPlays.length
    }, { merge: true });

    logger.info(`Saved ${simplifiedPlays.length} plays for game ${gameId}`);
    
    return {
      gameId,
      totalPlays: simplifiedPlays.length
    };
  } catch (error) {
    console.error(`Error saving play-by-play for game ${gameId}:`, error);
    throw error;
  }
};

/**
 * Add a single play to a game
 * Appends to the plays array
 */
export const addPlayToGame = async (gameId: string, play: any): Promise<{ gameId: string; totalPlays: number }> => {
  try {
    const gameRef = db.collection(COLLECTION_NAME).doc(gameId);
    
    // Simplify play data, store timestamp in ISO 8601 format
    const simplifiedPlay: Play = {
      text: play.text || '',
      quarter: play.quarter || 0,
      clock: play.clock || '0:00',
      // Use wallclock (ISO string) from ESPN, fallback to now in ISO format
      timestamp: play.wallclock || (typeof play.timestamp === 'string' ? play.timestamp : new Date().toISOString()),
      team: play.team?.id || null,
      type: play.type?.text || play.type?.abbreviation || '',
      scoreValue: play.scoreValue || 0,
      yardLine: play.start?.yardLine || play.end?.yardLine || null,
      yardage: play.statYardage || null,
      athletesInvolved: play.athletesInvolved?.map((athlete: any) => ({
        id: athlete.id,
        displayName: athlete.displayName,
        position: athlete.position
      })) || []
    };

    // Use arrayUnion to prepend (most recent first) - note: arrayUnion adds to end
    // So we'll need to fetch, prepend, and set
    const gameDoc = await gameRef.get();
    const currentPlays = gameDoc.exists ? (gameDoc.data()?.plays || []) : [];
    
    // Prepend new play to the beginning
    const updatedPlays = [simplifiedPlay, ...currentPlays];

    await gameRef.set({
      plays: updatedPlays,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      totalPlays: updatedPlays.length
    }, { merge: true });

    logger.info(`Added play to game ${gameId}`);
    
    return {
      gameId,
      totalPlays: updatedPlays.length
    };
  } catch (error) {
    console.error(`Error adding play to game ${gameId}:`, error);
    throw error;
  }
};
