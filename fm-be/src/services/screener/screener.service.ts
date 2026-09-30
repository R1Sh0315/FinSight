import axios from 'axios';
import * as cheerio from 'cheerio';

// A predefined list of top Indian companies to scrape for now
const TOP_SYMBOLS = [
  "RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "BHARTIARTL",
  "SBIN", "INFY", "HINDUNILVR", "ITC", "LT"
];

export const getCompaniesFromScreener = async (): Promise<any[]> => {
  const companies = [];
  
  for (const symbol of TOP_SYMBOLS) {
    try {
      // Some companies don't have consolidated data on screener, but most top ones do
      let response;
      try {
        response = await axios.get(`https://www.screener.in/company/${symbol}/consolidated/`);
      } catch (err) {
        response = await axios.get(`https://www.screener.in/company/${symbol}/`);
      }
      
      const $ = cheerio.load(response.data);
      
      const name = $('h1').first().text().trim();
      const exchange = "NSE";
      
      const marketCapStr = $('li:contains("Market Cap") .number').text().trim().replace(/,/g, '');
      const marketCap = parseFloat(marketCapStr) || 0;
      
      const currentPriceStr = $('li:contains("Current Price") .number').text().trim().replace(/,/g, '');
      const currentPrice = parseFloat(currentPriceStr) || 0;

      if (name) {
        companies.push({
          symbol,
          name,
          exchange,
          marketCap,
          currentPrice,
        });
      }
    } catch (error: any) {
      console.error(`Failed to fetch data for ${symbol}:`, error.message);
    }
    
    // Slight delay to be respectful of the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return companies;
};