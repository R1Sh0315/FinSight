import mongoose, { Schema, Document } from "mongoose";

export interface ICompany extends Document {
  symbol: string;
  name: string;
  exchange: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  currentPrice?: number;
}

const companySchema = new Schema<ICompany>(
  {
    symbol: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    exchange: {
      type: String,
      required: true
    },

    sector: String,

    industry: String,

    marketCap: Number,

    currentPrice: Number
  },
  {
    timestamps: true
  }
);

export const Company = mongoose.model<ICompany>(
  "Company",
  companySchema
);