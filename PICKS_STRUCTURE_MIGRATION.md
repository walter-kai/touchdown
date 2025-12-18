# Firebase Picks Migration Guide

## Overview

This migration restructures the Firebase database from a **game-first** organization to a **user-first** organization to dramatically reduce the number of queries needed and improve performance.

## Problem

The current structure requires polling each game individually:

```
gamePicks/{gameId}/users/{userId}
```

When a user has picks in 10 games, the frontend must make **10+ separate queries** to fetch all user data, leading to:
- Excessive API calls
- High Firebase read costs
- Slow page loads
- Unnecessary server processing

## Solution

The new structure organizes data by user first:

```
gamePicks/{userId}
  - gameIds: [array of game IDs]
  - lastUpdated: timestamp
  - picks/{gameId} (subcollection)
      - picks: []
      - timestamp: last update
```

### Benefits

1. **Single query to get all user games**: `gamePicks/{userId}` returns the list of all games
2. **Efficient batch reads**: Can fetch multiple game picks in parallel
3. **Reduced API calls**: Instead of querying each game, query the user once
4. **Lower costs**: Significantly fewer Firebase reads
5. **Faster performance**: Less network overhead

## Migration Steps

### Step 1: Run Migration (Dry Run)

First, preview what will happen without making changes:

```bash
npm run migrate:picks-to-user migrate
```

This will:
- Read all existing game-based data
- Show what would be created in the new structure
- Display statistics (games, users, picks)
- **NOT** write any data

### Step 2: Run Migration (Live)

Once you've verified the dry run looks correct:

```bash
npm run migrate:picks-to-user migrate --live
```

This will:
- Read all existing data from the old structure
- Create new user-based documents
- Preserve all pick data and timestamps
- Run in batches to respect Firestore limits

**Note**: This creates the new structure **alongside** the old one. Both will exist temporarily.

### Step 3: Verify Migration

Verify the migration completed successfully:

```bash
npm run migrate:picks-to-user verify
```

This will:
- Check all users in the new structure
- Verify gameIds arrays match picks subcollections
- Compare data integrity
- Report any issues

### Step 4: Update Application Code

Replace the picks service with the new implementation:

```bash
# Backup the old service
mv server/api/picks/picks.service.ts server/api/picks/picks.service.old.ts

# Use the new service
mv server/api/picks/picks.service.new.ts server/api/picks/picks.service.ts
```

### Step 5: Test Application

1. Start your development server
2. Test all pick-related functionality:
   - Creating picks
   - Viewing picks for a game
   - Viewing all user picks
   - Score calculations
3. Monitor logs for any errors
4. Check Firebase console to verify data structure

### Step 6: Cleanup Old Structure (Optional)

Once you've verified everything works, you can remove the old structure:

⚠️ **WARNING**: Only do this after thorough testing! This is irreversible.

```javascript
// Create a cleanup script if needed
// Example: Delete old game-based structure
const db = admin.firestore();
const gamesSnapshot = await db.collection('gamePicks').listDocuments();

for (const gameRef of gamesSnapshot) {
  // Check if this is an old game document (has 'users' subcollection)
  const usersSnapshot = await gameRef.collection('users').limit(1).get();
  
  if (!usersSnapshot.empty) {
    // This is an old structure, delete it
    await gameRef.delete();
  }
}
```

## API Changes

The public API remains the same! All functions have the same signatures:

- `createPick(args)` - Same
- `getUserPicksForGame(userId, gameId)` - Same
- `getAllPicksForGame(gameId)` - Same (but less efficient, consider alternatives)
- `getLatestUserPick(userId, gameId)` - Same
- `getUserPickHistory(userId, gameId)` - Same
- `calculateAthleteScores(userId, gameId, playLog)` - Same
- `getAllUserPicksAcrossGames(userId)` - **MUCH FASTER** ⚡

## Performance Improvements

### Before (Game-First)

User with picks in 10 games:
```
GET /api/picks/user/all
├─ Query gamePicks (list all games)          [1 read]
├─ Query gamePicks/{game1}/users/{user}      [1 read]
├─ Query gamePicks/{game2}/users/{user}      [1 read]
├─ ... (8 more queries)
└─ Total: 11 reads
```

### After (User-First)

User with picks in 10 games:
```
GET /api/picks/user/all
├─ Query gamePicks/{userId}                  [1 read]
└─ Query gamePicks/{userId}/picks/*          [1 read]
└─ Total: 2 reads
```

**Result**: 82% reduction in database reads! 🎉

## Rollback Plan

If issues arise:

1. Stop the application
2. Revert the service file:
   ```bash
   mv server/api/picks/picks.service.old.ts server/api/picks/picks.service.ts
   ```
3. Restart the application

The old structure is still intact (if you haven't deleted it), so the application will work immediately.

## Notes

- The migration is idempotent - you can run it multiple times safely
- Both structures can coexist temporarily
- No data is deleted during migration
- All timestamps are preserved
- The migration respects Firestore's 500 operations per batch limit

## Support

If you encounter issues:

1. Check the logs for error messages
2. Run the verify command to check data integrity
3. Ensure Firebase credentials are properly configured
4. Make sure you have sufficient Firestore permissions
