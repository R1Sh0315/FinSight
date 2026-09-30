import { Router } from "express";
import { getLivePrices, getIndianNews, analyzeNewsWithAI, getAnnualReport, analyzeCompanyWithAI, searchSymbols } from "./market.controller.js";

const router = Router();

router.get("/prices", getLivePrices);
router.get("/news", getIndianNews);
router.get("/search", searchSymbols);
router.post("/analyze-news", analyzeNewsWithAI);
router.post("/analyze-company", analyzeCompanyWithAI);
router.get("/annual-report/:symbol", getAnnualReport);

export default router;
