import { Router } from 'express';
import { register, login } from '../controllers/authController';

const router = Router();

// Define the endpoints
router.post('/register', register);
router.post('/login', login);

export default router;