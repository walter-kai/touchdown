import { Request, Response, NextFunction } from 'express';
import catchAsync from '../../utils/catch-async';
import ApiError from '../../utils/api-error';
import * as playByPlayService from './playbyplay.service';

/**
 * Get play-by-play data for a specific game
 */
export const getGamePlayByPlay = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { gameId } = req.params;
  
  if (!gameId) {
    throw new ApiError(400, 'Game ID is required');
  }

  const playByPlayData = await playByPlayService.getGamePlayByPlay(gameId);
  
  if (!playByPlayData) {
    throw new ApiError(404, 'Play-by-play data not found for this game');
  }

  return res.status(200).json(playByPlayData);
});

/**
 * Get all active games with play-by-play data
 */
export const getActiveGames = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const activeGames = await playByPlayService.getActiveGames();
  return res.status(200).json(activeGames);
});
