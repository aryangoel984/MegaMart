// backend_node/prisma/update_vectors.ts
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const AI_SERVICE_URL = 'http://localhost:8000/embed';

async function main() {
  console.log("🔄 Starting Vector Update...");

  // 1. Fetch all products
  const products = await prisma.product.findMany();
  console.log(`📦 Found ${products.length} products to process.`);

  for (const product of products) {
    // Create a rich text description for the AI to read
    // We combine Category + Name + Description to give the AI maximum context
    // @ts-ignore
    const textToEmbed = `${product.category}: ${product.name} ${product.description || ''}`;

    try {
      // 2. Call Python to get the Vector (The List of Numbers)
      const response = await axios.post(AI_SERVICE_URL, { text: textToEmbed });
      const vector = response.data.vector; 

      if (!vector) {
        console.error(`❌ No vector returned for ${product.name}`);
        continue;
      }

      // 3. Save to Postgres using Raw SQL
      // Prisma doesn't support vector arrays natively yet, so we use executeRaw
      // We cast the string to 'vector' type explicitly
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

  console.log("🎉 All Done! Your database is now AI-Ready.");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());