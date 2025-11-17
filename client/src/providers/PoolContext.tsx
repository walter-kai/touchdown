import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PoolData } from '../../../types/subgraph/Pools';
import { authenticatedFetch } from '../utils/jwtStorage';

export interface DailyPoolsData {
  dates: {
    today: string;
    yesterday: string;
  };
  pools: {
    today: {
      date: string;
      poolCount: number;
      lastUpdated: any;
      pools: PoolData[];
    } | null;
    yesterday: {
      date: string;
      poolCount: number;
      lastUpdated: any;
      pools: PoolData[];
    } | null;
  };
}

interface PoolContextType {
  availablePools: PoolData[] | null;
  dailyPoolsData: DailyPoolsData | null;
  loading: boolean;
  dailyPoolsLoading: boolean;
  getPools: () => Promise<PoolData[] | null>;
  getDailyPools: () => Promise<DailyPoolsData | null>;
}

const PoolContext = createContext<PoolContextType>({
  availablePools: null,
  dailyPoolsData: null,
  loading: false,
  dailyPoolsLoading: false,
  getPools: async () => null,
  getDailyPools: async () => null
});

export const usePools = () => useContext(PoolContext);

export const PoolProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [availablePools, setAvailablePools] = useState<PoolData[] | null>(null);
  const [dailyPoolsData, setDailyPoolsData] = useState<DailyPoolsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [dailyPoolsLoading, setDailyPoolsLoading] = useState<boolean>(false);

  const getPools = async (): Promise<PoolData[] | null> => {
    // If we already have pools data, return it immediately
    if (availablePools) {
      return availablePools;
    }
    
    try {
      setLoading(true);
      const response = await authenticatedFetch("/api/subgraph/pools");
      if (!response.ok) throw new Error("Failed to fetch pools");
      const data = await response.json();
      setAvailablePools(data.pools);
      return data.pools;
    } catch (error) {
      console.error("Error fetching pools:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getDailyPools = async (): Promise<DailyPoolsData | null> => {
    // If we already have daily pools data, return it immediately
    if (dailyPoolsData) {
      return dailyPoolsData;
    }
    
    try {
      setDailyPoolsLoading(true);
      const response = await authenticatedFetch('/api/subgraph/dailyPools');
      if (!response.ok) throw new Error('Failed to fetch daily pools data');
      const data = await response.json();
      setDailyPoolsData(data);
      return data;
    } catch (error) {
      console.error("Error fetching daily pools:", error);
      return null;
    } finally {
      setDailyPoolsLoading(false);
    }
  };

  return (
    <PoolContext.Provider value={{ 
      availablePools, 
      dailyPoolsData,
      loading, 
      dailyPoolsLoading,
      getPools,
      getDailyPools 
    }}>
      {children}
    </PoolContext.Provider>
  );
};
