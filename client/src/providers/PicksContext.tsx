import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import axios from 'axios';
import { jwtStorage } from '../utils/jwtStorage';
import { debugLog } from '@/utils/debugLog';
import { useLeague } from './LeagueContext';

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

interface AthleteScores {
  gameScores: Record<string, number>; // athleteId -> game score (all plays)
  sessionScores: Record<string, number>; // athleteId -> session score (time-filtered for current pick)
  userScores: Record<string, number>; // athleteId -> user score (accumulated across all sessions)
  totalScore: number; // sum of all user scores
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
  // New scoring methods
  fetchScores: (gameId: string) => Promise<AthleteScores | null>;
  getScores: (gameId: string) => AthleteScores | null;
  refreshScores: (gameId: string) => Promise<void>;
}

const PicksContext = createContext<PicksContextType | undefined>(undefined);

export const PicksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [picksCache, setPicksCache] = useState<Record<string, PicksState>>({});
  const [scoresCache, setScoresCache] = useState<Record<string, AthleteScores>>({});
  const fetchingRef = React.useRef<Set<string>>(new Set());
  const { league } = useLeague();

  const getKey = (homeTeamId: string, awayTeamId: string) => `playerPick_${homeTeamId}_${awayTeamId}`;

  // Load picks from localStorage
  const getPicks = (homeTeamId: string, awayTeamId: string): PicksState | null => {
    const key = getKey(homeTeamId, awayTeamId);
    
    // Check cache first
    if (picksCache[key]) {
      return picksCache[key];
    }

    // Load from localStorage (don't update cache during render)
    const savedState = localStorage.getItem(key);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        return parsed;
      } catch (e) {
        console.error('Error parsing picks:', e);
        return null;
      }
    }
    return null;
  };

  // Save picks to localStorage and cache
  const savePicks = async (homeTeamId: string, awayTeamId: string, picks: PicksState) => {
    const key = getKey(homeTeamId, awayTeamId);
    localStorage.setItem(key, JSON.stringify(picks));
    setPicksCache(prev => ({ ...prev, [key]: picks }));

    // If this represents a lock-in, also persist to backend (Firebase via server)
    if (picks.lockedAt) {
      try {
        const token = localStorage.getItem('dexter_access_token');
        const resp = await fetch('/api/picks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            homeTeamId,
            awayTeamId,
            picksState: picks,
          })
        });
        if (!resp.ok) {
          const detail = await resp.text().catch(() => '');
          console.error('Failed to persist pick lock-in:', resp.status, detail);
        } else {
          const json = await resp.json().catch(() => ({} as any));
          debugLog('Persisted pick lock-in:', json);
        }
      } catch (e) {
        console.error('Error persisting pick lock-in:', e);
      }
    }
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

  // Fetch scores from API - memoized to prevent infinite loops
  const fetchScores = useCallback(async (gameId: string): Promise<AthleteScores | null> => {
    // Prevent duplicate fetches
    if (fetchingRef.current.has(gameId)) {
      debugLog(`⏳ Already fetching scores for game ${gameId}, skipping...`);
      return null;
    }

    try {
      fetchingRef.current.add(gameId);
      
      const token = jwtStorage.getToken();
      if (!token) {
        console.warn('No auth token, cannot fetch scores');
        fetchingRef.current.delete(gameId);
        return null;
      }

      debugLog(`📊 Fetching scores for game ${gameId} from API...`);
      const response = await axios.get(`/api/picks/game/${gameId}/user/scores`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          league // Pass league parameter
        }
      });

      debugLog(`📊 Response from scores API:`, response.data);

      if (response.data.ok) {
        const scores: AthleteScores = {
          gameScores: response.data.gameScores,
          sessionScores: response.data.sessionScores,
          userScores: response.data.userScores,
          totalScore: response.data.totalScore
        };
        
        // Cache the scores
        setScoresCache(prev => ({ ...prev, [gameId]: scores }));
        debugLog(`✅ Scores cached for game ${gameId}:`, scores);
        
        fetchingRef.current.delete(gameId);
        return scores;
      }
      
      fetchingRef.current.delete(gameId);
      return null;
    } catch (error) {
      console.error('Error fetching scores:', error);
      fetchingRef.current.delete(gameId);
      return null;
    }
  }, []);

  // Get cached scores - memoized to prevent infinite loops
  const getScores = useCallback((gameId: string): AthleteScores | null => {
    return scoresCache[gameId] || null;
  }, [scoresCache]);

  // Refresh scores (force re-fetch) - memoized to prevent infinite loops
  const refreshScores = useCallback(async (gameId: string): Promise<void> => {
    await fetchScores(gameId);
  }, [fetchScores]);

  return (
    <PicksContext.Provider value={{ 
      getPicks, 
      getPicksWithHeadshots,
      savePicks, 
      clearPicks, 
      updateScore, 
      isLocked, 
      getCooldownTime,
      getPlayers,
      fetchScores,
      getScores,
      refreshScores
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
