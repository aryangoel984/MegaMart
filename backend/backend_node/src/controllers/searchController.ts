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

    // 1. Convert User Search -> Vector (using Python)
    const queryVector = await generateEmbedding(query);
    if (queryVector.length === 0) {
      res.status(500).json({ message: "AI Service Failed" });
      return;
    }

    // 2. Perform Cosine Similarity Search in Postgres
    // We cast the array to a vector string '[...]'
    const vectorString = JSON.stringify(queryVector);

    // This is the Magic SQL: "ORDER BY distance"
    const products = await prisma.$queryRaw`
      SELECT id, name, description, price, "imageUrl", category,
      1 - ("descriptionVector" <=> ${vectorString}::vector) as similarity
      FROM "Product"
      ORDER BY similarity DESC
      LIMIT 5;
    `;

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Search failed" });
  }
};