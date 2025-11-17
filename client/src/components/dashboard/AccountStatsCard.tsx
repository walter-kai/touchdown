import React from 'react';
import { FaChartLine } from 'react-icons/fa';

interface UserStats {
  globalRank: number;
  totalTrades: number;
  winRate: number;
  bestStreak: number;
  totalProfit: string;
  avgTradeSize: string;
  activeDays: number;
  favoriteBot: string;
}

interface AccountStatsCardProps {
  userStats: UserStats;
}

const AccountStatsCard: React.FC<AccountStatsCardProps> = ({ userStats }) => {
  return (
    <div className="lg:col-span-1">
      <div className="bg-[#181a23]/80 border-4 border-[#00ffe7]/40 rounded-2xl shadow-[0_0_32px_#00ffe7] p-6">
        <div className="flex items-center gap-3 mb-6">
          <FaChartLine className="text-2xl text-[#00ffe7]" />
          <h3 className="text-xl font-bold text-[#00ffe7]">Account Stats</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">#{userStats.globalRank}</div>
            <div className="text-xs text-[#e0e7ef]">Global Rank</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#00ffe7]">{userStats.totalTrades}</div>
            <div className="text-xs text-[#e0e7ef]">Total Trades</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{userStats.winRate}%</div>
            <div className="text-xs text-[#e0e7ef]">Win Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#faafe8]">{userStats.bestStreak}</div>
            <div className="text-xs text-[#e0e7ef]">Best Streak</div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-[#e0e7ef]">Total Profit:</span>
            <span className="text-green-400 font-bold">{userStats.totalProfit}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#e0e7ef]">Avg Trade:</span>
            <span className="text-[#00ffe7] font-bold">{userStats.avgTradeSize}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#e0e7ef]">Active Days:</span>
            <span className="text-[#faafe8] font-bold">{userStats.activeDays}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#e0e7ef]">Favorite Bot:</span>
            <span className="text-[#ff005c] font-bold text-sm">{userStats.favoriteBot}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountStatsCard;
