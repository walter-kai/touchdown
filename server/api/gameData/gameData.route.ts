import express from 'express';
import { getGameDataDoc } from './gameData.controller';

const router = express.Router();

// GET /api/game-data/:league/:gameId
router.get('/:league/:gameId', getGameDataDoc);

export default router;
