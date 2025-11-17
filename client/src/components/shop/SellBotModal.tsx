import React, { useState } from 'react';
import { BotConfig } from '../../../../types/Bot';
import { generateLogoHash } from '../../hooks/useRobohash';
import { FaTimes, FaTag, FaDollarSign, FaFileAlt, FaCheckCircle } from 'react-icons/fa';

interface SellBotModalProps {
  bot: BotConfig;
  onClose: () => void;
  onSubmit: (listingData: {
    botId: string;
    price: number;
    description: string;
    categories: string[];
  }) => void;
}

const SellBotModal: React.FC<SellBotModalProps> = ({ bot, onClose, onSubmit }) => {
  const [price, setPrice] = useState<number>(0.1);
  const [description, setDescription] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const availableCategories = [
    'Crypto', 'Arbitrage', 'AI', 'Stocks', 'Swing', 'ML',
    'Fantasy', 'Sports', 'Automation', 'NFT', 'Sniper', 'DeFi',
    'Options', 'Momentum', 'Quant', 'Forex', 'Scalping', 'Trend'
  ];

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      setError('Please provide a description for your bot.');
      return;
    }
    
    if (selectedCategories.length === 0) {
      setError('Please select at least one category.');
      return;
    }
    
    if (price < 0.01) {
      setError('Price must be at least 0.01 ETH.');
      return;
    }

    setError(null);
    onSubmit({
      botId: bot.botName,
      price,
      description: description.trim(),
      categories: selectedCategories
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-[#23263a] w-full max-w-2xl rounded-2xl p-8 relative border-4 border-[#00ffe7]/40 shadow-[0_0_48px_#00ffe7] max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-[#181a23] p-2 rounded-full hover:bg-[#00ffe7] hover:text-[#181a23] text-[#00ffe7] border-2 border-[#00ffe7] transition-all text-xl"
          aria-label="Close"
        >
          <FaTimes />
        </button>

        <h2 className="text-2xl font-bold text-[#00ffe7] mb-6 flex items-center gap-2">
          <FaTag /> List Bot for Sale
        </h2>

        {/* Bot Preview */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-[#181a23] rounded-lg border border-[#00ffe7]/20">
          <img
            src={generateLogoHash(bot.botName)}
            alt={bot.botName}
            className="w-16 h-16 rounded-full border-2 border-[#00ffe7]/40"
          />
          <div>
            <h3 className="text-lg font-bold text-[#00ffe7]">{bot.botName}</h3>
            <p className="text-[#e0e7ef] text-sm">Trading Pair: {bot.tradingPool || 'N/A'}</p>
            <p className="text-[#e0e7ef] text-sm">Status: {bot.status}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Price */}
          <div>
            <label className="flex items-center gap-2 text-[#00ffe7] font-bold text-sm mb-2">
              <FaDollarSign /> Price (ETH)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full p-3 bg-[#181a23] border-2 border-[#00ffe7]/40 text-[#e0e7ef] rounded-lg font-bold focus:outline-none focus:border-[#00ffe7]"
              placeholder="Enter price in ETH"
            />
            <div className="text-xs text-[#e0e7ef]/60 mt-1 flex items-center gap-1">
              ≈ ${(price * 3500).toFixed(2)} USD 
              <span className="text-[#b8eaff]">(estimated)</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-[#00ffe7] font-bold text-sm mb-2">
              <FaFileAlt /> Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-[#181a23] border-2 border-[#00ffe7]/40 text-[#e0e7ef] rounded-lg resize-none h-24 focus:outline-none focus:border-[#00ffe7]"
              placeholder="Describe your bot's features and performance..."
              maxLength={500}
            />
            <div className="text-xs text-[#e0e7ef]/60 mt-1">
              {description.length}/500 characters
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="flex items-center gap-2 text-[#00ffe7] font-bold text-sm mb-2">
              <FaTag /> Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map(category => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategoryToggle(category)}
                  className={`px-3 py-1 rounded text-xs font-bold border transition-all ${
                    selectedCategories.includes(category)
                      ? 'bg-[#00ffe7] text-[#181a23] border-[#00ffe7]'
                      : 'bg-[#181a23] text-[#00ffe7] border-[#00ffe7]/30 hover:bg-[#00ffe7]/20'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="text-xs text-[#e0e7ef]/60 mt-1">
              Selected: {selectedCategories.length} categories
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-400/30 rounded p-3">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-hud bg-gray-500 text-white border-gray-400 hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-hud bg-green-500 text-white border-green-400 hover:bg-green-600"
            >
              <FaCheckCircle /> List for Sale
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellBotModal;
