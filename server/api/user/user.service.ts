import admin from 'firebase-admin';
import ApiError from '../../utils/api-error';
import logger from '../../utils/logger';

/**
 * Get user profile by UID
 */
export async function getUserProfile(uid: string) {
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
        .where('providerData.uid', '==', uid)
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
    
    return {
      uid,
      walletAddress: data?.walletAddress || '',
      username: data?.username || '',
      email: data?.email || '',
      displayName: data?.displayName || '',
      photoUrl: data?.photoUrl || '',
      createdAt: data?.createdAt?.toDate() || new Date(),
      lastLogin: data?.lastLogin?.toDate() || new Date(),
      referralId: data?.referralId || '',
      telegramId: data?.telegramId || '',
      authMethod: data?.authMethod || 'simple',
      googleId: data?.googleId || '',
      googleEmail: data?.googleEmail || '',
      googleName: data?.googleName || '',
      googlePicture: data?.googlePicture || '',
      isEmailVerified: data?.isEmailVerified || false,
      locale: data?.locale || '',
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
export async function updateUserProfile(uid: string, updates: any) {
  try {
    const userDocRef = admin.firestore().collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      throw new ApiError(404, 'User not found');
    }

    // Filter out fields that shouldn't be updated directly
    const allowedUpdates = {
      ...(updates.username && { username: updates.username }),
      ...(updates.email && { email: updates.email }),
      ...(updates.displayName && { displayName: updates.displayName }),
      ...(updates.photoUrl && { photoUrl: updates.photoUrl }),
    };

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
      .where('username', '==', username.trim())
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
