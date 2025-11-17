import React, { useState, useEffect } from 'react';
import { FaRobot, FaPause, FaCrosshairs, FaHourglassHalf, FaTools, FaPlay } from 'react-icons/fa';
// import {FaTrendUp, FaTrendDown} from 'react-icons/fa6';
import { FaArrowTrendUp, FaArrowTrendDown } from 'react-icons/fa6';

import { SiEthereum } from 'react-icons/si';

interface Bot {
  id: string;
  name: string;
  status: 'running' | 'paused' | 'sniping' | 'waiting' | 'garage';
  profitLoss: number;
  profitLossPercent: number;
  dealsPerDay: number;
  avgTimeBetweenTrades: number; // in minutes
  totalProfit: number;
  // Status-specific data
  cooldownRemaining?: number; // seconds for paused bots
  snipingPrice?: number; // target price for sniping bots
  currentPrice?: number; // current token price for sniping bots
  snipingDuration?: number; // how long it's been sniping in minutes
  waitingReason?: string; // reason for waiting status
}

const BotsList: React.FC = () => {
  const [bots] = useState<Bot[]>([
    {
      id: '1',
      name: 'ScalpMaster Pro',
      status: 'running',
      profitLoss: 0.234,
      profitLossPercent: 15.6,
      dealsPerDay: 12,
      avgTimeBetweenTrades: 120,
      totalProfit: 1.45,
    },
    {
      id: '2',
      name: 'Arbitrage Hunter',
      status: 'paused',
      profitLoss: -0.056,
      profitLossPercent: -3.2,
      dealsPerDay: 8,
      avgTimeBetweenTrades: 180,
      totalProfit: 0.89,
      cooldownRemaining: 245,
    },
    {
      id: '3',
      name: 'DeFi Yield Bot',
      status: 'sniping',
      profitLoss: 0.123,
      profitLossPercent: 8.9,
      dealsPerDay: 6,
      avgTimeBetweenTrades: 240,
      totalProfit: 2.12,
      snipingPrice: 0.000034,
      currentPrice: 0.000038,
      snipingDuration: 47,
    },
    {
      id: '4',
      name: 'Swing Trader',
      status: 'waiting',
      profitLoss: 0.067,
      profitLossPercent: 4.1,
      dealsPerDay: 3,
      avgTimeBetweenTrades: 480,
      totalProfit: 0.67,
      waitingReason: 'Insufficient balance',
    },
    {
      id: '5',
      name: 'Grid Bot Alpha',
      status: 'garage',
      profitLoss: 0.0,
      profitLossPercent: 0,
      dealsPerDay: 0,
      avgTimeBetweenTrades: 0,
      totalProfit: 0.34,
    },
  ]);

  // Countdown timer for paused bots
  const [countdown, setCountdown] = useState<{[key: string]: number}>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        const newCountdown = { ...prev };
        bots.forEach(bot => {
          if (bot.status === 'paused' && bot.cooldownRemaining) {
            const currentTime = newCountdown[bot.id] || bot.cooldownRemaining;
            if (currentTime > 0) {
              newCountdown[bot.id] = currentTime - 1;
            }
          }
        });
        return newCountdown;
      });
    }, 1000);

    // Initialize countdown
    const initialCountdown: {[key: string]: number} = {};
    bots.forEach(bot => {
      if (bot.status === 'paused' && bot.cooldownRemaining) {
        initialCountdown[bot.id] = bot.cooldownRemaining;
      }
    });
    setCountdown(initialCountdown);

    return () => clearInterval(interval);
  }, [bots]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeFromMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <FaPlay className="text-green-400" />;
      case 'paused': return <FaPause className="text-yellow-400" />;
      case 'sniping': return <FaCrosshairs className="text-orange-400" />;
      case 'waiting': return <FaHourglassHalf className="text-blue-400" />;
      case 'garage': return <FaTools className="text-gray-400" />;
      default: return <FaRobot className="text-[#00ffe7]" />;
    }
  };

  const getStatusText = (bot: Bot) => {
    switch (bot.status) {
      case 'running':
        return <span className="text-green-400 font-bold">Running</span>;
      case 'paused':
        const timeLeft = countdown[bot.id] || 0;
        return (
          <div className="text-yellow-400">
            <div className="font-bold">Paused</div>
            <div className="text-xs">Cooldown: {formatTime(timeLeft)}</div>
          </div>
        );
      case 'sniping':
        return (
          <div className="text-orange-400">
            <div className="font-bold">Sniping</div>
            <div className="text-xs">Target: ${bot.snipingPrice?.toFixed(6)}</div>
            <div className="text-xs">Current: ${bot.currentPrice?.toFixed(6)}</div>
            <div className="text-xs">Waiting: {bot.snipingDuration}m</div>
          </div>
        );
      case 'waiting':
        return (
          <div className="text-blue-400">
            <div className="font-bold">Awaiting Funds</div>
            <div className="text-xs">{bot.waitingReason}</div>
          </div>
        );
      case 'garage':
        return <span className="text-gray-400 font-bold">In Garage</span>;
      default:
        return <span className="text-[#e0e7ef]">{bot.status}</span>;
    }
  };

  const runningBots = bots.filter(bot => bot.status === 'running').length;
  const garageBots = bots.filter(bot => bot.status === 'garage').length;

  return (
    <div className="w-full max-w-7xl mx-auto mb-8">
      <div className="bg-[#181a23]/80 border-4 border-[#00ffe7]/40 rounded-2xl shadow-[0_0_32px_#00ffe7] p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FaRobot className="text-2xl text-[#00ffe7]" />
            <h2 className="text-2xl font-bold text-[#00ffe7]">My Trading Bots</h2>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="bg-[#23263a]/50 rounded-lg px-3 py-2 border border-green-400/30">
              <span className="text-green-400 font-bold">{runningBots} Running</span>
            </div>
            <div className="bg-[#23263a]/50 rounded-lg px-3 py-2 border border-gray-400/30">
              <span className="text-gray-400 font-bold">{garageBots} In Garage</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {bots.map((bot) => (
            <div key={bot.id} className="bg-[#23263a]/50 rounded-lg p-4 border border-[#00ffe7]/20 hover:border-[#00ffe7]/40 transition-colors">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                {/* Bot Name & Status */}
                <div className="flex items-center gap-3">
                  {getStatusIcon(bot.status)}
                  <div>
                    <div className="font-bold text-[#00ffe7]">{bot.name}</div>
                    <div className="text-xs">{getStatusText(bot)}</div>
                  </div>
                </div>

                {/* P/L */}
                <div className="text-center">
                  <div className="text-xs text-[#b8eaff] mb-1">P/L</div>
                  <div className={`flex items-center justify-center gap-1 ${bot.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {bot.profitLoss >= 0 ? <FaArrowTrendUp /> : <FaArrowTrendDown />}
                    <span className="font-bold">{bot.profitLoss >= 0 ? '+' : ''}{bot.profitLoss.toFixed(3)}</span>
                    <SiEthereum className="w-3 h-3 text-[#627eea]" />
                  </div>
                  <div className={`text-xs ${bot.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {bot.profitLoss >= 0 ? '+' : ''}{bot.profitLossPercent.toFixed(1)}%
                  </div>
                </div>

                {/* Deals Per Day */}
                <div className="text-center">
                  <div className="text-xs text-[#b8eaff] mb-1">Deals/Day</div>
                  <div className="font-bold text-[#e0e7ef]">{bot.dealsPerDay}</div>
                </div>

                {/* Avg Time Between Trades */}
                <div className="text-center">
                  <div className="text-xs text-[#b8eaff] mb-1">Avg Wait Time</div>
                  <div className="font-bold text-[#e0e7ef]">{formatTimeFromMinutes(bot.avgTimeBetweenTrades)}</div>
                </div>

                {/* Total Profit */}
                <div className="text-center">
                  <div className="text-xs text-[#b8eaff] mb-1">Total Profit</div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-bold text-[#00ffe7]">{bot.totalProfit.toFixed(3)}</span>
                    <SiEthereum className="w-3 h-3 text-[#627eea]" />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {bots.length === 0 && (
            <div className="text-center text-[#e0e7ef] py-8">
              No bots found. <span className="text-[#00ffe7] font-bold">Create your first bot</span> to start trading!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BotsList;
