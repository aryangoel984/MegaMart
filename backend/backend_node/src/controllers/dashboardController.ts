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
    // Python expects a list of categories (strings), e.g. ["Electronics", "Clothing"]
    // We extracted objects before, which caused the bug.
    // @ts-ignore
    const pastPurchases = orders.flatMap(order =>
      // @ts-ignore
      order.items.map(item => item.product.category)
    );

    // 3. Get Recommendation Embedding from Python
    const vector = await getRecommendations(userId, pastPurchases);

    let recommendedProducts: any[] = [];

    if (vector) {
      // SCENARIO 1: Personalized (Vector Search)
      const vectorString = JSON.stringify(vector);
      // @ts-ignore
      recommendedProducts = await prisma.$queryRaw`
        SELECT id, name, description, price, "imageUrl", category,
        1 - ("descriptionVector" <=> ${vectorString}::vector) as similarity
        FROM "Product"
        ORDER BY similarity DESC
        LIMIT 3;
      `;
    } else {
      // SCENARIO 2: Cold Start (Fallback to real DB "Trending" / Latest)
      recommendedProducts = await prisma.product.findMany({
        take: 3,
        orderBy: { id: 'desc' } // Just get the latest ones for now
      });
    }

    // 4. Return Final Dashboard Data
    res.json({
      message: `Welcome back!`,
      pastOrdersCount: orders.length,
      aiRecommendations: recommendedProducts.map((p: any) => ({
        id: p.id,
        name: p.name,
        imageUrl: p.imageUrl, // <-- FIXED: Attached the image
        // Add a helpful reason tag
        reason: vector ? 'Based on your history' : 'Popular right now'
      }))
    });

  } catch (error) {
    res.status(500).json({ message: 'Dashboard failed', error });
  }
};