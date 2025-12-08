import admin from '../../utils/firebase';

const db = admin.firestore();
const COLLECTION_NAME = 'playByPlay';

/**
 * Get play-by-play data for a specific game from Firebase
 * New simplified structure: playByPlay/{gameId} contains a plays array
 */
export const getGamePlayByPlay = async (gameId: string) => {
  try {
    // Get the game document which now contains the plays array
    const gameDoc = await db.collection(COLLECTION_NAME).doc(gameId).get();

    if (!gameDoc.exists) {
      return null;
    }

    const gameData = gameDoc.data();
    
    // Convert Firestore timestamps to serializable format
    const plays = (gameData?.plays || []).map((play: any) => ({
      ...play,
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
export const getActiveGames = async () => {
  try {
    const snapshot = await db.collection(COLLECTION_NAME)
      .orderBy('lastUpdated', 'desc')
      .limit(20)
      .get();

    const games: any[] = [];
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
export const saveGamePlayByPlay = async (gameId: string, plays: any[]) => {
  try {
    const gameRef = db.collection(COLLECTION_NAME).doc(gameId);
    
    // Simplify play data - only keep essential fields
    const simplifiedPlays = plays.map(play => ({
      text: play.text || '',
      quarter: play.quarter || 0,
      clock: play.clock || '0:00',
      timestamp: play.timestamp || admin.firestore.Timestamp.now(),
      team: play.team?.id || null,
      type: play.type?.text || play.type?.abbreviation || '',
      scoreValue: play.scoreValue || 0,
      yardLine: play.drive?.end?.yardLine || play.drive?.start?.yardLine || null,
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

    console.log(`Saved ${simplifiedPlays.length} plays for game ${gameId}`);
    
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
export const addPlayToGame = async (gameId: string, play: any) => {
  try {
    const gameRef = db.collection(COLLECTION_NAME).doc(gameId);
    
    // Simplify play data
    const simplifiedPlay = {
      text: play.text || '',
      quarter: play.quarter || 0,
      clock: play.clock || '0:00',
      timestamp: play.timestamp || admin.firestore.Timestamp.now(),
      team: play.team?.id || null,
      type: play.type?.text || play.type?.abbreviation || '',
      scoreValue: play.scoreValue || 0,
      yardLine: play.drive?.end?.yardLine || play.drive?.start?.yardLine || null,
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

    console.log(`Added play to game ${gameId}`);
    
    return {
      gameId,
      totalPlays: updatedPlays.length
    };
  } catch (error) {
    console.error(`Error adding play to game ${gameId}:`, error);
    throw error;
  }
};
