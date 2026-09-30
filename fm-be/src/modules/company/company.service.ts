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

export const getCompanyFinancials = async (symbol: string) => {
  // Mock data for now until financial module is fully implemented
  return {
    symbol: symbol.toUpperCase(),
    year: new Date().getFullYear(),
    revenue: 1000000000,
    netIncome: 150000000,
    eps: 4.5,
    peRatio: 22.5,
    operatingMargin: 0.18,
    debtToEquity: 0.5
  };
};