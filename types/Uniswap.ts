

export namespace CoinMarketCap {
  export interface Platform {
    id: number;
    name: string;
    slug: string;
    symbol: string;
    token_address: string;
  }

  export interface Token {
    id: number;
    contract_address: string;
    name: string;
    symbol: string;
    decimals: number;
    total_supply: number;
    platform: Platform;
    price_usd: number;
    market_cap_usd: number;
    circulating_supply: number;
    volume_24h: number;
    price_change_24h: number;
    last_updated: string;  // ISO 8601 format string
  }



  
}

export namespace Subgraph {

    // Define TypeScript types for queries







}
