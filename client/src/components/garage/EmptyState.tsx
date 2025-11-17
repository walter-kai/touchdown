import React from 'react';
import { FaPlus, FaRocket, FaChartLine, FaCog, FaLightbulb } from 'react-icons/fa';

interface EmptyStateProps {
  isSelected: boolean;
  onCreateBot?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ isSelected, onCreateBot }) => {
  if (isSelected) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full min-h-[320px] animate-fade-in-scale"
        style={{
          background: "linear-gradient(135deg, #181a23 0%, #23263a 100%)",
          borderRadius: "1rem",
          border: "4px solid #00ffe7",
          boxShadow: "0 0 32px #00ffe7",
          padding: "2rem",
          overflow: "hidden",
          position: "relative"
        }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 w-8 h-8 border-2 border-[#00ffe7] rounded-full animate-pulse"></div>
          <div className="absolute bottom-6 right-6 w-6 h-6 border-2 border-[#ff005c] rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-1/2 left-1/4 w-4 h-4 border-2 border-[#faafe8] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 text-center">
          <div className="mb-4">
            <FaRocket className="text-4xl text-[#00ffe7] mx-auto mb-2 animate-bounce" />
          </div>
          <h3 className="text-xl font-bold text-[#00ffe7] mb-2">Ready to Expand Your Bot Army?</h3>
          <p className="text-[#e0e7ef] mb-4">Select any bot from your garage to view detailed analytics, or create a new bot to grow your trading empire!</p>
          
          {/* Create Bot CTA */}
          {onCreateBot && (
            <button 
              onClick={onCreateBot} 
              className="group relative overflow-hidden px-6 py-3 bg-gradient-to-r from-[#00ffe7] to-[#ff005c] text-[#181a23] font-bold rounded-xl border-2 border-[#00ffe7] shadow-[0_0_16px_#00ffe7] hover:shadow-[0_0_24px_#ff005c] transition-all duration-300 transform hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                <FaPlus />
                CREATE NEW BOT
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#ff005c] to-[#00ffe7] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center mt-8 animate-fade-in-up">
      <div
        className="relative p-8 text-center max-w-2xl mx-auto"
        style={{
          background: "linear-gradient(135deg, #181a23 0%, #23263a 100%)",
          borderRadius: "1.5rem",
          border: "4px solid #00ffe7",
          boxShadow: "0 0 48px #00ffe7",
          overflow: "hidden"
        }}
      >
        {/* Animated background grid */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-8 grid-rows-6 h-full w-full">
            {Array.from({ length: 48 }).map((_, i) => (
              <div 
                key={i} 
                className="border border-[#00ffe7] animate-pulse" 
                style={{ animationDelay: `${i * 0.1}s` }}
              ></div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Icon showcase */}
          <div className="flex justify-center items-center mb-6 space-x-4">
            <div className="p-3 bg-[#00ffe7]/20 rounded-full border-2 border-[#00ffe7] animate-pulse">
              <FaRocket className="text-2xl text-[#00ffe7]" />
            </div>
            <div className="p-3 bg-[#ff005c]/20 rounded-full border-2 border-[#ff005c] animate-pulse" style={{ animationDelay: '0.2s' }}>
              <FaChartLine className="text-2xl text-[#ff005c]" />
            </div>
            <div className="p-3 bg-[#faafe8]/20 rounded-full border-2 border-[#faafe8] animate-pulse" style={{ animationDelay: '0.4s' }}>
              <FaCog className="text-2xl text-[#faafe8]" />
            </div>
          </div>

          {/* Main heading */}
          <div className="mb-6">
            <h2 className="text-4xl font-extrabold text-[#00ffe7] mb-3 tracking-wide">
              🚀 BUILD YOUR FIRST <span className="text-[#ff005c]">TRADING BOT</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#00ffe7] to-[#ff005c] mx-auto rounded-full"></div>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-sm">
            <div className="p-4 bg-[#23263a]/50 rounded-lg border border-[#00ffe7]/20">
              <FaLightbulb className="text-[#00ffe7] text-xl mb-2 mx-auto" />
              <h4 className="font-bold text-[#00ffe7] mb-1">Smart AI</h4>
              <p className="text-[#e0e7ef]">Advanced algorithms that learn and adapt to market conditions</p>
            </div>
            <div className="p-4 bg-[#23263a]/50 rounded-lg border border-[#ff005c]/20">
              <FaChartLine className="text-[#ff005c] text-xl mb-2 mx-auto" />
              <h4 className="font-bold text-[#ff005c] mb-1">Real-time Analytics</h4>
              <p className="text-[#e0e7ef]">Live performance tracking and detailed profit analysis</p>
            </div>
            <div className="p-4 bg-[#23263a]/50 rounded-lg border border-[#faafe8]/20">
              <FaCog className="text-[#faafe8] text-xl mb-2 mx-auto" />
              <h4 className="font-bold text-[#faafe8] mb-1">Easy Setup</h4>
              <p className="text-[#e0e7ef]">No coding required - configure your bot in minutes</p>
            </div>
          </div>

          {/* CTA section */}
          <div className="mb-6">
            <p className="text-[#e0e7ef] text-lg mb-4 leading-relaxed">
              Join thousands of traders already earning <span className="text-green-400 font-bold">passive income</span> with 
              automated trading bots. Start building your financial future today!
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-[#00ffe7] mb-4">
              <span>⚡ Deploy in minutes</span>
              <span>•</span>
              <span>📈 24/7 trading</span>
              <span>•</span>
              <span>🛡️ Risk management</span>
            </div>
          </div>

          {/* Action button - Always present */}
          <button 
            onClick={onCreateBot} 
            className="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-[#00ffe7] to-[#ff005c] text-[#181a23] font-bold text-lg rounded-xl border-2 border-[#00ffe7] shadow-[0_0_24px_#00ffe7] hover:shadow-[0_0_32px_#ff005c] transition-all duration-300 transform hover:scale-105"
          >
            <span className="relative z-10 flex items-center gap-2">
              <FaPlus className="text-xl" />
              CREATE YOUR FIRST BOT
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#ff005c] to-[#00ffe7] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          {/* Testimonial */}
          <div className="mt-6 p-4 bg-[#181a23]/50 rounded-lg border-l-4 border-[#00ffe7]">
            <p className="text-[#e0e7ef] italic text-sm">
              "I made my first $1000 in passive income within the first month!" 
            </p>
            <span className="text-[#00ffe7] text-xs font-bold">- Alex_Trader_Pro</span>
          </div>
        </div>

        {/* Floating elements for visual appeal */}
        <div className="absolute top-4 right-4 w-12 h-12 border-2 border-[#00ffe7]/30 rounded-full animate-spin" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-4 left-4 w-8 h-8 border-2 border-[#ff005c]/30 rounded-full animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }}></div>
      </div>
    </div>
  );
};

export default EmptyState;
