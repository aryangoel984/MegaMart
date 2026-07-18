// backend_node/prisma/update_vectors.ts
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const HF_API_URL =
  process.env.HF_API_URL ||
  'https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction';
const HF_API_KEY = process.env.HF_API_KEY;

async function embedText(text: string): Promise<number[] | null> {
  if (!HF_API_KEY) {
    console.error('❌ HF_API_KEY is not set in .env');
    return null;
  }

  const response = await axios.post(
    HF_API_URL,
    { inputs: text },
    {
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    }
  );

  const data = response.data;
  if (Array.isArray(data) && Array.isArray(data[0])) {
    return data[0] as number[];
  }
  if (Array.isArray(data) && typeof data[0] === 'number') {
    return data as number[];
  }
  return null;
}

async function main() {
  console.log('🔄 Starting Vector Update (Hugging Face all-MiniLM-L6-v2)...');

  const products = await prisma.product.findMany();
  console.log(`📦 Found ${products.length} products to process.`);

  for (const product of products) {
    // @ts-ignore
    const textToEmbed = `${product.category}: ${product.name} ${product.description || ''}`;

    try {
      const vector = await embedText(textToEmbed);

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
      console.error(`⚠️ Failed to update ${product.name}:`, error.response?.data || error.message);
    }
  }

  console.log('🎉 All Done! Your database is now AI-Ready.');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
