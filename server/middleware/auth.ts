import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import ApiError from '../utils/api-error';

// Extend Express Request to include user info
export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    walletAddress: string;
    authMethod: string;
  };
}

/**
 * JWT Authentication Middleware
 * Verifies JWT token in Authorization header
 */
export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new ApiError(401, 'No token provided');
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret-change-in-production'
    ) as any;

    // Add user info to request
    req.user = {
      uid: decoded.uid,
      walletAddress: decoded.walletAddress,
      authMethod: decoded.authMethod,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, 'Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new ApiError(401, 'Token expired'));
    } else {
      next(error);
    }
  }
};

/**
 * Optional JWT Authentication Middleware
 * Sets user info if token is present, but doesn't require it
 */
export const optionalJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      if (token) {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'fallback-secret-change-in-production'
        ) as any;

        req.user = {
          uid: decoded.uid,
          walletAddress: decoded.walletAddress,
          authMethod: decoded.authMethod,
        };
      }
    }

    next();
  } catch (error) {
    // For optional auth, we don't throw errors, just continue without user
    next();
  }
};
