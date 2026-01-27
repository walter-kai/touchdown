import path from 'path';
import dotenv from 'dotenv';

// Load Firebase credentials from the root .env BEFORE importing firebase admin
dotenv.config({ path: path.resolve(__dirname, '../..', '.env') });

import admin from '../utils/firebase';
import logger from '../utils/logger';

/**
 * Migration script to rename pick documents from gameId:email -> gameId:displayName
 * and to normalize fields (email, displayName, remove userId).
 *
 * Usage:
 *   ts-node server/scripts/renamePicksToDisplayName.ts [--dry-run]
 *
 * Notes:
 * - Looks up displayName from users collection (doc id = email, or where email == ...)
 * - Skips docs where displayName cannot be found
 * - Skips docs when target docId already exists (to avoid overwriting)
 */

interface MigrationStats {
  total: number;
  migrated: number;
  skipped: number;
  errors: Array<{ docId: string; reason: string }>;
}

async function getDisplayNameByEmail(db: FirebaseFirestore.Firestore, email: string): Promise<string | null> {
  try {
    // Try direct document (id = email)
    const userDoc = await db.collection('users').doc(email).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      if (data?.displayName) return data.displayName as string;
    }

    // Fallback: query by email field
    const query = await db.collection('users').where('email', '==', email).limit(1).get();
    if (!query.empty) {
      const data = query.docs[0].data();
      if (data?.displayName) return data.displayName as string;
    }
  } catch (err) {
    logger.warn(`Error fetching displayName for ${email}: ${err}`);
  }
  return null;
}

async function migrate(dryRun: boolean): Promise<MigrationStats> {
  const db = admin.firestore();
  const stats: MigrationStats = { total: 0, migrated: 0, skipped: 0, errors: [] };

  const snapshot = await db.collection('picks').get();
  logger.info(`Found ${snapshot.size} pick documents`);

  for (const doc of snapshot.docs) {
    stats.total++;
    const oldDocId = doc.id; // e.g., 401810518:walt.yao
    const data = doc.data();

    const parts = oldDocId.split(':');
    if (parts.length !== 2) {
      stats.skipped++;
      logger.warn(`Skipping malformed docId: ${oldDocId}`);
      continue;
    }

    const gameId = parts[0];
    const parsedEmail = parts[1];

    // If doc already in new shape (has displayName and docId second part is not an email?) check field
    if (data.displayName && oldDocId === `${gameId}:${data.displayName}`) {
      // Ensure email field is set and userId removed
      if (!dryRun) {
        await doc.ref.set({ email: data.email || parsedEmail, userId: admin.firestore.FieldValue.delete() }, { merge: true });
      }
      continue;
    }

    const displayName = data.displayName || (await getDisplayNameByEmail(db, parsedEmail));
    if (!displayName) {
      stats.skipped++;
      logger.warn(`No displayName for email ${parsedEmail}; skipping ${oldDocId}`);
      continue;
    }

    const newDocId = `${gameId}:${displayName}`;
    if (newDocId === oldDocId) {
      // Already correctly named; just normalize fields
      if (!dryRun) {
        await doc.ref.set({ email: data.email || parsedEmail, displayName, userId: admin.firestore.FieldValue.delete() }, { merge: true });
      }
      continue;
    }

    const newRef = db.collection('picks').doc(newDocId);
    const newExists = await newRef.get();
    if (newExists.exists) {
      // Merge into existing doc and delete old one
      const targetData = newExists.data() || {};
      const mergedPicks = [
        ...(Array.isArray(targetData.picks) ? targetData.picks : []),
        ...(Array.isArray(data.picks) ? data.picks : []),
      ];

      try {
        if (!dryRun) {
          await db.runTransaction(async (tx) => {
            tx.set(
              newRef,
              {
                ...targetData,
                ...data,
                picks: mergedPicks,
                email: data.email || targetData.email || parsedEmail,
                displayName,
                userId: admin.firestore.FieldValue.delete(),
              },
              { merge: true }
            );
            tx.delete(doc.ref);
          });
        }

        stats.migrated++;
        logger.info(`${dryRun ? '[DRY-RUN] ' : ''}Merged ${oldDocId} -> ${newDocId} (existing target)`);
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        stats.errors.push({ docId: oldDocId, reason });
        logger.error(`Error merging ${oldDocId} into existing ${newDocId}: ${reason}`);
      }
      continue;
    }

    try {
      if (!dryRun) {
        await db.runTransaction(async (tx) => {
          tx.set(newRef, {
            ...data,
            email: data.email || parsedEmail,
            displayName,
            userId: admin.firestore.FieldValue.delete(),
          }, { merge: true });
          tx.delete(doc.ref);
        });
      }
      stats.migrated++;
      logger.info(`${dryRun ? '[DRY-RUN] ' : ''}Migrated ${oldDocId} -> ${newDocId}`);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      stats.errors.push({ docId: oldDocId, reason });
      logger.error(`Error migrating ${oldDocId}: ${reason}`);
    }
  }

  return stats;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  logger.info(`Starting pick doc rename (dryRun=${dryRun})`);

  const stats = await migrate(dryRun);

  logger.info('Migration complete');
  logger.info(`Total: ${stats.total}`);
  logger.info(`Migrated: ${stats.migrated}`);
  logger.info(`Skipped: ${stats.skipped}`);
  logger.info(`Errors: ${stats.errors.length}`);
  if (stats.errors.length) {
    stats.errors.forEach(e => logger.error(`${e.docId}: ${e.reason}`));
  }
}

main().then(() => process.exit(0)).catch(err => {
  logger.error(`Fatal migration error: ${err}`);
  process.exit(1);
});
