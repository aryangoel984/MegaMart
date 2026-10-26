import { Router } from 'express';
import { searchProductsHandler } from '../controllers/searchController';

const router = Router();
router.get('/', searchProductsHandler);

export default router;