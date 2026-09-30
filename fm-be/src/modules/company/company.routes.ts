import { Router } from "express";

import {
  getCompaniesController,
  getCompanyController,
  createCompanyController,
  getTopCompaniesController,
  getCompanyFinancialsController
} from "./company.controller.js";

const router = Router({ caseSensitive: true });

router.get("/", getCompaniesController);

// /top must come before /:symbol
router.get("/top", getTopCompaniesController);

router.get("/:symbol", getCompanyController);

router.get("/:symbol/financials", getCompanyFinancialsController);

router.post("/", createCompanyController);

export default router;