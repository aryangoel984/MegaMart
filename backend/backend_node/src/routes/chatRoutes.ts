import { Router } from 'express';
import { handleChat } from '../controllers/chatController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// PROTECTED ROUTE: User must be logged in to chat with the concierge
router.post('/', authenticateToken, handleChat);

export default router;
