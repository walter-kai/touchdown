import React from 'react';
import { FaTimes, FaShoppingCart, FaHandshake, FaCheckCircle } from 'react-icons/fa';
import { SiEthereum } from 'react-icons/si';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  bot: any;
  type: 'buy' | 'hire';
  onConfirm: () => void;
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  bot,
  type,
  onConfirm,
}) => {
  if (!isOpen || !bot) return null;

  const ethPrice = 3500; // Placeholder ETH price
  const basePrice = type === 'buy' ? bot.buyPrice : 0; // Hire is free
  const dexterCityFee = 5; // 5% always
  const botOwnerFee = bot.isPublic ? 0 : 5; // Additional 5% if private bot
  const userShare = 100 - dexterCityFee - botOwnerFee; // Remaining percentage
  
  const totalCost = basePrice;
  const totalCostUsd = (totalCost * ethPrice).toFixed(2);

  // Pie chart data for hire breakdown
  const hireBreakdownData = {
    labels: ['Your Share', 'Dexter CityFee', ...(bot.isPublic ? [] : ['Bot Creator Fee'])],
    datasets: [
      {
        data: bot.isPublic ? [userShare, dexterCityFee] : [userShare, dexterCityFee, botOwnerFee],
        backgroundColor: ['#00ff88', '#ff005c', '#faafe8'],
        borderColor: '#23263a',
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-[#23263a] w-full max-w-lg rounded-2xl p-8 relative border-4 border-[#00ffe7]/40 shadow-[0_0_48px_#00ffe7] hud-panel">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-[#181a23] p-2 rounded-full hover:bg-[#00ffe7] hover:text-[#181a23] text-[#00ffe7] border-2 border-[#00ffe7] transition-all text-xl"
          aria-label="Close"
        >
          <FaTimes />
        </button>

        <div className="flex items-center gap-3 mb-6">
          {type === 'buy' ? (
            <FaShoppingCart className="text-2xl text-green-400" />
          ) : (
            <FaHandshake className="text-2xl text-[#00ffe7]" />
          )}
          <h2 className="text-2xl font-bold text-[#00ffe7]">
            {type === 'buy' ? 'Buy Bot Details' : 'Hire Bot'}
          </h2>
        </div>

        {/* Bot Info */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-[#181a23]/50 rounded-lg border border-[#00ffe7]/20">
          <img
            src={bot.image}
            alt={bot.name}
            className="w-16 h-16 rounded-full border-2 border-[#00ffe7]/40"
          />
          <div>
            <h3 className="text-lg font-bold text-[#00ffe7]">{bot.name}</h3>
            <p className="text-sm text-[#e0e7ef]">{bot.description}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-1 rounded ${
                bot.isPublic 
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                  : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              }`}>
                {bot.isPublic ? 'Public' : 'Private'}
              </span>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="bg-[#181a23]/30 rounded-lg p-4 mb-6 border border-[#00ffe7]/10">
          <h4 className="text-lg font-bold text-[#00ffe7] mb-3">
            {type === 'buy' ? 'Purchase Details' : 'Hiring Agreement'}
          </h4>
          
          {type === 'buy' ? (
            <div className="space-y-2 text-sm">
              <p className="text-[#e0e7ef]">
                <strong className="text-[#00ffe7]">What you get:</strong> Full bot configuration details, 
                trading strategy parameters, and technical specifications.
              </p>
              <p className="text-[#e0e7ef]">
                <strong className="text-[#00ffe7]">Note:</strong> This is for viewing details only. 
                You'll need to hire the bot separately to use it for trading.
              </p>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <p className="text-[#e0e7ef]">
                <strong className="text-[#00ffe7]">What you get:</strong> Full access to use this bot 
                for automated trading with your wallet.
              </p>
              <p className="text-[#e0e7ef]">
                <strong className="text-[#00ffe7]">Commission Structure:</strong> We win when you win! 
                Fees are only taken from profitable trades.
              </p>
            </div>
          )}
        </div>

        {/* Cost Breakdown or Commission Breakdown */}
        {type === 'buy' ? (
          <div className="bg-[#181a23]/50 rounded-lg p-4 mb-6 border border-[#00ffe7]/20">
            <h4 className="text-lg font-bold text-[#00ffe7] mb-3">Cost Breakdown</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#e0e7ef]">Bot Details Access:</span>
                <div className="flex items-center gap-1">
                  <span className="text-[#e0e7ef] font-mono">{basePrice.toFixed(3)}</span>
                  <SiEthereum className="w-3 h-3 text-[#627eea]" />
                </div>
              </div>
              
              <div className="border-t border-[#00ffe7]/20 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#00ffe7] font-bold">Total Cost:</span>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1">
                      <span className="text-[#00ffe7] font-bold font-mono text-lg">
                        {totalCost.toFixed(3)}
                      </span>
                      <SiEthereum className="w-4 h-4 text-[#627eea]" />
                    </div>
                    <span className="text-[#b8eaff] text-xs">≈ ${totalCostUsd} USD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#181a23]/50 rounded-lg p-4 mb-6 border border-[#00ffe7]/20">
            <h4 className="text-lg font-bold text-[#00ffe7] mb-3">Commission Breakdown</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-center mb-2">
                  <span className="text-2xl font-bold text-green-400">{userShare}%</span>
                  <p className="text-xs text-[#e0e7ef]">Your Share of Profits</p>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#e0e7ef]">Dexter CityFee:</span>
                    <span className="text-[#ff005c]">{dexterCityFee}%</span>
                  </div>
                  {!bot.isPublic && (
                    <div className="flex justify-between">
                      <span className="text-[#e0e7ef]">Bot Creator:</span>
                      <span className="text-[#faafe8]">{botOwnerFee}%</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-center">
                <Pie
                  data={hireBreakdownData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          color: '#e0e7ef',
                          font: { size: 10 }
                        }
                      }
                    }
                  }}
                  height={120}
                />
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded">
              <p className="text-center text-green-400 font-bold text-lg">
                FREE TO START
              </p>
              <p className="text-center text-[#e0e7ef] text-sm">
                No upfront cost - fees only on profitable trades
              </p>
            </div>
          </div>
        )}

        {/* Confirm Button */}
        <button
          onClick={onConfirm}
          className={`w-full hud-btn flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold uppercase shadow-[0_0_8px_#00ffe7] hover:shadow-[0_0_16px_#ff005c] transition-all border-2 text-lg ${
            type === 'buy'
              ? 'bg-green-400 text-[#181a23] border-green-400 hover:bg-green-600 hover:text-white'
              : 'bg-[#00ffe7] text-[#181a23] border-[#00ffe7] hover:bg-[#ff005c] hover:text-white hover:border-[#ff005c]'
          }`}
        >
          <FaCheckCircle />
          {type === 'buy' ? (
            <span>Purchase - {totalCost.toFixed(3)} ETH (${totalCostUsd})</span>
          ) : (
            <span>Start Hiring - FREE</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default PurchaseModal;
