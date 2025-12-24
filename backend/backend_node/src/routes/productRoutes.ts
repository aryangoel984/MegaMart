import { Router } from 'express';
import { getAllProducts } from '../controllers/productController';

const router = Router();

// Public Route (Anyone can view products)
router.get('/', getAllProducts);

export default router;