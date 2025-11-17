import React, { useState } from 'react';
import BotCard from './BotCard';
import FilterPanel from './FilterPanel';

interface BuyingTabProps {
  bots: any[];
  allCategories: string[];
  onOpenModal: (botId: string) => void;
  onBuyBot: (bot: any) => void;
  onHireBot: (bot: any) => void;
}

const BuyingTab: React.FC<BuyingTabProps> = ({
  bots,
  allCategories,
  onOpenModal,
  onBuyBot,
  onHireBot,
}) => {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0.003, 0.006]);
  const [dragging, setDragging] = useState<null | 'min' | 'max'>(null);

  const MIN = 0.003;
  const MAX = 0.006;

  // Filter bots based on current filter criteria
  const filteredBots = bots.filter(bot => {
    const riskMatch = !riskFilter || bot.risk === riskFilter;
    const priceMatch = bot.buyPrice >= priceRange[0] && bot.buyPrice <= priceRange[1];
    const searchMatch = search === '' || bot.name.toLowerCase().includes(search.toLowerCase());
    const categoryMatch = categoryFilter.length === 0 || categoryFilter.every(cat => bot.categories.includes(cat));
    
    return riskMatch && priceMatch && searchMatch && categoryMatch;
  });

  // Remove first two bots for demo purposes
  const filteredBotsWithRemoved = filteredBots.filter((_, idx) => idx !== 0 && idx !== 6);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      <FilterPanel
        search={search}
        setSearch={setSearch}
        riskFilter={riskFilter}
        setRiskFilter={setRiskFilter}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        allCategories={allCategories}
        dragging={dragging}
        setDragging={setDragging}
        MIN={MIN}
        MAX={MAX}
      />
      {filteredBotsWithRemoved.map((bot) => (
        <BotCard
          key={bot.id}
          bot={bot}
          currency="ETH"
          onView={onOpenModal}
          onBuy={onBuyBot}
          onHire={onHireBot}
        />
      ))}
    </div>
  );
};

export default BuyingTab;
