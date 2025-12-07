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
 * Create picks using game-centric structure for efficient querying
 * 
 * Structure:
 * gamePicks/{gameId}/users/{userId} - User's picks for this game
 * gamePicks/{gameId}/athletes/{athleteId} - Pick stats for this athlete in this game
 * gamePicks/{gameId}/metadata - Game-level stats
 * athletes/{athleteId} - Athlete profile and all-time stats
 * 
 * This allows:
 * 1. Single read to get user's picks: gamePicks/{gameId}/users/{userId}
 * 2. Single read to get all athlete stats for a game: gamePicks/{gameId}/athletes/*
 * 3. Single read to get athlete profile: athletes/{athleteId}
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

  // Check if user already has picks for this game
  const userPickRef = db.collection('gamePicks').doc(args.gameId).collection('users').doc(args.userId);
  const existingPick = await userPickRef.get();
  const isUpdate = existingPick.exists;
  
  // Get existing and new player IDs
  const existingPlayerIds = isUpdate 
    ? (existingPick.data()?.players?.map((p: any) => p.id) || [])
    : [];
  const newPlayerIds = players.map(p => p.id).filter(id => id);
  
  // Determine which players to remove and which to add
  const playersToRemove = existingPlayerIds.filter((id: string) => !newPlayerIds.includes(id));
  const playersToAdd = newPlayerIds.filter(id => !existingPlayerIds.includes(id));
  
  if (isUpdate) {
    logger.info(`User ${args.userId} is updating picks for game ${args.gameId}: removing ${playersToRemove.length}, adding ${playersToAdd.length}`);
  }
  
  // Remove user from athletes no longer picked
  for (const athleteId of playersToRemove) {
    const athleteGameStatsRef = db.collection('gamePicks').doc(args.gameId).collection('athletes').doc(athleteId);
    batch.set(athleteGameStatsRef, {
      userIds: admin.firestore.FieldValue.arrayRemove(args.userId),
      lastUpdated: timestamp,
    }, { merge: true });
  }


  // Store user's picks: gamePicks/{gameId}/users/{userId}
  batch.set(userPickRef, {
    userId: args.userId,
    gameId: args.gameId,
    players: players.map(p => ({
      id: p.id,
      displayName: p.displayName || p.shortName,
      shortName: p.shortName,
      position: p.position?.abbreviation,
      jersey: p.jersey,
      headshot: p.headshot,
      team: p.team,
    })),
    totalScore: args.picksState.totalScore || 0,
    lockedAt: args.picksState.lockedAt,
    homeTeamId: args.homeTeamId,
    awayTeamId: args.awayTeamId,
    timestamp,
  });

  // Update stats for each athlete picked
  for (const player of players) {
    if (!player.id) continue;

    const athleteId = player.id;
    
    // Only update if this is a new pick (not already picked by this user)
    if (!playersToAdd.includes(athleteId)) {
      continue; // Player was already picked, skip
    }
    
    // Update athlete stats for this game: gamePicks/{gameId}/athletes/{athleteId}
    const athleteGameStatsRef = db.collection('gamePicks').doc(args.gameId).collection('athletes').doc(athleteId);
    batch.set(athleteGameStatsRef, {
      athleteId: athleteId,
      gameId: args.gameId,
      displayName: player.displayName || player.shortName,
      shortName: player.shortName,
      position: player.position?.abbreviation,
      jersey: player.jersey,
      headshot: player.headshot,
      team: player.team,
      userIds: admin.firestore.FieldValue.arrayUnion(args.userId),
      lastUpdated: timestamp,
    }, { merge: true });

    // Update athlete's all-time profile: athletes/{athleteId}
    const athleteRef = db.collection('athletes').doc(athleteId);
    const athleteDoc = await athleteRef.get();
    const needsBio = !athleteDoc.exists || !athleteDoc.data()?.bio;
    
    let athleteBio = null;
    if (needsBio) {
      athleteBio = await fetchAthleteBio(athleteId);
      logger.info(`Fetched bio for athlete ${athleteId}`);
    }

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
  }

  // Update game metadata: gamePicks/{gameId}/metadata/stats
  const gameMetadataRef = db.collection('gamePicks').doc(args.gameId).collection('metadata').doc('stats');
  const metadataUpdate: any = {
    gameId: args.gameId,
    homeTeamId: args.homeTeamId,
    awayTeamId: args.awayTeamId,
    lastUpdated: timestamp,
  };
  
  // Only increment totalUsers if this is a new user (not an update)
  if (!isUpdate) {
    metadataUpdate.totalUsers = admin.firestore.FieldValue.increment(1);
  }
  
  batch.set(gameMetadataRef, metadataUpdate, { merge: true });

  // Commit the batch
  await batch.commit();

  logger.info(`Successfully saved ${players.length} picks for user ${args.userId} in game ${args.gameId}`);

  return { 
    id: args.gameId,
    playersCount: players.length,
    userId: args.userId
  };
}

/**
 * Get all picks a user made for a specific game
 * Returns the user's player selections and metadata
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
 * Get all athlete pick statistics for a specific game
 * Returns pick counts and percentages for each athlete
 */
export async function getAthleteStatsForGame(gameId: string) {
  const db = admin.firestore();
  
  // Get all athlete stats for this game
  const athletesSnapshot = await db.collection('gamePicks')
    .doc(gameId)
    .collection('athletes')
    .get();

  // Get total users who made picks
  const metadataRef = db.collection('gamePicks').doc(gameId).collection('metadata').doc('stats');
  const metadataDoc = await metadataRef.get();
  const totalUsers = metadataDoc.exists ? metadataDoc.data()?.totalUsers || 0 : 0;

  // Build stats array with percentages
  const athleteStats = athletesSnapshot.docs.map(doc => {
    const data = doc.data();
    const pickCount = data.userIds?.length || 0;
    const percentage = totalUsers > 0 ? (pickCount / totalUsers) * 100 : 0;

    return {
      athleteId: data.athleteId,
      displayName: data.displayName,
      shortName: data.shortName,
      position: data.position,
      jersey: data.jersey,
      headshot: data.headshot,
      team: data.team,
      pickCount,
      percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal place
    };
  });

  logger.info(`Retrieved stats for ${athleteStats.length} athletes in game ${gameId}`);

  return {
    gameId,
    totalUsers,
    athletes: athleteStats,
  };
}
