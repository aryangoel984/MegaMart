import { Request, Response } from 'express';
import prisma from '../config/db';
import { getProductDetail } from '../data/productDetails';

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products' });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid product ID' });
      return;
    }

    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Per-product specs/supplier/reviews — see src/data/productDetails.ts.
    // This used to be generated per *category*, so every item in "Clothing"
    // got identical denim specs and every "Footwear" item got identical
    // Adidas Boost/Primeknit specs, regardless of what the product actually
    // was (a jacket showing "Classic Button Fly", an Air Jordan showing
    // "Continental Rubber Grip Outsole", etc).
    const { specifications, supplier, reviews, rating } = getProductDetail(product.name);

    res.json({
      ...product,
      specifications,
      supplier,
      reviews,
      rating
    });

  } catch (error) {
    res.status(500).json({ message: 'Error fetching product detail', error });
  }
};