import mongoose, { Schema, Document } from "mongoose";

export interface IInvestment extends Document {
  userId: mongoose.Types.ObjectId;
  symbol: string;
  companyName: string;
  assetClass: 'Indian Equity' | 'US Equity' | 'Forex' | 'Crypto' | 'Commodity' | 'Mutual Fund';
  tradeType: 'Delivery' | 'Intraday' | 'SIP';
  shares: number;
  averagePrice: number;
  dateInvested: Date;
  sipFrequency?: 'Daily' | 'Weekly' | '15 Days' | 'Monthly' | 'Quarterly';
  sipAmount?: number;
  isAmcSip?: boolean;
  sipStartDate?: Date;
  sipStatus?: 'Active' | 'Completed' | 'Paused';
  sipInstallmentsPaid?: number;
  manualCurrentPrice?: number;
}

const investmentSchema = new Schema<IInvestment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    symbol: { type: String, required: true, uppercase: true },
    companyName: { type: String, required: true },
    assetClass: { type: String, enum: ['Indian Equity', 'US Equity', 'Forex', 'Crypto', 'Commodity', 'Mutual Fund'], default: 'Indian Equity' },
    tradeType: { type: String, enum: ['Delivery', 'Intraday', 'SIP'], default: 'Delivery' },
    shares: { type: Number, required: true, min: 0 },
    averagePrice: { type: Number, required: true, min: 0 },
    dateInvested: { type: Date, default: Date.now },
    sipFrequency: { type: String, enum: ['Daily', 'Weekly', '15 Days', 'Monthly', 'Quarterly'] },
    sipAmount: { type: Number, min: 0 },
    isAmcSip: { type: Boolean, default: false },
    sipStartDate: { type: Date },
    sipStatus: { type: String, enum: ['Active', 'Completed', 'Paused'], default: 'Active' },
    sipInstallmentsPaid: { type: Number, min: 0, default: 0 },
    manualCurrentPrice: { type: Number, min: 0 }
  },
  { timestamps: true }
);

export const Investment = mongoose.model<IInvestment>("Investment", investmentSchema);
