import { Request, Response } from 'express';
import prisma from '../config/db';
import { generateEmbedding } from '../services/aiService';

export const searchProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;
    if (!query) {
      res.status(400).json({ message: "Query required" });
      return;
    }

    // 1. Convert User Search -> Vector (Hugging Face all-MiniLM-L6-v2)
    const queryVector = await generateEmbedding(query);

    if (queryVector.length === 0) {
      console.warn(`[SEARCH] Embedding unavailable for "${query}" — using text fallback`);
      // Fallback: plain text search if embedding API is down / rate-limited
      const products = await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
      });
      console.log(`[SEARCH] Text fallback returned ${products.length} products`);
      res.json(products.map((p) => ({ ...p, similarity: 0.5 })));
      return;
    }

    // 2. Cosine similarity search in Postgres (pgvector)
    console.log(`[SEARCH] Valid ${queryVector.length}-dim HF vector received — running pgvector cosine search`);
    const vectorString = JSON.stringify(queryVector);

    const products: any[] = await prisma.$queryRaw`
      SELECT id, name, description, price, "imageUrl", category,
      1 - ("descriptionVector" <=> ${vectorString}::vector) as similarity
      FROM "Product"
      ORDER BY similarity DESC
      LIMIT 5;
    `;

    console.log(`[SEARCH] Semantic search returned ${products.length} products`);
    products.forEach((product, index) => {
      console.log(
        `  ${index + 1}. ${product.name} — similarity ${Number(product.similarity).toFixed(4)}`
      );
    });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Search failed" });
  }
};
