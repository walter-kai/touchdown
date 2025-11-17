import React from 'react';
import { FaChartPie, FaRobot, FaTools, FaExchangeAlt } from 'react-icons/fa';

interface StatPreset {
  pl: string;
  botsRunning: number;
  botsGarage: number;
  orders: number;
}

interface StatCardsProps {
  statRange: '1d' | '7d' | '30d';
  onStatRangeChange: (range: '1d' | '7d' | '30d') => void;
  statPresets: Record<'1d' | '7d' | '30d', StatPreset>;
}

const StatCards: React.FC<StatCardsProps> = ({ statRange, onStatRangeChange, statPresets }) => {
  const statCards = [
    {
      label: "Total P/L",
      value: statPresets[statRange].pl,
      icon: <FaChartPie />,
      color: "from-green-400/80 to-green-700/60",
      desc: "Profit/Loss",
    },
    {
      label: "Bots Running",
      value: statPresets[statRange].botsRunning,
      icon: <FaRobot />,
      color: "from-blue-400/80 to-blue-700/60",
      desc: "Active bots",
    },
    {
      label: "Bots in Garage",
      value: statPresets[statRange].botsGarage,
      icon: <FaTools />,
      color: "from-purple-400/80 to-purple-700/60",
      desc: "Idle bots",
    },
    {
      label: "Total Orders",
      value: statPresets[statRange].orders,
      icon: <FaExchangeAlt />,
      color: "from-pink-400/80 to-pink-700/60",
      desc: "Orders placed",
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto mt-10 mb-8">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
        {/* Stat Cards */}
        {statCards.map((stat, idx) => (
          <div
            key={stat.label}
            className={`flex-1 min-w-[180px] bg-gradient-to-br ${stat.color} rounded-2xl shadow-lg p-6 mx-2 flex flex-col items-center justify-center border-2 border-[#00ffe7]/30 relative`}
            style={{ filter: "drop-shadow(0 0 16px #00ffe7aa)" }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#23263a] border-2 border-[#00ffe7]/40 rounded-full w-12 h-12 flex items-center justify-center text-2xl text-[#00ffe7] shadow-lg">
              {stat.icon}
            </div>
            <div className="mt-8 text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-[#b8eaff] text-sm">{stat.label}</div>
            <div className="text-xs text-[#e0e7ef]/60 mt-1">{stat.desc}</div>
          </div>
        ))}
      </div>
      
      {/* Stat Range Toggle */}
      <div className="flex justify-center gap-2 mt-6">
        {(['1d', '7d', '30d'] as const).map((range) => (
          <button
            key={range}
            onClick={() => onStatRangeChange(range)}
            className={`px-4 py-2 rounded-lg font-bold border border-[#00ffe7]/40 transition-all duration-200 ${
              statRange === range
                ? 'bg-[#00ffe7] text-[#181a23] shadow-[0_0_8px_#00ffe7]'
                : 'bg-[#23263a] text-[#e0e7ef] hover:bg-[#00ffe7]/20'
            }`}
          >
            {range.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StatCards;
