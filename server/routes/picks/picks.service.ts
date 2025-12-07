import admin from '../../utils/firebase';

type CreatePickArgs = {
  userId: string;
  homeTeamId?: string;
  awayTeamId?: string;
  picksState?: {
    players?: any[];
    totalScore?: number;
    lockedAt?: number | null;
  };
  gameId?: string;
  selection?: string;
  multiplier?: number;
};

export async function createPick(args: CreatePickArgs) {
  const db = admin.firestore();
  const picksCol = db.collection('picks');

  const pickDoc: any = {
    userId: args.userId,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (args.homeTeamId) pickDoc.homeTeamId = args.homeTeamId;
  if (args.awayTeamId) pickDoc.awayTeamId = args.awayTeamId;
  if (args.picksState) {
    pickDoc.players = args.picksState.players || [];
    pickDoc.totalScore = args.picksState.totalScore || 0;
    pickDoc.lockedAt = args.picksState.lockedAt || null;
  }

  if (args.gameId) pickDoc.gameId = args.gameId;
  if (args.selection) pickDoc.selection = args.selection;
  if (typeof args.multiplier !== 'undefined') pickDoc.multiplier = args.multiplier;

  const result = await picksCol.add(pickDoc);
  return { id: result.id };
}
