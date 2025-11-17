import React, { useRef } from 'react';
import { FaSearch, FaFilter } from 'react-icons/fa';

interface FilterPanelProps {
  search: string;
  setSearch: (value: string) => void;
  riskFilter: number | null;
  setRiskFilter: (value: number | null) => void;
  priceRange: [number, number];
  setPriceRange: (value: [number, number]) => void;
  categoryFilter: string[];
  setCategoryFilter: (value: string[]) => void;
  allCategories: string[];
  dragging: null | 'min' | 'max';
  setDragging: (value: null | 'min' | 'max') => void;
  MIN: number;
  MAX: number;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  search,
  setSearch,
  riskFilter,
  setRiskFilter,
  priceRange,
  setPriceRange,
  categoryFilter,
  setCategoryFilter,
  allCategories,
  dragging,
  setDragging,
  MIN,
  MAX,
}) => {
  const sliderTrack = useRef<HTMLDivElement>(null);

  const clamp = (val: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, val));
  };

  const getPercent = (val: number) => {
    const range = MAX - MIN;
    if (range === 0) return 0;
    const percent = ((val - MIN) / range) * 100;
    return Math.max(0, Math.min(100, percent)); // Clamp between 0-100
  };

  const handleSliderMouseDown = (type: 'min' | 'max') => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    setDragging(type);
  };

  const handleSliderMouseMove = (e: MouseEvent) => {
    if (!sliderTrack.current || !dragging) return;
    
    const rect = sliderTrack.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const value = percent * (MAX - MIN) + MIN;

    if (dragging === 'min') {
      const newMin = Math.max(MIN, Math.min(value, priceRange[1] - 0.001));
      setPriceRange([newMin, priceRange[1]]);
    } else if (dragging === 'max') {
      const newMax = Math.max(priceRange[0] + 0.001, Math.min(value, MAX));
      setPriceRange([priceRange[0], newMax]);
    }
  };

  const handleSliderMouseUp = () => setDragging(null);

  React.useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleSliderMouseMove);
      window.addEventListener('mouseup', handleSliderMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleSliderMouseMove);
        window.removeEventListener('mouseup', handleSliderMouseUp);
      };
    }
  }, [dragging, priceRange, MIN, MAX]);

  const minPercent = getPercent(priceRange[0]);
  const maxPercent = getPercent(priceRange[1]);

  return (
    <div className="col-span-2 sm:col-span-1 md:col-span-1 lg:col-span-1 row-span-2 flex flex-col justify-center items-center">
      <div className="w-full h-full flex flex-col justify-center items-center">
        <div className="p-3 h-full w-full bg-[#23263a]/80 border border-[#00ffe7]/20 rounded-xl shadow-[0_0_8px_#00ffe7] flex flex-col gap-3 items-center">
          <div className="flex items-center gap-2 w-full">
            <FaSearch className="text-[#00ffe7]" />
            <input
              type="text"
              placeholder="Search name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-[#181a23] border border-[#00ffe7]/20 rounded px-2 py-1 text-[#e0e7ef] focus:outline-none w-full"
            />
          </div>
          <div className="flex items-center gap-2 w-full">
            <FaFilter className="text-[#00ffe7]" />
            <span className="text-[#e0e7ef] text-xs">Risk:</span>
            <select
              value={riskFilter ?? ''}
              onChange={e => setRiskFilter(e.target.value ? Number(e.target.value) : null)}
              className="bg-[#181a23] border border-[#00ffe7]/20 rounded px-2 py-1 text-[#e0e7ef] w-full"
            >
              <option value="">All</option>
              {[1, 2, 3, 4, 5].map(risk => (
                <option key={risk} value={risk}>{risk}</option>
              ))}
            </select>
          </div>
          {/* Price range slider */}
          <div className="flex flex-col gap-1 w-full">
            <span className="text-[#e0e7ef] text-xs mb-1">Buy Price Range (ETH):</span>
            <div className="relative w-full h-12 flex flex-col justify-center select-none">
              <div
                ref={sliderTrack}
                className="relative w-full h-2 mt-5 bg-[#181a23] rounded cursor-pointer"
                onMouseDown={e => {
                  // Only handle track clicks if not clicking on a handle
                  const target = e.target as HTMLElement;
                  if (target.classList.contains('slider-handle')) {
                    return; // Let the handle's own event handler deal with it
                  }
                  
                  const rect = sliderTrack.current!.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percent = Math.max(0, Math.min(1, x / rect.width));
                  const value = percent * (MAX - MIN) + MIN;
                  const distToMin = Math.abs(value - priceRange[0]);
                  const distToMax = Math.abs(value - priceRange[1]);
                  
                  if (distToMin < distToMax) {
                    const newMin = Math.max(MIN, Math.min(value, priceRange[1] - 0.001));
                    setPriceRange([newMin, priceRange[1]]);
                    setDragging('min');
                  } else {
                    const newMax = Math.max(priceRange[0] + 0.001, Math.min(value, MAX));
                    setPriceRange([priceRange[0], newMax]);
                    setDragging('max');
                  }
                }}
              >
                {/* Active range bar */}
                <div
                  className="absolute h-2 bg-[#00ffe7] rounded"
                  style={{
                    left: `${getPercent(priceRange[0])}%`,
                    width: `${Math.max(0, getPercent(priceRange[1]) - getPercent(priceRange[0]))}%`,
                  }}
                />
                
                {/* Min handle */}
                <div
                  className="slider-handle absolute w-4 h-4 bg-[#00ffe7] border-2 border-[#fff] rounded-full shadow -top-1 cursor-pointer hover:scale-110 transition-transform"
                  style={{
                    left: `calc(${getPercent(priceRange[0])}% - 8px)`,
                    zIndex: dragging === 'min' ? 60 : 50,
                  }}
                  onMouseDown={handleSliderMouseDown('min')}
                />
                
                {/* Max handle */}
                <div
                  className="slider-handle absolute w-4 h-4 bg-[#ff005c] border-2 border-[#fff] rounded-full shadow -top-1 cursor-pointer hover:scale-110 transition-transform"
                  style={{
                    left: `calc(${getPercent(priceRange[1])}% - 8px)`,
                    zIndex: dragging === 'max' ? 60 : 40,
                  }}
                  onMouseDown={handleSliderMouseDown('max')}
                />
              </div>
              
              {/* Value labels */}
              <div className="absolute w-full flex justify-between top-9 text-xs text-[#00ffe7] pointer-events-none z-0">
                <span>{priceRange[0].toFixed(3)} ETH</span>
                <span>{priceRange[1].toFixed(3)} ETH</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 w-full">
            <span className="text-[#e0e7ef] text-xs">Categories:</span>
            {allCategories.map(cat => (
              <button
                key={cat}
                onClick={() =>
                  setCategoryFilter(categoryFilter.includes(cat)
                    ? categoryFilter.filter(c => c !== cat)
                    : [...categoryFilter, cat])
                }
                className={`px-2 py-1 rounded text-xs font-bold border ${
                  categoryFilter.includes(cat)
                    ? 'bg-[#00ffe7] text-[#181a23] border-[#00ffe7]'
                    : 'bg-[#181a23] text-[#00ffe7] border-[#00ffe7]/30'
                } transition`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
