import React, { createContext, useContext, useState, useEffect } from 'react';

export type LeagueType = 'nfl' | 'nba';

interface LeagueConfig {
  name: string;
  displayName: string;
  sport: string;
  apiPath: string;
  color: string;
  secondaryColor: string;
}

const leagueConfigs: Record<LeagueType, LeagueConfig> = {
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
  },
};

interface LeagueContextType {
  league: LeagueType;
  leagueConfig: LeagueConfig;
  setLeague: (league: LeagueType) => void;
  getApiPath: (endpoint: string) => string;
}

const LeagueContext = createContext<LeagueContextType | undefined>(undefined);

export const LeagueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [league, setLeagueState] = useState<LeagueType>(() => {
    // Load from localStorage or default to NFL
    const saved = localStorage.getItem('selectedLeague');
    return (saved === 'nba' ? 'nba' : 'nfl') as LeagueType;
  });

  const leagueConfig = leagueConfigs[league];

  const setLeague = (newLeague: LeagueType) => {
    setLeagueState(newLeague);
    localStorage.setItem('selectedLeague', newLeague);
  };

  const getApiPath = (endpoint: string) => {
    // Replace the league-specific path in the endpoint
    if (endpoint.includes('v2/sports/football/leagues/nfl')) {
      return endpoint.replace('v2/sports/football/leagues/nfl', leagueConfig.apiPath);
    }
    if (endpoint.includes('v2/sports/basketball/leagues/nba')) {
      return endpoint.replace('v2/sports/basketball/leagues/nba', leagueConfig.apiPath);
    }
    return endpoint;
  };

  return (
    <LeagueContext.Provider value={{ league, leagueConfig, setLeague, getApiPath }}>
      {children}
    </LeagueContext.Provider>
  );
};

export const useLeague = () => {
  const context = useContext(LeagueContext);
  if (context === undefined) {
    throw new Error('useLeague must be used within a LeagueProvider');
  }
  return context;
};
