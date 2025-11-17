import React from 'react';
import { BotConfig } from '../../../../types/Bot';
import { generateLogoHash } from '../../hooks/useRobohash';
import { FaCopy, FaShieldAlt, FaCode, FaCog } from 'react-icons/fa';
import { Line, Pie } from 'react-chartjs-2';

interface BotDetailsProps {
  bot: BotConfig;
  onCopyWallet: (wallet: string) => void;
  // Add key prop to force re-render and animation
  key?: string;
}

const BotDetails: React.FC<BotDetailsProps> = ({ bot, onCopyWallet }) => {
  function truncateMiddle(str: string, frontLen = 6, backLen = 4) {
    if (!str || str.length <= frontLen + backLen + 3) return str;
    return `${str.slice(0, frontLen)}...${str.slice(-backLen)}`;
  }

  // Generate fake smart contract data
  const smartContractData = {
    address: `0x${Math.random().toString(16).substr(2, 40)}`,
    version: `v${Math.floor(Math.random() * 3 + 1)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
    gasUsed: `${(Math.random() * 50000 + 21000).toFixed(0)}`,
    deployedBlock: Math.floor(Math.random() * 1000000 + 18000000),
    auditScore: Math.floor(Math.random() * 20 + 80),
  };

  // Fake data for charts
  const fakeLineData = {
    labels: Array.from({ length: 7 }, (_, i) => `Day ${i + 1}`),
    datasets: [
      {
        label: 'Earnings',
        data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 1000 + 1000)),
        fill: false,
        borderColor: '#00ffe7',
        backgroundColor: '#00ffe7',
        tension: 0.3,
      },
    ],
  };

  const fakePieData = {
    labels: ['ETH', 'USDT', 'BTC'],
    datasets: [
      {
        data: [40, 30, 30],
        backgroundColor: ['#00ffe7', '#ff005c', '#faafe8'],
        borderColor: '#23263a',
        borderWidth: 2,
      },
    ],
  };

  return (
    <div
      className="w-full animate-fade-in-scale transform transition-all duration-700 ease-out"
      style={{
        background: "#181a23",
        borderRadius: "1rem",
        border: "4px solid #00ffe7",
        boxShadow: "0 0 32px #00ffe7",
        padding: "1rem",
        overflow: "hidden"
      }}
    >
      {/* Main Horizontal Layout */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left Section - Bot Identity */}
        <div className="lg:min-w-[200px] animate-fadein-ltr">
          <div className='flex items-center gap-3 mb-3'>
            <div className="relative">
              <img
                src={generateLogoHash(bot.botName)}
                alt={bot.botName}
                className="w-14 h-14 rounded-full border-4 border-[#00ffe7]/60 shadow-[0_0_16px_#00ffe7] transform hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-[#181a23] animate-pulse"></div>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-[#00ffe7] mb-1 animate-fade-in-up">{bot.botName}</h2>
              <div className="flex gap-1 mb-1">
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  bot.status === 'Running' ? 'bg-green-500/20 text-green-400 border border-green-400/30' :
                  'bg-gray-500/20 text-gray-400 border border-gray-400/30'
                } animate-pulse`}>
                  {bot.status || "Stopped"}
                </span>
                <span className="px-2 py-1 rounded text-xs font-bold bg-[#00ffe7]/20 text-[#00ffe7] border border-[#00ffe7]/30">
                  {bot.tradingPool || "No Pair"}
                </span>
              </div>
              <div className="text-xs text-[#e0e7ef]">
                Creator: <span className="text-[#00ffe7] font-bold">{bot.creatorName || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Key Stats - Compact 2x2 grid */}
          <div className="grid grid-cols-2 gap-2 animate-fade-in-scale">
            {[
              { label: "Take Profit", value: `${bot.takeProfit || 0}%`, color: "text-green-400" },
              { label: "Safety Orders", value: bot.safetyOrders || "N/A", color: "text-[#ff005c]" },
              { label: "Initial Size", value: bot.initialOrderSize || "N/A", color: "text-[#faafe8]" },
              { label: "Price Dev", value: `${bot.priceDeviation || 0}%`, color: "text-[#00ffe7]" },
            ].map((stat, idx) => (
              <div 
                key={idx} 
                className="bg-[#23263a] rounded-lg p-2 text-center transform hover:scale-105 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <span className="text-xs text-[#e0e7ef] block mb-1">{stat.label}</span>
                <span className={`font-bold text-xs ${stat.color}`}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Section - Configuration Card */}
        <div className="lg:min-w-[180px] animate-scale-in">
          <div className="bg-[#23263a] rounded-lg p-3 h-full">
            <h3 className="text-sm font-bold text-[#00ffe7] mb-3 flex items-center gap-2">
              <FaCog /> Bot Configuration
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-2 gap-2 text-xs">
              {[
                { label: "Trigger Type", value: bot.triggerType || "N/A" },
                { label: "Order Type", value: bot.orderType || "N/A" },
                { label: "Gap Multiplier", value: `${bot.safetyOrderGapMultiplier || 0}x` },
                { label: "Size Multiplier", value: bot.safetyOrderSizeMultiplier || "N/A" },
                { label: "Trailing TP", value: bot.trailingTakeProfit ? "Yes" : "No" },
                { label: "Notifications", value: bot.notifications ? "On" : "Off" },
                { label: "Cooldown", value: `${bot.cooldownPeriod || 0}s` },
                { label: "Created", value: bot.createdAt ? new Date(bot.createdAt).toLocaleDateString() : "N/A" },
              ].map((config, index) => (
                <div key={index} className="text-center">
                  <span className="text-[#e0e7ef] block text-xs mb-1">{config.label}</span>
                  <span className="text-[#00ffe7] font-bold text-xs">{config.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Middle-Right Section - Smart Contract */}
        <div className="lg:min-w-[180px] animate-slide-in-left">
          <div className="bg-[#23263a] rounded-lg p-3 h-full">
            <h3 className="text-sm font-bold text-[#00ffe7] mb-3 flex items-center gap-2">
              <FaCode /> Smart Contract
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[#e0e7ef] block text-xs">Address</span>
                <span className="font-mono text-[#00ffe7] flex items-center gap-1 text-xs">
                  {truncateMiddle(smartContractData.address, 4, 3)}
                  <button
                    className="text-[#00ffe7] hover:text-[#ff005c] transition-colors duration-200"
                    onClick={() => onCopyWallet(smartContractData.address)}
                    title="Copy contract address"
                  >
                    <FaCopy className="text-xs" />
                  </button>
                </span>
              </div>
              <div>
                <span className="text-[#e0e7ef] block text-xs">Version</span>
                <span className="font-bold text-green-400 text-xs">{smartContractData.version}</span>
              </div>
              <div>
                <span className="text-[#e0e7ef] block text-xs">Gas Used</span>
                <span className="font-bold text-[#faafe8] text-xs">{smartContractData.gasUsed}</span>
              </div>
              <div>
                <span className="text-[#e0e7ef] block text-xs">Audit Score</span>
                <span className={`font-bold text-xs ${smartContractData.auditScore >= 90 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {smartContractData.auditScore}/100
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Larger Charts */}
        <div className="flex-1 lg:min-w-[400px] flex gap-4 animate-slide-in-right">
          <div className="flex-1 bg-[#23263a] rounded-lg p-3">
            <h4 className="text-sm font-bold text-[#00ffe7] mb-2">7-Day Earnings Trend</h4>
            <div className="h-44 w-full">
              <Line
                data={fakeLineData}
                options={{
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { 
                      display: true,
                      ticks: { 
                        color: '#00ffe7', 
                        font: { size: 10 },
                        maxTicksLimit: 7
                      },
                      grid: { 
                        color: '#00ffe7',
                        lineWidth: 0.5,
                        drawOnChartArea: false
                      }
                    },
                    y: { 
                      display: true,
                      ticks: { 
                        color: '#00ffe7', 
                        font: { size: 10 },
                        maxTicksLimit: 5
                      },
                      grid: { 
                        color: '#00ffe7',
                        lineWidth: 0.5,
                        drawOnChartArea: true
                      }
                    }
                  },
                  responsive: true,
                  maintainAspectRatio: false,
                  elements: { 
                    point: { radius: 3, hoverRadius: 5 },
                    line: { borderWidth: 2 }
                  }
                }}
              />
            </div>
          </div>

          <div className="w-48 bg-[#23263a] rounded-lg p-3">
            <h4 className="text-sm font-bold text-[#00ffe7] mb-2">Asset Allocation</h4>
            <div className="h-44 flex items-center justify-center">
              <div className="w-full h-full">
                <Pie
                  data={fakePieData}
                  options={{
                    plugins: { 
                      legend: { 
                        display: true,
                        position: 'bottom',
                        labels: { 
                          color: '#e0e7ef', 
                          font: { size: 10 },
                          boxWidth: 10,
                          padding: 8,
                          usePointStyle: true
                        }
                      }
                    },
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BotDetails;
