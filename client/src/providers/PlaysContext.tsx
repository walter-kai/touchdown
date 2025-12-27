import React from 'react';
import { PlayNfl } from '@/types/espn/plays';

interface PlaysContextValue {
  playLog: PlayNfl[];
  lastUpdated?: Date | null;
  isRefreshing?: boolean;
  countdown?: number;
  homeScore?: number;
  awayScore?: number;
  refresh?: () => void | Promise<void>;
}

const PlaysContext = React.createContext<PlaysContextValue>({
  playLog: []
});

export const usePlays = () => React.useContext(PlaysContext);

interface PlaysProviderProps extends PlaysContextValue {
  children: React.ReactNode;
}

export const PlaysProvider: React.FC<PlaysProviderProps> = ({
  children,
  playLog,
  lastUpdated = null,
  isRefreshing = false,
  countdown = 0,
  homeScore,
  awayScore,
  refresh
}) => {
  const value = React.useMemo(
    () => ({ playLog, lastUpdated, isRefreshing, countdown, homeScore, awayScore, refresh }),
    [playLog, lastUpdated, isRefreshing, countdown, homeScore, awayScore, refresh]
  );

  return <PlaysContext.Provider value={value}>{children}</PlaysContext.Provider>;
};

export default PlaysContext;
