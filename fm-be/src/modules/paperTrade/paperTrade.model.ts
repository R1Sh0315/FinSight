import mongoose, { Schema, Document } from "mongoose";

export interface IPriceSnapshot {
  timestamp: Date;
  price: number;
}

export interface IPaperTrade extends Document {
  userId: mongoose.Types.ObjectId;
  
  // Contract Details
  underlying: string;
  optionType: 'CE' | 'PE';
  strikePrice: number;
  expiryDate: Date;
  
  // Trade Entry
  entryPrice: number;
  entryDateTime: Date;
  lotSize: number;
  numberOfLots: number;
  totalQuantity: number;
  
  // Trade Status
  status: 'ACTIVE' | 'EXITED' | 'EXPIRED';
  
  // Trade Exit
  exitPrice?: number;
  exitDateTime?: Date;
  exitReason?: string;
  
  // Tracking
  priceHistory: IPriceSnapshot[];
  notes?: string;
}

const priceSnapshotSchema = new Schema<IPriceSnapshot>({
  timestamp: { type: Date, required: true },
  price: { type: Number, required: true }
}, { _id: false });

const paperTradeSchema = new Schema<IPaperTrade>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    
    underlying: { type: String, required: true, uppercase: true },
    optionType: { type: String, enum: ['CE', 'PE'], required: true },
    strikePrice: { type: Number, required: true, min: 0 },
    expiryDate: { type: Date, required: true },
    
    entryPrice: { type: Number, required: true, min: 0 },
    entryDateTime: { type: Date, default: Date.now },
    lotSize: { type: Number, required: true, min: 1 },
    numberOfLots: { type: Number, required: true, min: 1 },
    totalQuantity: { type: Number, required: true, min: 1 },
    
    status: { type: String, enum: ['ACTIVE', 'EXITED', 'EXPIRED'], default: 'ACTIVE' },
    
    exitPrice: { type: Number, min: 0 },
    exitDateTime: { type: Date },
    exitReason: { type: String },
    
    priceHistory: { type: [priceSnapshotSchema], default: [] },
    notes: { type: String }
  },
  { timestamps: true }
);

export const PaperTrade = mongoose.model<IPaperTrade>("PaperTrade", paperTradeSchema);
