import { Router } from 'express';
import { register, login, createGuest } from '../controllers/authController';

const router = Router();

// Define the endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/guest', createGuest);

export default router;
