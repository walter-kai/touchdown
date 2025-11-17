import React, { useEffect, useRef, useState } from "react";
import Chart, { TooltipItem } from "chart.js/auto";
import { CandlestickController, OhlcController, CandlestickElement, OhlcElement } from "chartjs-chart-financial";
import "chartjs-chart-financial";
import "chartjs-adapter-date-fns";

import { PoolData } from "../../../../../types/subgraph/Pools";
import { SwapDataV4 } from "../../../../../types/subgraph/Swaps";
import LoadingScreenDots from "../../common/LoadingScreenDots";
import { BotConfig } from "../../../../../types/Bot";
import { generateOHLCData, fillMissingDays, generateSafetyOrderAndProfitLines } from "./ChartUtil";
import { authenticatedFetch } from "../../../utils/jwtStorage";

const calculatePercentChange = (currentPrice: number, previousPrice: number) => {
  if (!previousPrice) return 0;
  return ((currentPrice - previousPrice) / previousPrice) * 100;
};

// Function to format price with exactly 6 decimals for consistent display
const formatPriceWithDecimals = (num: number): string => {
  if (isNaN(num)) return "0.000000";
  
  // If number is very small, use fixed notation with 6 decimals
  if (Math.abs(num) < 0.000001 && num !== 0) {
    return num.toExponential(4);
  }
  
  // Format with exactly 6 decimal places
  const formatted = num.toFixed(6);
  
  // Remove trailing zeros but ensure we have at least one decimal place for visual consistency
  const trimmed = formatted.replace(/\.?0+$/, "");
  
  // If we removed all decimals, add back ".0" for consistency
  return trimmed.includes('.') ? trimmed : trimmed + ".0";
};

// Helper function to deduplicate bars within the same hour
const deduplicateHourlyData = (rawData: any[]): any[] => {
  if (!rawData || rawData.length === 0) return [];
  
  // Group by hour
  const hourlyGroups: Record<string, any[]> = {};
  
  rawData.forEach(bar => {
    const date = new Date(bar.x);
    // Format key as YYYY-MM-DD-HH
    const hourKey = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}`;
    
    if (!hourlyGroups[hourKey]) {
      hourlyGroups[hourKey] = [];
    }
    
    // Tag the bar to identify if it's a flat bar (all OHLC values are equal)
    bar.isFlatBar = bar.o === bar.h && bar.h === bar.l && bar.l === bar.c;
    hourlyGroups[hourKey].push(bar);
  });
  
  // Select one representative bar per hour
  const deduplicated = Object.values(hourlyGroups).map(hourBars => {
    // If there's only one bar for this hour, return it
    if (hourBars.length === 1) return hourBars[0];
    
    // If we have non-flat bars, prefer those (actual price movement)
    const nonFlatBars = hourBars.filter(bar => !bar.isFlatBar);
    if (nonFlatBars.length > 0) {
      return nonFlatBars[0]; // Return the first non-flat bar
    }
    
    // If all bars are flat, return just one
    return hourBars[0];
  });
  
  // Sort by time
  return deduplicated.sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime());
};

// Add missing hours where significant gaps exist
const fillMissingHours = (data: any[]): any[] => {
  if (data.length < 2) return data;
  
  const result = [...data];
  const fillers = [];
  const fourHours = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
  
  // Look for gaps and fill them
  for (let i = 0; i < data.length - 1; i++) {
    const currentTime = new Date(data[i].x).getTime();
    const nextTime = new Date(data[i+1].x).getTime();
    
    // If gap is more than 4 hours, add a filler point
    if (nextTime - currentTime > fourHours) {
      // Create a filler point midway between the two points
      const fillerTime = new Date(currentTime + (nextTime - currentTime) / 2);
      fillers.push({
        x: fillerTime,
        o: data[i].c,  // Use the closing price of the previous bar
        h: data[i].c,
        l: data[i].c,
        c: data[i].c,
        isGapFiller: true  // Mark as gap filler for different styling
      });
    }
  }
  
  // Add fillers to result and sort again
  result.push(...fillers);
  return result.sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime());
};

interface PairDetailsProps {
  botForm: BotConfig;
  pool: PoolData | undefined;
  className?: string; // Added className prop
}

const PairChart: React.FC<PairDetailsProps> = ({ botForm, pool, className }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [lineState, setLine] = useState<boolean>(false);
  const [barType, setBarType] = useState<boolean>(false);
  const [scaleType, setScaleType] = useState<"linear" | "logarithmic">("linear");
  const [swaps, setSwaps] = useState<SwapDataV4[]>([]);
  const [percentChange, setPercentChange] = useState<number | null>(null);
  const [fadeIn, setFadeIn] = useState<boolean>(false);
  const [priceType, setPriceType] = useState<"tradeToken" | "USD">("tradeToken");
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [lastSwapTimestamp, setLastSwapTimestamp] = useState<string | null>(null);
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!pool) return;

    const fetchSwaps = async () => {
      try {
        setLoading(true);
        const response = await authenticatedFetch(`/api/subgraph/swaps/${pool.address}`);
        if (!response.ok) throw new Error(`Failed to fetch trades: ${response.statusText}`);
        const data = await response.json();
        if (!Array.isArray(data.data)) {
          console.error("Invalid swaps data format:", data);
          return;
        }
        setSwaps(data.data);
        if (data.data.length > 0) {
          const lastSwap = data.data[0];
          const price =
            priceType === "tradeToken"
              ? Math.abs(lastSwap.amount1) / Math.abs(lastSwap.amount0)
              : lastSwap.amountUSD / Math.abs(lastSwap.amount0);
          setLivePrice(price);
          setLastSwapTimestamp(new Date(lastSwap.timestamp * 1000).toLocaleString());
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };

    fetchSwaps();
  }, [pool, priceType]);

  useEffect(() => {
    if (!chartInstanceRef.current) return;
    if (barType) {
      (chartInstanceRef.current.data.datasets[0] as any).borderColors = "rgba(0, 0, 0, 0)";
    } else {
      delete (chartInstanceRef.current.data.datasets[0] as any).borderColors;
    }
    chartInstanceRef.current.update();
  }, [barType]);

  useEffect(() => {
    if (!chartInstanceRef.current) return;
    chartInstanceRef.current.data.datasets[1].hidden = !lineState;
    chartInstanceRef.current.update();
  }, [lineState]);

  useEffect(() => {
    if (!chartInstanceRef.current) return;
    chartInstanceRef.current.options.scales!.y!.type = scaleType as "linear" | "logarithmic";
    chartInstanceRef.current.update();
  }, [scaleType]);

  const updateChart = () => {
    if (!chartInstanceRef.current) return;
    const ctx = chartInstanceRef.current.ctx;
    const yScale = chartInstanceRef.current.scales.y;
    const { barData } = generateOHLCData(swaps, priceType);
    if (barData.length === 0) return;
    const lastBar = barData[barData.length - 1];
    if (!lastBar || typeof lastBar.c === 'undefined') return;
    const lines = generateSafetyOrderAndProfitLines(lastBar.c, botForm);

    ctx.save();
    lines.forEach(({ price, color, dash }) => {
      if (price >= yScale.min && price <= yScale.max) {
        const y = yScale.getPixelForValue(price);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.setLineDash(dash);
        ctx.beginPath();
        ctx.moveTo(chartInstanceRef.current!.chartArea.left, y);
        ctx.lineTo(chartInstanceRef.current!.chartArea.right, y);
        ctx.stroke();
      }
    });
    ctx.restore();

    chartInstanceRef.current.update();
  };

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    Chart.register(CandlestickController, OhlcController, CandlestickElement, OhlcElement);

    const { barData, lineData } = generateOHLCData(swaps, priceType);
    
    // Deduplicate data within the same hour
    const deduplicatedData = deduplicateHourlyData(barData);
    
    // Fill large gaps with gap fillers
    const filledBarData = fillMissingHours(deduplicatedData);

    const transformedLineData = lineData.map(({ x, y }) => ({
      x,
      y,
      o: 0,
      h: 0,
      l: 0,
      c: 0,
    }));

    // Define a proper custom plugin
    const customDrawPlugin = {
      id: 'customDraw',
      afterDraw: (chart: Chart) => {
        const ctx = chart.ctx;
        const yScale = chart.scales.y;
        const xScale = chart.scales.x;
        
        // Only proceed if we have data
        if (filledBarData.length === 0) return;
        
        const lines = generateSafetyOrderAndProfitLines(filledBarData[filledBarData.length - 1].c, botForm);

        ctx.save();
        // Draw safety/profit lines
        lines.forEach(({ price, color, dash }) => {
          if (price >= yScale.min && price <= yScale.max) {
            const y = yScale.getPixelForValue(price);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.setLineDash(dash);
            ctx.beginPath();
            ctx.moveTo(chart.chartArea.left, y);
            ctx.lineTo(chart.chartArea.right, y);
            ctx.stroke();
          }
        });

        // Draw vertical dotted line for current time (BRIGHT CYAN)
        if (xScale && yScale) {
          const now = Date.now();
          if (now >= xScale.min && now <= xScale.max) {
            const x = xScale.getPixelForValue(now);
            
            // Draw the vertical line
            ctx.save();
            ctx.strokeStyle = "#00ffe7";
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.moveTo(x, chart.chartArea.top);
            ctx.lineTo(x, chart.chartArea.bottom);
            ctx.stroke();
            ctx.restore();
            
            // Add current time text at the bottom
            const nowDate = new Date();
            const currentTime = nowDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            ctx.save();
            ctx.fillStyle = "#00ffe7";
            ctx.font = "8px Arial";
            ctx.textAlign = "center";
            // Position the text just below the chart area
            ctx.fillText(currentTime, x, chart.chartArea.bottom + 16);
            ctx.restore();
          }
        }

        // Draw trailing horizontal line from last close to current time
        if (filledBarData.length > 0 && xScale && yScale) {
          const lastBar = filledBarData[filledBarData.length - 1];
          const lastX = xScale.getPixelForValue(lastBar.x);
          const now = Date.now();
          
          // Check if we have a data point at the current time
          const hasDataAtCurrentTime = filledBarData.some(bar => {
            const barTime = new Date(bar.x).getTime();
            return Math.abs(barTime - now) < 60 * 60 * 1000;
          });
          
          // Only draw trailing line if there's no data point at current time
          if (!hasDataAtCurrentTime) {
            const nowX = now >= xScale.min && now <= xScale.max ? xScale.getPixelForValue(now) : chart.chartArea.right;
            const y = yScale.getPixelForValue(lastBar.c);
            ctx.save();
            ctx.strokeStyle = "#aaa";
            ctx.lineWidth = 0.8;
            ctx.setLineDash([8, 4]);
            ctx.beginPath();
            ctx.moveTo(lastX+2, y);
            ctx.lineTo(nowX, y);
            ctx.stroke();
            ctx.restore();
          }
        }
        ctx.restore();
      }
    };

    // Register the custom plugin
    Chart.register(customDrawPlugin);

    // Define external tooltip handler for gaming HUD style
    const externalTooltipHandler = (context: any) => {
      // Avoid rendering tooltip if no items
      const { chart, tooltip } = context;
      if (tooltip.opacity === 0) return;
      
      const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;
      const { caretX, caretY } = tooltip;
      
      // Draw tooltip container
      const tooltipEl = document.getElementById('chartjs-tooltip');
      
      // Create tooltip element if it doesn't exist
      if (!tooltipEl) {
        const newTooltipEl = document.createElement('div');
        newTooltipEl.id = 'chartjs-tooltip';
        newTooltipEl.style.position = 'absolute';
        newTooltipEl.style.pointerEvents = 'none';
        newTooltipEl.style.transition = 'all 0.2s ease';
        newTooltipEl.style.transform = 'translate(-50%, -100%)';
        newTooltipEl.style.zIndex = '0';
        
        chart.canvas.parentNode?.appendChild(newTooltipEl);
      }
      
      const tooltipRoot = document.getElementById('chartjs-tooltip');
      if (!tooltipRoot) return;
      
      // Hide if no tooltip items
      if (tooltip.body.length === 0) {
        tooltipRoot.style.opacity = '0';
        return;
      }

      // Set active bar index for highlighting
      if (tooltip.dataPoints && tooltip.dataPoints.length > 0) {
        setActiveBarIndex(tooltip.dataPoints[0].dataIndex);
      }

      // Get tooltip data
      const titleLines = tooltip.title || [];
      const bodyLines = tooltip.body.map((b: any) => b.lines);
      
      // Create the inner HTML for the tooltip with gaming HUD style
      let innerHtml = `
        <div style="
          background: rgba(8, 16, 24, 0.85);
          box-shadow: 0 0 15px rgba(0, 255, 231, 0.6), inset 0 0 8px rgba(0, 255, 231, 0.3);
          border: 1px solid rgba(0, 255, 231, 0.7);
          border-radius: 3px;
          color: #ffffff;
          font-family: 'Exo 2', 'Rajdhani', sans-serif;
          padding: 8px 12px;
          backdrop-filter: blur(4px);
          position: relative;
          min-width: 140px;
        ">
          <div style="
            position: absolute;
            top: -2px;
            left: -2px;
            width: 10px;
            height: 10px;
            border-top: 2px solid #00ffe7;
            border-left: 2px solid #00ffe7;
          "></div>
          <div style="
            position: absolute;
            top: -2px;
            right: -2px;
            width: 10px;
            height: 10px;
            border-top: 2px solid #00ffe7;
            border-right: 2px solid #00ffe7;
          "></div>
          <div style="
            position: absolute;
            bottom: -2px;
            left: -2px;
            width: 10px;
            height: 10px;
            border-bottom: 2px solid #00ffe7;
            border-left: 2px solid #00ffe7;
          "></div>
          <div style="
            position: absolute;
            bottom: -2px;
            right: -2px;
            width: 10px;
            height: 10px;
            border-bottom: 2px solid #00ffe7;
            border-right: 2px solid #00ffe7;
          "></div>
      `;
      
      // Add title with HUD styling
      if (titleLines.length) {
        innerHtml += `
          <div style="
            font-size: 12px;
            font-weight: bold;
            color: #00ffe7;
            margin-bottom: 6px;
            padding-bottom: 4px;
            border-bottom: 1px solid rgba(0, 255, 231, 0.4);
            text-transform: uppercase;
            letter-spacing: 1px;
          ">${titleLines[0]}</div>
        `;
      }

      // Process body data with futuristic styling
      const bodyContent = bodyLines
        .flat()
        .map((line: string) => {
          // Format price values to exactly 6 decimals
          const modified = line.replace(/[-+]?\d+\.?\d*/g, (match) => {
            const num = parseFloat(match);
            // Keep percentages as they are
            if (line.includes('Change:') && match.includes('%')) {
              return formatPriceWithDecimals(num) + '%';
            }
            return formatPriceWithDecimals(num);
          });
          
          // Style based on content
          if (modified.includes("Change:")) {
            const isPositive = !modified.includes("-");
            return `<div style="
              font-weight: bold;
              font-size: 12px;
              color: ${isPositive ? '#00ff8c' : '#ff4a6d'};
              margin-top: 4px;
              display: flex;
              justify-content: space-between;
            ">
              <span>CHANGE</span>
              <span>${modified.split(': ')[1]}</span>
            </div>`;
          } else if (modified.includes("Gap Filler")) {
            return `<div style="
              color: #ffcc00;
              font-style: italic;
              font-size: 12px;
              text-align: center;
              margin-bottom: 4px;
            ">${modified}</div>`;
          } else {
            // Extract label and value
            const [label, value] = modified.split(': ');
            return `<div style="
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              margin: 3px 0;
            ">
              <span style="color: rgba(255, 255, 255, 0.7);">${label}</span>
              <span style="color: #ffffff; font-weight: bold;">${value}</span>
            </div>`;
          }
        })
        .join('');

      innerHtml += bodyContent;
      
      // Add progress bar at bottom for visual flair
      innerHtml += `
        <div style="
          height: 2px;
          width: 100%;
          background: rgba(0, 255, 231, 0.2);
          margin-top: 6px;
          position: relative;
          overflow: hidden;
        ">
          <div style="
            position: absolute;
            height: 100%;
            width: 50%;
            background: linear-gradient(to right, transparent, #00ffe7, transparent);
            animation: pulse 2s infinite;
          "></div>
        </div>
      `;
      
      innerHtml += `</div>`;
      
      tooltipRoot.innerHTML = innerHtml;
      
      // Position the tooltip
      tooltipRoot.style.left = positionX + caretX + 'px';
      tooltipRoot.style.top = positionY + caretY - 10 + 'px';
      tooltipRoot.style.opacity = '1';
      
      // Add keyframe animation for the pulse effect
      const styleSheet = document.createElement('style');
      styleSheet.textContent = `
        @keyframes pulse {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `;
      tooltipRoot.appendChild(styleSheet);
    };

    const plugins = {
      tooltip: {
        enabled: false,
        external: externalTooltipHandler,
        callbacks: {
          title: (tooltipItems: TooltipItem<"line" | "candlestick">[]) => {
            if (tooltipItems.length === 0) return '';
            const date = new Date(tooltipItems[0].parsed.x);
            return date.toLocaleString(undefined, {
              year: 'numeric',
              month: 'short', 
              day: 'numeric',
              hour: '2-digit', 
              minute: '2-digit'
            });
          },
          label: (tooltipItem: TooltipItem<"line" | "candlestick">) => {
            const dataset = tooltipItem.chart.data.datasets[tooltipItem.datasetIndex].data;
            const currentIndex = tooltipItem.dataIndex;
            setActiveBarIndex(currentIndex);
            
            const currentData = dataset[currentIndex] as { o: number; h: number; l: number; c: number; isGapFiller?: boolean };

            let labels: string[] = [];
            const { o, h, l, c, isGapFiller } = currentData;
            
            if (isGapFiller) {
              labels.push("Gap Filler");
            }

            // Use 6 decimal formatting
            labels.push(`Open: ${formatPriceWithDecimals(o)}`);
            labels.push(`High: ${formatPriceWithDecimals(h)}`);
            labels.push(`Low: ${formatPriceWithDecimals(l)}`);
            labels.push(`Close: ${formatPriceWithDecimals(c)}`);

            const previousData = dataset[currentIndex - 1] as { o: number; h: number; l: number; c: number };

            if (previousData) {
              const previousClose = previousData.c;
              const percentChange = ((c - previousClose) / previousClose) * 100;
              labels.push(`Change: ${formatPriceWithDecimals(percentChange)}%`);
            }

            return labels;
          },
        },
      },
      legend: {
        display: false,
      }
    };

    chartInstanceRef.current = new Chart(ctx, {
      type: "candlestick",
      data: {
        datasets: [
          {
            label: "OHLC Data",
            data: filledBarData,
          },
          {
            label: "Close Price",
            type: "line",
            data: transformedLineData,
            hidden: !lineState,
            borderColor: "rgba(255, 255, 255, 0.96)",
            hoverBorderColor: "rgba(255, 255, 255, 0.96)",
          },
        ],
      },
      options: {
        animation: {
          duration: 0 // Disable animations for better performance
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
        scales: {
          x: {
            type: "time",
            time: {
              unit: "day",
            },
            ticks: {
              source: "auto",
              color: "white",
            },
            grid: {
              color: "rgba(200, 200, 200, 0.2)",
            },
            min: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).getTime(),
            max: new Date(Date.now() + 3 * 60 * 60 * 1000).getTime(),
          },
          y: {
            type: scaleType,
            ticks: {
              callback: (value) => {
                const num = Number(value);
                // Format without trailing zeros
                return formatPriceWithDecimals(num);
              },
              color: "white",
            },
            border: {
              color: "rgba(200, 200, 200, 0.56)",
            },
            grid: {
              color: "rgba(200, 200, 200, 0.2)",
            },
          },
        },
        plugins: plugins,
        onHover: (event, elements) => {
          if (!elements || elements.length === 0) {
            // Clear active bar when hovering away
            setActiveBarIndex(null);
          }
        },
      },
      plugins: [customDrawPlugin],
    });
    setFadeIn(true);
    chartInstanceRef.current.update();
  }, [swaps, barType, lineState, scaleType, botForm.priceDeviation, botForm.safetyOrderGapMultiplier, botForm.takeProfit, botForm.safetyOrders, botForm, priceType]);

  // Clear active bar index when moving away from chart
  const handleMouseLeave = () => {
    setActiveBarIndex(null);
    if (chartInstanceRef.current) {
      chartInstanceRef.current.update();
    }
  };

  return (
    <div>
      <a href={`https://coinmarketcap.com/dexscan/ethereum/${pool?.address}`} target="_blank" rel="noopener noreferrer" className="text-[#00ffe7] hover:underline font-bold">
        {pool?.name.slice(4)}
      </a>
      <div className="text-gray-300 mb-2">
        {percentChange !== null && (
          <div style={{ color: percentChange >= 0 ? "#00ff8c" : "#ff4a6d" }}>
            <strong>Percent Change: {formatPriceWithDecimals(percentChange)}%</strong>
          </div>
        )}
      </div>
      {livePrice !== null && (
        <div className="mt-4 mb-4 p-4 bg-[#0d1520] border-2 border-[#00ffe7]/40 rounded-lg relative overflow-hidden">
          {/* HUD Corner Decorations */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00ffe7]"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00ffe7]"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#00ffe7]"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00ffe7]"></div>
          
          {/* HUD Scanner Line Effect */}
          <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
            <div className="h-[2px] w-full bg-[#00ffe7] animate-scan"></div>
          </div>
          
          <div className="relative">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-[#00ffe7] font-bold uppercase tracking-wider text-sm">Live Market Data</h3>
              <span className="text-xs text-[#00ffe7]/60 flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-[#00ffe7] rounded-full animate-pulse"></span>
                LIVE
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#172334]/50 p-2 rounded border border-[#00ffe7]/20">
                <div className="text-xs text-[#00ffe7]/70 uppercase tracking-wider mb-1">Price</div>
                <p className="text-white font-mono text-lg">
                  1 {priceType === "tradeToken" ? pool?.token1.symbol : "USD"} = <span className="text-[#00ffe7] font-bold">{formatPriceWithDecimals(livePrice)}</span> {" "}
                  {priceType === "tradeToken" ? pool?.token0.symbol : pool?.token1.symbol}
                </p>
              </div>
              
              {lastSwapTimestamp && (
                <div className="bg-[#172334]/50 p-2 rounded border border-[#00ffe7]/20">
                  <div className="text-xs text-[#00ffe7]/70 uppercase tracking-wider mb-1">Last Swap</div>
                  <p className="text-white font-mono">{lastSwapTimestamp}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <div className={className} onMouseLeave={handleMouseLeave}>
        {loading ? (
          <LoadingScreenDots />
        ) : (
          <canvas
            ref={chartRef}
            className={`transition-opacity duration-2000 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
          ></canvas>
        )}
      </div>
      
      {/* Add style for animation */}

    </div>
  );
};

export default PairChart;
