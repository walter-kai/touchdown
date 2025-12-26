import { Request, Response } from 'express';
import admin from '../../utils/firebase';
import catchAsync from '../../utils/catch-async';

/**
 * Get the total score leaderboard
 */
export const getLeaderboard = catchAsync(async (req: Request, res: Response) => {
  const db = admin.firestore();
  const leaderboardRef = db.collection('leaderboards').doc('totalScore');
  const leaderboardDoc = await leaderboardRef.get();

  if (!leaderboardDoc.exists) {
    return res.status(200).json({
      success: true,
      leaderboard: [],
      message: 'Leaderboard not yet calculated'
    });
  }

  const data = leaderboardDoc.data();
  const entries = data?.leaderboard || [];
  
  // Get top 10 entries
  const top10Entries = entries.slice(0, 10);
  
  // Fetch fresh user data (displayName, photoUrl) from users collection
  const usersRef = db.collection('users');
  const userPromises = top10Entries.map(async (entry: any) => {
    try {
      // Use userId as the document key
      const userKey = entry.userId;
      if (!userKey) return entry;
      
      const userDoc = await usersRef.doc(userKey).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        return {
          userId: entry.userId,
          displayName: userData?.displayName || 'Player',
          photoUrl: userData?.photoUrl,
          totalScore: entry.totalScore,
          gamesPlayed: entry.gamesPlayed
        };
      }
      // Return minimal data without email
      return {
        userId: entry.userId,
        displayName: entry.displayName || 'Player',
        photoUrl: entry.photoUrl,
        totalScore: entry.totalScore,
        gamesPlayed: entry.gamesPlayed
      };
    } catch (error) {
      console.error(`Error fetching user data for ${entry.userId}:`, error);
      return {
        userId: entry.userId,
        displayName: entry.displayName || 'Player',
        totalScore: entry.totalScore,
        gamesPlayed: entry.gamesPlayed
      };
    }
  });
  
  const enrichedEntries = await Promise.all(userPromises);
  
  // Add ranks
  const top10 = enrichedEntries.map((entry: any, index: number) => ({
    ...entry,
    rank: index + 1
  }));

  return res.status(200).json({
    success: true,
    leaderboard: top10,
    lastCalculated: data?.lastCalculated,
    totalUsers: data?.totalUsers
  });
});
