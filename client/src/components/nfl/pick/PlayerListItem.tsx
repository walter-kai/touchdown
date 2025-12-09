import React from 'react';
import { FaUsers, FaCheckCircle, FaLock } from 'react-icons/fa';
import type { Athlete } from '@/types/espn/athlete';

interface PlayerListItemProps {
  player: Athlete;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

const PlayerListItem: React.FC<PlayerListItemProps> = ({
  player,
  isSelected,
  isDisabled,
  onClick,
}) => {
  const headshotUrl = typeof player.headshot === 'string' ? player.headshot : player.headshot?.href;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`w-full p-2 rounded-lg flex items-center gap-2 transition-all text-left ${
        isDisabled
          ? 'bg-gray-700/20 border-2 border-gray-600 opacity-50 cursor-not-allowed'
          : isSelected
          ? 'bg-[#00ffe7]/20 border-2 border-[#00ffe7]'
          : 'bg-[#23263a]/50 border-2 border-transparent hover:border-[#00ffe7]/30 cursor-pointer'
      }`}
    >
      {headshotUrl ? (
        <img
          src={headshotUrl}
          alt={player.displayName}
          className="w-8 h-8 rounded-full object-cover border-2 border-[#00ffe7]/50 flex-shrink-0"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
            const fallback = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
      ) : null}
      <div 
        className="w-8 h-8 rounded-full bg-[#23263a] border-2 border-[#00ffe7]/50 flex items-center justify-center flex-shrink-0"
        style={{ display: headshotUrl ? 'none' : 'flex' }}
      >
        <FaUsers className="text-[#00ffe7] text-xs" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white font-bold text-xs truncate">{player.shortName}</div>
        <div className="text-gray-400 text-[10px]">
          {player.position.abbreviation} {player.jersey && `• #${player.jersey}`}
        </div>
      </div>
      {isSelected && <FaCheckCircle className="text-[#00ffe7] flex-shrink-0 text-xs" />}
      {isDisabled && <FaLock className="text-gray-500 flex-shrink-0 text-xs" />}
    </button>
  );
};

export default PlayerListItem;
