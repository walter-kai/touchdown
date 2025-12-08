import express from 'express';
import * as playByPlayController from './playbyplay.controller';

const router = express.Router();

/**
 * @route   GET /api/playbyplay/active
 * @desc    Get all active games with play-by-play data
 * @access  Public
 */
router.get('/active', playByPlayController.getActiveGames);

/**
 * @route   GET /api/playbyplay/:gameId
 * @desc    Get play-by-play data for a specific game
 * @access  Public
 */
router.get('/:gameId', playByPlayController.getGamePlayByPlay);

export default router;
