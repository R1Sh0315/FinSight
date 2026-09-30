import { Response } from "express";
import { AuthRequest } from "../../utils/auth.middleware.js";
import { User } from "./user.model.js";
import { Company } from "../company/company.model.js";

export const getWatchlist = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch the company details for the symbols in the watchlist
    const companies = await Company.find({ symbol: { $in: user.watchlist } });
    
    // Also include symbols that might not exist in the DB yet, just pass them as mock objects
    const watchlistData = user.watchlist.map(symbol => {
      const company = companies.find(c => c.symbol === symbol);
      return company || { symbol, name: symbol + " Ltd", currentPrice: Math.floor(Math.random() * 2000) + 100 };
    });

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
