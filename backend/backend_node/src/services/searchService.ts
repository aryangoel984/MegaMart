import prisma from '../config/db';
import { generateEmbedding } from './embeddingService';

export interface SearchResult {
  id: number;
  name: string;
  description: string | null;
  price: unknown;
  imageUrl: string | null;
  category: string;
  stock: number;
  similarity: number;
}

/**
 * Keyword fallback for when embeddings are unavailable, using Postgres
 * full-text search (to_tsvector/plainto_tsquery) rather than raw `ILIKE
 * '%word%'` substring matching. Substring matching had a real bug: a short
 * word like "wear" matched inside unrelated tokens like "Footwear" (it's
 * literally a substring of it), so "clothes to wear" returned sneakers.
 * tsvector/tsquery match whole lexemes, so that false positive can't happen.
 */
const keywordSearch = async (query: string, limit: number): Promise<SearchResult[]> => {
  const products: SearchResult[] = await prisma.$queryRaw`
    SELECT id, name, description, price, "imageUrl", category, stock, 0.5 as similarity
    FROM "Product"
    WHERE to_tsvector('english', name || ' ' || coalesce(description, '') || ' ' || category)
          @@ plainto_tsquery('english', ${query})
    LIMIT ${limit};
  `;
  return products;
};

/**
 * Semantic search via pgvector cosine similarity, falling back to the
 * keyword search above only if embedding generation itself fails (it no
 * longer depends on a paid external API — see embeddingService.ts — so this
 * should be rare in practice, but a search page should never go to zero
 * results just because inference hiccuped once).
 */
export const searchProducts = async (query: string, limit: number): Promise<SearchResult[]> => {
  const queryVector = await generateEmbedding(query);

  if (queryVector.length === 0) {
    console.warn(`[SEARCH] Embedding unavailable for "${query}" — using full-text fallback`);
    return keywordSearch(query, limit);
  }

  const vectorString = JSON.stringify(queryVector);
  const products: SearchResult[] = await prisma.$queryRaw`
    SELECT id, name, description, price, "imageUrl", category, stock,
    1 - ("descriptionVector" <=> ${vectorString}::vector) as similarity
    FROM "Product"
    ORDER BY similarity DESC
    LIMIT ${limit};
  `;
  return products;
};
