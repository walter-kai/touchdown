import React, { useState } from 'react';
import { BotConfig } from '../../../../types/Bot';
import { generateLogoHash } from '../../hooks/useRobohash';
import BotCard from './BotCard';
import SellBotModal from './SellBotModal';

interface SellingTabProps {
  myBots: BotConfig[];
  myListings: any[];
  onSellSubmit: (listingData: any) => void;
  onRemoveListing: (listingId: string) => void;
}

const SellingTab: React.FC<SellingTabProps> = ({
  myBots,
  myListings,
  onSellSubmit,
  onRemoveListing,
}) => {
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedBotToSell, setSelectedBotToSell] = useState<BotConfig | null>(null);

  const handleSellBot = (bot: any) => {
    // Find the original BotConfig from the transformed data
    const originalBot = myBots.find(b => b.botName === bot.name);
    if (originalBot) {
      setSelectedBotToSell(originalBot);
      setShowSellModal(true);
    }
  };

  const handleSellModalSubmit = (listingData: any) => {
    const enhancedListingData = {
      ...listingData,
      bot: selectedBotToSell,
    };
    onSellSubmit(enhancedListingData);
    setShowSellModal(false);
    setSelectedBotToSell(null);
  };

  // Transform BotConfig to match BotCard interface
  const transformBotConfigToBotCard = (bot: BotConfig) => ({
    id: bot.botName,
    name: bot.botName,
    description: `Trading pair: ${bot.tradingPool || 'N/A'} | Status: ${bot.status}`,
    price: 0.1, // Default price for selling
    buyPrice: 0.1,
    hirePrice: 0,
    image: generateLogoHash(bot.botName),
    stats: {
      trades: Math.floor(Math.random() * 500 + 100), // Mock data
      tradesPerDay: Math.floor(Math.random() * 50 + 10),
      profitLoss: parseFloat((Math.random() * 30 - 5).toFixed(1)),
      avgTradeTime: Math.floor(Math.random() * 120 + 30),
      age: Math.floor(Math.random() * 180 + 30),
    },
    categories: ['Custom'], // Default category for user bots
    risk: Math.floor(Math.random() * 5) + 1,
  });

  // Transform listing to match BotCard interface
  const transformListingToBotCard = (listing: any) => ({
    id: listing.id,
    name: listing.bot.botName,
    description: listing.description,
    price: listing.price,
    buyPrice: listing.price,
    hirePrice: 0,
    image: generateLogoHash(listing.bot.botName),
    stats: {
      trades: Math.floor(Math.random() * 500 + 100), // Mock data
      tradesPerDay: Math.floor(Math.random() * 50 + 10),
      profitLoss: parseFloat((Math.random() * 30 - 5).toFixed(1)),
      avgTradeTime: Math.floor(Math.random() * 120 + 30),
      age: Math.floor(Math.random() * 180 + 30),
    },
    categories: listing.categories,
    risk: Math.floor(Math.random() * 5) + 1,
  });

  return (
    <>
      <div className="space-y-6">
        {/* My Bots Available to Sell */}
        <div>
          <h2 className="text-2xl font-bold text-[#00ffe7] mb-4">My Bots Available to Sell</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {myBots.map((bot) => (
              <BotCard
                key={bot.botName}
                bot={transformBotConfigToBotCard(bot)}
                currency="ETH"
                mode="myBots"
                onView={() => {}} // No view for own bots
                onSell={handleSellBot}
              />
            ))}
            {myBots.length === 0 && (
              <div className="col-span-full text-center text-[#e0e7ef] py-8">
                No bots available to sell. Create some bots first!
              </div>
            )}
          </div>
        </div>

        {/* My Active Listings */}
        <div>
          <h2 className="text-2xl font-bold text-[#00ffe7] mb-4">My Active Listings</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {myListings.map((listing) => (
              <BotCard
                key={listing.id}
                bot={transformListingToBotCard(listing)}
                currency="ETH"
                mode="listing"
                onView={() => {}} // No view for listings
                onRemoveListing={onRemoveListing}
              />
            ))}
            {myListings.length === 0 && (
              <div className="col-span-full text-center text-[#e0e7ef] py-8">
                No active listings. List some bots for sale!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sell Bot Modal */}
      {showSellModal && selectedBotToSell && (
        <SellBotModal
          bot={selectedBotToSell}
          onClose={() => {
            setShowSellModal(false);
            setSelectedBotToSell(null);
          }}
          onSubmit={handleSellModalSubmit}
        />
      )}
    </>
  );
};

export default SellingTab;
