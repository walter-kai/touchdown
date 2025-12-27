import admin from 'firebase-admin';
import ApiError from '../../utils/api-error';
import logger from '../../utils/logger';
import { User, ProviderData } from '../../../types/User';

/**
 * Get user profile by UID
 */
export async function getUserProfile(uid: string): Promise<User> {
  try {
    let userDoc;
    let userDocRef;
    
    // First try to get by UID (document ID)
    userDocRef = admin.firestore().collection('users').doc(uid);
    userDoc = await userDocRef.get();

    // If not found and UID starts with "google_", try to find by email
    // (Google users are stored with email as document ID)
    if (!userDoc.exists && uid.startsWith('google_')) {
      const query = admin.firestore()
        .collection('users')
        .where('providerData.googleId', '==', uid.replace('google_', ''))
        .limit(1);
      
      const snapshot = await query.get();
      
      if (!snapshot.empty) {
        userDoc = snapshot.docs[0];
        userDocRef = userDoc.ref;
      }
    }

    if (!userDoc.exists) {
      throw new ApiError(404, 'User not found');
    }

    const data = userDoc.data();
    
    // Construct providerData from Firebase data
    const providerData: ProviderData = {
      authTime: data?.providerData?.authTime?.toDate() || new Date(),
      googleId: data?.providerData?.googleId || '',
      googleEmail: data?.providerData?.googleEmail || data?.email || '',
      googleName: data?.providerData?.googleName || data?.displayName || '',
      googlePicture: data?.providerData?.googlePicture || data?.photoUrl || '',
      isEmailVerified: data?.providerData?.isEmailVerified ?? false,
      locale: data?.providerData?.locale || '',
    };
    
    return {
      uid: data?.uid || uid,
      email: data?.email || '',
      displayName: data?.displayName || '',
      photoUrl: data?.photoUrl || '',
      authMethod: data?.authMethod || 'simple',
      provider: data?.provider || data?.authMethod || 'simple',
      createdAt: data?.createdAt?.toDate() || new Date(),
      lastLogin: data?.lastLogin?.toDate() || new Date(),
      providerData,
      username: data?.username,
      referralId: data?.referralId,
      displayNameSet: data?.displayNameSet,
      // Deprecated fields for backward compatibility
      googleId: data?.providerData?.googleId,
      googleEmail: data?.providerData?.googleEmail,
      googleName: data?.providerData?.googleName,
      googlePicture: data?.providerData?.googlePicture,
      isEmailVerified: data?.providerData?.isEmailVerified,
      locale: data?.providerData?.locale,
    };
  } catch (error) {
    logger.error(error, 'Error fetching user profile:');
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(500, 'Failed to fetch user profile');
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(uid: string, updates: any): Promise<User> {
  try {
    const userDocRef = admin.firestore().collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      throw new ApiError(404, 'User not found');
    }

    const data = userDoc.data();

    // Filter out fields that shouldn't be updated directly
    const allowedUpdates: any = {
      ...(updates.username && { username: updates.username }),
      ...(updates.email && { email: updates.email }),
      ...(updates.photoUrl && { photoUrl: updates.photoUrl }),
    };

    // displayName can only be updated if it hasn't been manually set via setDisplayName
    // Use the dedicated setDisplayName endpoint for proper validation
    if (updates.displayName) {
      throw new ApiError(400, 'Use the /display-name endpoint to set your display name');
    }

    if (Object.keys(allowedUpdates).length === 0) {
      throw new ApiError(400, 'No valid fields to update');
    }

    await userDocRef.update(allowedUpdates);

    logger.info(`User profile updated: ${uid}`);

    return getUserProfile(uid);
  } catch (error) {
    logger.error(error, 'Error updating user profile:');
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(500, 'Failed to update user profile');
  }
}

/**
 * Check if username is available
 */
export async function checkUsernameAvailability(username: string, currentUid?: string) {
  try {
    const query = admin.firestore()
      .collection('users')
      .where('displayName', '==', username.trim())
      .limit(1);

    const snapshot = await query.get();

    if (snapshot.empty) {
      return { available: true };
    }

    // If the username belongs to the current user, it's available for them
    if (currentUid && snapshot.docs[0].id === currentUid) {
      return { available: true };
    }

    return { available: false };
  } catch (error) {
    logger.error(error, 'Error checking username availability:');
    throw new ApiError(500, 'Failed to check username availability');
  }
}

/**
 * Set user's display name (one-time only)
 */
export async function setDisplayName(email: string, displayName: string): Promise<User> {
  try {
    const userDocRef = admin.firestore().collection('users').doc(email);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      throw new ApiError(404, 'User not found');
    }

    const data = userDoc.data();

    // Check if display name has already been set AND is different from what they're trying to set
    if (data?.displayNameSet === true && data?.displayName !== displayName) {
      throw new ApiError(400, 'Display name has already been set and cannot be changed');
    }

    // Update display name and set flag
    await userDocRef.update({
      displayName,
      displayNameSet: true,
    });

    // Return updated user
    return getUserProfile(data?.uid || email);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error(error, 'Error setting display name:');
    throw new ApiError(500, 'Failed to set display name');
  }
}
