export interface BotForSale {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

export interface BotConfig {
  status: "Running" | "Stopped";
  creatorName: string;
  creatorWalletId: string;
  botName: string;
  network: "Ethereum" | "Solana";
  tradingPool: string;
  triggerType: "RSA" | string;
  orderType: "Market" | string;  // Assuming there may be other order types
  takeProfit: number;
  trailingTakeProfit: number;
  cooldownPeriod: number;
  
  initialOrderSize: number;
  priceDeviation: number;
  safetyOrders: number;
  safetyOrderGapMultiplier: number;
  safetyOrderSizeMultiplier: number;
  
  notifications: boolean;
  createdAt: Date;
}
