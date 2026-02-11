import { Router } from 'express';
import { createOrder, getUserOrders } from '../controllers/orderController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// PROTECTED ROUTE: User must be logged in to order
// Syntax: router.post(path, middleware, controller)
router.post('/', authenticateToken, createOrder);

// GET /api/orders
router.get('/', authenticateToken, getUserOrders);

export default router;