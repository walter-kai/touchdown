import { BotConfig } from "../../../../../types/Bot";
import { SwapDataV4 } from "../../../../../types/subgraph/Swaps";

export const generateOHLCData = (swaps: SwapDataV4[], priceType: "tradeToken" | "USD") => {
  const barData: { x: number; o: number; h: number; l: number; c: number }[] = [];
  const lineData: { x: number; y: number }[] = [];

  if (swaps.length === 0) return { barData, lineData };

  let lastCloseNotRounded = priceType === "tradeToken" 
    ? Math.abs(swaps[0].amount1) / swaps[0].amount0 
    : swaps[0].amountUSD / Math.abs(swaps[0].amount0);
  let lastClose = Number(lastCloseNotRounded.toExponential(8));

  const groupedSwaps: { [key: number]: { open?: number; high: number; low: number; close?: number } } = {};

  swaps.forEach((swap) => {
    const { amount0, amount1, amountUSD, timestamp } = swap;
    const price = priceType === "tradeToken" 
      ? Math.abs(amount1) / Math.abs(amount0) 
      : amountUSD / Math.abs(amount0);
    const priceRounded = Number(price.toExponential(8));

    // Normalize timestamp to hourly bins
    const date = new Date(timestamp * 1000);
    date.setUTCMinutes(0, 0, 0);
    const timeKey = date.getTime(); // Group by this key

    if (!groupedSwaps[timeKey]) {
      groupedSwaps[timeKey] = { open: priceRounded, high: priceRounded, low: priceRounded, close: priceRounded };
    } else {
      groupedSwaps[timeKey].high = Math.max(groupedSwaps[timeKey].high, priceRounded);
      groupedSwaps[timeKey].low = Math.min(groupedSwaps[timeKey].low, priceRounded);
      groupedSwaps[timeKey].close = priceRounded;
    }

    lastClose = priceRounded;
  });

  const sortedTimes = Object.keys(groupedSwaps).map(Number).sort((a, b) => a - b);
  let previousClose = lastClose;

  for (let i = 0; i < sortedTimes.length; i++) {
    const time = sortedTimes[i];
    const swapsInTimeGroup = swaps.filter((swap) => {
      const swapTime = new Date(swap.timestamp * 1000).getTime();
      return swapTime >= time && swapTime < time + 3600000; // 1-hour range
    });

    if (swapsInTimeGroup.length > 0) {
      const close = swapsInTimeGroup[0].amountUSD / Math.abs(swapsInTimeGroup[0].amount0);
      const open = swapsInTimeGroup[swapsInTimeGroup.length - 1].amountUSD / Math.abs(swapsInTimeGroup[swapsInTimeGroup.length - 1].amount0);
      const high = Math.max(...swapsInTimeGroup.map((swap) => swap.amountUSD / Math.abs(swap.amount0)));
      const low = Math.min(...swapsInTimeGroup.map((swap) => swap.amountUSD / Math.abs(swap.amount0)));

      barData.push({ x: time, o: open, h: high, l: low, c: close });
      lineData.push({ x: time, y: close });
      previousClose = close;
    }

    // Fill missing hours
    if (i < sortedTimes.length - 1) {
      let nextTime = sortedTimes[i + 1];
      let currentDate = new Date(time);
      let nextDate = new Date(nextTime);

      while (currentDate.getTime() + 3600000 < nextDate.getTime()) {
        currentDate = new Date(currentDate.getTime() + 3600000);
        barData.push({
          x: currentDate.getTime(),
          o: previousClose,
          h: previousClose,
          l: previousClose,
          c: previousClose,
        });
        lineData.push({ x: currentDate.getTime(), y: previousClose });
      }
    }
  }

  return { barData, lineData };
};

export const fillMissingDays = (barData: { x: number; o: number; h: number; l: number; c: number }[]) => {
  if (barData.length === 0) return barData;

  const filledData = [];
  let previousBar = barData[0];
  filledData.push(previousBar);

  for (let i = 1; i < barData.length; i++) {
    const currentBar = barData[i];
    let previousDate = new Date(previousBar.x);
    let currentDate = new Date(currentBar.x);

    // Fill missing days
    while (previousDate.getTime() + 86400000 < currentDate.getTime()) {
      previousDate = new Date(previousDate.getTime() + 86400000);
      filledData.push({
        x: previousDate.getTime(),
        o: previousBar.c,
        h: previousBar.c,
        l: previousBar.c,
        c: previousBar.c,
      });
    }

    filledData.push(currentBar);
    previousBar = currentBar;
  }

  return filledData;
};

export const generateSafetyOrderAndProfitLines = (currentPrice: number, botForm: BotConfig) => {
  const lines: { price: number; color: string; dash: number[] }[] = [];
  let safetyOrderPrice = currentPrice * (1 - botForm.priceDeviation);
  let safetyOrderGap = botForm.safetyOrderGapMultiplier;

  // Generate safety order lines
  for (let i = 0; i < botForm.safetyOrders; i++) {
    lines.push({ price: safetyOrderPrice, color: "blue", dash: [5, 5] });
    safetyOrderPrice *= (1 - botForm.priceDeviation * safetyOrderGap);
    safetyOrderGap *= botForm.safetyOrderGapMultiplier;
  }

  // Generate take profit line
  const takeProfitPrice = currentPrice * (1 + botForm.takeProfit);
  lines.push({ price: takeProfitPrice, color: "green", dash: [10, 5] });

  // Generate current price line
  lines.push({ price: currentPrice, color: "black", dash: [5, 5] });

  return lines;
};
