import { Router } from "express";
import { getInvestments, addInvestment, updateInvestment, deleteInvestment } from "./investment.controller.js";
import { protect } from "../../utils/auth.middleware.js";

const router = Router();

// Protect all investment routes
router.use(protect);

router.route("/")
  .get(getInvestments)
  .post(addInvestment);

router.route("/:id")
  .put(updateInvestment)
  .delete(deleteInvestment);

export default router;
