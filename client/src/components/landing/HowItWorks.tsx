import React, { useState, useEffect, useRef } from 'react';
import { FaCog } from 'react-icons/fa';
import { FaBell, FaCoins, FaRocket, FaWallet } from 'react-icons/fa6';
import { Link } from 'react-router-dom';


// Getting Started Steps Data
export const gettingStartedSteps = [
  {
    step: 1,
    icon: <FaWallet />,
    title: "Create Your Account",
    description: "Sign up with your email or Google account to access all Dexter City features",
    detail: (
      <div className="bg-[#181a23] p-4 rounded-lg border border-[#00ffe7]/20 ">
        <div className="flex text-[#00ffe7] font-semibold bg-[#23263a] p-3 rounded border border-[#00ffe7]/10">
            
          <div className="btn-blue w-fit h-fit mx-auto mt-2">
            <span className="text-4xl mr-3">🚀</span>
            Create Account
          </div>

        </div>
      </div>
    )
  },
  {
    step: 2,
    icon: <FaCog />,
    title: "Configure or Buy a Bot",
    description: "Create a custom bot or purchase a pre-built strategy from our Bot Shop",
    detail: (
      <div className="bg-[#181a23] p-4 rounded-lg border border-[#00ffe7]/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex text-[#00ffe7] font-semibold bg-[#23263a] p-3 rounded border border-[#00ffe7]/10">
            <img src='icons/building-garage.svg' alt='Bot Garage' className='w-24 h-24 inline-block' />
            <h4 className="mb-2 gap-2">
              Bot Garage
            <p className="text-[#e0e7ef] text-sm">Customize a bot tailored to your preferences and store them for later use.</p>
            </h4>
          </div>
          <div className="flex text-[#00ffe7] font-semibold bg-[#23263a] p-3 rounded border border-[#00ffe7]/10">
            <img src='icons/building-garage.svg' alt='Bot Garage' className='w-24 h-24 inline-block' />
            <h4 className="mb-2 gap-2">
              Marketplace
            <p className="text-[#e0e7ef] text-sm">
              Buy a bot to learn strategies or <span className="text-yellow-300">earn commissions</span> for selling and hiring out bots!
            </p>
            </h4>
          </div>
        </div>
      </div>
    )
  },
  {
    step: 3,
    icon: <FaCoins />,
    title: "Choose Trading Pairs",
    description: "Select from 50+ popular tokens including meme coins and established cryptocurrencies",
    detail: (
      <div className="bg-[#181a23] p-4 rounded-lg border border-[#00ffe7]/20">
        <div className="flex items-center gap-3 mb-3">
          <img
            src="logos/uniswap-logo.png"
            alt="Uniswap"
            className="w-8 h-8"
          />
          <span className="text-[#00ffe7] font-semibold">Uniswap Integration</span>
        </div>
        <p className="text-[#e0e7ef] mb-3">
          Trade on the most popular DEX with access to:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <span className="bg-[#23263a] px-2 py-1 rounded text-[#b8eaff]">🚀 ETH/USDC</span>
          <span className="bg-[#23263a] px-2 py-1 rounded text-[#b8eaff]">🐸 PEPE/ETH</span>
          <span className="bg-[#23263a] px-2 py-1 rounded text-[#b8eaff]">🐕 SHIB/ETH</span>
          <span className="bg-[#23263a] px-2 py-1 rounded text-[#b8eaff]">⚡ WBTC/ETH</span>
        </div>
        <p className="text-[#faafe8] text-sm mt-2">
          <Link to="/x/pools" className="hover:underline">View all 50+ supported pools →</Link>
        </p>
      </div>
    )
  },
  {
    step: 4,
    icon: <FaRocket />,
    title: "Deploy & Monitor",
    description: "Launch your bot and manage strategies with real-time monitoring and reinforcements",
    detail: (
      <div className="bg-[#181a23] p-4 rounded-lg border border-[#00ffe7]/20">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span>🎯</span>
            <span className="text-[#e0e7ef]">
              Deploy using Uniswap v4 hooks that write your order directly into a smart contract on the Ethereum blockchain.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>📊</span>
            <span className="text-[#e0e7ef]">
              Monitor and get notified instantly with our Telegram bot.
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <div className="relative group">
              <button className="bg-[#23263a] text-[#00ffe7] border border-[#00ffe7]/30 px-3 py-1 rounded-md text-sm font-semibold hover:bg-[#00ffe7]/20 transition-colors flex items-center gap-1">
                <span>🔋</span> Recharge
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-[#2d3748] text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Add funds to your DCA budget as a reserve or to directly buy more.
              </div>
            </div>
            <div className="relative group">
              <button className="bg-[#23263a] text-[#00ffe7] border border-[#00ffe7]/30 px-3 py-1 rounded-md text-sm font-semibold hover:bg-[#00ffe7]/20 transition-colors flex items-center gap-1">
                <span>🔄</span> Reverse
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-[#2d3748] text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Instantly switch from a buying strategy to selling (or vice versa).
              </div>
            </div>
            <div className="relative group">
              <button className="bg-[#23263a] text-[#00ffe7] border border-[#00ffe7]/30 px-3 py-1 rounded-md text-sm font-semibold hover:bg-[#00ffe7]/20 transition-colors flex items-center gap-1">
                <span>🔥</span> Conviction
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-[#2d3748] text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Use remaining funds to buy immediately when you spot an opportunity.
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    step: 5,
    icon: <FaBell />,
    title: "Secure & Automated Payouts",
    description: "Utilizing ERC-6909, your tokens are secure and profits are automatically transferred via Uniswap v4 hooks.",
    detail: (
      <div className="bg-[#181a23] p-4 rounded-lg border border-[#00ffe7]/20">
        <div className="bg-gradient-to-r from-blue-500/20 to-blue-500/10 border border-blue-500/50 rounded p-3 mb-3">
          <h4 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
            <span>🛡️</span>
            <span>ERC-6909 Token Security</span>
          </h4>
          <p className="text-[#e0e7ef] text-sm">
            Your assets are secured within an ERC-6909 compatible vault, ensuring they never leave your custody until a trade is executed. This minimizes exposure and enhances security.
          </p>
        </div>
        <ul className="space-y-2 text-[#b8eaff]">
          <li className="flex items-center gap-2">
            <span>🤖</span> Automated settlement via Uniswap v4 hooks.
          </li>
          <li className="flex items-center gap-2">
            <span>⚡</span> Instant and gas-efficient profit transfers.
          </li>
          <li className="flex items-center gap-2">
            <span>🔒</span> Full self-custody of your assets at all times.
          </li>
          <li className="flex items-center gap-2">
            <span>🔔</span> Real-time notifications for every transaction.
          </li>
        </ul>
      </div>
    )
  }
];

const HowItWorks: React.FC = () => {
  const [strategyLevel, setStrategyLevel] = useState(50);
  const [visibleSteps, setVisibleSteps] = useState<boolean[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Generate strategy description based on level
  const getStrategyDescription = (level: number) => {
    if (level < 25) return "Conservative: Lower risk, fewer trades, larger safety gaps";
    if (level < 50) return "Balanced Conservative: Moderate risk with safety-first approach";
    if (level < 75) return "Balanced Aggressive: Higher frequency trades with controlled risk";
    return "Aggressive: Maximum frequency, tighter gaps, higher potential returns";
  };

  // Generate robohash seed based on strategy level
  const getStrategyRobohash = (level: number) => {
    const seeds = ["conservative-bot", "balanced-safe", "balanced-aggro", "aggressive-trader", "extreme-dca"];
    const index = Math.floor(level / 20);
    return `https://robohash.org/${seeds[index] || seeds[0]}?set=set1&size=200x200`;
  };

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = stepRefs.current.findIndex(ref => ref === entry.target);
          if (index !== -1 && entry.isIntersecting) {
            setVisibleSteps(prev => {
              const newVisible = [...prev];
              newVisible[index] = true;
              return newVisible;
            });
          }
        });
      },
      { threshold: 0.2, rootMargin: '100px 0px' } // Added rootMargin for earlier trigger
    );

    stepRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={sectionRef}
      id="getting-started" 
      className="bg-[#23263a]/70 border border-[#00ffe7]/30 rounded-xl shadow-lg p-8 mb-12 hover:shadow-[0_0_32px_rgba(0,255,231,0.2)] transition-all duration-300"
    >
      <h2 className="text-3xl font-bold text-[#00ffe7] mb-8 text-center drop-shadow-[0_0_8px_#00ffe7] opacity-0 animate-fade-in-up">
        🚀 Getting Started withDexter City
      </h2>
      
      <div className="flex flex-col items-center">
        {gettingStartedSteps.map((step, index) => (
          <React.Fragment key={step.step}>
            <div 
              ref={el => { stepRefs.current[index] = el; }}
              className={`w-full max-w-3xl p-6 bg-[#181a23]/50 rounded-lg border border-[#00ffe7]/20 hover:border-[#00ffe7]/40 transition-all duration-700 mb-4 ${
                visibleSteps[index] ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
              style={{
                transitionDelay: `${index * 200}ms`
              }}
            >
              <div className="flex items-start gap-6">
                <div className={`flex-shrink-0 transition-all duration-500 ${
                  visibleSteps[index] ? 'scale-100 rotate-0' : 'scale-75 rotate-45'
                }`}>
                  <div className="w-16 h-16 bg-[#00ffe7] text-[#181a23] rounded-full flex items-center justify-center text-2xl font-bold shadow-[0_0_16px_#00ffe7]">
                    {step.step}
                  </div>
                </div>
                <div className="flex-1">
                  <div className={`flex items-center gap-3 mb-3 transition-all duration-500 ${
                    visibleSteps[index] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}>
                    <div className="text-2xl text-[#00ffe7]">{step.icon}</div>
                    <h3 className="text-xl font-bold text-[#00ffe7]">{step.title}</h3>
                  </div>
                  <p className={`text-[#faafe8] mb-4 text-lg transition-all duration-500 ${
                    visibleSteps[index] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`} style={{ transitionDelay: `${100}ms` }}>
                    {step.description}
                  </p>
                  <div className={`transition-all duration-500 ${
                    visibleSteps[index] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                  }`} style={{ transitionDelay: `${200}ms` }}>
                    {step.detail}
                  </div>
                </div>
              </div>
            </div>

            {index < gettingStartedSteps.length - 1 && (
              <div className={`transition-all duration-500 ${visibleSteps[index] ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: `${index * 200 + 100}ms` }}>
                <div className="w-1 h-12 bg-[#00ffe7]/30 mx-auto my-4"></div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Strategy Slider */}
      <div className="bg-[#181a23]/70 p-6 rounded-lg border border-[#00ffe7]/30 mt-8 opacity-0 animate-fade-in-scale" style={{ animationDelay: '0.3s' }}>
        <h3 className="text-xl font-bold text-[#00ffe7] mb-4 text-center">DCA Strategy Selector</h3>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-2">
              <span>Conservative</span>
              <span>Aggressive</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={strategyLevel}
              onChange={(e) => setStrategyLevel(Number(e.target.value))}
              className="w-full h-2 bg-neon-dark rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #00ffe7 0%, #00ffe7 ${strategyLevel}%, #374151 ${strategyLevel}%, #374151 100%)`
              }}
            />
            <div className="text-center mt-2 text-[#00ffe7] font-semibold">
              {getStrategyDescription(strategyLevel)}
            </div>
          </div>
          <div className="flex-shrink-0">
            <img
              src={getStrategyRobohash(strategyLevel)}
              alt="Strategy Bot"
              className="w-24 h-24 rounded-lg border-2 border-[#00ffe7] shadow-md bg-neon-darker transition-all duration-300"
            />
          </div>
        </div>
        <div className="mt-4 text-sm text-neon-light">
          <p><strong>Commission System:</strong> Dexter Cityoperates on a performance-based commission structure. We only earn when your bots are profitable, aligning our success with yours.</p>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
