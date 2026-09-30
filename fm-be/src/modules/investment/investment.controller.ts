import { Response } from "express";
import { AuthRequest } from "../../utils/auth.middleware.js";
import { Investment } from "./investment.model.js";

export const getInvestments = async (req: AuthRequest, res: Response) => {
  try {
    const investments = await Investment.find({ userId: req.userId }).sort({ dateInvested: -1 });
    res.json({ data: investments });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch investments" });
  }
};

export const addInvestment = async (req: AuthRequest, res: Response) => {
  try {
    const { symbol, companyName, assetClass, tradeType, shares, averagePrice, dateInvested, sipFrequency, sipAmount, isAmcSip, sipStartDate, sipStatus, sipInstallmentsPaid } = req.body;
    
    // Check if the user already has this investment
    const existing = await Investment.findOne({ userId: req.userId, symbol: symbol.toUpperCase() });

    if (existing) {
      // Averaging Logic
      const oldShares = existing.shares;
      const oldPrice = existing.averagePrice;
      const newShares = Number(shares);
      const newPrice = Number(averagePrice);

      const totalShares = oldShares + newShares;
      const newAvgPrice = ((oldShares * oldPrice) + (newShares * newPrice)) / totalShares;

      existing.shares = totalShares;
      existing.averagePrice = newAvgPrice;
      if (assetClass) existing.assetClass = assetClass;
      if (tradeType) existing.tradeType = tradeType;
      if (sipFrequency) existing.sipFrequency = sipFrequency;
      if (sipAmount) existing.sipAmount = sipAmount;
      if (isAmcSip !== undefined) existing.isAmcSip = isAmcSip;
      if (sipStartDate) existing.sipStartDate = sipStartDate;
      if (sipStatus) existing.sipStatus = sipStatus;
      if (sipInstallmentsPaid !== undefined) existing.sipInstallmentsPaid = sipInstallmentsPaid;
      
      await existing.save();
      return res.status(200).json({ data: existing });
    }

    const investment = await Investment.create({
      userId: req.userId,
      symbol: symbol.toUpperCase(),
      companyName,
      assetClass: assetClass || 'Indian Equity',
      tradeType: tradeType || 'Delivery',
      shares: Number(shares),
      averagePrice: Number(averagePrice),
      dateInvested: dateInvested || new Date(),
      sipFrequency: sipFrequency || undefined,
      sipAmount: sipAmount ? Number(sipAmount) : undefined,
      isAmcSip: isAmcSip || false,
      sipStartDate: sipStartDate || new Date(),
      sipStatus: sipStatus || 'Active',
      sipInstallmentsPaid: sipInstallmentsPaid ? Number(sipInstallmentsPaid) : 0
    });

    res.status(201).json({ data: investment });
  } catch (error) {
    res.status(500).json({ message: "Failed to add investment" });
  }
};

export const updateInvestment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { shares, averagePrice, tradeType, assetClass, sipFrequency, sipAmount, isAmcSip, sipStartDate, sipStatus, sipInstallmentsPaid, symbol, companyName, manualCurrentPrice } = req.body;
    
    const updateData: any = { shares: Number(shares), averagePrice: Number(averagePrice) };
    if (symbol) updateData.symbol = symbol.toUpperCase();
    if (companyName) updateData.companyName = companyName;
    if (tradeType) updateData.tradeType = tradeType;
    if (assetClass) updateData.assetClass = assetClass;
    if (sipFrequency !== undefined) updateData.sipFrequency = sipFrequency;
    if (sipAmount !== undefined) updateData.sipAmount = sipAmount ? Number(sipAmount) : undefined;
    if (isAmcSip !== undefined) updateData.isAmcSip = isAmcSip;
    if (sipStartDate !== undefined) updateData.sipStartDate = sipStartDate;
    if (sipStatus !== undefined) updateData.sipStatus = sipStatus;
    if (sipInstallmentsPaid !== undefined) updateData.sipInstallmentsPaid = Number(sipInstallmentsPaid);
    if (manualCurrentPrice !== undefined) updateData.manualCurrentPrice = Number(manualCurrentPrice);

    const investment = await Investment.findOneAndUpdate(
      { _id: id, userId: req.userId },
      updateData,
      { new: true }
    );

    if (!investment) {
      return res.status(404).json({ message: "Investment not found" });
    }

    res.json({ data: investment });
  } catch (error) {
    res.status(500).json({ message: "Failed to update investment" });
  }
};

export const deleteInvestment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await Investment.findOneAndDelete({ _id: id, userId: req.userId });
    res.json({ message: "Investment removed" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete investment" });
  }
};
