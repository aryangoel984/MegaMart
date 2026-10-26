// backend_node/prisma/update_vectors.ts
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { generateEmbedding } from '../src/services/embeddingService';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting Vector Update (local Xenova/all-MiniLM-L6-v2)...');

  const products = await prisma.product.findMany();
  console.log(`📦 Found ${products.length} products to process.`);

  for (const product of products) {
    const textToEmbed = `${product.category}: ${product.name} ${product.description || ''}`;

    try {
      const vector = await generateEmbedding(textToEmbed);

      if (!vector || vector.length === 0) {
        console.error(`❌ No vector returned for ${product.name}`);
        continue;
      }

      const vectorString = JSON.stringify(vector);

      await prisma.$executeRaw`
        UPDATE "Product"
        SET "descriptionVector" = ${vectorString}::vector
        WHERE id = ${product.id}
      `;

      console.log(`✅ Updated Vector for: ${product.name}`);
    } catch (error: any) {
      console.error(`⚠️ Failed to update ${product.name}:`, error.message);
    }
  }

  console.log('🎉 All Done! Your database is now AI-Ready.');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
