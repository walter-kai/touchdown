import express from 'express';
import * as leaderboardController from './leaderboard.controller';

const router = express.Router();

router.get('/', leaderboardController.getLeaderboard);

export default router;
