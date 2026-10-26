import { Request, Response } from 'express';
import { searchProducts } from '../services/searchService';

export const searchProductsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;
    if (!query) {
      res.status(400).json({ message: 'Query required' });
      return;
    }

    const products = await searchProducts(query, 5);
    console.log(`[SEARCH] "${query}" returned ${products.length} product(s)`);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Search failed' });
  }
};
