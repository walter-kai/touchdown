import { Request, Response } from 'express';
import admin from '../../utils/firebase';
import ApiError from '../../utils/api-error';
import catchAsync from '../../utils/catch-async';

/**
 * Fetch a single gameData document without scanning the full collection.
 * Doc ID format: espn:{league}:{gameId} (example: espn:nba:401810513)
 */
export const getGameDataDoc = catchAsync(async (req: Request, res: Response) => {
  const { league, gameId } = req.params;

  if (!league || !gameId) {
    throw new ApiError(400, 'league and gameId are required');
  }

  const docId = `espn:${league}:${gameId}`;
  const docRef = admin.firestore().collection('gameData').doc(docId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    throw new ApiError(404, 'Game data not found');
  }

  return res.status(200).json({ ok: true, docId, ...docSnap.data() });
});
