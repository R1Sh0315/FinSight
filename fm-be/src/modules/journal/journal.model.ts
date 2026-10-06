import mongoose, { Schema, Document } from 'mongoose';

export interface IJournalEntry extends Document {
  user: mongoose.Types.ObjectId;
  date: Date;
  symbol: string;
  type: 'LONG' | 'SHORT';
  currency: 'INR' | 'USD';
  multiplier: number;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  setup: string;
  emotion: string;
  notes: string;
}

const JournalEntrySchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  symbol: { type: String, required: true },
  type: { type: String, enum: ['LONG', 'SHORT'], required: true },
  currency: { type: String, enum: ['INR', 'USD'], default: 'INR' },
  multiplier: { type: Number, default: 1 },
  entryPrice: { type: Number, required: true },
  exitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
  pnl: { type: Number, required: true },
  setup: { type: String },
  emotion: { type: String },
  notes: { type: String }
}, { timestamps: true });

export const JournalEntry = mongoose.model<IJournalEntry>('JournalEntry', JournalEntrySchema);
