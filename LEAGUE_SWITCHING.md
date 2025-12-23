# League Switching Implementation

## Overview
The application now supports switching between NFL Drive and NBA Drive modes. This is implemented using a React Context provider pattern with persistent storage.

## Components

### 1. LeagueProvider (`/src/providers/LeagueContext.tsx`)
- **Purpose**: Global state management for the active league
- **Features**:
  - Stores current league selection (NFL or NBA)
  - Persists selection to localStorage
  - Provides league configuration (colors, API paths, display names)
  - Helper function `getApiPath()` to transform API endpoints

### 2. LoginNav Dropdown (`/src/components/common/navs/LoginNav.tsx`)
- **Location**: Left side of the navigation bar
- **Features**:
  - Dropdown button showing current league icon (football/basketball)
  - Click to open dropdown menu
  - Select between NFL Drive and NBA Drive
  - Automatically closes when clicking outside
  - Navigates to home page when switching leagues

### 3. API Utilities (`/src/utils/leagueApi.ts`)
- **Purpose**: Helper functions for league-aware API calls
- **Functions**:
  - `getScoreboardUrl(league)` - Get scoreboard endpoint for league
  - `getLeagueApiPath(league)` - Get base API path
  - `getEventApiUrl(league, eventId)` - Get event/game details
  - `getTeamApiUrl(league, teamId)` - Get team information
  - `getPlayerApiUrl(league, playerId)` - Get player/athlete information

## Usage

### Using the League Context

```typescript
import { useLeague } from '../providers/LeagueContext';

function MyComponent() {
  const { league, leagueConfig, setLeague, getApiPath } = useLeague();
  
  // Current league: 'nfl' | 'nba'
  console.log(league);
  
  // League configuration
  console.log(leagueConfig.displayName); // "NFL Drive" or "NBA Drive"
  console.log(leagueConfig.color); // Primary color for the league
  
  // Change league
  setLeague('nba');
  
  // Transform API endpoint
  const apiUrl = getApiPath('v2/sports/football/leagues/nfl/events/123');
  // Returns correct path based on current league
}
```

### Using API Utilities

```typescript
import { getScoreboardUrl, getEventApiUrl } from '../utils/leagueApi';
import { useLeague } from '../providers/LeagueContext';

function FetchScores() {
  const { league } = useLeague();
  
  const fetchScoreboard = async () => {
    const url = getScoreboardUrl(league);
    const response = await fetch(url);
    const data = await response.json();
    return data;
  };
  
  const fetchGameDetails = async (gameId: string) => {
    const url = getEventApiUrl(league, gameId);
    const response = await fetch(url);
    return response.json();
  };
}
```

## API Endpoint Mappings

### NFL (Football)
- Base path: `v2/sports/football/leagues/nfl`
- Scoreboard: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`
- Events: `https://site.api.espn.com/apis/site/v2/sports/football/leagues/nfl/events/{eventId}`
- Teams: `https://site.api.espn.com/apis/site/v2/sports/football/leagues/nfl/teams/{teamId}`
- Athletes: `https://site.api.espn.com/apis/common/v3/sports/football/nfl/athletes/{playerId}`

### NBA (Basketball)
- Base path: `v2/sports/basketball/leagues/nba`
- Scoreboard: `https://cdn.espn.com/core/nba/scoreboard?xhr=1&limit=50`
- Events: `https://site.api.espn.com/apis/site/v2/sports/basketball/leagues/nba/events/{eventId}`
- Teams: `https://site.api.espn.com/apis/site/v2/sports/basketball/leagues/nba/teams/{teamId}`
- Athletes: `https://site.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/{playerId}`
GETS ALL PLAYS FOR A GAME: Example: https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401220181/competitions/401220181/plays?limit=400

## League Configuration

Each league has its own configuration:

```typescript
{
  nfl: {
    name: 'nfl',
    displayName: 'NFL Drive',
    sport: 'football',
    apiPath: 'v2/sports/football/leagues/nfl',
    color: '#00FFE7', // neon-cyan
    secondaryColor: '#FAAFE8', // neon-pink
  },
  nba: {
    name: 'nba',
    displayName: 'NBA Drive',
    sport: 'basketball',
    apiPath: 'v2/sports/basketball/leagues/nba',
    color: '#FF6B35', // basketball orange
    secondaryColor: '#4ECDC4', // teal
  }
}
```

## Next Steps

To fully integrate NBA support:

1. **Update API calls**: Replace hardcoded ESPN API URLs with league-aware utilities
2. **Create NBA components**: Build NBA-specific pages (games, teams, players)
3. **Adapt visualizations**: Modify field/court visualizations for basketball
4. **Update routing**: Add NBA-specific routes in App.tsx
5. **Style adjustments**: Use league colors from configuration
6. **Data transformations**: Handle differences in ESPN's NFL vs NBA data structures

## Testing

1. Switch between leagues using the dropdown
2. Verify localStorage persists the selection (check DevTools -> Application -> Local Storage)
3. Refresh the page - should remember last selected league
4. Check that API utility functions return correct URLs for each league
