

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

  export interface ApiStatus {
    timestamp: string;
    error_code: number;
    error_message?: string;
    elapsed: number;
    credit_count: number;
  }

  export interface ApiResponse<T> {
    status: ApiStatus;
    data: T;
  }

  export interface RawTokenData {
    id: number;
    name: string;
    symbol: string;
    slug: string;
    num_market_pairs: number;
    date_added: string;
    tags: string[];
    max_supply: number | null;
    circulating_supply: number;
    total_supply: number;
    platform?: Platform;
    cmc_rank: number;
    self_reported_circulating_supply: number | null;
    self_reported_market_cap: number | null;
    tvl_ratio: number | null;
    last_updated: string;
    quote: {
      USD: {
        price: number;
        volume_24h: number;
        volume_change_24h: number;
        percent_change_1h: number;
        percent_change_24h: number;
        percent_change_7d: number;
        percent_change_30d: number;
        percent_change_60d: number;
        percent_change_90d: number;
        market_cap: number;
        market_cap_dominance: number;
        fully_diluted_market_cap: number;
        tvl: number | null;
        last_updated: string;
      };
    };
  }
}

