import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BotConfig } from "../../../../types/Bot";
import { PoolData } from "../../../../types/subgraph/Pools";
import User from "../../../../types/User";
import { generateLogoHash } from "../../hooks/useRobohash";
import PairChart from "../../components/build/chart/PairChart";
import TokenInfo from "../../components/build/MarketInfo";
import LoadingScreenDots from "../../components/common/LoadingScreenDots";
import { FaCheckCircle, FaExclamationTriangle, FaRobot, FaArrowLeft } from "react-icons/fa";
import { CoinGecko } from "../../../../types/CoinGecko";
import PoolDropdown from "../../components/build/PoolDropdown";
import { authenticatedFetch } from "../../utils/jwtStorage";

const hudPanel =
  "bg-[#181a23]/90 border-4 border-[#00ffe7]/40 rounded-2xl shadow-[0_0_32px_#00ffe7] p-6 md:p-10 flex flex-col items-center relative";

const BuildBot: React.FC = () => {
  const [formData, setFormData] = useState<BotConfig>({
    status: "Stopped",
    creatorName: "",
    creatorWalletId: "",
    botName: "",
    network: "Ethereum",
    tradingPool: "",
    triggerType: "RSA",
    orderType: "Market",
    takeProfit: 1,
    trailingTakeProfit: 0,
    cooldownPeriod: 60,
    initialOrderSize: 50,
    priceDeviation: 0.5,
    safetyOrders: 8,
    safetyOrderGapMultiplier: 1.0,
    safetyOrderSizeMultiplier: 1.0,
    notifications: true,
    createdAt: new Date(),
  });

  const [botNameError, setBotNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [tradingPool, setTradingPool] = useState<PoolData | undefined>(undefined);
  const [profitBase, setProfitBase] = useState<"token0" | "token1" | null>(null);


  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;
  const { botConfig } = state || {};

  useEffect(() => {
    if (botConfig) setFormData(botConfig);
    const storedUser = sessionStorage.getItem("currentUser");
    if (storedUser && storedUser !== "undefined") setUser(JSON.parse(storedUser));
    checkBotNameAvailability(formData.botName);
    // eslint-disable-next-line
  }, [botConfig]);

  // Helper function to get CMC icon
  const getCmcIcon = (imgId: number | undefined) =>
    imgId
      ? `https://s2.coinmarketcap.com/static/img/coins/64x64/${imgId}.png`
      : "/logos/dexter.svg";

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    let updatedValue: string | number | boolean = value;
    if (type === "checkbox") {
      updatedValue = (e.target as HTMLInputElement).checked;
    } else if (type === "number") {
      updatedValue = Number(value);
    }
    setFormData({ ...formData, [name]: updatedValue });
    if (name === "botName") checkBotNameAvailability(value.trim());
  };

  const checkBotNameAvailability = async (botName: string) => {
    if (botName.length > 0) {
      try {
        const response = await authenticatedFetch(`/api/bot?botName=${botName}`);
        if (response.status !== 404) setBotNameError("Bot name taken. Please try again.");
        else setBotNameError(null);
      } catch {
        setBotNameError("Unable to verify bot name.");
      }
    } else {
      setBotNameError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const key in formData) {
      if (!formData[key as keyof BotConfig] && key !== "notifications") {
        setFormError("Please fill in all the fields.");
        return;
      }
    }
    if (!user || !user.walletId) {
      setFormError("User wallet ID is missing. Please log in to create a bot.");
      return;
    }
    if (botNameError) {
      setFormError("Please choose a unique bot name.");
      return;
    }
    const payload = {
      ...formData,
      creatorName: user.username,
      creatorWalletId: user.walletId,
      createdAt: new Date(),
    };
    try {
      const response = await authenticatedFetch("/api/bot", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        setFormError(errorData.message || "Failed to create bot.");
        return;
      }
      setFormError(null);
      navigate("/dash");
    } catch {
      setFormError("An error occurred while creating the bot.");
    }
  };

  const handleProfitBaseToggle = (selectedToken: "token0" | "token1") => {
    setProfitBase(selectedToken);
  };

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <div className="page-scroll">
          <div className="page-inner">
            <div className="w-full max-w-7xl mx-auto px-4 py-24 animate-fade-in-up">
              <div className="flex items-center justify-between mb-8">
                <button
                  className="btn-hud bg-[#23263a] text-[#00ffe7] border-[#00ffe7] hover:bg-[#00ffe7] hover:text-[#181a23] px-4 py-2"
                  onClick={() => navigate(-1)}
                >
                  <FaArrowLeft className="mr-2" /> Back
                </button>
                <h1 className="text-4xl font-extrabold text-[#00ffe7] drop-shadow-[0_0_12px_#00ffe7] tracking-widest hud-title flex items-center gap-3">
                  <FaRobot className="text-3xl" /> BUILD BOT
                </h1>
                <span className="w-32" />
              </div>
              <form onSubmit={handleSubmit} className={hudPanel + " gap-8"}>
                {/* Bot Name & Avatar */}
                <div className="flex flex-col md:flex-row gap-8 w-full justify-center items-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <img
                        src={formData.botName.length > 0 ? generateLogoHash(formData.botName) : "/logos/dexter.svg"}
                        alt="profile pic"
                        className="h-32 w-32 rounded-full border-4 border-[#00ffe7]/60 shadow-[0_0_16px_#00ffe7] bg-[#23263a]"
                      />
                      <FaRobot className="absolute bottom-0 right-0 text-3xl text-[#00ffe7] bg-[#181a23] rounded-full p-1 border-2 border-[#00ffe7]" />
                    </div>
                    <input
                      type="text"
                      name="botName"
                      value={formData.botName}
                      onChange={handleInputChange}
                      className="mt-2 px-4 py-2 rounded bg-[#23263a] border-2 border-[#00ffe7]/40 text-[#e0e7ef] text-lg font-bold text-center focus:outline-none focus:border-[#00ffe7] shadow"
                      placeholder="Enter a unique bot name"
                      maxLength={32}
                      autoFocus
                    />
                    {botNameError && (
                      <span className="text-red-400 text-xs flex items-center gap-1 mt-1">
                        <FaExclamationTriangle /> {botNameError}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 w-full max-w-xs">
                    <label className="text-[#00ffe7] font-bold text-sm mb-1">Network</label>
                    <select
                      name="network"
                      value={formData.network}
                      onChange={handleInputChange}
                      className="h-10 w-full bg-[#23263a] border-2 border-[#00ffe7]/40 text-[#e0e7ef] rounded px-2 font-bold"
                    >
                      <option value="Ethereum">Ethereum</option>
                      <option value="Solana">Solana</option>
                    </select>
                    
                    <label className="text-[#00ffe7] font-bold text-sm mt-4 mb-1">Trading Pair</label>
                    <PoolDropdown
                      selectedPool={tradingPool}
                      onSelect={(pool) => {
                        setTradingPool(pool);
                        setFormData({
                          ...formData,
                          tradingPool: pool.name.split(":")[1],
                        });
                      }}
                      formData={formData}
                    />
                  </div>
                  {/* Payout Currency Selection */}
                  {tradingPool && (
                    <div className="flex flex-col items-center w-full">
                      <label className="text-[#00ffe7] font-bold text-sm mb-3">Payout Currency</label>
                      <div className="flex gap-4 mb-4">
                        {tradingPool?.token0.address && (
                          <div
                            className={`cursor-pointer p-3 flex rounded-lg items-center border-2 transition-all ${
                              profitBase === "token0"
                                ? "bg-[#00ffe7]/20 border-[#00ffe7]"
                                : "bg-[#23263a] border-[#23263a] hover:border-[#00ffe7]/40"
                            }`}
                            onClick={() => handleProfitBaseToggle("token0")}
                          >
                            <img
                              src={getCmcIcon(tradingPool.token0.imgId)}
                              alt="Token 0"
                              className="w-8 h-8 rounded-full"
                            />
                            <p className="text-[#e0e7ef] text-sm font-bold ml-3">{tradingPool?.token0.symbol}</p>
                          </div>
                        )}
                        {tradingPool?.token1.address && (
                          <div
                            className={`cursor-pointer p-3 flex rounded-lg items-center border-2 transition-all ${
                              profitBase === "token1"
                                ? "bg-[#00ffe7]/20 border-[#00ffe7]"
                                : "bg-[#23263a] border-[#23263a] hover:border-[#00ffe7]/40"
                            }`}
                            onClick={() => handleProfitBaseToggle("token1")}
                          >
                            <img
                              src={getCmcIcon(tradingPool.token1.imgId)}
                              alt="Token 1"
                              className="w-8 h-8 rounded-full"
                            />
                            <p className="text-[#e0e7ef] text-sm font-bold ml-3">{tradingPool?.token1.symbol}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Chart and Token Info Side by Side */}
                <div className="w-full flex flex-col lg:flex-row gap-6 items-start">
                  {/* Token Info - Left Side */}
                  <div className="w-full lg:w-1/3">
                    <TokenInfo tokenAddress={tradingPool?.token1.address || ""} />
                  </div>
                  {/* Chart - Right Side */}
                  <div className="w-full lg:w-2/3">
                    <div className="bg-[#23263a] border-2 border-[#00ffe7]/20 rounded-xl p-4">
                      <PairChart botForm={formData} pool={tradingPool} />
                    </div>
                  </div>
                </div>

                {/* Bot Settings */}
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-4">
                    <label className="text-[#00ffe7] font-bold text-sm">Take Profit (%)</label>
                    <input
                      type="number"
                      name="takeProfit"
                      value={formData.takeProfit}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-[#23263a] border-2 border-[#00ffe7]/20 text-[#e0e7ef] rounded-lg font-bold"
                      step="0.01"
                    />
                    <label className="text-[#00ffe7] font-bold text-sm">Trailing Take Profit (%)</label>
                    <input
                      type="number"
                      name="trailingTakeProfit"
                      value={formData.trailingTakeProfit}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-[#23263a] border-2 border-[#00ffe7]/20 text-[#e0e7ef] rounded-lg font-bold"
                      step="0.01"
                    />
                    <label className="text-[#00ffe7] font-bold text-sm">Cooldown Period (s)</label>
                    <input
                      type="number"
                      name="cooldownPeriod"
                      value={formData.cooldownPeriod}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-[#23263a] border-2 border-[#00ffe7]/20 text-[#e0e7ef] rounded-lg font-bold"
                    />
                    <label className="text-[#00ffe7] font-bold text-sm">Order Type</label>
                    <select
                      name="orderType"
                      value={formData.orderType}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-[#23263a] border-2 border-[#00ffe7]/20 text-[#e0e7ef] rounded-lg font-bold"
                    >
                      <option value="Market">Market</option>
                      <option value="Limit">Limit</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-4">
                    <label className="text-[#00ffe7] font-bold text-sm">Price Deviation (%)</label>
                    <input
                      type="number"
                      name="priceDeviation"
                      value={formData.priceDeviation}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-[#23263a] border-2 border-[#00ffe7]/20 text-[#e0e7ef] rounded-lg font-bold"
                      step="0.01"
                    />
                    <label className="text-[#00ffe7] font-bold text-sm">Safety Orders</label>
                    <input
                      type="number"
                      name="safetyOrders"
                      value={formData.safetyOrders}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-[#23263a] border-2 border-[#00ffe7]/20 text-[#e0e7ef] rounded-lg font-bold"
                    />
                    <label className="text-[#00ffe7] font-bold text-sm">Safety Order Gap Multiplier (x)</label>
                    <input
                      type="number"
                      name="safetyOrderGapMultiplier"
                      value={formData.safetyOrderGapMultiplier}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-[#23263a] border-2 border-[#00ffe7]/20 text-[#e0e7ef] rounded-lg font-bold"
                      step="0.01"
                    />
                    <label className="text-[#00ffe7] font-bold text-sm">Safety Order Size Multiplier (x)</label>
                    <input
                      type="number"
                      name="safetyOrderSizeMultiplier"
                      value={formData.safetyOrderSizeMultiplier}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-[#23263a] border-2 border-[#00ffe7]/20 text-[#e0e7ef] rounded-lg font-bold"
                      step="0.01"
                    />
                  </div>
                </div>
                {/* Notifications */}
                <div className="flex items-center gap-3 mt-4">
                  <input
                    type="checkbox"
                    name="notifications"
                    checked={formData.notifications}
                    onChange={handleInputChange}
                    className="accent-[#00ffe7] w-5 h-5"
                    id="notifications"
                  />
                  <label htmlFor="notifications" className="text-[#00ffe7] font-bold text-sm">
                    Enable Notifications
                  </label>
                </div>
                {/* Error or Success */}
                {formError && (
                  <div className="w-full flex items-center justify-center mt-2">
                    <span className="text-red-400 text-sm flex items-center gap-2">
                      <FaExclamationTriangle /> {formError}
                    </span>
                  </div>
                )}
                {/* Submit */}
                <div className="w-full flex justify-center mt-6">
                  <button
                    type="submit"
                    className="btn-hud text-lg px-8 py-3 flex items-center gap-2"
                  >
                    <FaCheckCircle /> Create Bot
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildBot;
