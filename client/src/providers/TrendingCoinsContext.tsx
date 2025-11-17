import React, { createContext, useState, useEffect, ReactNode } from 'react';

export const TrendingCoinsContext = createContext<{ trendingCoins: any[] }>({ trendingCoins: [] });

export const TrendingCoinsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [trendingCoins, setTrendingCoins] = useState<any[]>([]);
    useEffect(() => {
        const fetchTrendingCoins = async () => {
            try {
                const response = await fetch('https://api.coingecko.com/api/v3/search/trending');
                if (!response.ok) throw new Error('Failed to fetch');
                const data = await response.json();
                setTrendingCoins(data.coins);
            } catch (error) {
                console.error("Failed to fetch trending coins:", error);
            }
        };
        fetchTrendingCoins();
    }, []);
    return (
        <TrendingCoinsContext.Provider value={{ trendingCoins }}>
            {children}
        </TrendingCoinsContext.Provider>
    );
};
