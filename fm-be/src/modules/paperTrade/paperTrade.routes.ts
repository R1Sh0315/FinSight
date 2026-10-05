import { Router } from "express";
import { 
  getPaperTrades, 
  getPaperTradeById, 
  createPaperTrade, 
  exitPaperTrade,
  recordDailyPrice,
  syncPrices
} from "./paperTrade.controller.js";
import { protect } from "../../utils/auth.middleware.js";

const router = Router();

router.use(protect as any);

router.get("/", getPaperTrades);
router.post("/", createPaperTrade);
router.post("/sync", syncPrices);
router.get("/:id", getPaperTradeById);
router.patch("/:id/exit", exitPaperTrade);
router.post("/:id/price", recordDailyPrice);

export default router;
