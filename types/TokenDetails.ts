export interface TokenDetails {
  address: string;
  symbol: string;
  name: string;
  txCount: number;
  imgId: number;
  volume: number;
  price: number;
  date_added: string;
  tags: string[];
}

export interface TokenResponse {
  __typename: string;
  id: string;
  name: string;
  symbol: string;
  volumeUSD: string;
  txCount: string;
}
