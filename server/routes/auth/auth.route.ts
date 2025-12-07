import express from 'express';
import { authenticateGoogle, initiateGoogleLogin, googleCallback } from './auth.controller';

const router = express.Router();

/**
 * POST /auth/google
 * Authenticate user with Google ID token
 */
router.post('/google', authenticateGoogle);

/**
 * GET /auth/google/login
 * Initiate Google OAuth flow
 */
router.get('/google/login', initiateGoogleLogin);

/**
 * GET /auth/google/callback
 * Handle Google OAuth callback
 */
router.get('/google/callback', googleCallback);

export default router;
