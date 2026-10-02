import { Router } from 'express';
import {
  getForexRatesController,
  getCommonForexPairsController,
  getEconomicCalendarController,
  getForexNewsController
} from './forex.controller.js';

const router = Router();

router.get('/rates', getForexRatesController);
router.get('/common', getCommonForexPairsController);
router.get('/calendar', getEconomicCalendarController);
router.get('/news', getForexNewsController);

export default router;
