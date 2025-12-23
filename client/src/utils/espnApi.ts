/**
 * League-aware API utility functions
 * 
 * These functions help construct API endpoints that are aware of the currently selected league.
 * 
 * NFL API structure: v2/sports/football/leagues/nfl/...
 * NBA API structure: v2/sports/basketball/leagues/nba/...
 * 
 * ESPN Scoreboard endpoints:
 * - NFL: https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard (direct structure)
 * - NBA: https://cdn.espn.com/core/nba/scoreboard?xhr=1&limit=50 (wrapped in content.sbData)
 * 
 * IMPORTANT: NBA scoreboard has a different structure - the actual scoreboard data
 * is nested inside response.content.sbData, not at the root level.
 * Use extractNBAScoreboardData() helper to normalize the response.
 */

export const getScoreboardUrl = (league: 'nfl' | 'nba'): string => {
  if (league === 'nba') {
    return 'https://cdn.espn.com/core/nba/scoreboard?xhr=1&limit=50';
  }
  return 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';
};

export const getLeagueApiPath = (league: 'nfl' | 'nba'): string => {
  if (league === 'nba') {
    return 'v2/sports/basketball/nba';
  }
  return 'v2/sports/football/nfl';
};

export const getEventApiUrl = (league: 'nfl' | 'nba', eventId: string): string => {
  const basePath = getLeagueApiPath(league);
  return `https://site.api.espn.com/apis/site/${basePath}/events/${eventId}`;
};

export const getTeamApiUrl = (league: 'nfl' | 'nba', teamId: string): string => {
  const basePath = getLeagueApiPath(league);
//   return `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/${teamId}`
  return `https://site.api.espn.com/apis/site/${basePath}/teams/${teamId}`;
};

export const getPlayerApiUrl = (league: 'nfl' | 'nba', playerId: string): string => {
  const sport = league === 'nba' ? 'basketball' : 'football';
  return `https://site.api.espn.com/apis/common/v3/sports/${sport}/${league}/athletes/${playerId}`;
};

export const getPlayerOverviewUrl = (league: 'nfl' | 'nba', playerId: string): string => {
  const sport = league === 'nba' ? 'basketball' : 'football';
  return `https://site.web.api.espn.com/apis/common/v3/sports/${sport}/${league}/athletes/${playerId}/overview`;
};

export const getPlayerBioUrl = (league: 'nfl' | 'nba', playerId: string): string => {
  const sport = league === 'nba' ? 'basketball' : 'football';
  return `https://site.web.api.espn.com/apis/common/v3/sports/${sport}/${league}/athletes/${playerId}`;
};

export const getSummaryUrl = (league: 'nfl' | 'nba', eventId: string): string => {
  const basePath = getLeagueApiPath(league);
  return `https://site.api.espn.com/apis/site/${basePath}/summary?event=${eventId}`;
};

export const getTeamScheduleUrl = (league: 'nfl' | 'nba', teamId: string): string => {
  const basePath = getLeagueApiPath(league);
  return `https://site.api.espn.com/apis/site/${basePath}/teams/${teamId}/schedule`;
};

export const getTeamProjectionUrl = (league: 'nfl' | 'nba', teamId: string, season: number = 2025): string => {
  const basePath = getLeagueApiPath(league);
  return `https://sports.core.api.espn.com/${basePath}/seasons/${season}/teams/${teamId}/projection`;
};

export const getTeamRecordUrl = (league: 'nfl' | 'nba', teamId: string, season: number = 2025, typeId: number = 2): string => {
  const basePath = getLeagueApiPath(league);
  return `https://sports.core.api.espn.com/${basePath}/seasons/${season}/types/${typeId}/teams/${teamId}/record`;
};

export const getNewsUrl = (league: 'nfl' | 'nba', params?: { team?: string }): string => {
  const sport = league === 'nba' ? 'basketball' : 'football';
  const queryParams = new URLSearchParams();
  if (params?.team) queryParams.append('team', params.team);
  const queryString = queryParams.toString();
  return `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/news${queryString ? '?' + queryString : ''}`;
};

export const getProbabilitiesUrl = (league: 'nfl' | 'nba', gameId: string, competitionId: string): string => {
  const basePath = getLeagueApiPath(league);
const sport = league === 'nba' ? 'basketball' : 'football';
return `https://sports.core.api.espn.com/v2/sports/${sport}/leagues/${league}/events/${gameId}/competitions/${competitionId}/probabilities?limit=200`;
};

export const getPredictorUrl = (league: 'nfl' | 'nba', gameId: string, competitionId: string): string => {
const sport = league === 'nba' ? 'basketball' : 'football';
return `https://sports.core.api.espn.com/v2/sports/${sport}/leagues/${league}/events/${gameId}/competitions/${competitionId}/predictor`;
};

export const getPlaysUrl = (league: 'nfl' | 'nba', gameId: string, competitionId: string): string => {
  const sport = league === 'nba' ? 'basketball' : 'football';
  return `https://sports.core.api.espn.com/v2/sports/${sport}/leagues/${league}/events/${gameId}/competitions/${competitionId}/plays?limit=300&lang=en&region=us`;
};
