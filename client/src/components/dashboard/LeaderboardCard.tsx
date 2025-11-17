import React from 'react';
import { FaTrophy, FaCrown, FaMedal, FaUser } from 'react-icons/fa';

interface LeaderboardEntry {
  rank: number;
  name: string;
  profit: string;
  winRate: number;
  avatar: string;
}

interface UserStats {
  globalRank: number;
  totalProfit: string;
}

interface LeaderboardCardProps {
  leaderboardData: LeaderboardEntry[];
  userStats: UserStats;
}

const LeaderboardCard: React.FC<LeaderboardCardProps> = ({ leaderboardData, userStats }) => {
  return (
    <div className="lg:col-span-1">
      <div className="bg-[#181a23]/80 border-4 border-[#00ffe7]/40 rounded-2xl shadow-[0_0_32px_#00ffe7] p-6">
        <div className="flex items-center gap-3 mb-6">
          <FaTrophy className="text-2xl text-[#00ffe7]" />
          <h3 className="text-xl font-bold text-[#00ffe7]">Top Traders</h3>
        </div>
        
        <div className="space-y-3">
          {leaderboardData.map((trader, idx) => (
            <div key={trader.rank} className="flex items-center gap-3 p-2 rounded-lg bg-[#23263a]/50">
              <div className="flex items-center gap-2">
                {trader.rank === 1 && <FaCrown className="text-yellow-400" />}
                {trader.rank === 2 && <FaMedal className="text-gray-400" />}
                {trader.rank === 3 && <FaMedal className="text-amber-600" />}
                {trader.rank > 3 && trader.rank === 4 && <span className="text-sm">4️⃣</span>}
                {trader.rank > 3 && trader.rank === 5 && <span className="text-sm">5️⃣</span>}
                {trader.rank > 5 && <span className="text-[#e0e7ef] font-bold">#{trader.rank}</span>}
              </div>
              <img 
                src={trader.avatar} 
                alt={trader.name}
                className="w-8 h-8 rounded-full border border-[#00ffe7]/40"
              />
              <div className="flex-1">
                <div className="text-[#00ffe7] font-bold text-sm">{trader.name}</div>
                <div className="text-xs text-green-400">{trader.profit}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#e0e7ef]">{trader.winRate}%</div>
                <div className="text-xs text-[#b8eaff]">win rate</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-[#00ffe7]/20">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-[#00ffe7]/10">
            <FaUser className="text-[#00ffe7]" />
            <div className="flex-1">
              <div className="text-[#00ffe7] font-bold text-sm">You</div>
              <div className="text-xs text-green-400">{userStats.totalProfit}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#e0e7ef]">#{userStats.globalRank}</div>
              <div className="text-xs text-[#b8eaff]">rank</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardCard;
