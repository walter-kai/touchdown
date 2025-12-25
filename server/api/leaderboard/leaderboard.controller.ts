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
  
  // Get top 10 with ranks
  const top10 = entries.slice(0, 10).map((entry: any, index: number) => ({
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
