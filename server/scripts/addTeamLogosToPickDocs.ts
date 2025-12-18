import 'dotenv/config';
import admin from '../utils/firebase';
import logger from '../utils/logger';
import axios from 'axios';

/**
 * Script to add team logos to existing gamePicks documents
 * Fetches team logos from ESPN Summary API and updates all pick documents
 */

interface TeamLogos {
  awayLogo: string;
  homeLogo: string;
}

async function fetchTeamLogos(gameId: string): Promise<TeamLogos | null> {
  try {
    const response = await axios.get(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${gameId}`);
    const gameInfo = response.data;

    if (gameInfo.header?.competitions?.[0]) {
      const competition = gameInfo.header.competitions[0];
      const competitors = competition.competitors || [];
      const homeTeam = competitors.find((c: any) => c.homeAway === 'home');
      const awayTeam = competitors.find((c: any) => c.homeAway === 'away');

      if (homeTeam && awayTeam) {
        // Helper function to get logo URL
        const getTeamLogo = (team: any): string => {
          if (team.team?.logo) return team.team.logo;
          if (team.team?.logos?.[0]?.href) return team.team.logos[0].href;
          return '';
        };

        const homeLogo = getTeamLogo(homeTeam);
        const awayLogo = getTeamLogo(awayTeam);

        if (homeLogo && awayLogo) {
          return { awayLogo, homeLogo };
        }
      }
    }

    logger.warn(`Could not extract team logos for game ${gameId}`);
    return null;
  } catch (error) {
    logger.error(`Error fetching team logos for game ${gameId}: ${error}`);
    return null;
  }
}

async function addTeamLogosToPickDocs(dryRun: boolean = true) {
  const db = admin.firestore();

  logger.info(`Starting team logos migration (${dryRun ? 'DRY RUN' : 'LIVE MODE'})...`);

  try {
    // Get all user documents
    const usersSnapshot = await db.collection('gamePicks').listDocuments();

    let totalUsers = 0;
    let totalGames = 0;
    let successfulUpdates = 0;
    let skippedUpdates = 0;
    let failedUpdates = 0;

    for (const userRef of usersSnapshot) {
      const userId = userRef.id;
      totalUsers++;

      logger.info(`\nProcessing user: ${userId}`);

      // Get all game picks for this user
      const picksSnapshot = await userRef.collection('picks').get();

      if (picksSnapshot.empty) {
        logger.info(`  No picks found for user ${userId}`);
        continue;
      }

      for (const pickDoc of picksSnapshot.docs) {
        const gameId = pickDoc.id;
        const data = pickDoc.data();
        totalGames++;

        // Skip if teamLogos already exists
        if (data.teamLogos) {
          logger.info(`  Game ${gameId}: teamLogos already exists, skipping`);
          skippedUpdates++;
          continue;
        }

        logger.info(`  Game ${gameId}: fetching team logos...`);

        // Fetch team logos from ESPN API
        const teamLogos = await fetchTeamLogos(gameId);

        if (!teamLogos) {
          logger.warn(`  Game ${gameId}: failed to fetch team logos`);
          failedUpdates++;
          continue;
        }

        logger.info(`  Game ${gameId}: found logos - Away: ${teamLogos.awayLogo.substring(0, 50)}...`);
        logger.info(`  Game ${gameId}: found logos - Home: ${teamLogos.homeLogo.substring(0, 50)}...`);

        if (!dryRun) {
          try {
            await pickDoc.ref.update({
              teamLogos: {
                awayLogo: teamLogos.awayLogo,
                homeLogo: teamLogos.homeLogo
              }
            });
            logger.info(`  Game ${gameId}: ✅ Updated successfully`);
            successfulUpdates++;
          } catch (error) {
            logger.error(`  Game ${gameId}: ❌ Failed to update: ${error}`);
            failedUpdates++;
          }
        } else {
          logger.info(`  Game ${gameId}: [DRY RUN] Would update with team logos`);
          successfulUpdates++;
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    logger.info('\n' + '='.repeat(60));
    logger.info('Migration Summary:');
    logger.info(`  Mode: ${dryRun ? 'DRY RUN (no changes made)' : 'LIVE MODE (changes written)'}`);
    logger.info(`  Users processed: ${totalUsers}`);
    logger.info(`  Games processed: ${totalGames}`);
    logger.info(`  Successful updates: ${successfulUpdates}`);
    logger.info(`  Skipped (already has logos): ${skippedUpdates}`);
    logger.info(`  Failed updates: ${failedUpdates}`);
    logger.info('='.repeat(60));

    if (dryRun) {
      logger.info('\nTo perform the actual migration, run with --live flag');
    } else {
      logger.info('\n✅ Migration completed!');
    }

  } catch (error) {
    logger.error(`Migration failed: ${error}`);
    throw error;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--live');

  await addTeamLogosToPickDocs(dryRun);
  process.exit(0);
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    logger.error(`Script failed: ${error}`);
    process.exit(1);
  });
}

export { addTeamLogosToPickDocs };
