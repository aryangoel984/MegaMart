import { Router } from 'express';
import { handleCheckout } from '../controllers/checkoutController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', authenticateToken, handleCheckout);

export default router;
