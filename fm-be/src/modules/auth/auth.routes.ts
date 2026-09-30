import { Router } from "express";
import { googleLogin } from "./auth.controller.js";
import { getWatchlist, addToWatchlist, removeFromWatchlist } from "./watchlist.controller.js";
import { protect } from "../../utils/auth.middleware.js";

const router = Router();

router.post("/google", googleLogin);

// Watchlist routes
router.get("/watchlist", protect, getWatchlist);
router.post("/watchlist", protect, addToWatchlist);
router.delete("/watchlist/:symbol", protect, removeFromWatchlist);

export default router;
