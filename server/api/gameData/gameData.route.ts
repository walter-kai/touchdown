import express from 'express';
import { getGameDataDoc } from './gameData.controller';
import { detectLeague } from './detectLeague.controller';

const router = express.Router();

// GET /api/game-data/detect/:gameId
router.get('/detect/:gameId', detectLeague);

// GET /api/game-data/:league/:gameId
router.get('/:league/:gameId', getGameDataDoc);

export default router;
