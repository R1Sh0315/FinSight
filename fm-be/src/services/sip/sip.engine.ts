import cron from 'node-cron';
import { Investment } from '../../modules/investment/investment.model.js';

export const runSipEngine = async () => {
  console.log('[SIP ENGINE] Running daily SIP check...');
  try {
    const today = new Date();
    
    // Find all active SIP investments
    // For a real app, we'd have nextExecutionDate in DB.
    // Here we assume SIPs execute on a specific day of the month based on initial investment date.
    const sips = await Investment.find({ tradeType: 'SIP' });

    for (const sip of sips) {
      if (!sip.sipAmount || !sip.sipFrequency) continue;
      
      // Very basic logic: If Monthly, execute on the dateInvested day of the month
      // We only trigger if the current day matches the start date's day
      if (sip.sipFrequency === 'Monthly' && sip.dateInvested.getDate() === today.getDate()) {
        console.log(`[SIP ENGINE] Executing SIP for ${sip.symbol} for user ${sip.userId}`);
        
        // Fetch live NAV
        const code = sip.symbol;
        if (/^\d+$/.test(code)) {
          const response = await fetch(`https://api.mfapi.in/mf/${code}`);
          const data = await response.json();
          if (data && data.data && data.data.length > 0) {
            const latestNav = parseFloat(data.data[0].nav);
            
            const newUnits = sip.sipAmount / latestNav;
            
            // Average logic
            const oldShares = sip.shares;
            const oldPrice = sip.averagePrice;
            const totalShares = oldShares + newUnits;
            const newAvgPrice = ((oldShares * oldPrice) + (newUnits * latestNav)) / totalShares;
            
            sip.shares = totalShares;
            sip.averagePrice = newAvgPrice;
            
            await sip.save();
            console.log(`[SIP ENGINE] Successfully purchased ${newUnits.toFixed(4)} units of ${code} at NAV ${latestNav}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('[SIP ENGINE] Error running SIP cron:', error);
    throw error;
  }
};

export const startSipEngine = () => {
  // Run every day at 23:30 (11:30 PM) to ensure MF API has updated daily NAVs
  cron.schedule('30 23 * * *', async () => {
    await runSipEngine();
  });
  console.log('[SIP ENGINE] Scheduled to run daily at 23:30');
};
