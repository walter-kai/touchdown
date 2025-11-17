import React, { useState, useEffect } from 'react';
import { FaCopy, FaChartLine } from 'react-icons/fa';
import LoadingScreenDots from '../common/LoadingScreenDots';
import StatusPopup from '../common/StatusPopup';
import { User } from '../../types/User';

interface UserInfoCardProps {
  user: User | null;
}

const UserInfoCard: React.FC<UserInfoCardProps> = ({ user }) => {
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error' | 'loading', message: string} | null>(null);

  const [userStats] = useState({
    globalRank: 847,
    totalTrades: 1247,
    dealsPerDay: 8.5,
    avgTimeBetweenTrades: 4.2, // hours
    totalProfit: "+15.6 ETH",
    activeDays: 45,
    favoriteBot: "ScalpMaster Pro"
  });

  const timeSince = (date: string | Date) => {
    console.log("timeSince received date:", date, "type:", typeof date);
    console.log("date constructor:", date?.constructor?.name);
    
    const now = new Date();
    let lastLogin: Date;
    
    if (typeof date === "string") {
      lastLogin = new Date(date);
    } else if (date instanceof Date) {
      lastLogin = date;
    } else if (date && typeof date === 'object') {
      // Handle any object format
      console.log("Date is an object with keys:", Object.keys(date));
      return "Object date detected";
    } else {
      console.log("Unknown date format");
      return "Unknown";
    }
    
    console.log("lastLogin after conversion:", lastLogin);
    const seconds = Math.floor((now.getTime() - lastLogin.getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  const copyToClipboard = async () => {
    if (!user?.walletAddress) return;
    
    try {
      await navigator.clipboard.writeText(user.walletAddress);
      setStatusMessage({
        type: 'success',
        message: 'Wallet address copied to clipboard!'
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        message: 'Failed to copy wallet address'
      });
    }
  };

  const closeStatusMessage = () => {
    setStatusMessage(null);
  };

  return (
    <>
      <div className="lg:col-span-2">
        <div className="bg-[#181a23]/80 border-4 border-[#00ffe7]/40 rounded-2xl shadow-[0_0_32px_#00ffe7] p-6 h-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* User Info Section */}
            <div className="flex flex-col h-full">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <img 
                    src={`https://robohash.org/${encodeURIComponent(user?.username || 'default')}?set=set3`} 
                    className="h-16 w-16 rounded-full border-2 border-[#00ffe7]/40" 
                    alt="your icon" 
                  />
                  <div>
                    <div className="text-xl font-bold text-[#00ffe7]">{user?.username || "Unknown User"}</div>
                    <div className="text-xs text-[#b8eaff] flex items-center gap-2">
                      Wallet: <span className="font-mono">{user?.walletAddress?.slice(0, 6)}...{user?.walletAddress?.slice(-4)}</span>
                      <button
                        onClick={copyToClipboard}
                        className="text-[#00ffe7] hover:text-[#ff005c] transition-colors"
                        title="Copy full address"
                      >
                        <FaCopy />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-[#e0e7ef]"><strong className="text-[#00ffe7]">Username:</strong> {user?.username || "Not set"}</p>
                  <p className="text-[#e0e7ef]"><strong className="text-[#00ffe7]">Referral:</strong> {user?.referralId || "Not set"}</p>
                  <p className="text-[#e0e7ef]"><strong className="text-[#00ffe7]">Last Login:</strong> {user?.lastLogin ? timeSince(user.lastLogin) : "Unknown"}</p>
                  <p className="text-[#e0e7ef]"><strong className="text-[#00ffe7]">Member Since:</strong> {user?.createdAt ? timeSince(user.createdAt) : "Unknown"}</p>
                </div>
              </div>
            </div>

            {/* Account Stats Section */}
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <FaChartLine className="text-xl text-[#00ffe7]" />
                <h3 className="text-xl font-bold text-[#00ffe7]">Account Stats</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center bg-[#23263a]/50 rounded-lg p-3 border border-[#00ffe7]/10">
                  <div className="text-lg font-bold text-green-400">#{userStats.globalRank}</div>
                  <div className="text-xs text-[#e0e7ef]">Global Rank</div>
                </div>
                <div className="text-center bg-[#23263a]/50 rounded-lg p-3 border border-[#00ffe7]/10">
                  <div className="text-lg font-bold text-[#00ffe7]">{userStats.totalTrades}</div>
                  <div className="text-xs text-[#e0e7ef]">Total Trades</div>
                </div>
                <div className="text-center bg-[#23263a]/50 rounded-lg p-3 border border-[#00ffe7]/10">
                  <div className="text-lg font-bold text-green-400">{userStats.dealsPerDay}</div>
                  <div className="text-xs text-[#e0e7ef]">Deals/Day</div>
                </div>
                <div className="text-center bg-[#23263a]/50 rounded-lg p-3 border border-[#00ffe7]/10">
                  <div className="text-lg font-bold text-[#faafe8]">{userStats.avgTimeBetweenTrades}h</div>
                  <div className="text-xs text-[#e0e7ef]">Avg Trade Time</div>
                </div>
              </div>

              <div className="flex-1 space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-[#e0e7ef]">Total Profit:</span>
                  <span className="text-green-400 font-bold">{userStats.totalProfit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#e0e7ef]">Active Days:</span>
                  <span className="text-[#faafe8] font-bold">{userStats.activeDays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#e0e7ef]">Favorite Bot:</span>
                  <span className="text-[#ff005c] font-bold text-sm">{userStats.favoriteBot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#e0e7ef]">Risk Tolerance:</span>
                  <span className="text-yellow-400 font-bold">Medium</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#e0e7ef]">Portfolio Value:</span>
                  <span className="text-[#00ffe7] font-bold">2.87 ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#e0e7ef]">Success Rate:</span>
                  <span className="text-green-400 font-bold">73.8%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#e0e7ef]">Avg Win/Loss:</span>
                  <span className="text-green-400 font-bold">2.3:1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {statusMessage && (
        <StatusPopup
          type={statusMessage.type}
          message={statusMessage.message}
          onClose={closeStatusMessage}
        />
      )}
    </>
  );
};

export default UserInfoCard;
