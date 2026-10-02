import { Request, Response } from 'express';
import {
  getForexRates,
  getCommonForexPairs,
  getEconomicCalendar,
  getForexNews,
  COMMON_FOREX_PAIRS
} from '../../services/forex/forex.service.js';

export const getForexRatesController = async (req: Request, res: Response) => {
  try {
    const { pairs } = req.query;

    if (!pairs || typeof pairs !== 'string') {
      // Return common pairs if none specified
      const rates = await getCommonForexPairs();
      return res.json({ data: rates });
    }

    const pairList = pairs.split(',').map((p: string) => p.trim().toUpperCase());
    const rates = await getForexRates(pairList);

    res.json({ data: rates });
  } catch (error: any) {
    console.error('Failed to fetch forex rates:', error);
    res.status(500).json({ message: 'Failed to fetch forex rates', error: error.message });
  }
};

export const getCommonForexPairsController = async (req: Request, res: Response) => {
  try {
    const rates = await getCommonForexPairs();
    res.json({ data: rates, commonPairs: COMMON_FOREX_PAIRS });
  } catch (error: any) {
    console.error('Failed to fetch common forex pairs:', error);
    res.status(500).json({ message: 'Failed to fetch common forex pairs' });
  }
};

export const getEconomicCalendarController = async (req: Request, res: Response) => {
  try {
    const daysAhead = req.query.days ? parseInt(req.query.days as string, 10) : 7;
    const events = await getEconomicCalendar(daysAhead);

    res.json({
      data: events,
      message: 'Economic calendar integration in progress. Use TradingView widget for live calendar.'
    });
  } catch (error: any) {
    console.error('Failed to fetch economic calendar:', error);
    res.status(500).json({ message: 'Failed to fetch economic calendar' });
  }
};

export const getForexNewsController = async (req: Request, res: Response) => {
  try {
    const news = await getForexNews();
    res.json({ data: news });
  } catch (error: any) {
    console.error('Failed to fetch forex news:', error);
    res.status(500).json({ message: 'Failed to fetch forex news' });
  }
};
