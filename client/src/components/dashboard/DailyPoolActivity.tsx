import React, { useState, useEffect } from 'react';
import { FaChartBar, FaArrowUp, FaArrowDown, FaExchangeAlt } from 'react-icons/fa';

import LoadingScreenDots from '../common/LoadingScreenDots';
import { PoolData } from '../../../../types/subgraph/Pools';
import { usePools, DailyPoolsData } from '../../providers/PoolContext';

interface PoolWithChange extends PoolData {
  txCountChange?: number;
  txCountChangePercent?: number;
  volumeUSDChange?: number;
  volumeUSDChangePercent?: number;
  isNew?: boolean;
}

const DailyPoolActivity: React.FC = () => {
  const { getDailyPools, dailyPoolsLoading } = usePools();
  const [data, setData] = useState<DailyPoolsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortedPools, setSortedPools] = useState<PoolWithChange[]>([]);
  const [sortBy, setSortBy] = useState<'txCount' | 'txCountChange' | 'volumeUSD'>('txCount');
  const [viewMode, setViewMode] = useState<'all' | 'gainers' | 'losers'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const poolsData = await getDailyPools();
        if (poolsData) {
          setData(poolsData);
          processPools(poolsData);
        }
      } catch (err) {
        setError('Error fetching daily pools data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getDailyPools]);

  const processPools = (data: DailyPoolsData) => {
    if (!data.pools.today || !data.pools.today.pools) {
      setSortedPools([]);
      return;
    }

    const todayPools = data.pools.today.pools;
    const yesterdayPools = data.pools.yesterday?.pools || [];
    
    // Create map of yesterday's pools for quick lookup
    const yesterdayPoolsMap = new Map();
    yesterdayPools.forEach(pool => {
      yesterdayPoolsMap.set(pool.address, pool);
    });
    
    // Create enhanced pools with change calculations
    const enhancedPools = todayPools.map(todayPool => {
      const yesterdayPool = yesterdayPoolsMap.get(todayPool.address);
      const isNew = !yesterdayPool;
      
      // Calculate changes
      const txCountChange: number = yesterdayPool 
        ? Number(todayPool.txCount) - Number(yesterdayPool.txCount)
        : Number(todayPool.txCount);
        
      const txCountChangePercent: number = yesterdayPool && Number(yesterdayPool.txCount) > 0
        ? ((Number(todayPool.txCount) - Number(yesterdayPool.txCount)) / Number(yesterdayPool.txCount)) * 100
        : 100;
        
      const volumeUSDChange: number = yesterdayPool
        ? Number(todayPool.volumeUSD) - Number(yesterdayPool.volumeUSD)
        : Number(todayPool.volumeUSD);
        
      const volumeUSDChangePercent: number = yesterdayPool && Number(yesterdayPool.volumeUSD) > 0
        ? ((Number(todayPool.volumeUSD) - Number(yesterdayPool.volumeUSD)) / Number(yesterdayPool.volumeUSD)) * 100
        : 100;
        
      return {
        ...todayPool,
        txCountChange,
        txCountChangePercent,
        volumeUSDChange,
        volumeUSDChangePercent,
        isNew
      };
    });
    
    // Sort pools based on the current sort criteria
    sortPools(enhancedPools, sortBy);
  };

  const sortPools = (pools: PoolWithChange[], criteria: 'txCount' | 'txCountChange' | 'volumeUSD') => {
    let filtered = [...pools];
    
    // Apply view mode filter
    if (viewMode === 'gainers') {
      filtered = filtered.filter(pool => 
        (pool.txCountChange && pool.txCountChange > 0) || pool.isNew
      );
    } else if (viewMode === 'losers') {
      filtered = filtered.filter(pool => 
        pool.txCountChange !== undefined && pool.txCountChange < 0
      );
    }
    
    // Apply sort
    const sorted = filtered.sort((a, b) => {
      if (criteria === 'txCount') {
        return Number(b.txCount) - Number(a.txCount);
      } else if (criteria === 'txCountChange') {
        return (b.txCountChange || 0) - (a.txCountChange || 0);
      } else {
        return Number(b.volumeUSD) - Number(a.volumeUSD);
      }
    });
    
    // Take top 100
    setSortedPools(sorted.slice(0, 100));
  };

  useEffect(() => {
    if (data) {
      processPools(data);
    }
  }, [sortBy, viewMode]);

  const formatNumber = (num: number | undefined): string => {
    if (num === undefined) return '0';
    if (Math.abs(num) >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    } else if (Math.abs(num) >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    } else {
      return num.toFixed(2);
    }
  };

  const formatCurrency = (num: number | undefined): string => {
    if (num === undefined) return '$0';
    if (Math.abs(num) >= 1000000) {
      return '$' + (num / 1000000).toFixed(2) + 'M';
    } else if (Math.abs(num) >= 1000) {
      return '$' + (num / 1000).toFixed(2) + 'K';
    } else {
      return '$' + num.toFixed(2);
    }
  };

  if (loading || dailyPoolsLoading) {
    return (
      <div className="bg-[#181a23]/90 border-4 border-[#00ffe7]/40 rounded-2xl shadow-[0_0_12px_#00ffe7] p-6 flex flex-col h-full">
        <h2 className="text-xl font-bold text-[#00ffe7] mb-4 flex items-center gap-2">
          <FaChartBar /> Daily Pool Activity
        </h2>
        <div className="flex-grow flex items-center justify-center">
          <LoadingScreenDots />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#181a23]/90 border-4 border-[#00ffe7]/40 rounded-2xl shadow-[0_0_12px_#00ffe7] p-6 flex flex-col h-full">
        <h2 className="text-xl font-bold text-[#00ffe7] mb-4 flex items-center gap-2">
          <FaChartBar /> Daily Pool Activity
        </h2>
        <div className="text-red-400 flex-grow flex items-center justify-center">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#181a23]/90 border-4 border-[#00ffe7]/40 rounded-2xl shadow-[0_0_12px_#00ffe7] p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-[#00ffe7] flex items-center gap-2">
          <FaChartBar /> Daily Pool Activity
        </h2>
        <div className="text-sm text-[#e0e7ef]">
          {data?.dates.today}
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex flex-wrap justify-between gap-2 mb-4">
        <div className="flex gap-2">
          <button 
            className={`px-3 py-1 text-xs rounded-full ${sortBy === 'txCount' 
              ? 'bg-[#00ffe7] text-[#181a23] font-bold' 
              : 'bg-[#23263a] text-[#e0e7ef] hover:bg-[#00ffe7]/20'}`}
            onClick={() => setSortBy('txCount')}
          >
            Activity
          </button>
          <button 
            className={`px-3 py-1 text-xs rounded-full ${sortBy === 'txCountChange' 
              ? 'bg-[#00ffe7] text-[#181a23] font-bold' 
              : 'bg-[#23263a] text-[#e0e7ef] hover:bg-[#00ffe7]/20'}`}
            onClick={() => setSortBy('txCountChange')}
          >
            Change
          </button>
          <button 
            className={`px-3 py-1 text-xs rounded-full ${sortBy === 'volumeUSD' 
              ? 'bg-[#00ffe7] text-[#181a23] font-bold' 
              : 'bg-[#23263a] text-[#e0e7ef] hover:bg-[#00ffe7]/20'}`}
            onClick={() => setSortBy('volumeUSD')}
          >
            Volume
          </button>
        </div>
        
        <div className="flex gap-2">
          <button 
            className={`px-3 py-1 text-xs rounded-full ${viewMode === 'all' 
              ? 'bg-[#00ffe7] text-[#181a23] font-bold' 
              : 'bg-[#23263a] text-[#e0e7ef] hover:bg-[#00ffe7]/20'}`}
            onClick={() => setViewMode('all')}
          >
            All
          </button>
          <button 
            className={`px-3 py-1 text-xs rounded-full ${viewMode === 'gainers' 
              ? 'bg-[#00ff8c] text-[#181a23] font-bold' 
              : 'bg-[#23263a] text-[#e0e7ef] hover:bg-[#00ff8c]/20'}`}
            onClick={() => setViewMode('gainers')}
          >
            Gainers
          </button>
          <button 
            className={`px-3 py-1 text-xs rounded-full ${viewMode === 'losers' 
              ? 'bg-[#ff4a6d] text-[#181a23] font-bold' 
              : 'bg-[#23263a] text-[#e0e7ef] hover:bg-[#ff4a6d]/20'}`}
            onClick={() => setViewMode('losers')}
          >
            Losers
          </button>
        </div>
      </div>
      
      {/* Pool List */}
      <div className="flex-grow overflow-y-auto pr-1" style={{maxHeight: '350px'}}>
        {sortedPools.length === 0 ? (
          <div className="text-[#e0e7ef] text-center p-4">No pool data available</div>
        ) : (
          <div className="space-y-2">
            {sortedPools.map((pool, index) => (
              <div 
                key={pool.address}
                className="flex items-center p-2 bg-[#23263a] rounded-lg border border-[#00ffe7]/10 hover:border-[#00ffe7]/30 transition-all"
              >
                <div className="w-6 text-xs text-[#00ffe7]/60 text-right mr-2">
                  {index + 1}
                </div>
                
                <div className="flex items-center mr-3">
                  <div className="relative">
                    <img 
                      src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${pool.token0.imgId || 'default'}.png`}
                      alt={pool.token0.symbol}
                      className="w-6 h-6 rounded-full bg-[#23263a] border border-[#00ffe7]/20"
                    />
                    <img 
                      src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${pool.token1.imgId || 'default'}.png`}
                      alt={pool.token1.symbol}
                      className="w-6 h-6 rounded-full absolute -bottom-1 -right-1 bg-[#23263a] border border-[#00ffe7]/20"
                    />
                  </div>
                </div>
                
                <div className="flex-grow">
                  <div className="text-sm font-bold text-[#e0e7ef]">
                    {pool.token0.symbol} / {pool.token1.symbol}
                  </div>
                  <div className="text-xs text-[#e0e7ef]/60">
                    {formatCurrency(Number(pool.volumeUSD))}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-bold text-[#e0e7ef]">
                    {pool.txCount} <span className="text-[#e0e7ef]/60 text-xs">txs</span>
                  </div>
                  
                  {pool.isNew ? (
                    <div className="text-xs font-bold text-[#00ff8c] flex items-center justify-end">
                      NEW <FaArrowUp className="ml-1" />
                    </div>
                  ) : pool.txCountChange !== undefined ? (
                    <div className={`text-xs font-bold flex items-center justify-end ${
                      pool.txCountChange > 0 
                        ? 'text-[#00ff8c]' 
                        : pool.txCountChange < 0 
                          ? 'text-[#ff4a6d]' 
                          : 'text-[#e0e7ef]/60'
                    }`}>
                      {pool.txCountChange > 0 && '+'}
                      {pool.txCountChange}
                      {pool.txCountChange > 0 ? (
                        <FaArrowUp className="ml-1" />
                      ) : pool.txCountChange < 0 ? (
                        <FaArrowDown className="ml-1" />
                      ) : (
                        <FaExchangeAlt className="ml-1" />
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-3 border-t border-[#00ffe7]/20 grid grid-cols-2 gap-4">
        <div className="bg-[#23263a]/50 p-2 rounded-lg text-center">
          <div className="text-xs text-[#00ffe7]/70">Total Pools</div>
          <div className="text-xl font-bold text-[#e0e7ef]">
            {data?.pools.today?.poolCount || 0}
          </div>
        </div>
        <div className="bg-[#23263a]/50 p-2 rounded-lg text-center">
          <div className="text-xs text-[#00ffe7]/70">Total Transactions</div>
          <div className="text-xl font-bold text-[#e0e7ef]">
            {sortedPools.reduce((sum, pool) => sum + Number(pool.txCount), 0).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyPoolActivity;
