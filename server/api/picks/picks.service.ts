import admin from '../../utils/firebase';
import logger from '../../utils/logger';

type CreatePickArgs = {
  userId: string; // email address
  displayName: string;
  homeTeamId?: string;
  awayTeamId?: string;
  picksState?: {
    players?: any[];
    totalScore?: number;
    lockedAt?: number | string | null; // Can be epoch milliseconds or ISO string
    playerHistory?: Record<string, Array<{ start: number | string; end?: number | string }>>; // Can be epoch milliseconds or ISO string
    teamLogos?: {
      awayLogo: string;
      homeLogo: string;
    };
    teamData?: {
      league: 'nba' | 'nfl';
      homeTeam: {
        name: string;
        abbreviation: string;
      };
      awayTeam: {
        name: string;
        abbreviation: string;
      };
    };
  };
  gameId?: string;
  selection?: string;
  multiplier?: number;
};

/**
 * Create picks using SINGLE COLLECTION structure with composite doc IDs
 * 
 * NEW Structure:
 * picks/{gameId}:{displayName}
 *   - email: string
 *   - displayName: string
 *   - gameId: string
 *   - picks: PickSubmission[]
 *   - timestamp: last update
 *   - teamData: {league, team info}
 * 
 * users/{email}
 *   - gameIds: [array of game IDs user has picks in]
 *   - totalScore, gamesPlayed: leaderboard aggregates
 *   - [other user data]
 * 
 * This allows:
 * 1. Game leaderboard: picks.where('gameId', '==', gameId) (one query)
 * 2. User history: picks.where('email', '==', email) (one query)
 * 3. Single pick: picks.doc(`${gameId}:${displayName}`)
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

  // NEW STRUCTURE: picks/{gameId}:{displayName}
  const docId = `${args.gameId}:${args.displayName}`;
  const pickRef = db.collection('picks').doc(docId);

  // Update in a batch for atomicity
  const batch = db.batch();

  // Prepare the document update with email, displayName and gameId fields
  const docUpdate: any = {
    email: args.userId,
    displayName: args.displayName,
    gameId: args.gameId,
    picks: admin.firestore.FieldValue.arrayUnion(newPick),
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Add team data if provided (includes league, team names, and logos)
  if (args.picksState.teamData) {
    docUpdate.teamData = args.picksState.teamData;
  } 
  // Fallback: support legacy teamLogos format
  else if (args.picksState.teamLogos) {
    docUpdate.teamLogos = {
      awayLogo: args.picksState.teamLogos.awayLogo,
      homeLogo: args.picksState.teamLogos.homeLogo
    };
  }

  // Update the picks document
  batch.set(pickRef, docUpdate, { merge: true });

  // Update the user document with gameIds array (if not already present)
  const userRef = db.collection('users').doc(args.userId);
  batch.set(userRef, {
    gameIds: admin.firestore.FieldValue.arrayUnion(args.gameId),
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  await batch.commit();

  logger.info(`Successfully saved ${players.length} picks for user ${args.userId} in game ${args.gameId}`);

  return { 
    id: args.gameId,
    playersCount: players.length,
    userId: args.userId,
    displayName: args.displayName
  };
}

/**
 * Get all picks a user made for a specific game
 * Returns the user's pick array with all submissions
 */
export async function getUserPicksForGame(email: string, gameId: string, displayName: string) {
  const db = admin.firestore();
  const docId = `${gameId}:${displayName}`;
  const pickDoc = await db.collection('picks').doc(docId).get();

  if (!pickDoc.exists) {
    logger.info(`No picks found for user ${email} in game ${gameId}`);
    return null;
  }

  const data = pickDoc.data();
  
  return {
    picks: (data?.picks || []).map((pick: any) => ({
      ...pick,
      timestamp: pick.timestamp?.toDate ? pick.timestamp.toDate().toISOString() : pick.timestamp
    })),
    lastUpdated: data?.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data?.timestamp,
    totalPicks: data?.picks?.length || 0
  };
}

/**
 * Get all picks for a specific game (from all users)
 * Uses simple collection query to find all picks for this game
 */
export async function getAllPicksForGame(gameId: string) {
  const db = admin.firestore();
  
  // Query picks collection by gameId
  const picksQuery = db.collection('picks').where('gameId', '==', gameId);
  const picksSnapshot = await picksQuery.get();

  const allPicks = picksSnapshot.docs.map(doc => {
    const data = doc.data();
    
    return {
      email: data?.email || 'unknown',
      displayName: data?.displayName || 'Unknown',
      picks: (data?.picks || []).map((pick: any) => ({
        ...pick,
        timestamp: pick.timestamp?.toDate ? pick.timestamp.toDate().toISOString() : pick.timestamp
      })),
      lastUpdated: data?.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data?.timestamp,
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
export async function getLatestUserPick(email: string, gameId: string, displayName: string) {
  const result = await getUserPicksForGame(email, gameId, displayName);
  
  if (!result || !result.picks || result.picks.length === 0) {
    return null;
  }

  // Return the last pick in the array (most recent)
  return result.picks[result.picks.length - 1];
}

/**
 * Get pick history for a user in a specific game
 * Returns all picks ordered by timestamp
 */
export async function getUserPickHistory(email: string, gameId: string, displayName: string) {
  const result = await getUserPicksForGame(email, gameId, displayName);
  
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
export async function calculateAthleteScores(email: string, gameId: string, displayName: string, playLog: any[]) {
  try {
    const result = await getUserPicksForGame(email, gameId, displayName);

    if (!result || !result.picks || result.picks.length === 0) {
      logger.info(`No picks found for user ${email} in game ${gameId}`);
      return { gameScores: {}, sessionScores: {}, userScores: {}, totalScore: 0 };
    }

    const picks = result.picks;

    // Get the latest pick (current session)
    const latestPick = picks[picks.length - 1];
    logger.info(`[Scoring] All picks for game:`, picks.map((p: any, i: any) => ({ 
      index: i, 
      timestamp: p.timestamp,
      playerCount: p.players?.length 
    })));
    logger.info(`[Scoring] Latest pick timestamp: ${latestPick.timestamp}, now: ${new Date().toISOString()}`);
    const currentPlayers = new Set<string>(latestPick.players.map((p: any) => p.id as string));

    // If we have no play log (e.g., backend no longer calling ESPN summary), fall back to stored totals
    if (!playLog || playLog.length === 0) {
      const totalScore = Number(latestPick?.totalScore || 0);
      const playerIds = Array.from(currentPlayers);
      const perPlayerScore = playerIds.length > 0 ? totalScore / playerIds.length : 0;

      const userScores: Record<string, number> = {};
      playerIds.forEach(pid => {
        userScores[pid] = perPlayerScore;
      });

      logger.info(`Using stored totals for user ${email} in game ${gameId} (no play log). TotalScore=${totalScore}`);
      return {
        gameScores: {},
        sessionScores: { ...userScores },
        userScores,
        totalScore
      };
    }
    
    // Calculate game scores (all plays for each athlete)
    const gameScores: Record<string, number> = {};
    const athletePlayCounts: Record<string, number> = {};
    
    playLog.forEach(play => {
      try {
        // If we have athletesInvolved (normalized plays), use that
        if (play.athletesInvolved && play.athletesInvolved.length > 0) {
          play.athletesInvolved.forEach((athlete: any) => {
            if (athlete?.id) {
              if (!athletePlayCounts[athlete.id]) athletePlayCounts[athlete.id] = 0;
              athletePlayCounts[athlete.id]++;
            }
          });
        }
        // If we have raw ESPN plays, they'll just count as 1 play and we can't attribute to specific athletes
        // This is fine for gameScores - we'll just have 0 for game scores from raw ESPN plays
      } catch (err) {
        logger.warn(`Error processing play for scoring: ${err}`);
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
      
      try {
        const lockTimeMs = new Date(latestPick.timestamp).getTime();
        logger.info(`[Scoring] Lock time: ${new Date(lockTimeMs).toISOString()}`);
        
        // Count plays that happened AFTER the pick was locked
        playLog.forEach(play => {
          try {
            if (!play.athletesInvolved) return;
            
            const hasPlayer = play.athletesInvolved.some((a: any) => a?.id === playerId);
            if (!hasPlayer) return;
            
            // Use wallclock (ESPN format) or timestamp (normalized format)
            const playTimeStr = play.wallclock || play.timestamp;
            const playTime = new Date(playTimeStr).getTime();
            
            // Check if play happened after lock time
            if (playTime >= lockTimeMs) {
              sessionScores[playerId]++;
            }
          } catch (err) {
            // Skip plays with invalid timestamps
          }
        });
        
        logger.info(`[Scoring] ${playerId} session score: ${sessionScores[playerId]} plays after lock`);
      } catch (err) {
        logger.warn(`Error calculating session score for player ${playerId}: ${err}`);
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

  logger.info(`Calculated scores for user ${email} in game ${gameId}: ${Object.keys(gameScores).length} athletes, total score: ${totalScore}`);

  return {
    gameScores,
    sessionScores,
    userScores,
    totalScore
  };
  } catch (error) {
    logger.error(`Error calculating athlete scores for user ${email} in game ${gameId}: ${error}`);
    // Return empty scores on error rather than throwing
    return { gameScores: {}, sessionScores: {}, userScores: {}, totalScore: 0 };
  }
}

/**
 * Get all picks for a user across all games
 * Single query using email index
 */
export async function getAllUserPicksAcrossGames(email: string) {
  const db = admin.firestore();
  
  try {
    // Query picks collection by email
    const picksQuery = db.collection('picks').where('email', '==', email);
    const picksSnapshot = await picksQuery.get();
    
    if (picksSnapshot.empty) {
      logger.info(`No picks found for user ${email}`);
      return [];
    }
    
    const allGamesData: Array<{
      gameId: string;
      picks: any[];
      lastUpdated: string | null;
      totalPicks: number;
    }> = picksSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        gameId: data?.gameId || '',
        picks: (data?.picks || []).map((pick: any) => ({
          ...pick,
          timestamp: pick.timestamp?.toDate ? pick.timestamp.toDate().toISOString() : pick.timestamp
        })),
        lastUpdated: data?.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data?.timestamp,
        totalPicks: data?.picks?.length || 0
      };
    });
    
    logger.info(`Retrieved picks from ${allGamesData.length} games for user ${email}`);
    
    return allGamesData;
  } catch (error) {
    logger.error(`Error fetching all user picks for ${email}: ${error}`);
    throw error;
  }
}

/**
 * Get all user picks with scores calculated for each game
 * OPTIMIZED: Single query for all picks, then calculates scores in memory
 */
export async function getAllUserPicksWithScores(
  email: string,
  displayName: string,
  getPlayByPlayFn: (gameId: string, meta?: any) => Promise<any>
) {
  const db = admin.firestore();
  
  try {
    // Get the user document with gameIds
    const userRef = db.collection('users').doc(email);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      logger.info(`No picks found for user ${email}`);
      return [];
    }
    
    const userData = userDoc.data();
    const gameIds = userData?.gameIds || [];
    
    if (gameIds.length === 0) {
      logger.info(`User ${email} has no game picks`);
      return [];
    }

    // Process all games in parallel
    const gamesWithScores = await Promise.all(
      gameIds.map(async (gameId: string) => {
        try {
          // Get user's picks for this game
          const docId = `${gameId}:${displayName}`;
          const pickDoc = await db.collection('picks').doc(docId).get();
          
          if (!pickDoc.exists) {
            return null;
          }
          
          const data = pickDoc.data();
          const picks = data?.picks || [];

          // Get play-by-play data for score calculation
          const playByPlayData = await getPlayByPlayFn(gameId, data?.teamData);

          if (!playByPlayData || !playByPlayData.plays) {
            logger.warn(`No play-by-play data for game ${gameId}`);
            return {
              gameId,
              picks: picks.map((pick: any) => ({
                ...pick,
                timestamp: pick.timestamp?.toDate ? pick.timestamp.toDate().toISOString() : pick.timestamp
              })),
              lastUpdated: data?.timestamp?.toDate ? data.timestamp.toDate().toISOString() : null,
              totalPicks: picks.length,
              scores: { gameScores: {}, sessionScores: {}, userScores: {}, totalScore: 0 },
              teamData: data?.teamData,
            };
          }

          // Calculate scores using the same logic
          const scores = await calculateAthleteScoresFromPicks(picks, playByPlayData.plays, email, gameId);

          return {
            gameId,
            picks: picks.map((pick: any) => ({
              ...pick,
              timestamp: pick.timestamp?.toDate ? pick.timestamp.toDate().toISOString() : pick.timestamp
            })),
            lastUpdated: data?.timestamp?.toDate ? data.timestamp.toDate().toISOString() : null,
            totalPicks: picks.length,
            scores,
            teamData: data?.teamData
          };
        } catch (error) {
          logger.error(`Error calculating scores for game ${gameId}: ${error}`);
          return {
            gameId: gameId,
            picks: [],
            lastUpdated: null,
            totalPicks: 0,
            scores: { gameScores: {}, sessionScores: {}, userScores: {}, totalScore: 0 },
            teamData: undefined
          };
        }
      })
    );

    // Filter out null entries (games where user has no picks)
    const filteredGames = gamesWithScores.filter(g => g !== null);
    
    logger.info(`Retrieved picks with scores from ${filteredGames.length} games for user ${email}`);
    
    return filteredGames;
  } catch (error) {
    logger.error(`Error fetching all user picks with scores for ${email}: ${error}`);
    throw error;
  }
}

/**
 * Helper function to calculate scores from picks data (used by both endpoints)
 */
async function calculateAthleteScoresFromPicks(picks: any[], playLog: any[], email: string, gameId: string) {
  if (picks.length === 0) {
    return { gameScores: {}, sessionScores: {}, userScores: {}, totalScore: 0 };
  }

  // If no play-by-play is available (old games / ESPN 404), fall back to stored pick total
  if (!playLog || playLog.length === 0) {
    const latestPick = picks[picks.length - 1];
    const storedTotal = Number(latestPick?.totalScore || 0);
    const userScores: Record<string, number> = {};
    // We cannot allocate per-athlete without plays; keep per-athlete zero but surface total for dashboard
    latestPick?.players?.forEach((p: any) => {
      if (p?.id) userScores[p.id] = 0;
    });

    logger.info(`No play log for game ${gameId}, using stored totalScore=${storedTotal} for user ${email}`);
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
    
    if (!latestPick.timestamp) {
      logger.warn(`No timestamp found for latest pick in session score calculation`);
      return;
    }
    
    const lockTimeMs = new Date(latestPick.timestamp).getTime();
    
    playLog.forEach(play => {
      if (!play.athletesInvolved) return;
      
      const hasPlayer = play.athletesInvolved.some((a: any) => a.id === playerId);
      if (!hasPlayer) return;
      
      const playTime = new Date(play.timestamp).getTime();
      
      if (playTime >= lockTimeMs) {
        sessionScores[playerId]++;
      }
    });
  });

  // Calculate user scores (accumulated across all sessions)
  const userScores: Record<string, number> = {};
  const allUserPlayers = new Set<string>();
  picks.forEach((pick: any) => {
    pick.players.forEach((p: any) => allUserPlayers.add(p.id));
  });
  
  allUserPlayers.forEach(playerId => {
    userScores[playerId] = 0;
    
    const allLockPeriods: Array<{ start: number; end?: number }> = [];
    
    picks.forEach((pick: any, pickIndex: number) => {
      const isInPick = pick.players.some((p: any) => p.id === playerId);
      if (!isInPick) return;
      
      if (pick.playerHistory && pick.playerHistory[playerId]) {
        pick.playerHistory[playerId].forEach((period: any) => {
          allLockPeriods.push({
            start: new Date(period.start).getTime(),
            end: period.end ? new Date(period.end).getTime() : undefined
          });
        });
      }
      
      if (pick.timestamp) {
        const nextPick = picks[pickIndex + 1];
        let endTime: number | undefined = undefined;
        
        if (nextPick) {
          const isInNextPick = nextPick.players.some((p: any) => p.id === playerId);
          if (!isInNextPick && nextPick.timestamp) {
            endTime = new Date(nextPick.timestamp).getTime();
          }
        }
        
        allLockPeriods.push({
          start: new Date(pick.timestamp).getTime(),
          end: endTime
        });
      }
    });
    
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

  logger.info(`Calculated scores for user ${email} in game ${gameId}: ${Object.keys(gameScores).length} athletes, total score: ${totalScore}`);

  return {
    gameScores,
    sessionScores,
    userScores,
    totalScore
  };
}
