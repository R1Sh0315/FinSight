import { Company } from "./company.model.js";

export const getCompanies = async () => {
  return Company.find().sort({ marketCap: -1 });
};

export const getCompanyBySymbol = async (symbol: string) => {
  return Company.findOne({
    symbol: symbol.toUpperCase()
  });
};

export const createCompany = async (data: {
  symbol: string;
  name: string;
  exchange: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  currentPrice?: number;
}) => {
  return Company.create(data);
};

export const getTopCompanies = async (limit: number = 10) => {
  return Company.find().sort({ marketCap: -1 }).limit(limit);
};

import yahooFinanceDefault from 'yahoo-finance2';
const yahooFinance = new (yahooFinanceDefault as any)();

export const getCompanyFinancials = async (symbol: string) => {
  const company = await getCompanyBySymbol(symbol);
  if (!company) return null;

  try {
    const lookupSymbol = symbol.includes('.') ? symbol : `${symbol}.NS`;
    const quoteSummary = await yahooFinance.quoteSummary(lookupSymbol, { 
      modules: ['financialData', 'defaultKeyStatistics'] 
    });

    const finData = quoteSummary.financialData || {};
    const keyStats = quoteSummary.defaultKeyStatistics || {};

    return {
      symbol: symbol.toUpperCase(),
      name: company.name,
      exchange: company.exchange,
      revenue: finData.totalRevenue || null,
      netIncome: keyStats.netIncomeToCommon || null,
      peRatio: keyStats.forwardPE || keyStats.trailingPE || null,
      debtToEquity: finData.debtToEquity || null,
      message: "Success"
    };
  } catch (error) {
    console.error(`Failed to fetch financial data for ${symbol}:`, error);
    return {
      symbol: symbol.toUpperCase(),
      name: company.name,
      exchange: company.exchange,
      revenue: null,
      netIncome: null,
      peRatio: null,
      debtToEquity: null,
      message: "Failed to fetch real-time financial data"
    };
  }
};