import { Request, Response } from "express";
import { PaperTrade } from "./paperTrade.model.js";
import { 
  calculateTotalQuantity, 
  calculatePnL, 
  calculateReturnPercentage, 
  calculatePostExitAnalysis 
} from "../../utils/paperTrade.utils.js";

export const getPaperTrades = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const trades = await PaperTrade.find({ userId }).sort({ createdAt: -1 });
    res.json({ data: trades });
  } catch (error) {
    console.error("Failed to fetch paper trades:", error);
    res.status(500).json({ message: "Failed to fetch paper trades" });
  }
};

export const getPaperTradeById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const trade = await PaperTrade.findOne({ _id: id, userId });
    
    if (!trade) {
      return res.status(404).json({ message: "Trade not found" });
    }
    
    res.json({ data: trade });
  } catch (error) {
    console.error("Failed to fetch paper trade:", error);
    res.status(500).json({ message: "Failed to fetch paper trade" });
  }
};

export const createPaperTrade = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { 
      underlying, optionType, strikePrice, expiryDate, 
      entryPrice, lotSize, numberOfLots, notes 
    } = req.body;
    
    const totalQuantity = calculateTotalQuantity(lotSize, numberOfLots);
    
    const trade = await PaperTrade.create({
      userId,
      underlying,
      optionType,
      strikePrice,
      expiryDate,
      entryPrice,
      lotSize,
      numberOfLots,
      totalQuantity,
      notes,
      priceHistory: [{ timestamp: new Date(), price: entryPrice }]
    });
    
    res.status(201).json({ data: trade });
  } catch (error) {
    console.error("Failed to create paper trade:", error);
    res.status(500).json({ message: "Failed to create paper trade" });
  }
};

export const exitPaperTrade = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { exitPrice, exitReason, exitDateTime } = req.body;
    
    const trade = await PaperTrade.findOne({ _id: id, userId });
    
    if (!trade) {
      return res.status(404).json({ message: "Trade not found" });
    }
    
    if (trade.status !== 'ACTIVE') {
      return res.status(400).json({ message: "Trade is not active" });
    }
    
    trade.status = 'EXITED';
    trade.exitPrice = exitPrice;
    trade.exitReason = exitReason;
    trade.exitDateTime = exitDateTime ? new Date(exitDateTime) : new Date();
    
    // Add the exit price to history if not exactly the same timestamp
    trade.priceHistory.push({ timestamp: trade.exitDateTime, price: exitPrice });
    
    await trade.save();
    
    res.json({ data: trade });
  } catch (error) {
    console.error("Failed to exit paper trade:", error);
    res.status(500).json({ message: "Failed to exit paper trade" });
  }
};

export const recordDailyPrice = async (req: Request, res: Response) => {
  // Utility endpoint to manually append a price to history for demo/MVP purposes
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { price, timestamp } = req.body;
    
    const trade = await PaperTrade.findOne({ _id: id, userId });
    
    if (!trade) {
      return res.status(404).json({ message: "Trade not found" });
    }
    
    trade.priceHistory.push({ 
      timestamp: timestamp ? new Date(timestamp) : new Date(), 
      price 
    });
    
    await trade.save();
    
    res.json({ data: trade });
  } catch (error) {
    console.error("Failed to record price:", error);
    res.status(500).json({ message: "Failed to record price" });
  }
};
