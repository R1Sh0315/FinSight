import { Request, Response } from "express";
import {
  getCompanies,
  getCompanyBySymbol,
  createCompany,
  getTopCompanies,
  getCompanyFinancials
} from "./company.service.js";

export const getCompaniesController = async (
  req: Request,
  res: Response
) => {
  try {
    const companies = await getCompanies();

    res.json({
      data: companies
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch companies"
    });
  }
};

export const getCompanyController = async (
  req: Request<{ symbol: string }>,
  res: Response
) => {
  try {
    const { symbol } = req.params;

    const company = await getCompanyBySymbol(symbol);

    if (!company) {
      return res.status(404).json({
        message: "Company not found"
      });
    }

    res.json({
      data: company
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch company"
    });
  }
};

export const createCompanyController = async (
  req: Request,
  res: Response
) => {
  try {
    const company = await createCompany(req.body);

    res.status(201).json({
      data: company
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create company"
    });
  }
};

export const getTopCompaniesController = async (
  req: Request,
  res: Response
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const companies = await getTopCompanies(limit);

    res.json({
      data: companies
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch top companies"
    });
  }
};

export const getCompanyFinancialsController = async (
  req: Request<{ symbol: string }>,
  res: Response
) => {
  try {
    const { symbol } = req.params;

    const company = await getCompanyBySymbol(symbol);
    
    if (!company) {
      return res.status(404).json({
        message: "Company not found"
      });
    }

    const financials = await getCompanyFinancials(symbol);

    res.json({
      data: financials
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch company financials"
    });
  }
};