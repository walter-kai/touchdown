import React from "react";

import { BotConfig } from "../../../../types/Bot";
import { generateLogoHash } from "../../hooks/useRobohash";

interface BotDetailsPageProps {
  bot: BotConfig | null;
  onClose: () => void;
}

const BotDetails: React.FC<BotDetailsPageProps> = ({ bot, onClose }) => {
  if (!bot) return null;

  const details = [
    { label: "Status", value: bot.status || "N/A" },
    { label: "Creator", value: bot.creatorName || "N/A" },
    { label: "Creator Wallet ID", value: bot.creatorWalletId || "N/A" },
    { label: "Trading Pair", value: bot.tradingPool || "N/A" },
    { label: "Trigger Type", value: bot.triggerType || "N/A" },
    { label: "Initial Order Size", value: bot.initialOrderSize || "N/A" },
    { label: "Price Deviation", value: `${bot.priceDeviation || 0}%` },
    { label: "Safety Orders", value: bot.safetyOrders || "N/A" },
    { label: "Safety Order Gap Multiplier", value: `${bot.safetyOrderGapMultiplier || 0}x` },
    { label: "Safety Order Size Multiplier", value: bot.safetyOrderSizeMultiplier || "N/A" },
    { label: "Take Profit", value: `${bot.takeProfit || 0}%` },
    { label: "Trailing Take Profit", value: bot.trailingTakeProfit ? "Enabled" : "Disabled" },
    { label: "Order Type", value: bot.orderType || "N/A" },
    { label: "Cooldown Period", value: `${bot.cooldownPeriod || 0} seconds` },
    { label: "Notifications", value: bot.notifications ? "Enabled" : "Disabled" },
    {
      label: "Created At",
      value: bot.createdAt ? new Date(bot.createdAt).toLocaleString() : "N/A",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-[#23263a] w-full max-w-5xl rounded-lg p-8 relative border border-[#00ffe7]/30 shadow-[0_0_24px_#00ffe7]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-[#181a23] p-2 rounded-full hover:bg-[#00ffe7] hover:text-[#181a23] text-[#00ffe7] shadow-[0_0_8px_#00ffe7] transition"
        >
          ✕
        </button>
        <h2 className="text-3xl font-bold mb-6 text-center text-[#00ffe7] drop-shadow-[0_0_8px_#00ffe7]">{bot.botName}</h2>
        <img
          src={generateLogoHash(bot.botName)}
          alt={bot.botName}
          className="w-32 h-32 mx-auto rounded-full mb-6 border-2 border-[#00ffe7]"
        />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-[#e0e7ef]">
          {details.map((detail, index) => (
            <div key={index}>
              <strong className="text-[#00ffe7]">{detail.label}:</strong> {detail.value}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BotDetails;
