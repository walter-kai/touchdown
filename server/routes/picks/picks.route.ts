import express from 'express';
import { authenticate } from '../../middleware/auth';
import { postPick, getUserPicks, getGameStats } from './picks.controller';

const router = express.Router();

// POST /api/picks
router.post('/', authenticate, postPick);

// GET /api/picks/game/:gameId/user - Get user's picks for a game
router.get('/game/:gameId/user', authenticate, getUserPicks);

// GET /api/picks/game/:gameId/stats - Get athlete pick stats for a game
router.get('/game/:gameId/stats', getGameStats);

export default router;
