import React, { useEffect, useState } from 'react';
import { Player } from "@lottiefiles/react-lottie-player";
import RandomRobohashCard from '../common/RandomRobohashCard';

// Hero lines data moved here from Features.tsx
const heroLines = [
  <div key="line-1" className='flex'>
    <p className="text-white">
      Welcome to the <span className="font-semibold text-[#b8eaff]">Purely Decentralized</span> Automated Trading Bot city of
      <span className="font-semibold text-[#b8eaff]"> Uniswap!</span>
    </p>
    <img
      src="logos/uniswap-logo.png"
      alt="Uniswap"
      className="w-14 h-14 mb-1 inline-block align-middle ml-2"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    />
  </div>,
  <div key="line-2" className="btn-standard text-center">Enter The City</div>,
  <div key="line-3" className="btn-standard text-center">Simple Guide</div>,
  <div key="line-4" className="btn-standard text-center">Community Chat</div>,
];

const Hero: React.FC = () => {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    // Animate lines in one by one
    if (visibleLines < heroLines.length) {
      const timer = setTimeout(() => setVisibleLines(visibleLines + 1), 700);
      return () => clearTimeout(timer);
    }
  }, [visibleLines]);

  return (
    <div className="relative flex flex-col items-center mb-12 bg-gradient-to-r from-neon-darker/10 to-neon-cyan/10 rounded-xl shadow-lg pl-16 opacity-0 animate-fade-in-scale">
      <div className="w-full flex justify-center -m-16">
        {/* Overlayed description */}
        <div className="flex flex-col justify-center pointer-events-none -mr-32 z-10">
          <div className="bg-black/80 rounded-xl px-6 py-6 max-w-[800px] mx-auto">
            <div className="text-3xl md:text-4xl font-bold text-neon-cyan drop-shadow-[0_0_8px_#00ffe7] mb-2">
              Greetings,
            </div>
            <div className="space-y-2 mt-2">
              {heroLines.map((line, idx) => {
                const delays = [700, 1200, 2000];
                const show = visibleLines > idx;
                return (
                  <div
                    key={idx}
                    className={`
                      ${show ? "animate-fadein-ltr" : ""}
                      text-neon-accent text-lg 
                    `}
                    style={{
                      opacity: show ? 1 : 0,
                      transform: show ? "translateX(0)" : "translateX(-40px)",
                      transition: `opacity 0.7s ${delays[idx] || 0}ms, transform 0.7s ${delays[idx] || 0}ms`,
                    }}
                  >
                    {line}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <Player
          src="lottie/blackBlocks.json"
          className="w-full drop-shadow-[0_0_24px]"
          loop
          autoplay
          speed={1}
        />
        <div className="absolute top-[60%] right-[8.5%]">
          <RandomRobohashCard />
        </div>
      </div>
    </div>
  );
};

export default Hero;
