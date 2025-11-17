import { TokenDetails, TokenResponse } from '../TokenDetails';

export interface PoolData {
    name: string;
    lastUpdated: string;
    createdAtTimestamp: string;
    network: "Ethereum";
    address: string;
    volumeUSD: string;
    txCount: string;
    date: string;
    feeTier: string;
    liquidity: string;
    token0Price: string;
    token0: TokenDetails;
    token1Price: string;
    token1: TokenDetails;
  }

  export interface PoolResponse {
    __typename: string;
    id: string;
    createdAtTimestamp: string;
    feeTier: string;
    liquidity: string;
    token0: TokenResponse;
    token1: TokenResponse;
    token0Price: string;
    token1Price: string;
    volumeUSD: string;
  }

  export interface PoolDayDataResponse {
    __typename: string;
    date: number;
    txCount: string;
    pool: PoolResponse;
  }
