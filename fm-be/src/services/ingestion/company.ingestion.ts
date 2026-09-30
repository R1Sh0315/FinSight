// company.ingestion.ts

import { Company } from "../../modules/company/company.model.js";
import { getCompaniesFromScreener } from "../screener/screener.service.js";

export const syncCompanies = async () => {
  const companies = await getCompaniesFromScreener();

  for (const company of companies) {
    await Company.updateOne(
      {
        symbol: company.symbol
      },
      {
        $set: company
      },
      {
        upsert: true
      }
    );
  }

  return {
    count: companies.length
  };
};