import { Response } from "express";
import { AuthRequest } from "../../utils/auth.middleware.js";
import { User } from "./user.model.js";
import { Company } from "../company/company.model.js";
import yahooFinanceDefault from 'yahoo-finance2';

const yahooFinance = new (yahooFinanceDefault as any)();

export const getWatchlist = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch the company details for the symbols in the watchlist
    const companies = await Company.find({ symbol: { $in: user.watchlist } });

    // For missing symbols, try to fetch from Yahoo Finance
    const missingSymbols = user.watchlist.filter(
      symbol => !companies.find(c => c.symbol === symbol)
    );

    let yahooData: any = {};
    if (missingSymbols.length > 0) {
      try {
        const results = await yahooFinance.quote(
          missingSymbols.map(s => s + '.NS')
        );
        results.forEach((quote: any) => {
          const symbol = quote.symbol.replace('.NS', '');
          yahooData[symbol] = {
            symbol,
            name: quote.shortname || symbol,
            currentPrice: quote.regularMarketPrice,
            change: quote.regularMarketChange,
            changePercent: quote.regularMarketChangePercent
          };
        });
      } catch (err) {
        console.warn("Failed to fetch missing symbols from Yahoo Finance:", err);
      }
    }

    const watchlistData = user.watchlist.map(symbol => {
      const company = companies.find(c => c.symbol === symbol);
      if (company) return company;
      // Return only if we have real data from Yahoo Finance
      if (yahooData[symbol]) return yahooData[symbol];
      // Don't return mock data - skip symbols without real data
      return null;
    }).filter(item => item !== null);

    res.json({ data: watchlistData });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch watchlist" });
  }
};

export const addToWatchlist = async (req: AuthRequest, res: Response) => {
  try {
    const { symbol } = req.body;
    if (!symbol) return res.status(400).json({ message: "Symbol is required" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.watchlist.includes(String(symbol).toUpperCase())) {
      user.watchlist.push(String(symbol).toUpperCase());
      await user.save();
    }

    res.json({ message: "Added to watchlist", data: user.watchlist });
  } catch (error) {
    res.status(500).json({ message: "Failed to add to watchlist" });
  }
};

export const removeFromWatchlist = async (req: AuthRequest, res: Response) => {
  try {
    const { symbol } = req.params;
    
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.watchlist = user.watchlist.filter(s => s !== String(symbol).toUpperCase());
    await user.save();

    res.json({ message: "Removed from watchlist", data: user.watchlist });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove from watchlist" });
  }
};
