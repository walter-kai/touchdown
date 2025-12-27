import { Request, Response } from 'express';
import catchAsync from '../../utils/catch-async';
import ApiError from '../../utils/api-error';
import { createPick, getUserPicksForGame, getAllPicksForGame, getLatestUserPick, getUserPickHistory, calculateAthleteScores, getAllUserPicksAcrossGames, getAllUserPicksWithScores } from './picks.service';

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

  if (!user?.email) {
    throw new ApiError(400, 'Missing user email from token');
  }
  if (!gameId) {
    throw new ApiError(400, 'Missing gameId parameter');
  }

  try {
    // Backend returns empty scores - client will calculate from playLog
    // This tells the frontend: "use your client-side calculation"
    const emptyScores = {
      gameScores: {},
      sessionScores: {},
      userScores: {},
      totalScore: 0
    };

    return res.status(200).json({
      ok: true,
      ...emptyScores,
      espnAvailable: false
    });
  } catch (error: any) {
    console.error(`[Scoring] Error in getScores for game ${gameId}:`, error);
    throw new ApiError(500, `Failed to get scores: ${error.message}`);
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

// GET /picks/user/all-for-dashboard - FAST endpoint for dashboard (NO ESPN CALLS)
// Returns stored totalScore from picks without fetching ESPN play-by-play data
export const getAllUserPicksForDashboard = catchAsync(async (req: Request, res: Response) => {
  const { user } = req as any;

  if (!user?.email) {
    throw new ApiError(400, 'Missing user email from token');
  }

  // Get all user picks from Firebase (fast - single collection read)
  const userPicks = await getAllUserPicksAcrossGames(user.email);

  // Transform to dashboard format with stored totalScore (no ESPN API calls!)
  const dashboardGames = userPicks.map((game: any) => {
    const latestPick = game.picks[game.picks.length - 1];
    const totalScore = Number(latestPick?.totalScore || 0);

    return {
      gameId: game.gameId,
      picks: game.picks,
      lastUpdated: game.lastUpdated,
      totalPicks: game.totalPicks,
      teamData: game.teamData,
      teamLogos: game.teamLogos,
      scores: {
        gameScores: {},
        sessionScores: {},
        userScores: {},
        totalScore // ✅ From stored data, NO ESPN API call!
      }
    };
  });

  console.log(`[Dashboard] Returning ${dashboardGames.length} games with stored scores (NO ESPN API calls)`);
  return res.status(200).json({ ok: true, games: dashboardGames });
});

// GET /picks/user/all-with-scores - Legacy endpoint; now returns stored totals without ESPN calls
export const getAllUserPicksWithScoresController = catchAsync(async (req: Request, res: Response) => {
  const { user } = req as any;

  if (!user?.email) {
    throw new ApiError(400, 'Missing user email from token');
  }

  // No ESPN Summary calls; return picks with empty play logs (frontend will enhance if needed)
  const noopPlayFetcher = async () => ({ plays: [] });

  const userPicksWithScores = await getAllUserPicksWithScores(user.email, noopPlayFetcher);

  return res.status(200).json({ ok: true, games: userPicksWithScores });
});
