import { PaperTrade } from "./paperTrade.model.js";

// Utility to fetch from NSE with standard browser headers to bypass basic bot protection.
async function fetchNseOptionPrice(underlying: string, strikePrice: number, optionType: string, expiryMonth: string) {
  try {
    // 1. Fetch main page to get cookies
    const baseUrl = 'https://www.nseindia.com';
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Connection': 'keep-alive'
    };

    const mainRes = await fetch(baseUrl, { headers });
    const cookies = mainRes.headers.get('set-cookie');

    // 2. Determine index or equity
    const indices = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];
    const isIndex = indices.includes(underlying.toUpperCase());
    const apiUrl = isIndex 
      ? `https://www.nseindia.com/api/option-chain-indices?symbol=${underlying}`
      : `https://www.nseindia.com/api/option-chain-equities?symbol=${underlying}`;

    // 3. Fetch Option Chain Data
    const apiRes = await fetch(apiUrl, {
      headers: {
        ...headers,
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'Cookie': cookies || ''
      }
    });

    if (!apiRes.ok) throw new Error(`NSE API returned status: ${apiRes.status}`);
    
    const data = await apiRes.json();
    if (!data || !data.records || !data.records.data) {
       throw new Error("NSE API returned empty or invalid structure (Bot protection likely blocked the request).");
    }

    // 4. Find the matching contract
    // Expiry dates are typically like "26-Oct-2026", but user inputs just the month like "October" or "Oct".
    // We'll filter the data looking for matches
    const optionKey = optionType.toUpperCase() === 'CE' ? 'CE' : 'PE';
    
    // Attempt to match the exact strike
    const strikes = data.records.data.filter((record: any) => record.strikePrice === strikePrice && record[optionKey]);
    
    // Find one that matches the month
    const targetMonthPrefix = expiryMonth.substring(0, 3).toLowerCase();
    const contract = strikes.find((record: any) => {
      const recordExpiry = (record.expiryDate || "").toLowerCase();
      return recordExpiry.includes(targetMonthPrefix);
    });

    if (contract && contract[optionKey]) {
      return contract[optionKey].lastPrice;
    }
    
    throw new Error("Specific contract not found in the option chain.");
  } catch (error: any) {
    console.error(`[NSE Scraper Error] Failed to fetch for ${underlying} ${strikePrice} ${optionType}:`, error.message);
    return null;
  }
}

export const updatePaperTradePrices = async () => {
  console.log("Starting EOD Paper Trade Price Update via NSE Scraper...");
  try {
    const activeTrades = await PaperTrade.find({ status: 'ACTIVE' });
    
    if (activeTrades.length === 0) {
      console.log("No active paper trades to update.");
      return;
    }

    let updatedCount = 0;

    for (const trade of activeTrades) {
      try {
        console.log(`Fetching latest price for: ${trade.underlying} ${trade.strikePrice} ${trade.optionType} (${trade.expiryDate})`);
        
        const currentPrice = await fetchNseOptionPrice(
          trade.underlying, 
          trade.strikePrice, 
          trade.optionType, 
          trade.expiryDate
        );
        
        if (currentPrice !== null && currentPrice > 0) {
          trade.priceHistory.push({
            timestamp: new Date(),
            price: currentPrice
          });
          await trade.save();
          updatedCount++;
          console.log(`✅ Successfully updated ${trade.underlying} to ₹${currentPrice}`);
        } else {
           console.log(`⚠️ Could not fetch price for ${trade.underlying} (Possibly blocked or market closed).`);
        }

        // Wait a few seconds between requests to avoid rate limits
        await new Promise(r => setTimeout(r, 2000));

      } catch (err) {
        console.error(`Failed to update price for trade ${trade._id}:`, err);
      }
    }

    console.log(`Paper Trade Price Update completed. (Updated ${updatedCount}/${activeTrades.length} trades)`);
  } catch (error) {
    console.error("Critical error in updatePaperTradePrices:", error);
  }
};
