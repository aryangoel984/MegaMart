import { Request, Response } from 'express';
import prisma from '../config/db';

// Define a custom interface for the request since we added 'user' in middleware
interface AuthRequest extends Request {
  user?: { userId: number };
}

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId; // Got this from the Middleware!
    const { items } = req.body; // Expect: [{ productId: 1, quantity: 2 }]

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!items || items.length === 0) {
      res.status(400).json({ message: 'Cart is empty' });
      return;
    }

    // 1. Fetch Products to calculate REAL total price (Don't trust client price)
    // We get the IDs from the request
    const productIds = items.map((item: any) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    let totalAmount = 0;
    
    // Validate stock and calculate total
    for (const item of items) {
        // @ts-ignore
      const product = products.find((p) => p.id === item.productId);
      
      if (!product) {
        res.status(404).json({ message: `Product ${item.productId} not found` });
        return;
      }
      if (product.stock < item.quantity) {
        res.status(400).json({ message: `Not enough stock for ${product.name}` });
        return;
      }
      // Calculate price using DB value * quantity
      totalAmount += Number(product.price) * item.quantity;
    }

    // 2. THE TRANSACTION (Interview Critical: ACID Property)
    // All these operations happen together. If stock update fails, Order is not created.
    const result = await prisma.$transaction(async (tx) => {
      
      // A. Create the Order
      // @ts-ignore
      const order = await tx.order.create({
        data: {
          userId,
          totalAmount,
          status: 'COMPLETED',
          // Create OrderItems automatically using 'create' relation
          items: {
            create: items.map((item: any) => {
                // @ts-ignore
              const product = products.find((p) => p.id === item.productId)!;
              return {
                productId: item.productId,
                quantity: item.quantity,
                price: product.price // Snapshot the price at time of purchase
              };
            }),
          },
        },
        include: { items: true } // Return the items in response
      });

      // B. Update Stock for each product
      for (const item of items) {
        // @ts-ignore
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return order;
    });

    res.status(201).json({ message: 'Order placed successfully', order: result });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Transaction failed', error });
  }
};