import React, { useState } from 'react';
import { BotForSale } from '../../../../types/Bot';
import { FaRobot, FaShoppingCart, FaCheckCircle, FaClock, FaUser, FaStar, FaCalendar, FaCodeBranch, FaExchangeAlt, FaChartLine, FaArrowUp, FaShieldAlt, FaWifi, FaCog } from 'react-icons/fa';
import { SiEthereum } from 'react-icons/si';
import { Line, Bar, Pie } from 'react-chartjs-2';

interface ShopDetailProps {
  bot: BotForSale & {
    stats: { 
      trades: number; 
      tradesPerDay: number;
      profitLoss: number;
      avgTradeTime: number;
      age: number;
    };
    categories: string[];
    risk: number;
  };
}

const BotDetail: React.FC<ShopDetailProps> = ({ bot }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'history' | 'reviews'>('overview');
  const [showSuccess, setShowSuccess] = useState(false);

  // Expanded bot stats for detailed view
  const expandedStats = {
    totalTrades: bot.stats.trades,
    tradesPerDay: bot.stats.tradesPerDay,
    profitLoss: bot.stats.profitLoss,
    avgTradeTime: bot.stats.avgTradeTime,
    age: bot.stats.age,
    avgDailyProfit: (Math.random() * 50 + 20).toFixed(2),
    maxDrawdown: (Math.random() * 15 + 5).toFixed(1),
    sharpeRatio: (Math.random() * 2 + 1).toFixed(2),
    totalUsers: Math.floor(Math.random() * 500 + 100),
    avgOrderSize: (Math.random() * 100 + 50).toFixed(0),
    lastActive: 'Active now',
    createdDate: '2023-08-15',
    version: '2.4.1',
    avgExecutionTime: (Math.random() * 2 + 0.5).toFixed(1),
    successfulOrders: Math.floor(bot.stats.trades * (bot.stats.profitLoss > 0 ? 0.7 : 0.3)),
    totalVolume: (bot.stats.trades * 150).toLocaleString(),
    fees: (Math.random() * 5 + 2).toFixed(2),
  };

  // Chart data
  const performanceData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Monthly Profit (%)',
        data: Array.from({ length: 6 }, () => Math.random() * 20 + 5),
        borderColor: '#00ffe7',
        backgroundColor: 'rgba(0, 255, 231, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const tradeDistribution = {
    labels: ['Profitable', 'Break-even', 'Loss'],
    datasets: [
      {
        data: [Math.max(0, bot.stats.profitLoss + 60), 10, Math.max(0, 30 - bot.stats.profitLoss)], // Approximate distribution based on P/L
        backgroundColor: ['#00ff88', '#faafe8', '#ff005c'],
        borderColor: '#23263a',
        borderWidth: 2,
      },
    ],
  };

  const volumeData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Daily Trades',
        data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 50 + 10)),
        backgroundColor: 'rgba(0, 255, 231, 0.7)',
        borderColor: '#00ffe7',
        borderWidth: 2,
      },
    ],
  };

  const handleAddToCart = () => {
    // Add to cart logic would go here
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const renderRiskMeter = (risk: number) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((lvl) => (
        <div
          key={lvl}
          className={`w-3 h-3 rounded-full border ${
            lvl <= risk
              ? lvl >= 4
                ? 'bg-red-500 border-red-400'
                : lvl === 3
                ? 'bg-yellow-400 border-yellow-300'
                : 'bg-green-400 border-green-300'
              : 'bg-gray-700 border-gray-500'
          }`}
        />
      ))}
      <span className="ml-2 text-sm text-[#e0e7ef]">Risk Level: {risk}/5</span>
    </div>
  );

  const formatTradeTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours} hours`;
  };

  const formatAge = (days: number) => {
    return `${days} days`;
  };

  const tabContent = {
    overview: (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-[#00ffe7] mb-4 flex items-center gap-2">
            <FaRobot /> Bot Overview
          </h3>
          <p className="text-[#e0e7ef] mb-4">{bot.description}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <FaExchangeAlt />, label: 'Total Trades', value: expandedStats.totalTrades.toLocaleString() },
              { icon: <FaArrowUp />, label: 'Trades/Day', value: expandedStats.tradesPerDay.toString() },
              { icon: <FaChartLine />, label: 'P/L', value: `${expandedStats.profitLoss >= 0 ? '+' : ''}${expandedStats.profitLoss.toFixed(1)}%` },
              { icon: <FaUser />, label: 'Active Users', value: expandedStats.totalUsers.toLocaleString() },
            ].map((stat, idx) => (
              <div key={idx} className="bg-[#181a23] rounded-lg p-4 border border-[#00ffe7]/20">
                <div className="flex items-center gap-2 text-[#00ffe7] mb-2">
                  {stat.icon}
                  <span className="text-sm">{stat.label}</span>
                </div>
                <div className={`text-2xl font-bold ${
                  stat.label === 'P/L' 
                    ? expandedStats.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
                    : 'text-white'
                }`}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-lg font-bold text-[#00ffe7] mb-3">Categories & Features</h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {bot.categories.map((cat) => (
              <span
                key={cat}
                className="bg-[#00ffe7]/10 text-[#00ffe7] px-3 py-1 rounded-full text-sm font-bold border border-[#00ffe7]/20"
              >
                {cat}
              </span>
            ))}
          </div>
          {renderRiskMeter(bot.risk)}
        </div>

        <div>
          <h4 className="text-lg font-bold text-[#00ffe7] mb-3">Key Metrics</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Average Trade Time', value: formatTradeTime(expandedStats.avgTradeTime), icon: <FaClock /> },
              { label: 'Bot Age', value: formatAge(expandedStats.age), icon: <FaCalendar /> },
              { label: 'Max Drawdown', value: `${expandedStats.maxDrawdown}%`, icon: <FaChartLine /> },
              { label: 'Sharpe Ratio', value: expandedStats.sharpeRatio, icon: <FaStar /> },
              { label: 'Average Order Size', value: `$${expandedStats.avgOrderSize}`, icon: <FaExchangeAlt /> },
              { label: 'Trading Fees', value: `${expandedStats.fees}%`, icon: <FaCog /> },
            ].map((metric, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-[#181a23] rounded border border-[#00ffe7]/20">
                <div className="flex items-center gap-2 text-[#e0e7ef]">
                  <span className="text-[#00ffe7]">{metric.icon}</span>
                  {metric.label}
                </div>
                <span className="font-bold text-[#00ffe7]">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    performance: (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-[#00ffe7] mb-4">Performance Analytics</h3>
          <div className="bg-[#181a23] rounded-lg p-4 mb-6">
            <h4 className="text-lg font-bold text-[#00ffe7] mb-3">Monthly Profit Trend</h4>
            <Line
              data={performanceData}
              options={{
                responsive: true,
                plugins: { legend: { labels: { color: '#e0e7ef' } } },
                scales: {
                  x: { ticks: { color: '#00ffe7' }, grid: { color: '#23263a' } },
                  y: { ticks: { color: '#00ffe7' }, grid: { color: '#23263a' } }
                },
              }}
              height={100}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#181a23] rounded-lg p-4">
            <h4 className="text-lg font-bold text-[#00ffe7] mb-3">Trade Distribution</h4>
            <Pie
              data={tradeDistribution}
              options={{
                responsive: true,
                plugins: {
                  legend: { labels: { color: '#e0e7ef' } }
                },
              }}
              height={150}
            />
          </div>

          <div className="bg-[#181a23] rounded-lg p-4">
            <h4 className="text-lg font-bold text-[#00ffe7] mb-3">Weekly Trading Volume</h4>
            <Bar
              data={volumeData}
              options={{
                responsive: true,
                plugins: { legend: { labels: { color: '#e0e7ef' } } },
                scales: {
                  x: { ticks: { color: '#00ffe7' }, grid: { color: '#23263a' } },
                  y: { ticks: { color: '#00ffe7' }, grid: { color: '#23263a' } }
                },
              }}
              height={150}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Successful Orders', value: expandedStats.successfulOrders.toLocaleString(), color: 'text-green-400' },
            { label: 'Total Volume', value: `$${expandedStats.totalVolume}`, color: 'text-[#00ffe7]' },
            { label: 'Best Month', value: '+24.7%', color: 'text-green-400' },
            { label: 'Worst Month', value: '-3.2%', color: 'text-red-400' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-[#181a23] rounded-lg p-3 text-center">
              <div className="text-xs text-[#e0e7ef] mb-1">{stat.label}</div>
              <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    history: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-[#00ffe7] mb-4">Bot Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: <FaCalendar />, label: 'Created Date', value: expandedStats.createdDate },
            { icon: <FaCodeBranch />, label: 'Version', value: `v${expandedStats.version}` },
            { icon: <FaClock />, label: 'Last Active', value: expandedStats.lastActive },
            { icon: <FaShieldAlt />, label: 'Security Rating', value: 'A+' },
          ].map((info, idx) => (
            <div key={idx} className="flex items-center gap-3 p-4 bg-[#181a23] rounded border border-[#00ffe7]/20">
              <span className="text-[#00ffe7] text-xl">{info.icon}</span>
              <div>
                <div className="text-sm text-[#e0e7ef]">{info.label}</div>
                <div className="font-bold text-[#00ffe7]">{info.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    reviews: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-[#00ffe7] mb-4">User Reviews</h3>
        <div className="space-y-4">
          {[
            { user: 'CryptoTrader23', rating: 5, comment: 'Excellent bot! Consistent profits and easy to use.', date: '2 days ago' },
            { user: 'InvestorPro', rating: 4, comment: 'Good performance, but could use more customization options.', date: '1 week ago' },
            { user: 'TechAnalyst', rating: 5, comment: 'Best trading bot I\'ve used. Highly recommended!', date: '2 weeks ago' },
          ].map((review, idx) => (
            <div key={idx} className="p-4 bg-[#181a23] rounded border border-[#00ffe7]/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#00ffe7]">{review.user}</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} className={`text-sm ${i < review.rating ? 'text-yellow-400' : 'text-gray-500'}`} />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-[#e0e7ef]">{review.date}</span>
              </div>
              <p className="text-[#e0e7ef]">{review.comment}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <img
          src={bot.image}
          alt={bot.name}
          className="w-32 h-32 object-cover rounded-full border-4 border-[#00ffe7]/40 shadow-[0_0_16px_#00ffe7] mx-auto md:mx-0"
        />
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-[#00ffe7] mb-2">{bot.name}</h1>
          <p className="text-[#e0e7ef] text-lg mb-4">{bot.description}</p>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="text-3xl font-bold text-green-400 flex items-center gap-2">
              {bot.price} <SiEthereum className="w-6 h-6 text-[#627eea]" />
            </div>
            <button
              onClick={handleAddToCart}
              className="btn-hud bg-green-500 hover:bg-green-600 border-green-400 text-white px-6 py-3 text-lg"
              disabled={showSuccess}
            >
              {showSuccess ? (
                <>
                  <FaCheckCircle /> Added to Cart!
                </>
              ) : (
                <>
                  <FaShoppingCart /> Add to Cart
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#00ffe7]/20 mb-6">
        <div className="flex gap-1">
          {[
            { id: 'overview', label: 'Overview', icon: <FaRobot /> },
            { id: 'performance', label: 'Performance', icon: <FaChartLine /> },
            { id: 'history', label: 'Details', icon: <FaClock /> },
            { id: 'reviews', label: 'Reviews', icon: <FaStar /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#00ffe7] text-[#181a23] shadow-[0_0_8px_#00ffe7]'
                  : 'bg-[#23263a] text-[#e0e7ef] hover:bg-[#00ffe7]/20'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {tabContent[activeTab]}
      </div>
    </div>
  );
};

export default BotDetail;
