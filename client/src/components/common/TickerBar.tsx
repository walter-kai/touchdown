import React, { useState, useEffect } from 'react';

interface Coin {
    item: {
        id: string;
        name: string;
        symbol: string;
        thumb: string;
    };
}

const TickerBar: React.FC = () => {
    const [trendingCoins, setTrendingCoins] = useState<Coin[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrendingCoins = async () => {
            try {
                setLoading(true);
                const response = await fetch('https://api.coingecko.com/api/v3/search/trending');
                if (!response.ok) throw new Error('Failed to fetch');
                const data = await response.json();
                setTrendingCoins(data.coins);
            } catch (error) {
                console.error("Failed to fetch trending coins:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTrendingCoins();
    }, []);

    const marqueeStyle = `
        @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-100%); }
        }
        .animate-marquee {
            animation: marquee 120s linear infinite;
            will-change: transform;
        }
    `;

    return (
        <>
            <style>{marqueeStyle}</style>
            <div className="bg-black/50 backdrop-blur-sm h-12 w-full fixed top-0 z-50 overflow-hidden">
                <div className="flex animate-marquee whitespace-nowrap items-center h-full">
                    {loading ? (
                        <span className="text-white px-4">Loading trending tokens...</span>
                    ) : (
                        // Triple the array for seamless looping
                        [...trendingCoins, ...trendingCoins, ...trendingCoins].map((coin, index) => (
                            <div key={index} className="flex items-center mx-8 flex-shrink-0">
                                <img src={coin.item.thumb} alt={coin.item.name} className="h-6 w-6 mr-2 rounded-full" />
                                <span className="text-white font-semibold">{coin.item.name} ({coin.item.symbol.toUpperCase()})</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default TickerBar;
