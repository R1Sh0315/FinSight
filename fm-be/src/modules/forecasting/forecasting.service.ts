import axios from "axios";
import { getCompanyFinancials, getCompanyBySymbol } from "../company/company.service.js";

export const generateForecast = async (symbol: string) => {
  const company = await getCompanyBySymbol(symbol);
  if (!company) throw new Error("Company not found");
  
  const financials = await getCompanyFinancials(symbol);

  if (!process.env.AI_API_KEY || process.env.AI_API_KEY === "mock-key") {
    return `**Mock Forecast for ${company.name} (${symbol})**\n\nBased on the P/E ratio of ${financials?.peRatio} and recent revenue growth, this company is positioned for moderate growth. \n\n*Note: Add AI_API_KEY to your .env file to see real AI predictions.*`;
  }

  const prompt = `
    You are a senior financial analyst. Provide a short growth forecast and assessment (under 150 words) for the following company based on this data:
    
    Company: ${company.name} (${company.symbol})
    Market Cap: ₹${company.marketCap} Cr
    Current Price: ₹${company.currentPrice}
    
    Financials:
    Revenue: ₹${financials?.revenue}
    Net Income: ₹${financials?.netIncome}
    P/E Ratio: ${financials?.peRatio}
    Debt to Equity: ${financials?.debtToEquity}
    
    Is this company undervalued? What is its future growth potential?
  `;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "openai/gpt-oss-safeguard-20b",
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.AI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    return response.data.choices[0].message.content;
  } catch (error: any) {
    console.error("Groq AI Error:", error?.response?.data || error.message);
    throw new Error("Failed to generate AI forecast.");
  }
};
