import React, { useContext, useEffect, useState } from "react";
import RandomRobohashCard from "../../components/common/RandomRobohashCard";
import { TrendingCoinsContext } from "../../providers/TrendingCoinsContext";

interface StepCardProps {
  icon: React.ReactNode;
  step: string;
  title: string;
  titleColor: string;
  borderColor: string;
  description: React.ReactNode;
  buttonText?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  buttonHref?: string;
  buttonTarget?: string;
}

const StepCard: React.FC<StepCardProps> = ({
  icon,
  step,
  title,
  titleColor,
  borderColor,
  description,
  buttonText,
  buttonColor,
  buttonTextColor,
  buttonHref,
  buttonTarget
}) => (
  <div className={`relative flex flex-col items-center bg-[#181c23] border-2 ${borderColor} rounded-2xl shadow-[0_0_24px_#00ffe7]/20 p-8 w-full max-w-xs passport-card overflow-hidden`}>
    <div className="flex flex-col items-center mb-2">
      <div className="h-20 my-auto">{icon}</div>
      <span className={`${titleColor} font-bold text-lg mt-2`}>{step}</span>
    </div>
    <div className="flex-1 flex flex-col w-full">
      <h2 className={`text-2xl font-bold ${titleColor} mb-2 text-center`}>{title}</h2>
      <div className="text-[#e0e7ef] mb-2 text-center">{description}</div>
      <div className="mt-auto w-full flex justify-center">
        <a
          href={buttonHref}
          target={buttonTarget}
          rel={buttonTarget === '_blank' ? 'noopener noreferrer' : undefined}
          className={`inline-block w-full px-5 py-2 ${buttonColor} ${buttonTextColor} font-bold rounded-lg shadow hover:bg-[#faafe8] hover:text-[#181a23] transition text-center`}
        >
          {buttonText}
        </a>
      </div>
    </div>
    {/* Neon HUD corners */}
    <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#00ffe7] rounded-tl-2xl opacity-60 animate-pulse" />
    <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#00ffe7] rounded-tr-2xl opacity-60 animate-pulse" />
    <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#00ffe7] rounded-bl-2xl opacity-60 animate-pulse" />
    <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#00ffe7] rounded-br-2xl opacity-60 animate-pulse" />
  </div>
);

const HowItWorks: React.FC = () => {
  const { trendingCoins } = useContext(TrendingCoinsContext);
  const [rotatingIndex, setRotatingIndex] = useState(0);

  useEffect(() => {
    if (!trendingCoins || trendingCoins.length === 0) return;
    const interval = setInterval(() => {
      setRotatingIndex((prev) => (prev + 1) % trendingCoins.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [trendingCoins]);

  return (
    <div className="fixed inset-0 bg-[#23263a]/70 overflow-hidden animate-fade-in-up">
      <div className="relative w-full h-full flex justify-center items-start">
        <div className="w-full h-screen flex justify-center custom-scrollbar" style={{ overflowY: 'auto' }}>
          <div className="h-fit">
            <div className="max-w-5xl w-full px-4 py-16 mx-auto">
              <div className="flex flex-col items-center mt-12 mb-24">
                <h1 className="text-4xl font-bold text-[#00ffe7] mb-12 drop-shadow-[0_0_8px_#00ffe7] tracking-widest text-center">
                  How does it work?
                </h1>
                <p className="text-xl text-[#faafe8] mb-12 text-center max-w-2xl">
                  Your guide to getting started with trading bots in Dexter City. Follow these steps to level up your trading game!
                </p>
                <div className="flex flex-col md:flex-row gap-10 w-full justify-center items-center">
                  <StepCard
                    icon={<span className="text-6xl">🚀</span>}
                    step="Step 1"
                    title="Create Account"
                    titleColor="text-[#faafe8]"
                    borderColor="border-[#00ffe7]/30"
                    description={<span>Sign up with Google or email to get started with trading bots in Dexter City.</span>}

                  />
                  <StepCard
                    icon={<RandomRobohashCard />}
                    step="Step 2"
                    title="Buy or Sell Bots"
                    titleColor="text-[#00ffe7]"
                    borderColor="border-[#faafe8]/30"
                    description={<span>Get started with a premade bot or build your own. Fees are in USDT. See the pricing section below for details.</span>}

                  />
                  <StepCard
                    icon={trendingCoins && trendingCoins.length > 0 ? (
                      <img
                        src={trendingCoins[rotatingIndex].item.thumb}
                        alt={trendingCoins[rotatingIndex].item.name}
                        className="h-16 w-16 mb-2 rounded-full border-2 border-[#00ffe7] bg-black"
                      />
                    ) : (
                      <div className="h-16 w-16 mb-2 rounded-full border-2 border-[#00ffe7] bg-black flex items-center justify-center text-[#00ffe7]">?</div>
                    )}
                    step="Step 3"
                    title="Trending Tokens"
                    titleColor="text-[#faafe8]"
                    borderColor="border-[#00ffe7]/30"
                    description={<span>See what's hot! We highlight trending tokens from CoinGecko. <a href="/x/pools" className="text-[#00ffe7] underline hover:text-[#faafe8]">See all pools</a>.</span>}

                  />
                  <StepCard
                    icon={<img src="/logos/dexter3d.svg" alt="DexterLogo" className="h-20 w-20 mb-2 rounded-lg" />}
                    step="Step 4"
                    title="Deploy & Monitor"
                    titleColor="text-[#00ffe7]"
                    borderColor="border-[#faafe8]/30"
                    description={<span>The best bots are the ones that are monitored! Use <a href="/x/about" className="text-[#00ffe7] underline hover:text-[#faafe8]">Telegram notifications</a> to stay on top of things.</span>}
                  />
                </div>
                
                {/* Commissions Section */}
                <div className="mt-16 w-full">
                  <h2 className="text-3xl font-bold text-[#faafe8] mb-8 drop-shadow-[0_0_8px_#faafe8] tracking-widest text-center">
                    Pricing & Commissions
                  </h2>
                  <p className="text-lg text-[#e0e7ef] mb-8 text-center max-w-3xl mx-auto">
                    Transparent, performance-based pricing. Pay only when your bot makes profit, with fair revenue sharing for bot creators.
                  </p>
                  <div className="flex flex-col md:flex-row gap-10 w-full justify-center items-start">
                    {/* Using a Bot Section */}
                    <div className="relative flex flex-col items-center bg-[#181a23]/80 rounded-2xl shadow-[0_0_32px_#00ffe7]/20 p-6 w-full max-w-md border-2 border-[#00ffe7]/40 passport-card overflow-hidden">
                      <h3 className="text-2xl font-bold mb-4 text-[#00ffe7] text-center drop-shadow-[0_0_8px_#00ffe7]">💸 Using a Bot</h3>
                      <p className="text-[#e0e7ef] mb-4 text-center text-sm">
                        Pay only when your bot makes profit. No monthly fees, no upfront costs.
                      </p>
                      <div className="space-y-2 mb-4 w-full">
                        <div className="flex justify-between items-center p-2 bg-[#23263a] rounded-lg">
                          <span className="text-[#b8eaff] text-sm">$0 – $5</span>
                          <span className="text-[#00ffe7] font-bold text-sm">2%</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-[#23263a] rounded-lg">
                          <span className="text-[#b8eaff] text-sm">$5 – $50</span>
                          <span className="text-[#00ffe7] font-bold text-sm">5%</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-[#23263a] rounded-lg">
                          <span className="text-[#b8eaff] text-sm">$50 – $250</span>
                          <span className="text-[#00ffe7] font-bold text-sm">10%</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-[#23263a] rounded-lg">
                          <span className="text-[#b8eaff] text-sm">$250+</span>
                          <span className="text-[#00ffe7] font-bold text-sm">15%</span>
                        </div>
                      </div>
                      <div className="border-t border-[#00ffe7]/30 pt-3 w-full">
                        <ul className="text-[#b8eaff] list-none space-y-1 text-xs">
                          <li className="flex items-center gap-2"><span>💰</span> Min $0.01 fee per round</li>
                          <li className="flex items-center gap-2"><span>📊</span> Monthly cap: max 1.5% of profit</li>
                        </ul>
                      </div>
                      {/* Neon HUD corners */}
                      <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#00ffe7] rounded-tl-2xl opacity-60 animate-pulse" />
                      <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#00ffe7] rounded-tr-2xl opacity-60 animate-pulse" />
                      <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#00ffe7] rounded-bl-2xl opacity-60 animate-pulse" />
                      <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#00ffe7] rounded-br-2xl opacity-60 animate-pulse" />
                    </div>
                    
                    {/* Selling a Bot Section */}
                    <div className="relative flex flex-col items-center bg-[#181a23]/80 rounded-2xl shadow-[0_0_32px_#faafe8]/20 p-6 w-full max-w-md border-2 border-[#faafe8]/40 passport-card overflow-hidden">
                      <h3 className="text-2xl font-bold mb-4 text-[#faafe8] text-center drop-shadow-[0_0_8px_#faafe8]">🤝 Selling a Bot</h3>
                      <p className="text-[#e0e7ef] mb-4 text-center text-sm">
                        Bot creators receive 70% of the commission, platform receives 30%.
                      </p>
                      <div className="flex flex-col items-center gap-4 mb-6">
                        <div className="flex justify-center items-center gap-3">
                          <div className="text-center">
                            <div className="bg-[#23263a] px-4 py-2 rounded text-[#00ffe7] font-bold text-lg">70%</div>
                            <span className="text-[#e0e7ef] text-sm">Creator</span>
                          </div>
                          <div className="text-center">
                            <div className="bg-[#23263a] px-4 py-2 rounded text-[#faafe8] font-bold text-lg">30%</div>
                            <span className="text-[#e0e7ef] text-sm">Platform</span>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-[#faafe8]/30 pt-3 w-full">
                        <ul className="text-[#b8eaff] list-none space-y-1 text-xs">
                          <li className="flex items-center gap-2"><span>🔗</span> Automatic revenue sharing</li>
                          <li className="flex items-center gap-2"><span>🛠️</span> Platform support included</li>
                          <li className="flex items-center gap-2"><span>📈</span> Transparent tracking</li>
                        </ul>
                      </div>
                      {/* Neon HUD corners */}
                      <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#faafe8] rounded-tl-2xl opacity-60 animate-pulse" />
                      <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#faafe8] rounded-tr-2xl opacity-60 animate-pulse" />
                      <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#faafe8] rounded-bl-2xl opacity-60 animate-pulse" />
                      <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#faafe8] rounded-br-2xl opacity-60 animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Smart Contract Features Section */}
                <div className="mt-16 w-full">
                  <h2 className="text-3xl font-bold text-[#faafe8] mb-8 drop-shadow-[0_0_8px_#faafe8] tracking-widest text-center">
                    Advanced Smart Contract Features
                  </h2>
                  <p className="text-lg text-[#e0e7ef] mb-8 text-center max-w-3xl mx-auto">
                    Our Uniswap V4 integration brings cutting-edge trading technology with batch processing, MEV protection, and dynamic fee optimization.
                  </p>
                  <div className="flex flex-col md:flex-row gap-10 w-full justify-center items-center">
                    <StepCard
                      icon={<div className="h-16 w-16 mb-2 bg-gradient-to-br from-[#00ffe7] to-[#faafe8] rounded-lg flex items-center justify-center text-[#181c23] font-bold text-2xl">⚡</div>}
                      step="Feature 1"
                      title="Batch Processing"
                      titleColor="text-[#00ffe7]"
                      borderColor="border-[#00ffe7]/30"
                      description={<span>Execute multiple orders across price levels in a single transaction. <strong>40% gas reduction</strong> compared to individual limit orders.</span>}
                    />
                    <StepCard
                      icon={<div className="h-16 w-16 mb-2 bg-gradient-to-br from-[#faafe8] to-[#8b5cf6] rounded-lg flex items-center justify-center text-white font-bold text-2xl">🛡️</div>}
                      step="Feature 2"
                      title="MEV Protection"
                      titleColor="text-[#faafe8]"
                      borderColor="border-[#faafe8]/30"
                      description={<span>Advanced multi-layer protection against MEV exploitation with commitment-reveal schemes and <strong>deadline enforcement</strong>.</span>}
                    />
                    <StepCard
                      icon={<div className="h-16 w-16 mb-2 bg-gradient-to-br from-[#8b5cf6] to-[#00ffe7] rounded-lg flex items-center justify-center text-white font-bold text-2xl">🎯</div>}
                      step="Feature 3"
                      title="Best Execution"
                      titleColor="text-[#bdb7ff]"
                      borderColor="border-[#bdb7ff]/30"
                      description={<span>Intelligent order queuing waits for better prices with configurable timeouts. Average <strong>0.1% price improvement</strong>.</span>}
                    />
                    <StepCard
                      icon={<div className="h-16 w-16 mb-2 bg-gradient-to-br from-[#00ffe7] to-[#8b5cf6] rounded-lg flex items-center justify-center text-[#181c23] font-bold text-2xl">💰</div>}
                      step="Feature 4"
                      title="Dynamic Fees"
                      titleColor="text-[#00ffe7]"
                      borderColor="border-[#00ffe7]/30"
                      description={<span>Gas-responsive pricing adjusts fees based on network conditions. <strong>50% fee reduction</strong> during high gas periods.</span>}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
