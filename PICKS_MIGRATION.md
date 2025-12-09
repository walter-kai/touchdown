# Picks Array Migration

## Overview
This migration converts the gamepicks structure from a single pick per user to an array-based structure that supports multiple pick submissions, similar to the play-by-play implementation.

## Changes Made

### Database Structure

**Old Structure:**
```
gamePicks/{gameId}/users/{userId}
  ├── players: [...]
  ├── totalScore: number
  ├── lockedAt: number
  └── timestamp: Timestamp
```

**New Structure:**
```
gamePicks/{gameId}/users/{userId}
  ├── picks: [
  │     {
  │       players: [...],
  │       totalScore: number,
  │       lockedAt: number,
  │       timestamp: Timestamp
  │     },
  │     ...
  │   ]
  └── lastUpdated: Timestamp
```

### Benefits

1. **Multiple Picks Per User**: Users can now submit multiple picks for the same game
2. **Pick History**: Track all pick submissions over time
3. **Consistent Structure**: Matches the play-by-play array-based pattern
4. **No Data Loss**: Each submission is preserved in the array

### Backend Changes

#### Files Modified:
- `server/api/picks/picks.service.ts` - Updated to use array structure with `arrayUnion`
- `server/api/picks/picks.controller.ts` - Added new endpoints for latest pick and history
- `server/api/picks/picks.route.ts` - Added new routes
- `package.json` - Added migration script

#### New Functions:
- `getLatestUserPick(userId, gameId)` - Get most recent pick only
- `getUserPickHistory(userId, gameId)` - Get all picks sorted by time

#### New API Endpoints:
- `GET /api/picks/game/:gameId/user/latest` - Returns the most recent pick
- `GET /api/picks/game/:gameId/user/history` - Returns all picks with history

### Frontend Changes

#### Files Modified:
- `client/src/pages/nfl/scoreboard/PlayerPick.tsx` - Updated to read from picks array
- `client/src/components/nfl/SelectedAthletes.tsx` - Updated to read from picks array

Both components now:
- Access `result.picks.picks` array from API response
- Get the latest pick using `result.picks.picks[length - 1]`
- Fall back to localStorage if backend fails

### Migration Script

**File:** `server/scripts/migrate-picks.ts`

**What it does:**
1. Scans all games in the `gamePicks` collection
2. For each user with picks:
   - Checks if already migrated (has `picks` array)
   - If in old format (has `players` directly), converts to array format
   - Wraps existing data in a picks array
   - Removes old fields
3. Provides detailed progress logging

**How to run:**
```bash
npm run migrate:picks
```

**Output Example:**
```
🚀 Starting picks migration...

Found 5 games with picks

📦 Processing game: 401671792
  Found 12 users with picks
  → Migrating user user@example.com...
  ✓ User user@example.com migrated successfully
  ...

✅ Migration complete!
   Games processed: 5
   Users processed: 12
   Users migrated: 10
   Already migrated: 2
```

## Usage Examples

### Submitting a Pick (No Change)
```typescript
// POST /api/picks
{
  gameId: "401671792",
  picksState: {
    players: [...],
    totalScore: 0,
    lockedAt: null
  }
}
```

### Getting All User Picks
```typescript
// GET /api/picks/game/:gameId/user
// Response:
{
  ok: true,
  picks: {
    picks: [
      {
        players: [...],
        totalScore: 0,
        lockedAt: null,
        timestamp: "2025-12-08T..."
      },
      ...
    ],
    lastUpdated: "2025-12-08T...",
    totalPicks: 3
  }
}
```

### Getting Latest Pick Only
```typescript
// GET /api/picks/game/:gameId/user/latest
// Response:
{
  ok: true,
  pick: {
    players: [...],
    totalScore: 0,
    lockedAt: null,
    timestamp: "2025-12-08T..."
  }
}
```

### Getting Pick History
```typescript
// GET /api/picks/game/:gameId/user/history
// Response:
{
  ok: true,
  history: [
    { players: [...], timestamp: "2025-12-08T10:00:00Z", ... },
    { players: [...], timestamp: "2025-12-08T11:30:00Z", ... },
    { players: [...], timestamp: "2025-12-08T13:15:00Z", ... }
  ],
  totalPicks: 3
}
```

## Testing

After migration, verify:
1. ✅ Existing picks are preserved in array format
2. ✅ New picks append to the array
3. ✅ Frontend displays the latest pick correctly
4. ✅ Multiple submissions work without overwriting previous picks
5. ✅ API endpoints return expected data structure

## Rollback

If needed, you can manually revert by:
1. Reading the first item from the `picks` array
2. Setting its fields directly on the user document
3. Removing the `picks` array field

This is not recommended as it will lose pick history data.
