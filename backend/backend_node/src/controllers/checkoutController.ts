import { Request, Response } from 'express';
import { z } from 'zod';
import { checkout } from '../services/checkoutService';
import { CartError } from '../services/cartService';

interface AuthRequest extends Request {
  user?: { userId: number };
}

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().min(1),
      })
    )
    .optional(),
});

export const handleCheckout = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = checkoutSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(422).json({ message: 'Invalid checkout payload', issues: parsed.error.issues });
    return;
  }

  const idempotencyKey = req.get('Idempotency-Key') || undefined;

  try {
    const result = await checkout(req.user!.userId, parsed.data.items, idempotencyKey);
    res.status(201).json({ message: 'Order placed successfully', order: result });
  } catch (error) {
    if (error instanceof CartError) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    console.error('⚠️ Checkout error:', error);
    res.status(500).json({ message: 'Checkout failed' });
  }
};
