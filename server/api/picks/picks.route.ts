import express from 'express';
import { authenticate } from '../../auth/middleware/auth';
import { postPick, getUserPicks, getGameStats, getLatestPick, getPickHistory, getScores } from './picks.controller';

const router = express.Router();

// POST /api/picks
router.post('/', authenticate, postPick);

// GET /api/picks/game/:gameId/user - Get all user's picks for a game
router.get('/game/:gameId/user', authenticate, getUserPicks);

// GET /api/picks/game/:gameId/user/latest - Get user's latest pick for a game
router.get('/game/:gameId/user/latest', authenticate, getLatestPick);

// GET /api/picks/game/:gameId/user/history - Get user's pick history for a game
router.get('/game/:gameId/user/history', authenticate, getPickHistory);

// GET /api/picks/game/:gameId/user/scores - Get calculated scores for user's picks
router.get('/game/:gameId/user/scores', authenticate, getScores);

// GET /api/picks/game/:gameId/stats - Get athlete pick stats for a game
router.get('/game/:gameId/stats', getGameStats);

export default router;
