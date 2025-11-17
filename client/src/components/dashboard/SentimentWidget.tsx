import React, { useEffect, useState } from "react";
import axios from "axios";
import { SentimentTopic } from "../../../../types/tw/Sentiment";
import LoadingScreenDots from "../common/LoadingScreenDots";

const COLORS = {
  POSITIVE: "#00ffe7",
  NEUTRAL: "#e0e7ef",
  NEGATIVE: "#ff4d6d"
};

const GAUGE_BG = "#232834";
const GAUGE_RING = "#00ffe7";
const GAUGE_RING_BG = "#1a1e25";
const GAUGE_SHADOW = "0 0 16px #00ffe7, 0 0 32px #00ffe7";
const PANEL_SHADOW = "0 0 24px #00ffe755, 0 0 4px #00ffe7aa";

const EMOJIS = {
  POSITIVE: "😊",
  NEUTRAL: "😑",
  NEGATIVE: "😪"
};

type TokenInfo = {
  name: string;
  symbol: string;
  id?: number;
  logo?: string;
  price?: number;
  circulating_supply?: number;
  quote?: { USD?: { price?: number } };
  [key: string]: any;
};

const getCmcLogo = (id?: number) =>
  id ? `https://s2.coinmarketcap.com/static/img/coins/64x64/${id}.png` : undefined;

const SentimentGauge: React.FC<{
  percent: number[];
  dominant: string;
}> = ({ percent, dominant }) => {
  // Horizontal bar with three sections perfectly aligned
  const barWidth = 200;
  const barHeight = 20;
  const totalPositive = percent[0];
  const totalNeutral = percent[1];
  const totalNegative = percent[2];
  
  // Calculate exact widths for each section (they should add up to 100%)
  const negativeWidth = (totalNegative / 100) * barWidth;
  const neutralWidth = (totalNeutral / 100) * barWidth;
  const positiveWidth = (totalPositive / 100) * barWidth;
  
  return (
    <div className="flex flex-col items-center">
      <div 
        className="relative rounded-full border-2 overflow-hidden"
        style={{
          width: barWidth,
          height: barHeight,
          background: GAUGE_BG,
          borderColor: GAUGE_RING,
          boxShadow: GAUGE_SHADOW
        }}
      >
        {/* Positive section (leftmost) */}
        <div
          className="absolute left-0 top-0 h-full"
          style={{
            width: positiveWidth,
            background: COLORS.POSITIVE,
            boxShadow: `inset 0 0 8px ${COLORS.POSITIVE}`,
            borderTopLeftRadius: '10px',
            borderBottomLeftRadius: '10px'
          }}
        />
        
        {/* Neutral section (middle) */}
        <div
          className="absolute top-0 h-full"
          style={{
            left: positiveWidth,
            width: neutralWidth,
            background: COLORS.NEUTRAL,
            boxShadow: `inset 0 0 6px ${COLORS.NEUTRAL}`
          }}
        />

        {/* Negative section (rightmost) */}
        <div
          className="absolute top-0 h-full"
          style={{
            left: positiveWidth + neutralWidth,
            width: negativeWidth,
            background: COLORS.NEGATIVE,
            boxShadow: `inset 0 0 8px ${COLORS.NEGATIVE}`,
            borderTopRightRadius: '10px',
            borderBottomRightRadius: '10px'
          }}
        />
        

        
        {/* Dividers between sections */}
        {neutralWidth > 0 && (
          <>
            {/* Left divider */}
            <div
              className="absolute top-0 w-0.5 h-full bg-black opacity-30"
              style={{ left: positiveWidth }}
            />
            {/* Right divider */}
            <div
              className="absolute top-0 w-0.5 h-full bg-black opacity-30"
              style={{ left: positiveWidth + neutralWidth }}
            />
          </>
        )}
        
        {/* Dominant sentiment emoji */}
        <div
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-2xl"
          style={{
            filter: "drop-shadow(0 0 8px #00ffe7)"
          }}
        >
          {EMOJIS[dominant as keyof typeof EMOJIS]}
        </div>
      </div>
      
      {/* Labels */}
      <div className="flex justify-between w-full mt-2 px-2">
        <span className="text-xs text-[#00ffe7]">POSITIVE</span>
        <span className="text-xs text-[#e0e7ef]">NEUTRAL</span>
        <span className="text-xs text-[#ff4d6d]">NEGATIVE</span>
      </div>
    </div>
  );
};

const SentimentWidget: React.FC = () => {
  const [topics, setTopics] = useState<SentimentTopic[]>([]);
  const [tokenInfo, setTokenInfo] = useState<Record<string, TokenInfo>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get<{ success: boolean; data: SentimentTopic[] }>("/api/sentiment/all")
      .then(async res => {
        setTopics(res.data.data);
        const tokenResults: Record<string, TokenInfo> = {};
        await Promise.all(res.data.data.map(async (topic) => {
          try {
            const tokenRes = await axios.get(`/api/cmc/tokens/${topic.topic_name}`);
            const arr = Array.isArray(tokenRes.data?.id) ? tokenRes.data.id : [];
            let best = arr[0];
            for (const t of arr) {
              if (
                typeof t.circulating_supply === "number" &&
                (!best || t.circulating_supply > (best.circulating_supply || 0))
              ) {
                best = t;
              }
            }
            if (best && best.id) {
              best.logo = getCmcLogo(best.id);
              tokenResults[topic.id] = { ...best, logo: best.logo };
            } else {
              tokenResults[topic.id] = { name: topic.topic_name, symbol: topic.id };
            }
          } catch {
            tokenResults[topic.id] = { name: topic.topic_name, symbol: topic.id };
          }
        }));
        setTokenInfo(tokenResults);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div
        className="bg-[#181c23] rounded-xl p-6 flex flex-col items-center shadow-lg min-h-[300px]"
        style={{ boxShadow: PANEL_SHADOW }}
      >
        <div className="text-[#00ffe7] text-lg font-bold mb-2 tracking-widest">SENTIMENT HUD</div>
        <div className="flex-1 flex items-center justify-center">
          <LoadingScreenDots />
        </div>
      </div>
    );
  }

  const labels = ["POSITIVE", "NEUTRAL", "NEGATIVE"];

  return (
    <div
      className="bg-[#181c23] rounded-xl p-6 flex flex-col items-center shadow-lg min-h-[300px] w-full"
      style={{ boxShadow: PANEL_SHADOW }}
    >
      <div className="text-[#00ffe7] text-lg font-bold mb-4 tracking-widest text-center">
        MARKET SENTIMENT PANEL
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
        {topics.map((topic) => {
          const last = topic.histogram.data[topic.histogram.data.length - 1];
          const values = last?.v || [0, 0, 0];
          const total = values.reduce((a, b) => a + b, 0) || 1;
          const percent = values.map(v => Math.round((v / total) * 100));
          const dominantIdx = percent.indexOf(Math.max(...percent));
          const dominant = labels[dominantIdx];
          const token = tokenInfo[topic.id] || {};
          return (
            <div
              key={topic.id}
              className="flex flex-col items-center bg-[#10131a] rounded-lg p-4 border-2 border-[#00ffe7] shadow-md"
              style={{
                boxShadow: "0 0 16px #00ffe744, 0 0 2px #00ffe7aa",
                minHeight: 260
              }}
            >
              {/* Token info and topic */}
              <div className="flex flex-row items-center gap-3 mb-2">
                {token.logo ? (
                  <img
                    src={token.logo}
                    alt={token.name || topic.topic_name}
                    className="w-10 h-10 rounded-full border border-[#00ffe7] shadow"
                    style={{ boxShadow: "0 0 8px #00ffe7" }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#181c23] flex items-center justify-center text-2xl border border-[#00ffe7]">
                    {topic.topic_name[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-bold text-[#00ffe7] text-base drop-shadow-[0_0_6px_#00ffe7]">
                    {token.name || topic.topic_name}
                  </div>
                  <div className="text-xs text-[#e0e7ef] uppercase tracking-widest">
                    {token.symbol || topic.id}
                  </div>
                  {token.quote?.USD?.price !== undefined && (
                    <div className="text-xs text-[#6c7383]">
                      ${token.quote.USD.price.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </div>
                  )}
                  {token.circulating_supply !== undefined && (
                    <div className="text-xs text-[#6c7383]">
                      Supply: {token.circulating_supply.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
              {/* Gauge */}
              <div className="flex flex-col items-center w-full">
                <SentimentGauge percent={percent} dominant={dominant} />
                <div className="flex flex-row gap-4 mt-4 justify-center">
                  {labels.map((label, i) => (
                    <div key={label} className="flex flex-col items-center">
                      <span
                        className="text-lg mb-1"
                        style={{ 
                          color: COLORS[label as keyof typeof COLORS], 
                          filter: `drop-shadow(0 0 4px ${COLORS[label as keyof typeof COLORS]})` 
                        }}
                      >
                        {EMOJIS[label as keyof typeof EMOJIS]}
                      </span>
                      <span className="font-bold text-[#e0e7ef]">{percent[i]}%</span>
                      <span className="text-xs text-[#6c7383]">{label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-[#00ffe7] text-center w-full font-mono tracking-wide">
                  {dominant === "POSITIVE" && "VIBES: BULLISH �"}
                  {dominant === "NEUTRAL" && "VIBES: STABLE �"}
                  {dominant === "NEGATIVE" && "VIBES: BEARISH �"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SentimentWidget;
