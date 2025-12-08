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

  console.log('✅ Firebase Admin initialized successfully');
}

const db = admin.firestore();
const COLLECTION_NAME = 'playByPlay';
const GAME_ID = '401772932';

/**
 * Migration script to convert play-by-play subcollection to array structure
 * 
 * Old structure: playByPlay/{gameId}/plays/{playId}
 * New structure: playByPlay/{gameId} with plays array
 */
async function migratePlayByPlay() {
  try {
    console.log(`Starting migration for game ${GAME_ID}...`);
    
    // Step 1: Fetch all plays from the subcollection
    const playsSnapshot = await db
      .collection(COLLECTION_NAME)
      .doc(GAME_ID)
      .collection('plays')
      .orderBy('timestamp', 'desc')
      .get();

    if (playsSnapshot.empty) {
      console.log(`No plays found in subcollection for game ${GAME_ID}`);
      return;
    }

    console.log(`Found ${playsSnapshot.size} plays in subcollection`);

    // Step 2: Convert to simplified play format
    const plays: any[] = [];
    playsSnapshot.forEach((doc) => {
      const play = doc.data();
      
      const simplifiedPlay = {
        text: play.text || '',
        quarter: play.quarter || 0,
        clock: play.clock || '0:00',
        timestamp: play.timestamp || admin.firestore.Timestamp.now(),
        team: play.team?.id || null,
        type: play.type?.text || play.type?.abbreviation || '',
        scoreValue: play.scoreValue || 0,
        yardLine: play.drive?.end?.yardLine || play.drive?.start?.yardLine || null,
        athletesInvolved: play.athletesInvolved?.map((athlete: any) => ({
          id: athlete.id,
          displayName: athlete.displayName,
          position: athlete.position
        })) || []
      };
      
      plays.push(simplifiedPlay);
    });

    console.log(`Converted ${plays.length} plays to simplified format`);

    // Step 3: Save to new structure
    const gameRef = db.collection(COLLECTION_NAME).doc(GAME_ID);
    
    await gameRef.set({
      plays: plays,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      totalPlays: plays.length
    }, { merge: true });

    console.log(`✅ Successfully saved ${plays.length} plays to game document ${GAME_ID}`);
    
    // Step 4: Verify the migration
    const verifyDoc = await gameRef.get();
    const verifyData = verifyDoc.data();
    console.log(`Verification: Document contains ${verifyData?.plays?.length || 0} plays`);
    
    // Optional: Log first few plays for verification
    console.log('\nSample plays (first 3):');
    plays.slice(0, 3).forEach((play, index) => {
      console.log(`${index + 1}. Q${play.quarter} ${play.clock} - ${play.text.substring(0, 80)}...`);
    });

    console.log('\n⚠️  Migration complete! The subcollection is still intact.');
    console.log('After verifying the migration worked correctly, you can manually delete the subcollection.');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
}

// Run the migration
migratePlayByPlay()
  .then(() => {
    console.log('\nMigration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nMigration script failed:', error);
    process.exit(1);
  });
