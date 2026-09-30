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

// Ensure database is connected before handling requests
app.use(async (req, res, next) => {
  await connectDatabase();
  next();
});

app.get("/", (req, res) => {
  res.json({
    message: "Financial Modeling API is running"
  });
});

import { runSipEngine } from "./services/sip/sip.engine.js";

app.get("/api/cron/sip", async (req, res) => {
  try {
    // Vercel Cron requests can be authenticated by checking an env var
    // if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).end();
    
    await runSipEngine();
    res.json({ success: true, message: "SIP Engine executed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: "SIP Engine failed" });
  }
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/companies", companyRoutes);
app.use("/api/v1/forecast", forecastRoutes);
app.use("/api/v1/investments", investmentRoutes);
app.use("/api/v1/market", marketRoutes);

const PORT = process.env.PORT || 5000;

// Only start the server if not running on Vercel
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  import('./services/sip/sip.engine.js').then(({ startSipEngine }) => {
    startSipEngine();
  });
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;