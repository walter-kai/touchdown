import { Request, Response } from 'express';
import catchAsync from '../../utils/catch-async';
import ApiError from '../../utils/api-error';
import { createPick, getUserPicksForGame, getAthleteStatsForGame } from './picks.service';

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

  const stats = await getAthleteStatsForGame(gameId);

  return res.status(200).json({ ok: true, stats });
});
