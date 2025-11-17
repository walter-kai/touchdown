import React from 'react';
import { SiEthereum } from 'react-icons/si';

export const formatLargeNumberEth = (value: string | number): { formatted: string; hasSubscript: boolean; subscriptParts?: { before: string; subscript: string; after: string } } => {
  const numStr = value.toString();
  const num = parseFloat(numStr);
  
  // Handle very small numbers (many leading zeros after decimal)
  if (num > 0 && num < 0.0001) {
    const parts = numStr.split('.');
    if (parts[1]) {
      const decimals = parts[1];
      let zeroCount = 0;
      
      // Count leading zeros
      for (let i = 0; i < decimals.length; i++) {
        if (decimals[i] === '0') {
          zeroCount++;
        } else {
          break;
        }
      }
      
      if (zeroCount >= 4) {
        const significantDigits = decimals.substring(zeroCount);
        const displayDigits = significantDigits.substring(0, 4);
        
        return {
          formatted: `0.0(${zeroCount})${displayDigits}`,
          hasSubscript: true,
          subscriptParts: {
            before: '0.0',
            subscript: zeroCount.toString(),
            after: displayDigits
          }
        };
      }
    }
  }
  
  // Handle very large numbers (many trailing zeros)
  if (num >= 1000000000) {
    const numStr = num.toString();
    
    // Check for scientific notation
    if (numStr.includes('e+')) {
      const [base, exp] = numStr.split('e+');
      const baseNum = parseFloat(base);
      const exponent = parseInt(exp);
      
      if (exponent >= 9) {
        return {
          formatted: `${baseNum.toFixed(2)}(${exponent})`,
          hasSubscript: true,
          subscriptParts: {
            before: baseNum.toFixed(2),
            subscript: exponent.toString(),
            after: ''
          }
        };
      }
    }
    
    // Check for many trailing zeros
    const integerPart = Math.floor(num).toString();
    let zeroCount = 0;
    for (let i = integerPart.length - 1; i >= 0; i--) {
      if (integerPart[i] === '0') {
        zeroCount++;
      } else {
        break;
      }
    }
    
    if (zeroCount >= 6) {
      const significantPart = integerPart.substring(0, integerPart.length - zeroCount);
      return {
        formatted: `${significantPart}(${zeroCount})`,
        hasSubscript: true,
        subscriptParts: {
          before: significantPart,
          subscript: zeroCount.toString(),
          after: ''
        }
      };
    }
  }
  
  // Default formatting for normal numbers
  if (num >= 1000000) {
    return { formatted: (num / 1000000).toFixed(2) + 'M', hasSubscript: false };
  } else if (num >= 1000) {
    return { formatted: (num / 1000).toFixed(2) + 'K', hasSubscript: false };
  } else if (num >= 1) {
    return { formatted: num.toFixed(4), hasSubscript: false };
  } else {
    return { formatted: num.toFixed(6), hasSubscript: false };
  }
};

export const formatCurrency = (amount: string | number, symbol: string, showUsd?: string): JSX.Element => {
  const formatted = formatLargeNumberEth(amount);
  
  return React.createElement('span', { className: 'flex items-center gap-1' }, [
    formatted.hasSubscript && formatted.subscriptParts ? 
      React.createElement('span', { className: 'font-mono', key: 'amount' }, [
        formatted.subscriptParts.before,
        React.createElement('sub', { className: 'text-xs', key: 'sub' }, formatted.subscriptParts.subscript),
        formatted.subscriptParts.after
      ]) :
      React.createElement('span', { className: 'font-mono', key: 'amount' }, formatted.formatted),
    React.createElement(SiEthereum, { className: 'w-3 h-3 text-[#627eea]', key: 'icon' }),
    showUsd && React.createElement('span', { className: 'text-[#b8eaff] text-xs ml-1', key: 'usd' }, `$${showUsd}`)
  ]);
};
