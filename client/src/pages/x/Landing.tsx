import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/AuthContext';
import LoadingScreenDots from '../../components/common/LoadingScreenDots';
import { Player } from '@lottiefiles/react-lottie-player';
import RandomRobohashCard from '../../components/common/RandomRobohashCard';
import { FaBars, FaChevronCircleDown, FaChevronCircleRight, FaChevronCircleUp, FaEthereum } from 'react-icons/fa';
import TickerBar from '../../components/common/TickerBar';

const landingFeatures = [
    {
        icon: <img src="/logos/eth-logo.svg" alt="Eth logo" className="h-16 w-16" />,
        title: "Automated DEX trading on Ethereum, made easy",
        color: "text-[#00ffe7]"
    },
    {
        icon: <img src="/logos/uniswap-logo.png" alt="Uniswap logo" className="h-16 w-16" />,
        title: "Direct and secure transactions through Uniswap's trading pools",
        color: "text-[#faafe8]"
    },
    {
        icon: "/icons/building-info.svg",
        title: "Experience the city of the future with Dexter City",
        color: "text-[#ffb347]"
    }
];

const LandingPage: React.FC = () => {
    const [showFooterMenu, setShowFooterMenu] = useState(false);
    const [assetsLoaded, setAssetsLoaded] = useState(false);
    const [animateWelcome, setAnimateWelcome] = useState(false);
    const [animateFeatures, setAnimateFeatures] = useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);
    const toggleButtonRef = React.useRef<HTMLButtonElement>(null);
    const navigate = useNavigate();
    const { user, triggerLoginModal } = useAuth();

    const handleEnterClick = () => {
        // If user is already authenticated, take them to dashboard
        if (user) {
            navigate('/i/dashboard');
        } else {
            triggerLoginModal();
        }
    };

    // Close on outside click or after 10 seconds
    useEffect(() => {
        if (!showFooterMenu) return;
        const handleClick = (e: MouseEvent) => {
            if (
                (menuRef.current && menuRef.current.contains(e.target as Node)) ||
                (toggleButtonRef.current && toggleButtonRef.current.contains(e.target as Node))
            ) {
                return;
            }
            setShowFooterMenu(false);
        };
        document.addEventListener('mousedown', handleClick);
        const timeout = setTimeout(() => setShowFooterMenu(false), 20000);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            clearTimeout(timeout);
        };
    }, [showFooterMenu]);

    // Track asset loading
    useEffect(() => {
        const imagePromises = [
            '/logos/eth-logo.svg',
            '/logos/uniswap-logo.png',
            '/icons/building-info.svg',
            '/logos/dexter3d.svg',
            '/lottie/blackBlocks.json'
        ].map((src) => {
            if (src.endsWith('.json')) {
                // For Lottie files, just resolve immediately
                return Promise.resolve();
            }
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = resolve;
                img.onerror = reject;
                img.src = src;
            });
        });

        Promise.all(imagePromises)
            .then(() => {
                setAssetsLoaded(true);
                // Start welcome animation first
                setTimeout(() => {
                    setAnimateWelcome(true);
                    // Then start features animation after welcome completes
                    setTimeout(() => setAnimateFeatures(true), 800);
                }, 100);
            })
            .catch(() => {
                // Even if some assets fail, show the content
                setAssetsLoaded(true);
                setTimeout(() => {
                    setAnimateWelcome(true);
                    setTimeout(() => setAnimateFeatures(true), 800);
                }, 100);
            });
    }, []);

    return (
        <>
            {/* HUD Foreground Content */}
            {/* <TickerBar /> */}
            <div className="relative z-10 flex flex-col flex-1 min-h px-4 py-auto  absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-1/3">
                <div className="z-20 mx-auto flex flex-col items-center justify-center w-full h-full ">
                    {/* HUD Video Game Background */}
                    <div className="relative z-20 backdrop-blur-lg mx-auto px-8 flex flex-col items-center justify-center w-4/5 h-full py-auto">
                        {/* Lottie Background Docked Right */}
                        <div className="absolute inset-y-0 right-0 sm:right-[3%] md:right-[6%] lg:right-[10.5%] flex items-center justify-end pointer-events-none select-none -z-10">
                            <Player
                                src="/lottie/blackBlocks.json"
                                className="w-full h-full object-cover drop-shadow-[0_0_24px] opacity-40"
                                loop
                                autoplay
                                speed={1}
                            />
                        </div>
                        <div className="flex gap-8 w-full h-full items-center justify-center ">
                            {/* Features grid docked right, vertically aligned */}
                            <div className={`flex flex-col w-3/5 bg-black rounded-xl p-8 shadow-[0_0_10px_#faafe8] justify-center transition-all duration-1000 ease-out ${
                                !assetsLoaded 
                                    ? 'opacity-0 scale-75 -translate-x-20' 
                                    : animateFeatures 
                                        ? 'opacity-100 scale-100 translate-x-0' 
                                        : 'opacity-0 scale-75 -translate-x-20'
                            }`}>
                                <div className="gap-8 w-full flex flex-col justify-center">
                                    {landingFeatures.map((feature, index) => (
                                        <div
                                            key={index}
                                            className={`bg-[#23263a] p-4 rounded-xl border border-[#00ffe7]/30 z-10 hover:shadow-[0_0_32px_rgba(0,255,231,0.25)] transition-all duration-700 ease-out flex items-center text-left ${
                                                !assetsLoaded 
                                                    ? 'opacity-0 scale-75 -translate-x-16' 
                                                    : animateFeatures 
                                                        ? 'opacity-100 scale-100 translate-x-0' 
                                                        : 'opacity-0 scale-75 -translate-x-16'
                                            }`}
                                            style={{ 
                                                transitionDelay: animateFeatures ? `${index * 150}ms` : '0ms'
                                            }}
                                        >
                                            <div className="flex items-center justify-center gap-2 min-w-[100px]">
                                                <div className='flex items-center justify-center bg-[#2e3147] rounded-full p-3 px-5 shadow-lg'>
                                                    {typeof feature.icon === 'string' ? (
                                                        <img src={feature.icon} alt={`${feature.title} icon`} className="h-16 w-16" />
                                                    ) : (
                                                        feature.icon
                                                    )}
                                                </div>
                                            </div>
                                            {/* Divider */}
                                            <div className="h-16 border-l border-[#00ffe7]/30 mx-6" />
                                            {/* Title with color and fading transition */}
                                            <h3
                                                className={`text-2xl font-bold ${feature.color} text-center flex-grow fadein-slidein`}
                                                style={{ animationDelay: `${index * 0.3 + 0.2}s` }}
                                            >
                                                {feature.title}
                                            </h3>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Dexter Cityheader vertically centered, docked right */}
                            <div className={`flex flex-col items-center justify-center w-3/5 p-10 bg-black/85 rounded-xl shadow-[0_0_10px_#faafe8] transition-all duration-1000 ease-out ${
                                !assetsLoaded 
                                    ? 'opacity-0 scale-75 translate-y-20' 
                                    : animateWelcome 
                                        ? 'opacity-100 scale-100 translate-y-0' 
                                        : 'opacity-0 scale-75 translate-y-20'
                            }`}>
                                <img src="/logos/dexter3d.svg" className="absolute top-2 h-20 p-4 rounded-full shadow-[0_0_10px_#faafe8] bg-black" alt="DexterCity" />
                                {/* Group Welcome and Logo together */}
                                <div className='mt-6'>
                                    <p
                                        className="font-marck  z-10 left-3 top-0 text-[#faafe8] text-5xl max-w-2xl mx-auto text-center -rotate-3"
                                        style={{ textShadow: "0 0 12px #faafe8" }}
                                    >
                                        Welcome to
                                    </p>
                                    <span
                                        className="neon-text text-7xl tracking-widest font-savate mb-2 text-center italic"
                                    >
                                        D<span className='text-5xl'>EXTER</span>C<span className='text-5xl'>ITY</span>
                                    </span>
                                </div>
                                <div className='my-6'>
                                    <RandomRobohashCard />
                                </div>
                                
                                <button
                                    onClick={handleEnterClick}
                                    // disabled={walletModalOpen}
                                    className="btn-special px-10 py-4"
                                >
                                    Enter the city
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Bottom HUD Navigation Bar removed, now handled in App.tsx */}

        </>
    );
};

export default LandingPage;
