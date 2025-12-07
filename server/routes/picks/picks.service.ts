import admin from '../../utils/firebase';
import logger from '../../utils/logger';
import axios from 'axios';

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
 * Fetch athlete bio from ESPN API
 */
async function fetchAthleteBio(athleteId: string) {
  try {
    const response = await axios.get(
      `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${athleteId}`
    );
    return response.data?.athlete || null;
  } catch (error) {
    logger.error(error, `Error fetching athlete bio for ${athleteId}:`);
    return null;
  }
}

/**
 * Create picks using athlete-level aggregation structure
 * Structure: athletes/{athleteId}/games/{gameId}
 * This allows efficient calculation of:
 * - Per-game pick percentages
 * - Season-wide player popularity
 */
export async function createPick(args: CreatePickArgs) {
  const db = admin.firestore();
  const batch = db.batch();

  if (!args.gameId) {
    throw new Error('gameId is required');
  }

  if (!args.picksState?.players || args.picksState.players.length === 0) {
    throw new Error('No players in picksState');
  }

  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const players = args.picksState.players;

  // For each player picked, update their stats
  for (const player of players) {
    if (!player.id) continue;

    const athleteId = player.id;
    
    // Reference to athletes/{athleteId}
    const athleteRef = db.collection('athletes').doc(athleteId);
    
    // Reference to athletes/{athleteId}/games/{gameId}
    const gamePickRef = athleteRef.collection('games').doc(args.gameId);

    // Get current game picks to check if user already picked
    const gamePickDoc = await gamePickRef.get();
    const gameData = gamePickDoc.data();
    const userIds = gameData?.userIds || [];
    const alreadyPicked = userIds.includes(args.userId);

    if (!alreadyPicked) {
      // Update game-specific pick count
      batch.set(gamePickRef, {
        count: admin.firestore.FieldValue.increment(1),
        userIds: admin.firestore.FieldValue.arrayUnion(args.userId),
        lastUpdated: timestamp,
        gameId: args.gameId,
        homeTeamId: args.homeTeamId,
        awayTeamId: args.awayTeamId,
      }, { merge: true });

      // Check if athlete bio exists, if not fetch it
      const athleteDoc = await athleteRef.get();
      const needsBio = !athleteDoc.exists || !athleteDoc.data()?.bio;
      
      let athleteBio = null;
      if (needsBio) {
        athleteBio = await fetchAthleteBio(athleteId);
        logger.info(`Fetched bio for athlete ${athleteId}`);
      }

      // Update athlete's season stats and bio
      const athleteData: any = {
        athleteId: athleteId,
        displayName: player.displayName || player.shortName,
        shortName: player.shortName,
        position: player.position?.abbreviation,
        jersey: player.jersey,
        headshot: player.headshot,
        team: player.team,
        totalPicks: admin.firestore.FieldValue.increment(1),
        lastPickedAt: timestamp,
        gamesPicked: admin.firestore.FieldValue.arrayUnion(args.gameId),
      };

      // Add bio if we fetched it (filter out undefined values)
      if (athleteBio) {
        const bio: any = {};
        
        // Only add defined values to avoid Firestore errors
        if (athleteBio.firstName !== undefined) bio.firstName = athleteBio.firstName;
        if (athleteBio.lastName !== undefined) bio.lastName = athleteBio.lastName;
        if (athleteBio.fullName !== undefined) bio.fullName = athleteBio.fullName;
        if (athleteBio.displayName !== undefined) bio.displayName = athleteBio.displayName;
        if (athleteBio.debutYear !== undefined) bio.debutYear = athleteBio.debutYear;
        if (athleteBio.age !== undefined) bio.age = athleteBio.age;
        if (athleteBio.displayHeight !== undefined) bio.displayHeight = athleteBio.displayHeight;
        if (athleteBio.displayWeight !== undefined) bio.displayWeight = athleteBio.displayWeight;
        if (athleteBio.displayDOB !== undefined) bio.displayDOB = athleteBio.displayDOB;
        if (athleteBio.displayBirthPlace !== undefined) bio.displayBirthPlace = athleteBio.displayBirthPlace;
        if (athleteBio.displayExperience !== undefined) bio.displayExperience = athleteBio.displayExperience;
        if (athleteBio.displayDraft !== undefined) bio.displayDraft = athleteBio.displayDraft;
        if (athleteBio.college !== undefined) bio.college = athleteBio.college;
        if (athleteBio.position !== undefined) bio.position = athleteBio.position;
        if (athleteBio.team !== undefined) bio.team = athleteBio.team;
        if (athleteBio.headshot !== undefined) bio.headshot = athleteBio.headshot;
        if (athleteBio.status !== undefined) bio.status = athleteBio.status;
        if (athleteBio.active !== undefined) bio.active = athleteBio.active;
        
        athleteData.bio = bio;
        athleteData.bioFetchedAt = timestamp;
      }

      batch.set(athleteRef, athleteData, { merge: true });

      logger.info(`Added pick for athlete ${athleteId} in game ${args.gameId} by user ${args.userId}`);
    } else {
      logger.info(`User ${args.userId} already picked athlete ${athleteId} in game ${args.gameId}`);
    }
  }

  // Store user's pick history in a separate collection for tracking
  const userPickRef = db.collection('userPicks').doc(args.userId).collection('games').doc(args.gameId);
  batch.set(userPickRef, {
    userId: args.userId,
    gameId: args.gameId,
    players: players.map(p => ({
      id: p.id,
      displayName: p.displayName || p.shortName,
      position: p.position?.abbreviation,
    })),
    totalScore: args.picksState.totalScore || 0,
    lockedAt: args.picksState.lockedAt,
    homeTeamId: args.homeTeamId,
    awayTeamId: args.awayTeamId,
    timestamp,
  });

  // Commit the batch
  await batch.commit();

  logger.info(`Successfully saved ${players.length} picks for user ${args.userId} in game ${args.gameId}`);

  return { 
    id: args.gameId,
    playersCount: players.length,
    userId: args.userId
  };
}
