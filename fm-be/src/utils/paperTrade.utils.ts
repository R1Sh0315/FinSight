/**
 * Utility functions for Paper Trading calculations.
 * Pure functions, separated from business logic for testability.
 */

export const calculateTotalQuantity = (lotSize: number, numberOfLots: number): number => {
  return lotSize * numberOfLots;
};

export const calculateInvestment = (entryPrice: number, totalQuantity: number): number => {
  return entryPrice * totalQuantity;
};

export const calculatePnL = (entryPrice: number, currentPrice: number, totalQuantity: number): number => {
  // Formula applies to both CE and PE for an Option Buyer.
  // E.g., PE bought at ₹5, sold at ₹8 = ₹3 profit per unit.
  return (currentPrice - entryPrice) * totalQuantity;
};

export const calculateReturnPercentage = (entryPrice: number, exitPrice: number): number => {
  if (entryPrice === 0) return 0;
  return ((exitPrice - entryPrice) / entryPrice) * 100;
};

export interface PriceSnapshot {
  timestamp: Date;
  price: number;
}

export const calculateMaximumProfit = (entryPrice: number, priceHistory: PriceSnapshot[], totalQuantity: number): number => {
  if (!priceHistory || priceHistory.length === 0) return 0;
  const maxPrice = Math.max(...priceHistory.map(p => p.price), entryPrice);
  return calculatePnL(entryPrice, maxPrice, totalQuantity);
};

export const calculateMaximumLoss = (entryPrice: number, priceHistory: PriceSnapshot[], totalQuantity: number): number => {
  if (!priceHistory || priceHistory.length === 0) return 0;
  const minPrice = Math.min(...priceHistory.map(p => p.price), entryPrice);
  return calculatePnL(entryPrice, minPrice, totalQuantity);
};

export const calculatePostExitAnalysis = (
  entryPrice: number,
  exitPrice: number,
  postExitPriceHistory: PriceSnapshot[],
  totalQuantity: number
) => {
  const realizedPnL = calculatePnL(entryPrice, exitPrice, totalQuantity);
  
  if (!postExitPriceHistory || postExitPriceHistory.length === 0) {
    return {
      realizedPnL,
      postExitHighPrice: exitPrice,
      postExitLowPrice: exitPrice,
      potentialAdditionalProfit: 0,
      missedProfit: 0
    };
  }

  const postExitHighPrice = Math.max(...postExitPriceHistory.map(p => p.price));
  const postExitLowPrice = Math.min(...postExitPriceHistory.map(p => p.price));
  
  const potentialMaxPnL = calculatePnL(entryPrice, postExitHighPrice, totalQuantity);
  const missedProfit = Math.max(0, potentialMaxPnL - realizedPnL);

  return {
    realizedPnL,
    postExitHighPrice,
    postExitLowPrice,
    potentialAdditionalProfit: missedProfit, // Synonym for missed profit
    missedProfit
  };
};
