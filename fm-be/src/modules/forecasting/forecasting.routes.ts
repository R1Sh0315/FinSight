import { Router } from "express";
import { getForecastController } from "./forecasting.controller.js";

const router = Router();

router.get("/:symbol", getForecastController);

export default router;
