import { Router } from 'express';
import { getAllProducts, getProductById } from '../controllers/productController';

const router = Router();

// Public Route (Anyone can view products)
router.get('/', getAllProducts);
router.get('/:id', getProductById);

export default router;