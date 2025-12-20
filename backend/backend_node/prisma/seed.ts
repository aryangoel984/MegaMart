import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient(); // v5 reads env vars automatically

async function main() {
  console.log('🌱 Starting Seeding...');
  const products = [
    { name: 'MacBook Pro 14"', price: 1999.99, stock: 50, category: 'Electronics', imageUrl: 'https://placehold.co/600x400' },
    { name: 'iPhone 15 Pro', price: 999.99, stock: 100, category: 'Electronics', imageUrl: 'https://placehold.co/600x400' },
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
  }

  await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: { email: 'test@example.com', name: 'Test User', password: '123' },
  });
  console.log('✅ Seeding Finished.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });