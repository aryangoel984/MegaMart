import { Router } from 'express';
import { getDashboard } from '../controllers/dashboardController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// Protected Route
router.get('/', authenticateToken, getDashboard);

export default router;