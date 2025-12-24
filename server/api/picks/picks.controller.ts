import { Request, Response } from 'express';
import catchAsync from '../../utils/catch-async';
import ApiError from '../../utils/api-error';
import { createPick, getUserPicksForGame, getAllPicksForGame, getLatestUserPick, getUserPickHistory, calculateAthleteScores, getAllUserPicksAcrossGames, getAllUserPicksWithScores } from './picks.service';
import axios from 'axios';

// POST /picks
export const postPick = catchAsync(async (req: Request, res: Response) => {
  const { user } = req as any;
  const { homeTeamId, awayTeamId, picksState, gameId, selection, multiplier } = req.body;

  if (!user?.email) {
    throw new ApiError(400, 'Missing user email from token');
  }
  if (!picksState && !selection) {
    throw new ApiError(400, 'Missing pick payload: provide `picksState` or `selection`');
  }

  const result = await createPick({
    userId: user.email,
    homeTeamId,
    awayTeamId,
    picksState,
    gameId,
    selection,
    multiplier,
  });

  return res.status(200).json({ ok: true, id: result.id, collection: 'picks' });
});

// GET /picks/game/:gameId/user
export const getUserPicks = catchAsync(async (req: Request, res: Response) => {
  const { user } = req as any;
  const { gameId } = req.params;

  if (!user?.email) {
    throw new ApiError(400, 'Missing user email from token');
  }
  if (!gameId) {
    throw new ApiError(400, 'Missing gameId parameter');
  }

  const picks = await getUserPicksForGame(user.email, gameId);

  return res.status(200).json({ ok: true, picks });
});

// GET /picks/game/:gameId/stats
export const getGameStats = catchAsync(async (req: Request, res: Response) => {
  const { gameId } = req.params;

  if (!gameId) {
    throw new ApiError(400, 'Missing gameId parameter');
  }

  const allPicks = await getAllPicksForGame(gameId);

  return res.status(200).json({ ok: true, picks: allPicks, totalUsers: allPicks.length });
});

// GET /picks/game/:gameId/user/latest
export const getLatestPick = catchAsync(async (req: Request, res: Response) => {
  const { user } = req as any;
  const { gameId } = req.params;

  if (!user?.email) {
    throw new ApiError(400, 'Missing user email from token');
  }
  if (!gameId) {
    throw new ApiError(400, 'Missing gameId parameter');
  }

  const latestPick = await getLatestUserPick(user.email, gameId);

  return res.status(200).json({ ok: true, pick: latestPick });
});

// GET /picks/game/:gameId/user/history
export const getPickHistory = catchAsync(async (req: Request, res: Response) => {
  const { user } = req as any;
  const { gameId } = req.params;

  if (!user?.email) {
    throw new ApiError(400, 'Missing user email from token');
  }
  if (!gameId) {
    throw new ApiError(400, 'Missing gameId parameter');
  }

  const history = await getUserPickHistory(user.email, gameId);

  return res.status(200).json({ ok: true, history, totalPicks: history.length });
});

// GET /picks/game/:gameId/user/scores
export const getScores = catchAsync(async (req: Request, res: Response) => {
  const { user } = req as any;
  const { gameId } = req.params;
  const { league = 'nfl' } = req.query; // Default to NFL

  if (!user?.email) {
    throw new ApiError(400, 'Missing user email from token');
  }
  if (!gameId) {
    throw new ApiError(400, 'Missing gameId parameter');
  }

  // Helper function to extract athlete ID from ESPN $ref URL
  const extractAthleteIdFromRef = (ref?: string): string => {
    if (!ref || typeof ref !== 'string') return '';
    const sanitized = ref.split('?')[0];
    const parts = sanitized.split('/').filter(Boolean);
    return parts[parts.length - 1] || '';
  };

  // Get play-by-play data from ESPN Summary API
  // Note: The sports.core.api.espn.com/plays endpoint doesn't work reliably
  // Use the summary endpoint which has plays data directly
  const sport = league === 'nba' ? 'basketball' : 'football';
  const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/summary?event=${gameId}`;
  
  let plays: any[] = [];
  let espnAvailable = false;

  try {
    const response = await axios.get(summaryUrl);
    const summaryData = response.data;
    
    // If plays available, transform them
    if (summaryData?.plays && summaryData.plays.length > 0) {
      plays = summaryData.plays.map((play: any) => {
        // Extract athlete IDs from participants
        const athletesInvolved = (play.participants || [])
          .map((p: any) => {
            // ESPN API returns athlete as a $ref URL, need to extract the ID
            const athleteId = p.athlete?.id || extractAthleteIdFromRef(p.athlete?.$ref);
            if (!athleteId) return null;
            
            return {
              id: athleteId,
              displayName: play.text // Use play text for now, could fetch athlete details if needed
            };
          })
          .filter(Boolean); // Remove null entries

        return {
          ...play,
          athletesInvolved,
          timestamp: play.wallclock || new Date().toISOString(),
          quarter: play.period?.number || 0,
          clock: play.clock?.displayValue || '0:00'
        };
      });
      
      console.log(`[Scoring] Fetched ${plays.length} plays for game ${gameId}`);
      console.log(`[Scoring] Sample play athletes:`, plays[0]?.athletesInvolved?.map((a: any) => a.id));
      espnAvailable = true;
    }
  } catch (error: any) {
    // Log different error types appropriately
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.log(`[Scoring] Game ${gameId} not found in ESPN API (404) - likely an old game, calculating scores from stored picks only`);
    } else if (axios.isAxiosError(error)) {
      console.warn(`[Scoring] ESPN API error for game ${gameId}:`, error.message);
    } else {
      console.error(`[Scoring] Unexpected error fetching ESPN data:`, error);
    }
    // Continue with empty plays array
  }

  // Always calculate scores, even with empty plays array
  // This allows us to return the user's picks and accumulated scores
  try {
    const scores = await calculateAthleteScores(user.email, gameId, plays);
    
    console.log(`[Scoring] Returning scores for game ${gameId}:`, {
      gameScoresCount: Object.keys(scores.gameScores).length,
      sessionScoresCount: Object.keys(scores.sessionScores).length,
      userScoresCount: Object.keys(scores.userScores).length,
      totalScore: scores.totalScore,
      sampleGameScores: Object.entries(scores.gameScores).slice(0, 3)
    });
    
    return res.status(200).json({ 
      ok: true, 
      ...scores,
      espnAvailable // Include flag so frontend knows if live data is available
    });
  } catch (error: any) {
    console.error(`[Scoring] Error calculating scores for game ${gameId}:`, error);
    throw new ApiError(500, `Failed to calculate scores: ${error.message}`);
  }
});

// GET /picks/user/all
export const getAllUserPicks = catchAsync(async (req: Request, res: Response) => {
  const { user } = req as any;

  if (!user?.email) {
    throw new ApiError(400, 'Missing user email from token');
  }

  const userPicks = await getAllUserPicksAcrossGames(user.email);

  return res.status(200).json({ ok: true, games: userPicks });
});

// GET /picks/user/all-with-scores - OPTIMIZED endpoint for dashboard
export const getAllUserPicksWithScoresController = catchAsync(async (req: Request, res: Response) => {
  const { user } = req as any;
  const { league = 'nfl' } = req.query; // Default to NFL

  if (!user?.email) {
    throw new ApiError(400, 'Missing user email from token');
  }

  // Helper to normalize athlete id from ESPN $ref or direct id
  const extractAthleteIdFromRef = (ref?: string): string => {
    if (!ref || typeof ref !== 'string') return '';
    const sanitized = ref.split('?')[0];
    const parts = sanitized.split('/').filter(Boolean);
    return parts[parts.length - 1] || '';
  };

  // Create a function that fetches play-by-play from ESPN Summary API
  const getPlayByPlayFromESPN = async (gameId: string, meta?: any) => {
    const gameLeague = meta?.teamData?.league || league;
    const sport = gameLeague === 'nba' ? 'basketball' : 'football';
    const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${gameLeague}/summary?event=${gameId}`;
    
    try {
      const response = await axios.get(summaryUrl);
      const summaryData = response.data;
      
      if (!summaryData?.plays || summaryData.plays.length === 0) {
        return { plays: [] };
      }

      // Transform plays to expected format with athletesInvolved
      const plays = summaryData.plays.map((play: any) => {
        const athletesInvolved = (play.participants || [])
          .map((p: any) => {
            const athleteId = p.athlete?.id || extractAthleteIdFromRef(p.athlete?.$ref);
            if (!athleteId) return null;
            return { id: athleteId, displayName: play.text };
          })
          .filter(Boolean);

        return {
          ...play,
          athletesInvolved,
          timestamp: play.wallclock || new Date().toISOString(),
          quarter: play.period?.number || 0,
          clock: play.clock?.displayValue || '0:00'
        };
      });

      return { plays };
    } catch (error) {
      console.error(`Error fetching plays for game ${gameId}:`, error);
      return { plays: [] };
    }
  };

  const userPicksWithScores = await getAllUserPicksWithScores(user.email, getPlayByPlayFromESPN);

  return res.status(200).json({ ok: true, games: userPicksWithScores });
});
