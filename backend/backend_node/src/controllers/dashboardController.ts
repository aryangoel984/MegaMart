// src/controllers/dashboardController.ts
import { Request, Response } from 'express';
import prisma from '../config/db';
import { getRecommendations } from '../services/aiService';

// Define Interface for Request with User
interface AuthRequest extends Request {
  user?: { userId: number };
}

export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // 1. Fetch User's Past Orders (Complex Query)
    // We need the products inside the orders
    const orders = await prisma.order.findMany({
      where: { userId },
      include: { 
        items: {
          include: { product: true } 
        } 
      }
    });

    // 2. Format Data for Python
    // Extract just the product details from the nested structure
    // @ts-ignore
    const pastPurchases = orders.flatMap(order => 
        // @ts-ignore
      order.items.map(item => ({
        id: item.productId,
        category: item.product.category
      }))
    );

    // 3. Call the Python AI Service
    const recommendations = await getRecommendations(userId, pastPurchases);

    // 4. Return Final Dashboard Data
    res.json({
      message: `Welcome back!`,
      pastOrdersCount: orders.length,
      aiRecommendations: recommendations
    });

  } catch (error) {
    res.status(500).json({ message: 'Dashboard failed', error });
  }
};