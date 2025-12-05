import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Player {
  id: string;
  displayName: string;
  shortName: string;
  position: {
    abbreviation: string;
  };
  headshot?: string;
  jersey?: string;
  team?: {
    id: string;
    logo: string;
  };
}

interface PicksState {
  players: Player[];
  lockedAt: number | null;
  totalScore: number;
}

interface PicksContextType {
  getPicks: (homeTeamId: string, awayTeamId: string) => PicksState | null;
  getPicksWithHeadshots: (homeTeamId: string, awayTeamId: string) => PicksState | null;
  savePicks: (homeTeamId: string, awayTeamId: string, picks: PicksState) => void;
  clearPicks: (homeTeamId: string, awayTeamId: string) => void;
  updateScore: (homeTeamId: string, awayTeamId: string, totalScore: number) => void;
  isLocked: (homeTeamId: string, awayTeamId: string) => boolean;
  getCooldownTime: (homeTeamId: string, awayTeamId: string) => number;
  getPlayers: (homeTeamId: string, awayTeamId: string) => Player[];
}

const PicksContext = createContext<PicksContextType | undefined>(undefined);

export const PicksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [picksCache, setPicksCache] = useState<Record<string, PicksState>>({});

  const getKey = (homeTeamId: string, awayTeamId: string) => `playerPick_${homeTeamId}_${awayTeamId}`;

  // Load picks from localStorage
  const getPicks = (homeTeamId: string, awayTeamId: string): PicksState | null => {
    const key = getKey(homeTeamId, awayTeamId);
    
    // Check cache first
    if (picksCache[key]) {
      return picksCache[key];
    }

    // Load from localStorage
    const savedState = localStorage.getItem(key);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setPicksCache(prev => ({ ...prev, [key]: parsed }));
        return parsed;
      } catch (e) {
        console.error('Error parsing picks:', e);
        return null;
      }
    }
    return null;
  };

  // Save picks to localStorage and cache
  const savePicks = (homeTeamId: string, awayTeamId: string, picks: PicksState) => {
    const key = getKey(homeTeamId, awayTeamId);
    localStorage.setItem(key, JSON.stringify(picks));
    setPicksCache(prev => ({ ...prev, [key]: picks }));
  };

  // Clear picks from localStorage and cache
  const clearPicks = (homeTeamId: string, awayTeamId: string) => {
    const key = getKey(homeTeamId, awayTeamId);
    localStorage.removeItem(key);
    setPicksCache(prev => {
      const newCache = { ...prev };
      delete newCache[key];
      return newCache;
    });
  };

  // Update just the score
  const updateScore = (homeTeamId: string, awayTeamId: string, totalScore: number) => {
    const picks = getPicks(homeTeamId, awayTeamId);
    if (picks) {
      savePicks(homeTeamId, awayTeamId, { ...picks, totalScore });
    }
  };

  // Check if picks are locked
  const isLocked = (homeTeamId: string, awayTeamId: string): boolean => {
    const picks = getPicks(homeTeamId, awayTeamId);
    if (!picks || !picks.lockedAt) return false;
    
    const elapsed = Date.now() - picks.lockedAt;
    const remaining = 120000 - elapsed; // 2 minutes
    return remaining > 0;
  };

  // Get remaining cooldown time in seconds
  const getCooldownTime = (homeTeamId: string, awayTeamId: string): number => {
    const picks = getPicks(homeTeamId, awayTeamId);
    if (!picks || !picks.lockedAt) return 0;
    
    const elapsed = Date.now() - picks.lockedAt;
    const remaining = 120000 - elapsed; // 2 minutes
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  };

  // Get picks with guaranteed headshots (only returns picks that have headshots)
  const getPicksWithHeadshots = (homeTeamId: string, awayTeamId: string): PicksState | null => {
    const picks = getPicks(homeTeamId, awayTeamId);
    if (!picks) return null;
    
    // Filter out players without headshots
    const playersWithHeadshots = picks.players.filter(player => player.headshot);
    
    if (playersWithHeadshots.length === 0) return null;
    
    return {
      ...picks,
      players: playersWithHeadshots
    };
  };

  // Get just the players array
  const getPlayers = (homeTeamId: string, awayTeamId: string): Player[] => {
    const picks = getPicks(homeTeamId, awayTeamId);
    return picks?.players || [];
  };

  return (
    <PicksContext.Provider value={{ 
      getPicks, 
      getPicksWithHeadshots,
      savePicks, 
      clearPicks, 
      updateScore, 
      isLocked, 
      getCooldownTime,
      getPlayers
    }}>
      {children}
    </PicksContext.Provider>
  );
};

export const usePicks = () => {
  const context = useContext(PicksContext);
  if (!context) {
    throw new Error('usePicks must be used within a PicksProvider');
  }
  return context;
};
