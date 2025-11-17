import React from 'react';
import { FaEye, FaShoppingCart, FaHandshake, FaTag, FaTrash } from 'react-icons/fa';
import { SiEthereum } from 'react-icons/si';

interface BotCardProps {
  bot: {
    id: string;
    name: string;
    description: string;
    price: number;
    buyPrice: number;
    hirePrice: number;
    image: string;
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
  currency: string;
  mode?: 'marketplace' | 'myBots' | 'listing';
  onView: (botId: string) => void;
  onBuy?: (bot: BotCardProps['bot']) => void;
  onHire?: (bot: BotCardProps['bot']) => void;
  onSell?: (bot: BotCardProps['bot']) => void;
  onRemoveListing?: (botId: string) => void;
}

const BotCard: React.FC<BotCardProps> = ({ 
  bot, 
  currency, 
  mode = 'marketplace',
  onView, 
  onBuy, 
  onHire,
  onSell,
  onRemoveListing
}) => {
  const renderRiskMeter = (risk: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((lvl) => (
        <div
          key={lvl}
          className={`w-2 h-2 rounded-full border ${
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
      <span className="ml-1 text-[10px] text-[#e0e7ef]">Risk: {risk}/5</span>
    </div>
  );

  const getProfitLossColor = (pl: number) => {
    if (pl >= 10) return 'text-green-400';
    if (pl >= 0) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatTradeTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  const formatAge = (days: number) => {
    if (days < 30) return `${days}d`;
    const months = Math.floor(days / 30);
    return `${months}mo`;
  };

  const renderActionButtons = () => {
    switch (mode) {
      case 'myBots':
        return (
          <div className="flex gap-2 mt-3 w-full">
            <button
              onClick={() => onSell?.(bot)}
              className="flex-1 hud-btn flex flex-col items-center justify-center bg-green-500 text-white px-2 py-2 rounded-lg font-bold shadow-[0_0_6px_rgba(34,197,94,0.5)] hover:bg-green-600 hover:shadow-[0_0_12px_rgba(34,197,94,0.7)] transition-all border border-green-400 text-xs"
            >
              <div className="flex items-center gap-1">
                <FaTag />
                <span>SELL</span>
              </div>
            </button>
          </div>
        );
      
      case 'listing':
        return (
          <div className="flex gap-2 mt-3 w-full">
            <button
              onClick={() => onRemoveListing?.(bot.id)}
              className="flex-1 hud-btn flex flex-col items-center justify-center bg-red-500 text-white px-2 py-2 rounded-lg font-bold shadow-[0_0_6px_rgba(239,68,68,0.5)] hover:bg-red-600 hover:shadow-[0_0_12px_rgba(239,68,68,0.7)] transition-all border border-red-400 text-xs"
            >
              <div className="flex items-center gap-1">
                <FaTrash />
                <span>REMOVE</span>
              </div>
            </button>
          </div>
        );
      
      default: // marketplace
        return (
          <div className="flex gap-2 mt-3 w-full">
            <button
              onClick={() => onBuy?.(bot)}
              className="flex-1 hud-btn flex flex-col items-center justify-center bg-green-500 text-white px-2 py-2 rounded-lg font-bold shadow-[0_0_6px_rgba(34,197,94,0.5)] hover:bg-green-600 hover:shadow-[0_0_12px_rgba(34,197,94,0.7)] transition-all border border-green-400 text-xs"
            >
              <div className="flex items-center gap-1 mb-1">
                <FaShoppingCart />
                <span>BUY</span>
              </div>
              <div className="flex items-center gap-1 text-[13px]">
                <span>{parseFloat(bot.buyPrice.toFixed(4))}</span>
                <SiEthereum className="w-3 h-3 text-[#627eea]" />
              </div>
            </button>
            <button
              onClick={() => onHire?.(bot)}
              className="flex-1 hud-btn flex flex-col items-center justify-center bg-[#00ffe7] text-[#181a23] px-2 py-2 rounded-lg font-bold shadow-[0_0_6px_rgba(0,255,231,0.5)] hover:bg-[#ff005c] hover:text-white hover:shadow-[0_0_12px_rgba(255,0,92,0.7)] transition-all border border-[#00ffe7] text-xs"
            >
              <div className="flex items-center gap-1 mb-1">
                <FaHandshake />
                <span>HIRE</span>
              </div>
              <span className="text-[13px]">FREE</span>
            </button>
          </div>
        );
    }
  };

  const cardBorderClass = mode === 'listing' 
    ? 'border-green-400/30 shadow-[0_0_12px_green] hover:shadow-[0_0_24px_green]'
    : 'border-[#00ffe7]/30 shadow-[0_0_12px_#00ffe7] hover:shadow-[0_0_24px_#ff005c]';

  return (
    <div
      className={`relative group bg-[#181a23]/80 border-2 ${cardBorderClass} rounded-xl transition-shadow overflow-hidden hud-panel p-2 flex flex-col items-center`}
      style={{ minHeight: 280 }}
    >
      {/* View Button - Top Left Corner */}
      <button
        onClick={() => onView(bot.id)}
        className="absolute top-2 left-2 w-8 h-8 hud-btn flex items-center justify-center bg-[#23263a] text-[#e0e7ef] rounded font-bold hover:bg-[#00ffe7] hover:text-[#181a23] transition-all "
      >
        <FaEye className="text-xs" />
      </button>

      <img
        src={bot.image}
        alt={bot.name}
        className="w-16 h-16 object-cover rounded-full border-2 border-[#00ffe7]/30 shadow-[0_0_8px_#00ffe7] mb-1"
      />
      <h2 className="text-base font-bold text-[#00ffe7] tracking-wide mb-0.5 text-center">
        {bot.name}
      </h2>
      <div className="flex flex-wrap gap-1 mb-1 justify-center">
        {bot.categories.map((cat) => (
          <span
            key={cat}
            className="bg-[#00ffe7]/10 text-[#00ffe7] px-1 py-0.5 rounded text-[10px] font-bold border border-[#00ffe7]/20"
          >
            {cat}
          </span>
        ))}
      </div>
      {renderRiskMeter(bot.risk)}
      <p className="text-[#e0e7ef] text-xs my-1 text-center line-clamp-2">
        {bot.description}
      </p>
      
      {/* Enhanced Stats Section */}
      <div className="flex flex-col gap-1 w-full mt-auto bg-[#23263a]/50 rounded-lg p-2 border border-[#00ffe7]/10">
        <div className="flex justify-between text-[11px]">
          <span className="text-[#b8eaff] font-medium">Trades/Day</span>
          <span className="font-bold text-[#00ffe7]">{bot.stats.tradesPerDay}</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-[#b8eaff] font-medium">P/L</span>
          <span className={`font-bold ${getProfitLossColor(bot.stats.profitLoss)}`}>
            {bot.stats.profitLoss >= 0 ? '+' : ''}{bot.stats.profitLoss.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-[#b8eaff] font-medium">Avg Trade</span>
          <span className="font-bold text-[#00ffe7]">{formatTradeTime(bot.stats.avgTradeTime)}</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-[#b8eaff] font-medium">Age</span>
          <span className="font-bold text-[#00ffe7]">{formatAge(bot.stats.age)}</span>
        </div>
      </div>

      {renderActionButtons()}
      
      <div className="absolute inset-0 pointer-events-none border border-[#00ffe7]/20 rounded-xl hud-glow"></div>
    </div>
  );
};

export default BotCard;
