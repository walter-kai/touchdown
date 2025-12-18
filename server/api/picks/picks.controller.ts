import { Request, Response } from 'express';
import catchAsync from '../../utils/catch-async';
import ApiError from '../../utils/api-error';
import { createPick, getUserPicksForGame, getAllPicksForGame, getLatestUserPick, getUserPickHistory, calculateAthleteScores, getAllUserPicksAcrossGames } from './picks.service';
import { getGamePlayByPlay } from '../playbyplay/playbyplay.service';

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

  // Get play-by-play data
  const playByPlay = await getGamePlayByPlay(gameId);
  
  if (!playByPlay) {
    throw new ApiError(404, 'Play-by-play data not found for this game');
  }

  const scores = await calculateAthleteScores(user.email, gameId, playByPlay.plays);

  return res.status(200).json({ ok: true, ...scores });
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
