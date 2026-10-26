import { Request, Response } from 'express';
import prisma from '../config/db';
import { generateEmbedding } from '../services/embeddingService';

export const getHealth = async (_req: Request, res: Response): Promise<void> => {
  let db: 'ok' | 'error' = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error('⚠️ Health check: DB ping failed', error);
    db = 'error';
  }

  // Not an actual API call to Groq on every check (this endpoint is meant
  // to be pinged frequently to keep the server warm) — just whether a key
  // is configured, since the app degrades to a working mock agent without one.
  const llm = process.env.GROQ_API_KEY ? 'ok' : 'mock';

  // Embeddings run locally now (no external API, no billing), so an actual
  // readiness check is cheap and worth doing — this is also what caught
  // the previous silent failure (the HF Inference key ran out of credits
  // and every search quietly degraded to keyword matching with no error).
  const embeddings = (await generateEmbedding('healthcheck')).length > 0 ? 'ok' : 'error';

  const status = db === 'ok' && embeddings === 'ok' ? 200 : 503;
  res.status(status).json({ db, llm, embeddings, uptime: process.uptime() });
};
