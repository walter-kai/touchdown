import React from 'react';
import { BotConfig } from '../../../../types/Bot';
import { generateLogoHash } from '../../hooks/useRobohash';
import { FaPlay, FaStop, FaClone, FaTrash } from 'react-icons/fa';

interface BotCardProps {
  bot: BotConfig;
  isSelected: boolean;
  onSelect: (botName: string) => void;
  onStart: (botName: string) => void;
  onStop: (botName: string) => void;
  onClone: (botName: string) => void;
  onDelete: (botName: string) => void;
}

const BotCard: React.FC<BotCardProps> = ({
  bot,
  isSelected,
  onSelect,
  onStart,
  onStop,
  onClone,
  onDelete,
}) => {
  const renderBotStats = (bot: BotConfig) => (
    <div className="my-2 text-[#00ffe7] text-xs grid grid-cols-2 gap-1 font-mono">
      <div>
        <span className="text-[#ff005c] font-bold">9879</span> <span className="opacity-70">#Txns (1D)</span>
      </div>
      <div>
        <span className="text-green-400 font-bold">8659</span> <span className="opacity-70">Earnings (1D)</span>
      </div>
      <div>
        <span className="text-[#00ffe7] font-bold">6587</span> <span className="opacity-70">Avg/Txn (1D)</span>
      </div>
      <div>
        <span className="text-[#faafe8] font-bold">5</span> <span className="opacity-70">Age</span>
      </div>
      <div>
        <span className="text-[#ff005c] font-bold">568</span> <span className="opacity-70">Avg Time/Txn</span>
      </div>
    </div>
  );

  return (
    <div
      onClick={() => onSelect(bot.botName)}
      className={`relative flex flex-col items-center min-h-[180px] p-3 cursor-pointer hover:scale-105 transition-all duration-300 ease-in-out`}
      style={{
        background: "#181a23",
        borderRadius: "1rem",
        border: "4px solid #00ffe7",
        boxShadow: isSelected
          ? "0 0 32px #ff005c"
          : "0 0 16px #00ffe7",
        overflow: "hidden"
      }}
    >
      <img
        src={generateLogoHash(bot.botName)}
        alt={bot.botName}
        className="w-14 h-14 mx-auto mb-2 rounded-full border-2 border-[#00ffe7]/40 shadow-[0_0_8px_#00ffe7]"
      />
      <h2 className="text-base font-bold text-center text-[#00ffe7] mb-1">{bot.botName}</h2>
      {renderBotStats(bot)}
      <div className="grid grid-cols-1 gap-1 w-full mt-2">
        {bot.status !== 'Running' ? (
          <button
            onClick={e => { e.stopPropagation(); onStart(bot.botName); }}
            className="btn-hud bg-green-500 text-white border-green-400 hover:bg-green-600"
          >
            <FaPlay />
            Start
          </button>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); onStop(bot.botName); }}
            className="btn-hud bg-yellow-500 text-white border-yellow-400 hover:bg-yellow-600"
          >
            <FaStop />
            Stop
          </button>
        )}
        <button
          onClick={e => { e.stopPropagation(); onClone(bot.botName); }}
          className="btn-hud bg-purple-500 text-white border-purple-400 hover:bg-purple-600"
        >
          <FaClone />
          Clone
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete(bot.botName); }}
          className="btn-hud bg-red-500 text-white border-red-400 hover:bg-red-600"
        >
          <FaTrash />
          Delete
        </button>
      </div>
    </div>
  );
};

export default BotCard;
