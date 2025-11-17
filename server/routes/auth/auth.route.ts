import express from 'express';
import { authenticateMetaMask, authenticateSimple } from './auth.controller';

const router = express.Router();

/**
 * POST /auth/metamask
 * Authenticate user with MetaMask signature
 */
router.post('/metamask', authenticateMetaMask);

/**
 * POST /auth/simple
 * Authenticate user with simple registration (no wallet required)
 */
router.post('/simple', authenticateSimple);

export default router;
