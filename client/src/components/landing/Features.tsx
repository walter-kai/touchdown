import React from 'react';
import { FaShoppingCart, FaTools, FaChartLine, FaTrophy, FaWallet, FaCog, FaCoins, FaRocket, FaBell } from "react-icons/fa";
import { Link } from 'react-router-dom';

interface GuideSectionProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  summary: string;
  detail: React.ReactNode;
}

const GuideSection: React.FC<GuideSectionProps> = ({ id, icon, title, summary, detail }) => {
  return (
    <section
      id={id}
      className="py-6 mb-8 scroll-mt-24 bg-bg-darker/90 border border-neon-cyan/30 rounded-xl shadow-lg hover:shadow-[0_0_32px_rgba(0,255,231,0.2)] transition-all duration-300"
    >
      <div className="flex items-center gap-4 mb-4 border-b border-neon-cyan/30 p-6">
        <div className="text-4xl text-neon-cyan bg-bg-dark p-3 rounded-lg border border-neon-cyan/30">
          {icon}
        </div>
        <h2 className="text-3xl font-bold text-neon-cyan drop-shadow-[0_0_8px_#00ffe7]">
          {title}
        </h2>
      </div>
      <p className="text-neon-pink font-semibold mb-4 px-6 text-lg">{summary}</p>
      <div className="text-text-light px-6 leading-relaxed">{detail}</div>
    </section>
  );
};

const Features: React.FC = () => {
  return (
    <div id="features" className="scroll-mt-24">
      <h2 className="text-3xl font-bold text-neon-cyan mb-8 text-center drop-shadow-[0_0_8px_#00ffe7]">
        Platform Features
      </h2>
      {featuresData.map((feature) => (
        <GuideSection
          key={feature.id}
          id={feature.id}
          icon={feature.icon}
          title={feature.title}
          summary={feature.summary}
          detail={feature.detail}
        />
      ))}
    </div>
  );
};

// Features Data
export const featuresData = [
  {
    id: "bot-shop",
    icon: <FaShoppingCart />,
    title: "Bot Shop Marketplace",
    summary: "Discover, buy, lease, and sell trading bots in our comprehensive marketplace",
    detail: (
      <div className="space-y-4">
        <p className="text-lg">
          The Bot Shop is your gateway to proven trading strategies. Browse bots created by top developers,
          each with detailed performance metrics, user reviews, and strategy breakdowns.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-bg-dark p-4 rounded-lg border border-neon-cyan/20 hover:scale-105 transition-transform duration-300">
            <div className="text-2xl mb-2">🔍</div>
            <h4 className="text-neon-cyan font-semibold mb-2">Discover Strategies</h4>
            <p className="text-text-light text-sm">Browse hundreds of bots with advanced filtering and sorting</p>
          </div>
          <div className="bg-bg-dark p-4 rounded-lg border border-neon-cyan/20 hover:scale-105 transition-transform duration-300">
            <div className="text-2xl mb-2">💰</div>
            <h4 className="text-neon-cyan font-semibold mb-2">Buy or Lease</h4>
            <p className="text-text-light text-sm">Purchase bots outright or lease them for lower upfront costs</p>
          </div>
          <div className="bg-bg-dark p-4 rounded-lg border border-neon-cyan/20 hover:scale-105 transition-transform duration-300">
            <div className="text-2xl mb-2">🏪</div>
            <h4 className="text-neon-cyan font-semibold mb-2">Sell Your Bots</h4>
            <p className="text-text-light text-sm">Monetize your successful strategies by listing them for sale</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-neon-cyan/10 to-neon-pink/10 p-4 rounded-lg border border-neon-cyan/30">
          <h4 className="text-neon-cyan font-semibold mb-2">🎯 Featured Categories</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <span className="bg-bg-darker px-3 py-1 rounded text-[#b8eaff] text-sm">DCA Strategies</span>
            <span className="bg-bg-darker px-3 py-1 rounded text-[#b8eaff] text-sm">Arbitrage Bots</span>
            <span className="bg-bg-darker px-3 py-1 rounded text-[#b8eaff] text-sm">Trend Following</span>
            <span className="bg-bg-darker px-3 py-1 rounded text-[#b8eaff] text-sm">Scalping Bots</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "bot-garage",
    icon: <FaTools />,
    title: "Bot Garage Workshop",
    summary: "Your personal workshop for building, customizing, and managing trading bots",
    detail: (
      <div className="space-y-4">
        <p className="text-lg">
          The Bot Garage is where creativity meets functionality. Use our intuitive visual builder
          to create sophisticated trading strategies without coding knowledge.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-bg-dark p-4 rounded-lg border border-neon-cyan/20 hover:scale-105 transition-transform duration-300">
            <div className="text-2xl mb-2">🔧</div>
            <h4 className="text-neon-cyan font-semibold mb-2">Visual Strategy Builder</h4>
            <ul className="text-text-light text-sm space-y-1">
              <li>• Drag-and-drop interface</li>
              <li>• Pre-built strategy templates</li>
              <li>• Advanced parameter tuning</li>
              <li>• Real-time strategy validation</li>
            </ul>
          </div>
          <div className="bg-bg-dark p-4 rounded-lg border border-neon-cyan/20 hover:scale-105 transition-transform duration-300">
            <div className="text-2xl mb-2">📋</div>
            <h4 className="text-neon-cyan font-semibold mb-2">Bot Management</h4>
            <ul className="text-text-light text-sm space-y-1">
              <li>• Clone successful strategies</li>
              <li>• A/B test different approaches</li>
              <li>• Version control for strategies</li>
              <li>• Bulk operations on multiple bots</li>
            </ul>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 rounded-lg border border-blue-500/30">
          <h4 className="text-blue-400 font-semibold mb-2">🚀 Advanced Features</h4>
          <div className="flex flex-wrap gap-2">
            <span className="bg-bg-darker px-3 py-1 rounded text-[#b8eaff] text-sm">Custom Indicators</span>
            <span className="bg-bg-darker px-3 py-1 rounded text-[#b8eaff] text-sm">Multi-timeframe Analysis</span>
            <span className="bg-bg-darker px-3 py-1 rounded text-[#b8eaff] text-sm">Risk Management</span>
            <span className="bg-bg-darker px-3 py-1 rounded text-[#b8eaff] text-sm">Portfolio Rebalancing</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "analytics",
    icon: <FaChartLine />,
    title: "Advanced Analytics",
    summary: "Comprehensive performance tracking with real-time insights and detailed reports",
    detail: (
      <div className="space-y-4">
        <p className="text-lg">
          Make data-driven decisions with our comprehensive analytics suite. Track every metric
          that matters and optimize your strategies based on real performance data.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-bg-dark p-4 rounded-lg border border-neon-cyan/20 hover:scale-105 transition-transform duration-300">
            <div className="text-2xl mb-2">📊</div>
            <h4 className="text-neon-cyan font-semibold mb-2">Real-time Dashboards</h4>
            <ul className="text-text-light text-sm space-y-1">
              <li>• Live P&L tracking</li>
              <li>• Trade execution logs</li>
              <li>• Performance heatmaps</li>
            </ul>
          </div>
          <div className="bg-bg-dark p-4 rounded-lg border border-neon-cyan/20 hover:scale-105 transition-transform duration-300">
            <div className="text-2xl mb-2">📈</div>
            <h4 className="text-neon-cyan font-semibold mb-2">Historical Analysis</h4>
            <ul className="text-text-light text-sm space-y-1">
              <li>• Backtesting results</li>
              <li>• Risk-adjusted returns</li>
              <li>• Drawdown analysis</li>
            </ul>
          </div>
          <div className="bg-bg-dark p-4 rounded-lg border border-neon-cyan/20 hover:scale-105 transition-transform duration-300">
            <div className="text-2xl mb-2">📄</div>
            <h4 className="text-neon-cyan font-semibold mb-2">Custom Reports</h4>
            <ul className="text-text-light text-sm space-y-1">
              <li>• Exportable data</li>
              <li>• Tax reporting tools</li>
              <li>• Performance comparisons</li>
            </ul>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500/10 to-yellow-500/10 p-4 rounded-lg border border-green-500/30">
          <h4 className="text-green-400 font-semibold mb-2">📋 Key Metrics Tracked</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <span className="bg-bg-darker px-3 py-1 rounded text-[#b8eaff] text-sm">ROI %</span>
            <span className="bg-bg-darker px-3 py-1 rounded text-[#b8eaff] text-sm">Sharpe Ratio</span>
            <span className="bg-bg-darker px-3 py-1 rounded text-[#b8eaff] text-sm">Win Rate</span>
            <span className="bg-bg-darker px-3 py-1 rounded text-[#b8eaff] text-sm">Max Drawdown</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "leaderboard",
    icon: <FaTrophy />,
    title: "Global Leaderboard",
    summary: "Compete with traders worldwide and showcase your best performing strategies",
    detail: (
      <div className="space-y-4">
        <p className="text-lg">
          Rise through the ranks and earn recognition for your trading prowess. The leaderboard
          showcases top performers and provides inspiration for improving your strategies.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-bg-dark p-4 rounded-lg border border-neon-cyan/20 hover:scale-105 transition-transform duration-300">
            <div className="text-2xl mb-2">🏆</div>
            <h4 className="text-neon-cyan font-semibold mb-2">Competition Categories</h4>
            <ul className="text-text-light text-sm space-y-1">
              <li>• Overall Performance</li>
              <li>• Best Risk-Adjusted Returns</li>
              <li>• Most Consistent Trader</li>
              <li>• Rising Star (New Traders)</li>
            </ul>
          </div>
          <div className="bg-bg-dark p-4 rounded-lg border border-neon-cyan/20 hover:scale-105 transition-transform duration-300">
            <div className="text-2xl mb-2">🎖️</div>
            <h4 className="text-neon-cyan font-semibold mb-2">Achievements & Badges</h4>
            <ul className="text-text-light text-sm space-y-1">
              <li>• Performance milestones</li>
              <li>• Strategy innovation awards</li>
              <li>• Community contribution badges</li>
              <li>• Exclusive NFT rewards</li>
            </ul>
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-lg border border-purple-500/30">
          <h4 className="text-purple-400 font-semibold mb-2">🌟 Leaderboard Benefits</h4>
          <div className="flex flex-wrap gap-2">
            <span className="bg-bg-darker px-3 py-1 rounded text-[#b8eaff] text-sm">Reduced Fees</span>
            <span className="bg-bg-darker px-3 py-1 rounded text-[#b8eaff] text-sm">Early Access</span>
            <span className="bg-bg-darker px-3 py-1 rounded text-[#b8eaff] text-sm">VIP Support</span>
            <span className="bg-bg-darker px-3 py-1 rounded text-[#b8eaff] text-sm">Premium Features</span>
          </div>
        </div>
      </div>
    ),
  },
];

export default Features;
