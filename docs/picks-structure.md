# Picks Collection Structure (Post-Migration)

## Document ID
- `picks/{gameId}:{displayName}`

## Fields
- `email` (string): User email
- `displayName` (string): User display name used in docId
- `gameId` (string): ESPN game identifier
- `picks` (array): Pick submissions (latest appended)
  - Each pick item:
    - `players` (array): Athlete entries
      - `id` (string)
      - `displayName` (string)
      - `shortName` (string)
      - `position` (string, optional)
      - `jersey` (string|number, optional)
      - `headshot` (string, optional URL)
      - `team` (object, optional): `{ id, logo }`
    - `totalScore` (number)
    - `timestamp` (ISO string)
    - `playerHistory` (object, optional): `{ [playerId]: [{ start: ISO, end?: ISO }] }`
  - Picks are appended via `FieldValue.arrayUnion`
- `timestamp` (Firestore serverTimestamp): Last update time for the doc
- `teamData` (object, optional):
  - `league`: `"nba" | "nfl"`
  - `homeTeam`: `{ name, abbreviation }
  - `awayTeam`: `{ name, abbreviation }
  - `gameId`: string (if provided)
- `teamLogos` (object, optional legacy): `{ awayLogo, homeLogo }`

## Users Collection (related)
- `users/{email}`
  - `gameIds` (array): Games the user has picks in
  - `lastUpdated` (serverTimestamp)
  - Other user profile fields

## Migration Behavior
- Old doc IDs `gameId:email` are renamed to `gameId:displayName`.
- Fields normalized: add `email`, add `displayName`, remove `userId`.
- If target doc already exists, picks are merged and old doc is deleted.
- Script: `npx ts-node server/scripts/renamePicksToDisplayName.ts [--dry-run]`
