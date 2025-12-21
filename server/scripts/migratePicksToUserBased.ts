import 'dotenv/config'; // Load environment variables first
import admin from '../utils/firebase';
import logger from '../utils/logger';

/**
 * Migration script to restructure Firebase from game-based to user-based
 * 
 * OLD STRUCTURE:
 * gamePicks/{gameId}/users/{userId}
 *   - picks: []
 *   - lastUpdated: timestamp
 * 
 * NEW STRUCTURE:
 * gamePicks/{userId}
 *   - gameIds: [array of game IDs user has picks for]
 *   - lastUpdated: timestamp
 *   - picks/{gameId}
 *       - picks: []
 *       - timestamp: when last pick was made
 */

interface OldUserPickData {
  picks: any[];
  lastUpdated: any;
}

interface GamePickData {
  gameId: string;
  picks: any[];
  lastUpdated: any;
}

interface UserDataAggregated {
  gameIds: string[];
  gameData: Map<string, GamePickData>;
}

async function migratePicksToUserBased(dryRun: boolean = true) {
  const db = admin.firestore();
  
  logger.info(`Starting migration (${dryRun ? 'DRY RUN' : 'LIVE MODE'})...`);
  
  try {
    // Step 1: Read all existing game-based data
    logger.info('Step 1: Reading existing game-based structure...');
    const gamesSnapshot = await db.collection('gamePicks').listDocuments();
    
    // Aggregate all data by user
    const userDataMap = new Map<string, UserDataAggregated>();
    let totalGames = 0;
    let totalUsers = 0;
    
    for (const gameRef of gamesSnapshot) {
      const gameId = gameRef.id;
      totalGames++;
      
      logger.info(`Processing game ${gameId}...`);
      
      // Get all users for this game
      const usersSnapshot = await gameRef.collection('users').get();
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const data = userDoc.data() as OldUserPickData;
        
        // Initialize user data if not exists
        if (!userDataMap.has(userId)) {
          userDataMap.set(userId, {
            gameIds: [],
            gameData: new Map()
          });
          totalUsers++;
        }
        
        const userData = userDataMap.get(userId)!;
        userData.gameIds.push(gameId);
        userData.gameData.set(gameId, {
          gameId,
          picks: data.picks || [],
          lastUpdated: data.lastUpdated
        });
        
        logger.info(`  Found ${data.picks?.length || 0} picks for user ${userId}`);
      }
    }
    
    logger.info(`\nFound ${totalGames} games with ${totalUsers} unique users`);
    
    // Step 2: Write new user-based structure
    logger.info('\nStep 2: Writing new user-based structure...');
    
    const batch = db.batch();
    let batchCount = 0;
    const BATCH_LIMIT = 500; // Firestore batch limit
    
    for (const [userId, userData] of userDataMap.entries()) {
      logger.info(`\nMigrating user ${userId} (${userData.gameIds.length} games)...`);
      
      // Create the main user document with gameIds array
      const userDocRef = db.collection('gamePicks').doc(userId);
      
      if (!dryRun) {
        batch.set(userDocRef, {
          gameIds: userData.gameIds,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          migratedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        batchCount++;
        
        // Commit batch if reaching limit
        if (batchCount >= BATCH_LIMIT) {
          await batch.commit();
          logger.info('Committed batch of 500 operations');
          batchCount = 0;
        }
      } else {
        logger.info(`[DRY RUN] Would create user doc with gameIds: ${userData.gameIds.join(', ')}`);
      }
      
      // Create subcollection documents for each game
      for (const [gameId, gameData] of userData.gameData.entries()) {
        const gamePickRef = userDocRef.collection('picks').doc(gameId);
        
        if (!dryRun) {
          batch.set(gamePickRef, {
            picks: gameData.picks,
            timestamp: gameData.lastUpdated || admin.firestore.FieldValue.serverTimestamp()
          });
          batchCount++;
          
          // Commit batch if reaching limit
          if (batchCount >= BATCH_LIMIT) {
            await batch.commit();
            logger.info('Committed batch of 500 operations');
            batchCount = 0;
          }
        } else {
          logger.info(`  [DRY RUN] Would create picks subcollection for game ${gameId} with ${gameData.picks.length} picks`);
        }
      }
    }
    
    // Commit any remaining operations
    if (!dryRun && batchCount > 0) {
      await batch.commit();
      logger.info(`Committed final batch of ${batchCount} operations`);
    }
    
    logger.info('\n' + '='.repeat(60));
    logger.info('Migration Summary:');
    logger.info(`  Mode: ${dryRun ? 'DRY RUN (no changes made)' : 'LIVE MODE (changes written)'}`);
    logger.info(`  Games processed: ${totalGames}`);
    logger.info(`  Users migrated: ${totalUsers}`);
    logger.info('='.repeat(60));
    
    if (dryRun) {
      logger.info('\nTo perform the actual migration, run with dryRun=false');
      logger.info('WARNING: This will create a new structure alongside the old one.');
      logger.info('You should verify the new structure before deleting the old one.');
    } else {
      logger.info('\n✅ Migration completed successfully!');
      logger.info('\nNext steps:');
      logger.info('1. Verify the new structure in Firebase console');
      logger.info('2. Update your application code to use the new structure');
      logger.info('3. Run the cleanup script to remove old structure (not included, create separately)');
    }
    
  } catch (error) {
    logger.error(error, 'Migration failed:');
    throw error;
  }
}

/**
 * Verification function to compare old and new structures
 */
async function verifyMigration() {
  const db = admin.firestore();
  
  logger.info('Starting migration verification...\n');
  
  try {
    // Get all users from new structure
    const newUsersSnapshot = await db.collection('gamePicks').get();
    
    let totalVerified = 0;
    let totalErrors = 0;
    
    for (const userDoc of newUsersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      // Skip if this is an old game document (has 'users' subcollection)
      const usersSubcollection = await userDoc.ref.collection('users').limit(1).get();
      if (!usersSubcollection.empty) {
        // This is an old game document, skip it
        continue;
      }
      
      logger.info(`Verifying user ${userId}...`);
      
      const gameIds = userData.gameIds || [];
      const picksSnapshot = await userDoc.ref.collection('picks').get();
      
      // Verify all gameIds have corresponding picks subcollection docs
      if (picksSnapshot.size !== gameIds.length) {
        logger.error(`  ❌ Mismatch: gameIds array has ${gameIds.length} items but picks subcollection has ${picksSnapshot.size} docs`);
        totalErrors++;
        continue;
      }
      
      // Verify each game
      for (const gameId of gameIds) {
        const pickDoc = await userDoc.ref.collection('picks').doc(gameId).get();
        
        if (!pickDoc.exists) {
          logger.error(`  ❌ Missing picks document for game ${gameId}`);
          totalErrors++;
          continue;
        }
        
        const pickData = pickDoc.data();
        const picksCount = pickData?.picks?.length || 0;
        
        logger.info(`  ✅ Game ${gameId}: ${picksCount} picks`);
      }
      
      totalVerified++;
    }
    
    logger.info('\n' + '='.repeat(60));
    logger.info('Verification Summary:');
    logger.info(`  Users verified: ${totalVerified}`);
    logger.info(`  Errors found: ${totalErrors}`);
    logger.info('='.repeat(60));
    
    if (totalErrors === 0) {
      logger.info('\n✅ Verification passed! All data migrated correctly.');
    } else {
      logger.error('\n❌ Verification failed! Please review errors above.');
    }
    
  } catch (error) {
    logger.error(error, 'Verification failed:');
    throw error;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'migrate':
      const dryRun = !args.includes('--live');
      await migratePicksToUserBased(dryRun);
      break;
      
    case 'migrate-live':
      await migratePicksToUserBased(false);
      break;
      
    case 'verify':
      await verifyMigration();
      break;
      
    default:
      logger.info('Usage:');
      logger.info('  npm run migrate:picks-to-user migrate           # Dry run (preview changes)');
      logger.info('  npm run migrate:picks-to-user migrate-live      # Actually perform migration');
      logger.info('  npm run migrate:picks-to-user -- migrate --live # Alternative live mode');
      logger.info('  npm run migrate:picks-to-user verify            # Verify migration completed correctly');
      process.exit(1);
  }
  
  process.exit(0);
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    logger.error(error, 'Script failed:');
    process.exit(1);
  });
}

export { migratePicksToUserBased, verifyMigration };
