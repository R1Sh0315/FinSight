import { PaperTrade } from "./paperTrade.model.js";

// Utility to fetch from Groww API which provides reliable free option chain data without bot protection blocks
async function fetchOptionPrice(underlying: string, strikePrice: number, optionType: string, expiryMonth: string) {
  try {
    // 1. Search for the underlying to get the correct search_id
    const searchUrl = `https://groww.in/v1/api/search/v3/query/global/st_query?page=0&query=${encodeURIComponent(underlying)}&size=1&web=true`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    
    if (!searchData.data || !searchData.data.content || searchData.data.content.length === 0) {
      throw new Error("Could not find underlying on broker API");
    }
    
    const searchId = searchData.data.content[0].search_id;

    // 2. Fetch the option chain using the search_id
    const optionUrl = `https://groww.in/v1/api/option_chain_service/v1/option_chain/derivatives/${searchId}`;
    const optionRes = await fetch(optionUrl);
    const optionData = await optionRes.json();

    if (!optionData.optionChain || !optionData.optionChain.optionChains) {
       throw new Error("Invalid option chain data from broker API");
    }

    // 3. Find the matching contract
    // Groww strikePrice is multiplied by 100 (e.g. 2900 -> 290000)
    const targetStrike = strikePrice * 100;
    
    const key = optionType.toUpperCase() === 'CE' ? 'callOption' : 'putOption';
    
    const targetMonthPrefix = expiryMonth.substring(0, 3).toLowerCase();

    const matches = optionData.optionChain.optionChains.filter((chain: any) => 
      chain.strikePrice === targetStrike && chain[key]
    );

    const contract = matches.find((chain: any) => {
      const displayName = (chain[key].longDisplayName || "").toLowerCase();
      return displayName.includes(targetMonthPrefix);
    });

    if (contract && contract[key]) {
      return contract[key].ltp;
    }
    
    throw new Error("Specific contract not found in the option chain.");
  } catch (error: any) {
    console.error(`[Scraper Error] Failed to fetch for ${underlying} ${strikePrice} ${optionType}:`, error.message);
    return null;
  }
}

export const updatePaperTradePrices = async () => {
  console.log("Starting EOD Paper Trade Price Update...");
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
        
        const currentPrice = await fetchOptionPrice(
          trade.underlying, 
          trade.strikePrice, 
          trade.optionType, 
          trade.expiryDate.toLocaleString('default', { month: 'long' })
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
           console.log(`⚠️ Could not fetch price for ${trade.underlying}.`);
        }

        // Wait a few seconds between requests to avoid rate limits
        await new Promise(r => setTimeout(r, 1000));

      } catch (err) {
        console.error(`Failed to update price for trade ${trade._id}:`, err);
      }
    }

    console.log(`Paper Trade Price Update completed. (Updated ${updatedCount}/${activeTrades.length} trades)`);
  } catch (error) {
    console.error("Critical error in updatePaperTradePrices:", error);
  }
};
