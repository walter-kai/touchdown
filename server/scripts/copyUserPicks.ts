import path from 'path';
import dotenv from 'dotenv';

// Load Firebase credentials from the root .env BEFORE importing firebase admin
dotenv.config({ path: path.resolve(__dirname, '../..', '.env') });

import admin from '../utils/firebase';
import logger from '../utils/logger';

// Simple utility script to copy all picks from one user to another.
// Defaults copy from Walt's old email to new email. Override via env:
//   SOURCE_USER=source@example.com TARGET_USER=dest@example.com ts-node server/scripts/copyUserPicks.ts

const SOURCE_USER = process.env.SOURCE_USER || 'walt.yao@gmail.com';
const TARGET_USER = process.env.TARGET_USER || 'walt.yaoza@gmail.com';

async function main() {
  if (SOURCE_USER === TARGET_USER) {
    throw new Error('Source and target users must be different');
  }

  const db = admin.firestore();
  const sourceRef = db.collection('gamePicks').doc(SOURCE_USER);
  const targetRef = db.collection('gamePicks').doc(TARGET_USER);

  const sourceDoc = await sourceRef.get();
  if (!sourceDoc.exists) {
    throw new Error(`No picks document found for source user ${SOURCE_USER}`);
  }

  const existingTargetPicks = await targetRef.collection('picks').limit(1).get();
  if (!existingTargetPicks.empty) {
    throw new Error(`Target user ${TARGET_USER} already has picks. Aborting to avoid overwrite.`);
  }

  const sourcePicksSnapshot = await sourceRef.collection('picks').get();
  logger.info(`Found ${sourcePicksSnapshot.size} game pick docs for ${SOURCE_USER}`);

  const batch = db.batch();

  // Copy the root doc (gameIds, lastUpdated) and refresh lastUpdated to now.
  batch.set(
    targetRef,
    {
      ...sourceDoc.data(),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // Copy each game pick subdocument, nudging pick timestamps slightly earlier (1-3 minutes).
  sourcePicksSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    const picks = Array.isArray(data.picks)
      ? data.picks.map((pick: any) => {
          if (!pick?.timestamp) return pick;

          const original = new Date(pick.timestamp);
          if (Number.isNaN(original.getTime())) return pick;

          const minutesToSubtract = Math.max(1, Math.min(3, Math.floor(Math.random() * 4)));
          const adjustedDate = new Date(original.getTime() - minutesToSubtract * 60 * 1000);

          return {
            ...pick,
            timestamp: adjustedDate.toISOString(),
          };
        })
      : data.picks;

    batch.set(
      targetRef.collection('picks').doc(doc.id),
      {
        ...data,
        picks,
      },
      { merge: false }
    );
  });

  await batch.commit();

  logger.info(
    {
      sourceUser: SOURCE_USER,
      targetUser: TARGET_USER,
      gameCount: sourcePicksSnapshot.size,
    },
    'Successfully copied picks'
  );
}

main()
  .then(() => {
    logger.info('Done');
    process.exit(0);
  })
  .catch((err) => {
    logger.error({ err }, 'Failed to copy picks');
    process.exit(1);
  });
