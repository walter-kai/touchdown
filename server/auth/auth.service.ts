import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import ApiError from '../utils/api-error';
import logger from '../utils/logger';

// Initialize Google OAuth client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_SECRET,
  `${process.env.HOST_URL}/auth/google/callback`
);

export interface AuthResponse {
  accessToken: string;
  user: {
    uid: string;
    walletAddress?: string;
    username: string;
    email: string;
    displayName?: string;
    photoUrl?: string;
    createdAt: Date;
    lastLogin: Date;
    referralId?: string;
    telegramId?: string;
    googleId?: string;
    googleEmail?: string;
    googleName?: string;
    googlePicture?: string;
    isEmailVerified?: boolean;
    locale?: string;
    authMethod?: string;
  };
  expiresIn: number;
}

export interface GoogleAuthRequest {
  idToken: string;
}

/**
 * Authenticate user with Google OAuth
 */
export async function authenticateWithGoogle(authRequest: GoogleAuthRequest): Promise<AuthResponse> {
  const { idToken } = authRequest;

  try {
    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
    if (!payload) {
      throw new ApiError(401, 'Invalid Google token');
    }

    const {
      sub: googleId,
      email,
      name,
      picture,
      email_verified,
      locale
    } = payload;

    if (!email) {
      throw new ApiError(400, 'Email not provided by Google');
    }

    // Use email as the user document ID
    const uid = `google_${googleId}`;
    const userDocRef = admin.firestore().collection('users').doc(email);
    const userDoc = await userDocRef.get();

    let userData;
    const now = new Date();

    if (!userDoc.exists) {
      // Create new user document
      userData = {
        uid,
        email,
        username: name || email.split('@')[0],
        displayName: name || '',
        photoUrl: picture || '',
        isEmailVerified: email_verified || false,
        locale: locale || '',
        authMethod: 'google' as const,
        createdAt: now,
        lastLogin: now,
      };

      await userDocRef.set({
        email,
        authMethod: 'google',
        provider: 'google',
        providerData: {
          uid,
          googleId,
          googleEmail: email,
          googleName: name || '',
          googlePicture: picture || '',
          isEmailVerified: email_verified || false,
          locale: locale || '',
        },
        displayName: name || '',
        photoUrl: picture || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(`New user created with Google auth: ${email}`);
    } else {
      // Update existing user
      const existingData = userDoc.data();
      
      await userDocRef.set({
        email,
        authMethod: 'google',
        provider: 'google',
        providerData: {
          ...(existingData?.providerData || {}),
          uid,
          googleId,
          googleEmail: email,
          googleName: name || existingData?.providerData?.googleName,
          googlePicture: picture || existingData?.providerData?.googlePicture,
          isEmailVerified: email_verified ?? existingData?.providerData?.isEmailVerified,
          locale: locale || existingData?.providerData?.locale,
        },
        displayName: name || existingData?.displayName,
        photoUrl: picture || existingData?.photoUrl,
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      userData = {
        uid,
        googleId,
        email,
        username: existingData?.username || name || email.split('@')[0],
        displayName: name || existingData?.displayName || '',
        photoUrl: picture || existingData?.photoUrl || '',
        isEmailVerified: email_verified || existingData?.providerData?.isEmailVerified || false,
        locale: locale || existingData?.providerData?.locale || '',
        authMethod: 'google' as const,
        createdAt: existingData?.createdAt?.toDate() || now,
        lastLogin: now,
        ...(existingData?.walletAddress && { walletAddress: existingData.walletAddress }),
        ...(existingData?.referralId && { referralId: existingData.referralId }),
        ...(existingData?.telegramId && { telegramId: existingData.telegramId }),
      };

      logger.info(`User logged in with Google: ${email}`);
    }

    // Create JWT payload
    const jwtPayload = {
      uid,
      email,
      googleId,
      authMethod: 'google',
      iat: Math.floor(Date.now() / 1000),
    };

    // Create JWT (expires in 7 days)
    const expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds
    const accessToken = jwt.sign(
      jwtPayload,
      process.env.JWT_SECRET || 'fallback-secret-change-in-production',
      {
        expiresIn,
        issuer: 'dexter-city',
        audience: 'dexter-city-users'
      }
    );

    return {
      accessToken,
      user: userData,
      expiresIn
    };

  } catch (error) {
    logger.error(error, 'Google authentication error:');
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(500, 'Google authentication failed');
  }
}

/**
 * Generate Google OAuth URL for login flow
 */
export function getGoogleAuthUrl(): string {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  return googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
}

/**
 * Exchange Google authorization code for tokens
 */
export async function handleGoogleCallback(code: string): Promise<AuthResponse> {
  try {
    const { tokens } = await googleClient.getToken(code);
    
    if (!tokens.id_token) {
      throw new ApiError(400, 'No ID token received from Google');
    }

    return authenticateWithGoogle({ idToken: tokens.id_token });

  } catch (error) {
    logger.error(error, 'Google callback error:');
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(500, 'Failed to process Google authentication');
  }
}

/**
 * Auto-login for testing purposes
 * WARNING: Only use in development!
 */
export async function testAutoLogin(): Promise<AuthResponse> {
  // Allow in development or when NODE_ENV is not explicitly set to production
  // Comment out this check if you want to enable it everywhere
  // if (process.env.NODE_ENV === 'production') {
  //   throw new ApiError(403, 'Test auto-login is disabled in production');
  // }

  const email = 'walt.yao@gmail.com';
  const uid = 'google_115162507329919334138';
  const googleId = '115162507329919334138';
  
  const userDocRef = admin.firestore().collection('users').doc(email);
  const userDoc = await userDocRef.get();
  
  const now = new Date();
  let userData;

  if (!userDoc.exists) {
    // Create test user if doesn't exist
    userData = {
      uid,
      email,
      username: 'Walt Yao',
      displayName: 'Walt Yao',
      photoUrl: 'https://lh3.googleusercontent.com/a/ACg8ocKG07JjIWrgu49iCx1H62_drz4vc4Ti01TAxrsmh_8Hx-tLmcWW-w=s96-c',
      isEmailVerified: true,
      locale: '',
      authMethod: 'google' as const,
      createdAt: now,
      lastLogin: now,
    };

    await userDocRef.set({
      email,
      authMethod: 'google',
      provider: 'google',
      providerData: {
        uid,
        googleId,
        googleEmail: email,
        googleName: 'Walt Yao',
        googlePicture: 'https://lh3.googleusercontent.com/a/ACg8ocKG07JjIWrgu49iCx1H62_drz4vc4Ti01TAxrsmh_8Hx-tLmcWW-w=s96-c',
        isEmailVerified: true,
        locale: '',
        authTime: admin.firestore.FieldValue.serverTimestamp(),
      },
      displayName: 'Walt Yao',
      photoUrl: 'https://lh3.googleusercontent.com/a/ACg8ocKG07JjIWrgu49iCx1H62_drz4vc4Ti01TAxrsmh_8Hx-tLmcWW-w=s96-c',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`Test user created: ${email}`);
  } else {
    // Update existing user
    const existingData = userDoc.data();
    
    await userDocRef.update({
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
    });

    userData = {
      uid,
      googleId,
      email,
      username: existingData?.username || 'Walt Yao',
      displayName: existingData?.displayName || 'Walt Yao',
      photoUrl: existingData?.photoUrl || 'https://lh3.googleusercontent.com/a/ACg8ocKG07JjIWrgu49iCx1H62_drz4vc4Ti01TAxrsmh_8Hx-tLmcWW-w=s96-c',
      isEmailVerified: true,
      locale: '',
      authMethod: 'google' as const,
      createdAt: existingData?.createdAt?.toDate() || now,
      lastLogin: now,
      ...(existingData?.walletAddress && { walletAddress: existingData.walletAddress }),
      ...(existingData?.referralId && { referralId: existingData.referralId }),
      ...(existingData?.telegramId && { telegramId: existingData.telegramId }),
    };

    logger.info(`Test user auto-login: ${email}`);
  }

  // Create JWT payload
  const jwtPayload = {
    uid,
    email,
    googleId,
    authMethod: 'google',
    iat: Math.floor(Date.now() / 1000),
  };

  // Create JWT (expires in 7 days)
  const expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds
  const accessToken = jwt.sign(
    jwtPayload,
    process.env.JWT_SECRET || 'fallback-secret-change-in-production',
    {
      expiresIn,
      issuer: 'dexter-city',
      audience: 'dexter-city-users'
    }
  );

  return {
    accessToken,
    user: userData,
    expiresIn
  };
}
