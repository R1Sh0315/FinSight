import { Request, Response } from "express";
import { generateForecast } from "./forecasting.service.js";

export const getForecastController = async (
  req: Request<{ symbol: string }>,
  res: Response
) => {
  try {
    const { symbol } = req.params;
    const forecast = await generateForecast(symbol);

    res.json({
      data: {
        symbol,
        forecast
      }
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Failed to generate forecast"
    });
  }
};
