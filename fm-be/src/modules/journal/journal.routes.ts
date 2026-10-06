import { Router } from 'express';
import { getJournalEntries, addJournalEntry, deleteJournalEntry } from './journal.controller.js';
import { protect } from '../../utils/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/', getJournalEntries);
router.post('/', addJournalEntry);
router.delete('/:id', deleteJournalEntry);

export default router;
