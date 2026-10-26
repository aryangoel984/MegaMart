import { Router } from 'express';
import { getUserOrders, getOrderById } from '../controllers/orderController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// Order placement now happens through POST /api/checkout (see checkoutRoutes.ts),
// which snapshots prices and decrements stock atomically from the cart.
router.get('/', authenticateToken, getUserOrders);
router.get('/:id', authenticateToken, getOrderById);

export default router;
