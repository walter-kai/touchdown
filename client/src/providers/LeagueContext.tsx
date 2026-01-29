'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

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
  getHeadshotUrl: (opts: {
    id?: string | number;
    headshot?: string | { href?: string } | null;
  } | null | undefined) => string;
  getHeadshotFromIdOrUrl: (id?: string | number, raw?: string) => string;
}

const LeagueContext = createContext<LeagueContextType | undefined>(undefined);

export const LeagueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  
  const [league, setLeagueState] = useState<LeagueType>(() => {
    // Check URL first for league context
    if (pathname.startsWith('/nba')) return 'nba';
    if (pathname.startsWith('/nfl')) return 'nfl';
    
    // Otherwise load from localStorage or default to NFL
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedLeague');
      return (saved === 'nba' ? 'nba' : 'nfl') as LeagueType;
    }
    return 'nfl';
  });

  // Update league based on URL changes
  useEffect(() => {
    if (pathname.startsWith('/nba')) {
      setLeagueState('nba');
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedLeague', 'nba');
      }
    } else if (pathname.startsWith('/nfl')) {
      setLeagueState('nfl');
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedLeague', 'nfl');
      }
    }
  }, [pathname]);

  const leagueConfig = leagueConfigs[league];

  const setLeague = (newLeague: LeagueType) => {
    setLeagueState(newLeague);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedLeague', newLeague);
    }
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

  // Headshot URL utilities that automatically use current league
  const getHeadshotUrl = (opts: {
    id?: string | number;
    headshot?: string | { href?: string } | null;
  } | null | undefined): string => {
    if (!opts) return '';
    const raw = (opts as any).headshot;
    const href = typeof raw === 'string' ? raw : raw?.href;
    if (href) return href;
    const id = (opts as any).id;
    if (!id) return '';
    const sport = leagueConfig.sport === 'basketball' ? 'nba' : 'nfl';
    return `https://a.espncdn.com/i/headshots/${sport}/players/full/${id}.png`;
  };

  const getHeadshotFromIdOrUrl = (id?: string | number, raw?: string): string => {
    if (raw) return raw;
    if (!id) return '';
    const sport = leagueConfig.sport === 'basketball' ? 'nba' : 'nfl';
    return `https://a.espncdn.com/i/headshots/${sport}/players/full/${id}.png`;
  };

  return (
    <LeagueContext.Provider value={{ league, leagueConfig, setLeague, getApiPath, getHeadshotUrl, getHeadshotFromIdOrUrl }}>
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
