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
  // TODO: Implement real financial data integration
  // Options:
  // 1. Yahoo Finance API (already used for prices) - has some financial metrics
  // 2. Finnhub API - comprehensive financial data for Indian stocks
  // 3. Screener.in scraping - extract from company pages
  // 4. PDF parsing of annual reports - extract from company annual reports
  // For now, return only the company's basic info without mock financial data
  const company = await getCompanyBySymbol(symbol);
  if (!company) return null;

  return {
    symbol: symbol.toUpperCase(),
    name: company.name,
    exchange: company.exchange,
    // Real financial metrics should be fetched from external API
    message: "Financial data integration in progress"
  };
};