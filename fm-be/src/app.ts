import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { connectDatabase } from "./config/database.js";
import companyRoutes from "./modules/company/company.routes.js";
import forecastRoutes from "./modules/forecasting/forecasting.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import investmentRoutes from "./modules/investment/investment.routes.js";
import marketRoutes from "./modules/market/market.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Financial Modeling API is running"
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/companies", companyRoutes);
app.use("/api/v1/forecast", forecastRoutes);
app.use("/api/v1/investments", investmentRoutes);
app.use("/api/v1/market", marketRoutes);

const PORT = process.env.PORT || 5000;

import { startSipEngine } from "./services/sip/sip.engine.js";

const startServer = async () => {
  await connectDatabase();

  startSipEngine();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();