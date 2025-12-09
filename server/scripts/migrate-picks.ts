import * as dotenv from 'dotenv';
import admin from 'firebase-admin';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Firebase Admin not fully configured. Missing env vars.');
    console.error('Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    process.exit(1);
  }

  // Replace escaped newlines with real newlines
  privateKey = privateKey.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  console.log('✅ Firebase Admin initialized successfully\n');
}

const db = admin.firestore();
const COLLECTION_NAME = 'gamePicks';

/**
 * Migration script to convert picks structure to array-based format
 * 
 * Old structure: gamePicks/{gameId}/users/{userId} with direct player fields
 * New structure: gamePicks/{gameId}/users/{userId} with picks array
 * 
 * This allows multiple pick submissions per user, similar to play-by-play structure
 */
async function migratePicks() {
  try {
    console.log('🚀 Starting picks migration...\n');

    // Get all game documents
    const gamesSnapshot = await db.collection(COLLECTION_NAME).get();
    
    if (gamesSnapshot.empty) {
      console.log('No games found in gamePicks collection');
      return;
    }

    console.log(`Found ${gamesSnapshot.docs.length} games with picks\n`);
    
    let totalGames = 0;
    let totalUsers = 0;
    let totalMigrated = 0;

    for (const gameDoc of gamesSnapshot.docs) {
      const gameId = gameDoc.id;
      console.log(`\n📦 Processing game: ${gameId}`);
      
      // Get all users for this game
      const usersSnapshot = await db.collection(COLLECTION_NAME)
        .doc(gameId)
        .collection('users')
        .get();
      
      if (usersSnapshot.empty) {
        console.log(`  No users found for game ${gameId}`);
        continue;
      }
      
      totalGames++;
      console.log(`  Found ${usersSnapshot.docs.length} users with picks`);
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const data = userDoc.data();
        
        // Check if already migrated (has picks array)
        if (data.picks && Array.isArray(data.picks)) {
          console.log(`  ✓ User ${userId} already migrated (${data.picks.length} picks)`);
          continue;
        }
        
        // Check if old format (has players array directly)
        if (data.players && Array.isArray(data.players)) {
          console.log(`  → Migrating user ${userId}...`);
          
          // Convert old format to new array-based format
          const newPick = {
            players: data.players,
            totalScore: data.totalScore || 0,
            lockedAt: data.lockedAt || null,
            timestamp: data.timestamp || admin.firestore.Timestamp.now(),
          };
          
          // Update document with new structure
          await userDoc.ref.set({
            picks: [newPick], // Wrap in array
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
          
          // Remove old fields
          await userDoc.ref.update({
            players: admin.firestore.FieldValue.delete(),
            totalScore: admin.firestore.FieldValue.delete(),
            lockedAt: admin.firestore.FieldValue.delete(),
            timestamp: admin.firestore.FieldValue.delete(),
          });
          
          totalMigrated++;
          console.log(`  ✓ User ${userId} migrated successfully`);
        } else {
          console.log(`  ⚠ User ${userId} has unexpected data format, skipping`);
        }
        
        totalUsers++;
      }
    }
    
    console.log('\n✅ Migration complete!');
    console.log(`   Games processed: ${totalGames}`);
    console.log(`   Users processed: ${totalUsers}`);
    console.log(`   Users migrated: ${totalMigrated}`);
    console.log(`   Already migrated: ${totalUsers - totalMigrated}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
migratePicks()
  .then(() => {
    console.log('\n🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
