import yahooFinanceDefault from 'yahoo-finance2';
import axios from 'axios';

const yahooFinance = new (yahooFinanceDefault as any)();

// Common forex pairs for Indian traders
export const COMMON_FOREX_PAIRS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'NZDUSD',
  'USDINR', 'EURIND', 'GBPIND', 'JPYIND'
];

export interface ForexRate {
  pair: string;
  rate: number;
  change: number;
  changePercent: number;
  timestamp: Date;
  source: string;
}

export interface EconomicEvent {
  date: string;
  country: string;
  event: string;
  impact: 'High' | 'Medium' | 'Low';
  forecast: string;
  previous: string;
  actual?: string;
  source: string;
}

// Fetch forex rates from Yahoo Finance
export const getForexRates = async (pairs: string[]): Promise<ForexRate[]> => {
  try {
    const yahooSymbols = pairs.map(pair => `${pair}=X`);
    const results = await yahooFinance.quote(yahooSymbols);

    return results.map((quote: any) => ({
      pair: quote.symbol.replace('=X', ''),
      rate: quote.regularMarketPrice,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      timestamp: new Date(),
      source: 'Yahoo Finance'
    }));
  } catch (error) {
    console.error('Failed to fetch forex rates:', error);
    throw new Error('Failed to fetch forex rates');
  }
};

// Get common forex pairs with live rates
export const getCommonForexPairs = async (): Promise<ForexRate[]> => {
  return getForexRates(COMMON_FOREX_PAIRS);
};

// Fetch economic calendar from Forex Factory
// This would need to be scraped or use an API
export const getEconomicCalendar = async (daysAhead: number = 7): Promise<EconomicEvent[]> => {
  try {
    // Note: Forex Factory doesn't provide a free API, so we'd need to:
    // 1. Use web scraping (cheerio) to extract calendar data
    // 2. Or use a paid API like Finnhub, Alpha Vantage, or TradingEconomics
    // 3. Or use TradingView's calendar widget (frontend only)

    // Placeholder - actual implementation would require scraping or paid API
    console.warn('Economic calendar integration pending - requires Forex Factory API or TradingEconomics integration');
    return [];
  } catch (error) {
    console.error('Failed to fetch economic calendar:', error);
    throw new Error('Failed to fetch economic calendar');
  }
};

// Get forex news from relevant sources
export const getForexNews = async (): Promise<any[]> => {
  try {
    // This could integrate additional RSS feeds for forex news
    // For now, using economic/financial news feeds that cover forex
    const feeds = [
      { url: 'https://feeds.bloomberg.com/markets/forex.rss', source: 'Bloomberg Forex' },
      { url: 'https://economictimes.indiatimes.com/rss', source: 'Economic Times' }
    ];

    // This would need RSS parsing - similar to market.controller.ts
    // For now, return empty array pending RSS feed integration
    return [];
  } catch (error) {
    console.error('Failed to fetch forex news:', error);
    return [];
  }
};
