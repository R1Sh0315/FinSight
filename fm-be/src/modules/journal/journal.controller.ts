import { Request, Response } from 'express';
import { JournalEntry } from './journal.model.js';

export const getJournalEntries = async (req: Request, res: Response) => {
  try {
    const entries = await JournalEntry.find({ user: (req as any).userId }).sort({ date: -1 });
    res.status(200).json({ success: true, data: entries });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addJournalEntry = async (req: Request, res: Response) => {
  try {
    const newEntry = new JournalEntry({
      ...req.body,
      user: (req as any).userId
    });
    await newEntry.save();
    res.status(201).json({ success: true, data: newEntry });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteJournalEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await JournalEntry.findOneAndDelete({ _id: id, user: (req as any).userId });
    res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
