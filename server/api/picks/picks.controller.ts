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

  // Get play-by-play data from ESPN Summary API
  // Note: The sports.core.api.espn.com/plays endpoint doesn't work reliably
  // Use the summary endpoint which has plays data directly
  const sport = league === 'nba' ? 'basketball' : 'football';
  const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/summary?event=${gameId}`;
  
  try {
    const response = await axios.get(summaryUrl);
    const summaryData = response.data;
    
    // If no plays available (game hasn't started or no data yet), return empty scores
    if (!summaryData?.plays || summaryData.plays.length === 0) {
      const scores = await calculateAthleteScores(user.email, gameId, []);
      return res.status(200).json({ ok: true, ...scores });
    }

    // Transform plays to expected format with athletesInvolved
    const plays = summaryData.plays.map((play: any) => ({
      ...play,
      athletesInvolved: play.participants?.map((p: any) => ({
        id: p.athlete?.id,
        displayName: play.text // Use play text for now, could fetch athlete details if needed
      })) || [],
      timestamp: play.wallclock || new Date().toISOString(),
      quarter: play.period?.number || 0,
      clock: play.clock?.displayValue || '0:00'
    }));

    const scores = await calculateAthleteScores(user.email, gameId, plays);

    return res.status(200).json({ ok: true, ...scores });
  } catch (error: any) {
    // If ESPN API fails (game not started, network error, etc), return empty scores
    if (axios.isAxiosError(error)) {
      const scores = await calculateAthleteScores(user.email, gameId, []);
      return res.status(200).json({ ok: true, ...scores });
    }
    throw new ApiError(500, `Failed to fetch play-by-play data: ${error.message}`);
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

  // Create a function that fetches play-by-play from ESPN Summary API
  const getPlayByPlayFromESPN = async (gameId: string) => {
    const sport = league === 'nba' ? 'basketball' : 'football';
    const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/summary?event=${gameId}`;
    
    try {
      const response = await axios.get(summaryUrl);
      const summaryData = response.data;
      
      if (!summaryData?.plays || summaryData.plays.length === 0) {
        return { plays: [] };
      }

      // Transform plays to expected format with athletesInvolved
      const plays = summaryData.plays.map((play: any) => ({
        ...play,
        athletesInvolved: play.participants?.map((p: any) => ({
          id: p.athlete?.id,
          displayName: play.text
        })) || [],
        timestamp: play.wallclock || new Date().toISOString(),
        quarter: play.period?.number || 0,
        clock: play.clock?.displayValue || '0:00'
      }));

      return { plays };
    } catch (error) {
      console.error(`Error fetching plays for game ${gameId}:`, error);
      return { plays: [] };
    }
  };

  const userPicksWithScores = await getAllUserPicksWithScores(user.email, getPlayByPlayFromESPN);

  return res.status(200).json({ ok: true, games: userPicksWithScores });
});
