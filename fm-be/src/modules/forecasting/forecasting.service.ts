import axios from "axios";
import { getCompanyBySymbol } from "../company/company.service.js";

export const generateForecast = async (symbol: string) => {
  const company = await getCompanyBySymbol(symbol);
  if (!company) throw new Error("Company not found");

  if (!process.env.AI_API_KEY) {
    throw new Error("AI_API_KEY is not configured. Please set it in your .env file to enable AI forecasting.");
  }

  const prompt = `
    You are a senior financial analyst. Provide a short growth forecast and assessment (under 150 words) for the following company based on this data:

    Company: ${company.name} (${company.symbol})
    Exchange: ${company.exchange}
    Market Cap: ₹${company.marketCap} Cr
    Current Price: ₹${company.currentPrice}

    Analyze this company's growth potential, competitive position, and investment suitability.
    Is this company worth investing in? What are the key growth drivers?
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
