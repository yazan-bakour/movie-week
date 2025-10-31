import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { asyncHandler } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/apiResponse';

const router = Router();
const db = getDb();

// Get all winners
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const winners = db.getAllWinners();
  sendSuccess(res, winners, { count: winners.length });
}));

export default router;
