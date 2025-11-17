import { Request, Response, NextFunction } from 'express';
import { authenticateWithMetaMask, authenticateWithSimple } from './auth.service';
import catchAsync from '../../utils/catch-async';
import ApiError from '../../utils/api-error';

interface AuthRequest {
  walletAddress: string;
  signature: string;
  message: string;
}

interface SimpleAuthRequest {
  walletAddress?: string;
  username: string;
  email?: string;
  referralId?: string;
}

/**
 * POST /auth/metamask
 * Authenticate user with MetaMask signature
 */
export const authenticateMetaMask = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { walletAddress, signature, message }: AuthRequest = req.body;

  if (!walletAddress || !signature || !message) {
    throw new ApiError(400, 'Missing required fields: walletAddress, signature, message');
  }

  const result = await authenticateWithMetaMask({ walletAddress, signature, message });

  return res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * POST /auth/simple
 * Authenticate user with simple registration (no wallet required)
 */
export const authenticateSimple = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { walletAddress, username, email, referralId }: SimpleAuthRequest = req.body;

  if (!username || username.length < 3) {
    throw new ApiError(400, 'Username must be at least 3 characters');
  }

  const result = await authenticateWithSimple({ walletAddress, username, email, referralId });

  return res.status(200).json({
    success: true,
    data: result
  });
});
