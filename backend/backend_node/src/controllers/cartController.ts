import { Request, Response } from 'express';
import { z } from 'zod';
import * as cartService from '../services/cartService';
import { CartError } from '../services/cartService';

interface AuthRequest extends Request {
  user?: { userId: number };
}

const addItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).default(1),
});

const updateItemSchema = z.object({
  quantity: z.number().int().min(1),
});

const handleCartError = (res: Response, error: unknown) => {
  if (error instanceof CartError) {
    res.status(error.status).json({ message: error.message });
    return;
  }
  console.error('⚠️ Cart error:', error);
  res.status(500).json({ message: 'Cart operation failed' });
};

export const getCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cart = await cartService.getCart(req.user!.userId);
    res.json(cart);
  } catch (error) {
    handleCartError(res, error);
  }
};

export const addItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = addItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ message: 'productId is required; quantity must be a positive integer', issues: parsed.error.issues });
    return;
  }
  try {
    const cart = await cartService.addItem(req.user!.userId, parsed.data.productId, parsed.data.quantity);
    res.status(201).json(cart);
  } catch (error) {
    handleCartError(res, error);
  }
};

export const updateItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const productId = parseInt(req.params.productId, 10);
  if (isNaN(productId)) {
    res.status(400).json({ message: 'Invalid product ID' });
    return;
  }
  const parsed = updateItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ message: 'quantity must be a positive integer', issues: parsed.error.issues });
    return;
  }
  try {
    const cart = await cartService.updateItem(req.user!.userId, productId, parsed.data.quantity);
    res.json(cart);
  } catch (error) {
    handleCartError(res, error);
  }
};

export const removeItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const productId = parseInt(req.params.productId, 10);
  if (isNaN(productId)) {
    res.status(400).json({ message: 'Invalid product ID' });
    return;
  }
  try {
    const cart = await cartService.removeItem(req.user!.userId, productId);
    res.json(cart);
  } catch (error) {
    handleCartError(res, error);
  }
};

export const clearCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cart = await cartService.clearCart(req.user!.userId);
    res.json(cart);
  } catch (error) {
    handleCartError(res, error);
  }
};
