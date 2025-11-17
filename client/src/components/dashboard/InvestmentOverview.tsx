import React, { useState } from 'react';
import { FaChartLine } from 'react-icons/fa';
import { FaArrowTrendUp, FaArrowTrendDown } from 'react-icons/fa6';

import { SiEthereum } from 'react-icons/si';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface InvestmentOverviewProps {
  statRange: '1d' | '7d' | '30d';
  onStatRangeChange: (range: '1d' | '7d' | '30d') => void;
}

const InvestmentOverview: React.FC<InvestmentOverviewProps> = ({ statRange, onStatRangeChange }) => {
  // Mock investment data
  const investmentData = {
    "1d": {
      totalInvested: 2.45,
      currentValue: 2.87,
      pl: "+0.42",
      plPercent: 17.1,
      chartData: [2.45, 2.52, 2.48, 2.61, 2.73, 2.69, 2.87]
    },
    "7d": {
      totalInvested: 2.45,
      currentValue: 4.58,
      pl: "+2.13",
      plPercent: 86.9,
      chartData: [2.45, 2.67, 2.89, 3.12, 3.45, 3.89, 4.02, 4.23, 4.45, 4.31, 4.58]
    },
    "30d": {
      totalInvested: 2.45,
      currentValue: 10.33,
      pl: "+7.88",
      plPercent: 321.6,
      chartData: [2.45, 2.67, 2.89, 3.12, 3.45, 3.89, 4.02, 4.23, 4.45, 4.67, 4.89, 5.12, 5.34, 5.67, 5.89, 6.23, 6.78, 7.12, 7.45, 7.89, 8.23, 8.67, 9.12, 9.45, 9.78, 10.12, 10.33]
    }
  };

  const currentData = investmentData[statRange];
  const isPositive = currentData.plPercent >= 0;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#23263a',
        titleColor: '#00ffe7',
        bodyColor: '#e0e7ef',
        borderColor: '#00ffe7',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 6,
      },
      line: {
        borderWidth: 3,
      },
    },
  };

  const chartData = {
    labels: currentData.chartData.map((_, i) => i.toString()),
    datasets: [
      {
        data: currentData.chartData,
        borderColor: isPositive ? '#00ff88' : '#ff005c',
        backgroundColor: isPositive ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 0, 92, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="w-full max-w-7xl mx-auto mt-10 mb-8">
      <div className="bg-[#181a23]/80 border-4 border-[#00ffe7]/40 rounded-2xl shadow-[0_0_32px_#00ffe7] p-6">
        <div className="flex items-center gap-3 mb-6">
          <FaChartLine className="text-2xl text-[#00ffe7]" />
          <h2 className="text-2xl font-bold text-[#00ffe7]">Investment Overview</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Investment Stats */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#23263a]/50 rounded-lg p-4 border border-[#00ffe7]/20">
                <div className="text-sm text-[#b8eaff] mb-1">Total Invested</div>
                <div className="flex items-center gap-1">
                  <span className="text-xl font-bold text-[#e0e7ef]">
                    {currentData.totalInvested.toFixed(3)}
                  </span>
                  <SiEthereum className="w-4 h-4 text-[#627eea]" />
                </div>
              </div>
              
              <div className="bg-[#23263a]/50 rounded-lg p-4 border border-[#00ffe7]/20">
                <div className="text-sm text-[#b8eaff] mb-1">Current Value</div>
                <div className="flex items-center gap-1">
                  <span className="text-xl font-bold text-[#e0e7ef]">
                    {currentData.currentValue.toFixed(3)}
                  </span>
                  <SiEthereum className="w-4 h-4 text-[#627eea]" />
                </div>
              </div>
            </div>

            <div className={`rounded-lg p-4 border-2 ${isPositive ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isPositive ? (
                    <FaArrowTrendUp className="text-green-400" />
                  ) : (
                    <FaArrowTrendDown className="text-red-400" />
                  )}
                  <span className="text-sm text-[#b8eaff]">P/L ({statRange.toUpperCase()})</span>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {currentData.pl} ETH
                  </div>
                  <div className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{currentData.plPercent.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-[#23263a]/50 rounded-lg p-4 border border-[#00ffe7]/20">
            <div className="text-sm text-[#b8eaff] mb-3">Portfolio Performance</div>
            <div className="h-32">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Time Range Toggle */}
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
    </div>
  );
};

export default InvestmentOverview;
