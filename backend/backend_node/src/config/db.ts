// src/config/db.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    // @ts-ignore
  datasources: {
    db: {
      // The App needs the POOLED connection for speed
      url: process.env.DATABASE_URL,
    },
  },
});

export default prisma;