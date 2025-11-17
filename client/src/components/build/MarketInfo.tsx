import React, { useEffect, useState, useMemo } from "react";
import { CoinGecko } from "../../../../types/CoinGecko";
import LoadingScreenDots from "../common/LoadingScreenDots";
import { FaCoins, FaExchangeAlt, FaStar, FaTags, FaGlobe, FaLink, FaChartLine, FaChartBar, FaBook } from "react-icons/fa";
import StatusPopup from "../common/StatusPopup";

interface MarketInfoProps {
  tokenAddress: string;
}

const isUniswapMarket = (ticker: CoinGecko.Ticker) => {
  const id = ticker.market.identifier?.toLowerCase();
  const name = ticker.market.name?.toLowerCase();
  return (
    id?.includes("uniswap") || 
    id?.includes("uni-v3") || 
    id?.includes("uni-v4") || 
    name?.includes("uniswap")
  );
};

const MarketInfo: React.FC<MarketInfoProps> = ({ tokenAddress }) => {
  const [coinGeckoData, setCoinGeckoData] = useState<CoinGecko.CoinGeckoToken | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'loading' | 'success' | 'error'>('success');

  useEffect(() => {
    if (!tokenAddress) {
      setCoinGeckoData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`https://api.coingecko.com/api/v3/coins/ethereum/contract/${tokenAddress}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch CoinGecko data");
        return res.json();
      })
      .then((data) => {
        setCoinGeckoData(data as CoinGecko.CoinGeckoToken);
        setLoading(false);
      })
      .catch(() => {
        setCoinGeckoData(null);
        setError("Failed to load market data.");
        setLoading(false);
      });
  }, [tokenAddress]);

  const formatNumber = (num: number | undefined | null, digits = 2) => {
    if (num === null || num === undefined) return "N/A";
    if (num >= 1e9) return `${(num / 1e9).toFixed(digits)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(digits)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(digits)}K`;
    return num.toFixed(digits);
  };

  // Pin all Uniswap markets to the top, keep original order otherwise
  const sortedTickers = useMemo(() => {
    if (!coinGeckoData?.tickers) return [];
    const uniswap = coinGeckoData.tickers.filter(isUniswapMarket);
    const others = coinGeckoData.tickers.filter((t) => !isUniswapMarket(t));
    return [...uniswap, ...others];
  }, [coinGeckoData]);

  const truncateAddress = (address?: string, length = 6) => {
    if (!address) return "N/A";
    if (address.length <= length * 2) return address;
    return `${address.substring(0, length)}...${address.substring(address.length - length)}`;
  };

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setStatusMessage(`Copied ${description} to clipboard`);
        setStatusType('success');
        setTimeout(() => setStatusMessage(null), 3000);
      })
      .catch(() => {
        setStatusMessage('Failed to copy to clipboard');
        setStatusType('error');
        setTimeout(() => setStatusMessage(null), 3000);
      });
  };

  if (!tokenAddress) {
    return (
      <div className="bg-[#181a23] border-2 border-[#00ffe7]/20 rounded-xl p-6 w-full">
        <div className="text-center text-[#e0e7ef]/60">
          <FaCoins className="text-4xl mx-auto mb-3 text-[#00ffe7]/40" />
          <p>Select a trading pair to view market info</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#181a23] border-2 border-[#00ffe7]/20 rounded-xl p-6 w-full">
        <LoadingScreenDots />
      </div>
    );
  }

  if (error || !coinGeckoData) {
    return (
      <div className="bg-[#181a23] border-2 border-red-400/40 rounded-xl p-6 w-full">
        <div className="text-center text-red-400">
          <p className="font-bold">Error</p>
          <p className="text-sm">{error || "No market data available."}</p>
        </div>
      </div>
    );
  }

  const { name, symbol, image, description, categories, links, market_data, market_cap_rank } = coinGeckoData;

  return (
    <div className="bg-[#181a23] border-2 border-[#00ffe7]/40 rounded-xl p-4 w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4 pb-3 border-b border-[#00ffe7]/20">
        <img
          src={image?.large || image?.thumb || "/logos/dexter.svg"}
          alt={symbol}
          className="w-14 h-14 rounded-full border-2 border-[#00ffe7]/40 bg-[#23263a]"
        />
        <div>
          <h3 className="text-2xl font-bold text-[#00ffe7] flex items-center gap-2">
            {name}
            {market_cap_rank && (
              <span className="text-xs bg-[#00ffe7]/10 text-[#00ffe7] px-2 py-1 rounded font-mono">Rank #{market_cap_rank}</span>
            )}
          </h3>
          <p className="text-sm text-[#e0e7ef]/70 font-mono">{symbol?.toUpperCase() || "N/A"}</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {categories?.slice(0, 3).map((cat, i) => (
              <span key={i} className="bg-[#00ffe7]/10 text-[#00ffe7] px-2 py-1 rounded text-xs font-bold border border-[#00ffe7]/20">
                <FaTags className="inline mr-1" />{cat}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      {description?.en && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <FaBook className="text-[#00ffe7]" />
            <span className="text-xs text-[#e0e7ef]/70">About</span>
          </div>
          <div className="text-xs text-[#e0e7ef]/80 max-h-24 overflow-y-auto" dangerouslySetInnerHTML={{ __html: description.en.split("\n")[0] }} />
        </div>
      )}

      {/* Links */}
      <div className="flex flex-wrap gap-3 mb-4">
        {links?.homepage?.[0] && (
          <a href={links.homepage[0]} target="_blank" rel="noopener noreferrer" className="text-[#00ffe7] underline flex items-center gap-1">
            <FaGlobe /> Website
          </a>
        )}
        {links?.whitepaper && (
          <a href={links.whitepaper} target="_blank" rel="noopener noreferrer" className="text-[#00ffe7] underline flex items-center gap-1">
            <FaBook /> Whitepaper
          </a>
        )}
        {links?.blockchain_site?.[0] && (
          <a href={links.blockchain_site[0]} target="_blank" rel="noopener noreferrer" className="text-[#00ffe7] underline flex items-center gap-1">
            <FaLink /> Explorer
          </a>
        )}
        {links?.chat_url?.[0] && (
          <a href={links.chat_url[0]} target="_blank" rel="noopener noreferrer" className="text-[#00ffe7] underline flex items-center gap-1">
            <FaLink /> Chat
          </a>
        )}
        {links?.official_forum_url?.[0] && (
          <a href={links.official_forum_url[0]} target="_blank" rel="noopener noreferrer" className="text-[#00ffe7] underline flex items-center gap-1">
            <FaLink /> Forum
          </a>
        )}
        {links?.subreddit_url && (
          <a href={links.subreddit_url} target="_blank" rel="noopener noreferrer" className="text-[#00ffe7] underline flex items-center gap-1">
            <FaLink /> Subreddit
          </a>
        )}
        {links?.twitter_screen_name && (
          <a href={`https://twitter.com/${links.twitter_screen_name}`} target="_blank" rel="noopener noreferrer" className="text-[#00ffe7] underline flex items-center gap-1">
            <FaLink /> Twitter
          </a>
        )}
        {links?.telegram_channel_identifier && (
          <a href={`https://t.me/${links.telegram_channel_identifier}`} target="_blank" rel="noopener noreferrer" className="text-[#00ffe7] underline flex items-center gap-1">
            <FaLink /> Telegram
          </a>
        )}
        {links?.repos_url?.github?.[0] && (
          <a href={links.repos_url.github[0]} target="_blank" rel="noopener noreferrer" className="text-[#00ffe7] underline flex items-center gap-1">
            <FaLink /> Github
          </a>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-[#23263a] rounded-lg p-3 flex flex-col items-center">
          <FaChartLine className="text-[#00ffe7] text-xl mb-1" />
          <span className="text-xs text-[#e0e7ef]/70">Price (USD)</span>
          <span className="text-lg font-bold text-[#00ffe7]">
            ${market_data?.current_price?.usd !== undefined ? market_data.current_price.usd.toFixed(6) : "N/A"}
          </span>
        </div>
        <div className="bg-[#23263a] rounded-lg p-3 flex flex-col items-center">
          <FaChartBar className="text-[#00ffe7] text-xl mb-1" />
          <span className="text-xs text-[#e0e7ef]/70">Market Cap</span>
          <span className="text-lg font-bold text-[#00ffe7]">
            ${formatNumber(market_data?.market_cap?.usd)}
          </span>
        </div>
        <div className="bg-[#23263a] rounded-lg p-3 flex flex-col items-center">
          <FaExchangeAlt className="text-[#00ffe7] text-xl mb-1" />
          <span className="text-xs text-[#e0e7ef]/70">24h Volume</span>
          <span className="text-lg font-bold text-[#00ffe7]">
            ${formatNumber(market_data?.total_volume?.usd)}
          </span>
        </div>
        <div className="bg-[#23263a] rounded-lg p-3 flex flex-col items-center">
          <FaTags className="text-[#00ffe7] text-xl mb-1" />
          <span className="text-xs text-[#e0e7ef]/70">Categories</span>
          <span className="text-xs text-[#e0e7ef] text-center">{categories?.slice(0, 2).join(", ")}</span>
        </div>
      </div>

      {/* Markets Table */}
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          <FaExchangeAlt className="text-[#00ffe7]" />
          <span className="text-sm font-bold text-[#00ffe7]">Markets Comparison</span>
          <span className="text-xs text-[#e0e7ef]/70 italic">(Uniswap markets highlighted)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-[#e0e7ef]">
            <thead>
              <tr className="border-b-2 border-[#00ffe7]/30">
                <th className="py-2 px-2 text-left">Exchange</th>
                <th className="py-2 px-2 text-left">Pair</th>
                <th className="py-2 px-2 text-right">Price (USD)</th>
                <th className="py-2 px-2 text-right">Volume (24h)</th>
                <th className="py-2 px-2 text-center">Trust</th>
                <th className="py-2 px-2 text-center">Spread</th>
                <th className="py-2 px-2 text-center">Last Updated</th>
                <th className="py-2 px-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedTickers.map((ticker, idx) => {
                const isUniswap = isUniswapMarket(ticker);
                return (
                  <tr
                    key={idx}
                    className={`border-b border-[#00ffe7]/10 ${
                      isUniswap
                        ? "bg-[#00ffe7]/10 font-medium"
                        : idx % 2 === 0
                        ? "bg-[#23263a]/40"
                        : ""
                    }`}
                  >
                    <td className="py-2 px-2">
                      <div className="flex items-center">
                        {isUniswap && <FaStar className="text-yellow-400 mr-1" />}
                        {ticker.market.name}
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-1">
                        <button 
                          className="text-[#00ffe7] hover:underline btn-link"
                          onClick={() => copyToClipboard(ticker.base, "base token address")}
                          title={ticker.base}
                        >
                          {truncateAddress(ticker.base, 4)}
                        </button>
                        <span>/</span>
                        <button 
                          className="text-[#00ffe7] hover:underline btn-link"
                          onClick={() => copyToClipboard(ticker.target, "target token address")}
                          title={ticker.target}
                        >
                          {truncateAddress(ticker.target, 4)}
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right">
                      {ticker.converted_last?.usd !== undefined
                        ? `$${ticker.converted_last.usd.toFixed(8)}`
                        : ticker.last !== undefined
                        ? `$${ticker.last}`
                        : "N/A"}
                    </td>
                    <td className="py-2 px-2 text-right font-mono">
                      <span>${formatNumber(ticker.converted_volume?.usd)}</span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      {ticker.trust_score ? (
                        <span
                          className={`px-2 py-1 rounded font-bold ${
                            ticker.trust_score === "green"
                              ? "bg-green-700/40 text-green-300"
                              : ticker.trust_score === "yellow"
                              ? "bg-yellow-700/40 text-yellow-300"
                              : "bg-red-700/40 text-red-300"
                          }`}
                        >
                          {ticker.trust_score}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {ticker.bid_ask_spread_percentage !== null && ticker.bid_ask_spread_percentage !== undefined
                        ? `${ticker.bid_ask_spread_percentage.toFixed(2)}%`
                        : "-"}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {ticker.last_traded_at 
                        ? new Date(ticker.last_traded_at).toLocaleTimeString()
                        : "-"}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {ticker.trade_url && (
                        <a
                          href={ticker.trade_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#00ffe7] hover:underline px-2 py-1 bg-[#00ffe7]/10 rounded-md"
                        >
                          Trade
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-xs text-[#e0e7ef]/70">
          <span className="font-bold text-[#00ffe7]">Note:</span> Market data is from CoinGecko. Uniswap markets <FaStar className="text-yellow-400 inline" /> are prioritized.
          <div className="mt-1">
            <span className="bg-[#00ffe7]/10 text-[#00ffe7] px-2 py-1 rounded text-xs">
              Total markets shown: {sortedTickers.length} | Uniswap markets: {sortedTickers.filter(isUniswapMarket).length}
            </span>
          </div>
        </div>
      </div>

      {/* Status Footer for copy notifications */}
      {statusMessage && (
        <StatusPopup 
          type={statusType}
          message={statusMessage}
          onClose={() => setStatusMessage(null)}
        />
      )}
    </div>
  );
};



export default MarketInfo;
