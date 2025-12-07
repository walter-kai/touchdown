import express from 'express';
import { authenticateGoogle, initiateGoogleLogin, googleCallback, testLogin } from './auth.controller';

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

/**
 * GET /test
 * Auto-login for testing (development only)
 */
router.get('/test', testLogin);

export default router;
