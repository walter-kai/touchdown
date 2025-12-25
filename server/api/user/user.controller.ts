import { Request, Response, NextFunction } from 'express';
import { getUserProfile, updateUserProfile, checkUsernameAvailability, setDisplayName } from './user.service';
import catchAsync from '../../utils/catch-async';
import ApiError from '../../utils/api-error';

/**
 * GET /user/profile
 * Get current user's profile
 */
export const getProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const uid = (req as any).user?.uid;

  if (!uid) {
    throw new ApiError(401, 'Not authenticated');
  }

  const user = await getUserProfile(uid);

  return res.status(200).json({
    success: true,
    user
  });
});

/**
 * PUT /user/profile
 * Update current user's profile
 */
export const updateProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const uid = (req as any).user?.uid;

  if (!uid) {
    throw new ApiError(401, 'Not authenticated');
  }

  const user = await updateUserProfile(uid, req.body);

  return res.status(200).json({
    success: true,
    user
  });
});

/**
 * GET /user/checkName
 * Check if username is available
 */
export const checkUsername = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { username } = req.query;
  const uid = (req as any).user?.uid;

  if (!username || typeof username !== 'string') {
    throw new ApiError(400, 'Username is required');
  }

  const result = await checkUsernameAvailability(username, uid);

  return res.status(200).json({
    success: true,
    ...result
  });
});

/**
 * PUT /user/display-name
 * Set display name (one-time only)
 */
export const updateDisplayName = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const uid = (req as any).user?.uid;
  const email = (req as any).user?.email;
  const { displayName } = req.body;

  if (!uid || !email) {
    throw new ApiError(401, 'Not authenticated');
  }

  if (!displayName || typeof displayName !== 'string') {
    throw new ApiError(400, 'Display name is required');
  }

  if (displayName.trim().length < 2 || displayName.trim().length > 50) {
    throw new ApiError(400, 'Display name must be between 2 and 50 characters');
  }

  const user = await setDisplayName(email, displayName.trim());

  return res.status(200).json({
    success: true,
    user
  });
});
