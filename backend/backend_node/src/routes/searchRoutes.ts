import { Router } from 'express';
import { searchProducts } from '../controllers/searchController';

const router = Router();
router.get('/', searchProducts);

export default router;