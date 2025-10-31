import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();
const db = getDb();

// Get all winners
router.get('/', (req: Request, res: Response) => {
  try {
    const winners = db.getAllWinners();
    res.json({
      success: true,
      count: winners.length,
      data: winners
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
