import re
with open("fm-fe/src/pages/HomePage.tsx", "r") as f:
    content = f.read()

new_logic = """    let currentPrice;
    
    // Check if it's a commodity and we have live metal prices
    const symUpper = inv.symbol.toUpperCase();
    const nameUpper = (inv.name || "").toUpperCase();
    let isCommodityLive = false;
    
    if ((inv.assetClass === 'COMMODITY' || inv.assetClass === 'Physical') && metals) {
      if (symUpper.includes('GOLD') || nameUpper.includes('GOLD')) { currentPrice = metals.gold; isCommodityLive = true; }
      else if (symUpper.includes('SILVER') || nameUpper.includes('SILVER')) { currentPrice = metals.silver; isCommodityLive = true; }
      else if (symUpper.includes('PLATINUM') || nameUpper.includes('PLATINUM')) { currentPrice = metals.platinum; isCommodityLive = true; }
    }
    
    if (!isCommodityLive) {
      // 1. Manual Override (e.g. for Physical Commodities)
      if (inv.manualCurrentPrice) {
        currentPrice = inv.manualCurrentPrice;
      } else {
        // 2. Try real-time API
        currentPrice = livePrices[lookupSymbol]?.price;
        
        // 3. Fallback to scraped database
        if (!currentPrice) {
          const found = allCompanies.find((c: any) => c.symbol === inv.symbol);
          currentPrice = found?.currentPrice;
        }
        
        // 4. Absolute Fallback: Use the average purchase price
        if (!currentPrice) {
          currentPrice = inv.averagePrice;
        }
      }
    }"""

old_logic = """    let currentPrice;
    
    // 1. Manual Override (e.g. for Physical Commodities)
    if (inv.manualCurrentPrice) {
      currentPrice = inv.manualCurrentPrice;
    } else {
      // 2. Try real-time API
      currentPrice = livePrices[lookupSymbol]?.price;
      
      // 3. Fallback to scraped database
      if (!currentPrice) {
        const found = allCompanies.find((c: any) => c.symbol === inv.symbol);
        currentPrice = found?.currentPrice;
      }
      
      // 4. Absolute Fallback: Use the average purchase price
      if (!currentPrice) {
        currentPrice = inv.averagePrice;
      }
    }"""

content = content.replace(old_logic, new_logic)

with open("fm-fe/src/pages/HomePage.tsx", "w") as f:
    f.write(content)
