import express from 'express';
import { authenticate } from '../../middleware/auth';
import { postPick } from './picks.controller';

const router = express.Router();

// POST /api/picks
router.post('/', authenticate, postPick);

export default router;
