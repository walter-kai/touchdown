import express from 'express';
import { getProfile, updateProfile, checkUsername } from './user.controller';
import { authenticate } from '../../auth/middleware/auth';

const router = express.Router();

/**
 * GET /user/profile
 * Get current user's profile
 */
router.get('/profile', authenticate, getProfile);

/**
 * PUT /user/profile
 * Update current user's profile
 */
router.put('/profile', authenticate, updateProfile);

/**
 * GET /user/checkName
 * Check if username is available
 */
router.get('/checkName', checkUsername);

// Remove legacy picks subroutes; picks now lives under /api/picks

export default router;
