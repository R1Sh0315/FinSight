import { Investment } from "../modules/investment/investment.model.js";
import { User } from "../modules/auth/user.model.js";
import { sendAlertEmail } from "./notification.service.js";
import yahooFinanceDefault from 'yahoo-finance2';

const yahooFinance = new (yahooFinanceDefault as any)();

// The specific thresholds to trigger alerts
const PROFIT_THRESHOLDS = [10, 25];
const LOSS_THRESHOLDS = [-10, -25, -60, -90];

/**
 * Helper to determine which threshold (if any) was crossed and not yet alerted.
 */
function getTriggeredThreshold(pnlPercent: number, alertsSent: number[]): number | null {
  // Sort thresholds so we trigger the highest profit or deepest loss first if multiple are crossed
  // (e.g. if a stock jumped 26% suddenly, we want to trigger the 25% alert, not just 10%)
  
  if (pnlPercent > 0) {
    // Check highest profit threshold crossed
    const crossed = PROFIT_THRESHOLDS.filter(t => pnlPercent >= t).sort((a, b) => b - a);
    for (const t of crossed) {
      if (!alertsSent.includes(t)) return t;
    }
  } else if (pnlPercent < 0) {
    // Check deepest loss threshold crossed (e.g. -25 is deeper than -10)
    const crossed = LOSS_THRESHOLDS.filter(t => pnlPercent <= t).sort((a, b) => a - b);
    for (const t of crossed) {
      if (!alertsSent.includes(t)) return t;
    }
  }
  
  return null;
}

export const runAlertEngine = async () => {
  console.log("Starting Alert Engine...");
  
  try {
    // 1. Fetch all Indian Equity investments
    const investments = await Investment.find({ assetClass: 'Indian Equity' }).populate('userId');
    
    if (!investments.length) {
      console.log("No Indian Equity investments found.");
      return;
    }

    // 2. Gather unique symbols and fetch live prices from Yahoo Finance
    const uniqueSymbols = [...new Set(investments.map(inv => inv.symbol.includes('.') ? inv.symbol : `${inv.symbol}.NS`))];
    const prices: Record<string, number> = {};
    
    try {
      const results = await yahooFinance.quote(uniqueSymbols);
      results.forEach((quote: any) => {
        prices[quote.symbol] = quote.regularMarketPrice;
      });
    } catch (err) {
      console.error("Failed to fetch live prices from Yahoo Finance for Alert Engine:", err);
      return; // Cannot run alerts without prices
    }

    // 3. Process each user's investments
    // Group investments by user so we send ONE email per user
    const alertsByUser = new Map<string, { user: any, messages: string[], triggeredInvs: any[] }>();

    for (const inv of investments) {
      const lookupSymbol = inv.symbol.includes('.') ? inv.symbol : `${inv.symbol}.NS`;
      const currentPrice = prices[lookupSymbol];
      
      if (!currentPrice) continue;

      const investedValue = inv.shares * inv.averagePrice;
      const currentValue = inv.shares * currentPrice;
      const pnlPercent = ((currentValue - investedValue) / investedValue) * 100;

      const triggeredThreshold = getTriggeredThreshold(pnlPercent, inv.alertsSent || []);

      if (triggeredThreshold !== null) {
        // We have an alert!
        const user = inv.userId as any;
        const userIdStr = user._id.toString();
        
        let msg = "";
        if (triggeredThreshold > 0) {
          msg = `📈 <strong>${inv.symbol}</strong> is up <strong>+${pnlPercent.toFixed(2)}%</strong> (Crossed +${triggeredThreshold}% threshold). Current Price: ₹${currentPrice.toFixed(2)}`;
        } else {
          msg = `📉 <strong>${inv.symbol}</strong> is down <strong>${pnlPercent.toFixed(2)}%</strong> (Crossed ${triggeredThreshold}% threshold). Current Price: ₹${currentPrice.toFixed(2)}`;
        }

        if (!alertsByUser.has(userIdStr)) {
          alertsByUser.set(userIdStr, { user, messages: [], triggeredInvs: [] });
        }
        
        const userAlerts = alertsByUser.get(userIdStr)!;
        userAlerts.messages.push(msg);
        
        // Add threshold to inv so we don't alert again
        inv.alertsSent = inv.alertsSent || [];
        inv.alertsSent.push(triggeredThreshold);
        userAlerts.triggeredInvs.push(inv);
      }
    }

    // 4. Send emails and save DB updates
    for (const [userId, alertData] of alertsByUser.entries()) {
      const { user, messages, triggeredInvs } = alertData;
      
      // Send Email
      await sendAlertEmail(user.email, user.name, messages);
      
      // Save all updated investments for this user
      for (const inv of triggeredInvs) {
        await inv.save();
      }
    }

    console.log(`Alert Engine completed. Processed alerts for ${alertsByUser.size} users.`);

  } catch (error) {
    console.error("Critical error in Alert Engine:", error);
  }
};
