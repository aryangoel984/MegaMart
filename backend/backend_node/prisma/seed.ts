// backend_node/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Smart Seeding...');

  // 1. Define a rich list of products
  const products = [
    // Electronics
    { name: 'MacBook Pro 14"', price: 1999.99, stock: 50, category: 'Electronics', imageUrl: 'https://m.media-amazon.com/images/I/61cCf94xIEL._AC_UF894,1000_QL80_.jpg' },
    { name: 'iPhone 15 Pro', price: 999.99, stock: 100, category: 'Electronics', imageUrl: 'https://placehold.co/600x400?text=iPhone' },
    { name: 'Sony WH-1000XM5', price: 349.99, stock: 30, category: 'Electronics', imageUrl: 'https://placehold.co/600x400?text=Headphones' },
    { name: 'Logitech MX Master 3S', price: 99.99, stock: 200, category: 'Electronics', imageUrl: 'https://placehold.co/600x400?text=Mouse' },
    
    // Clothing (New Category!)
    { name: 'Levis 501 Original Jeans', price: 69.99, stock: 150, category: 'Clothing', imageUrl: 'https://placehold.co/600x400?text=Jeans' },
    { name: 'Nike Dri-Fit T-Shirt', price: 29.99, stock: 300, category: 'Clothing', imageUrl: 'https://placehold.co/600x400?text=T-Shirt' },
    { name: 'North Face Puffer Jacket', price: 299.99, stock: 40, category: 'Clothing', imageUrl: 'https://placehold.co/600x400?text=Jacket' },

    // Footwear
    { name: 'Adidas Ultraboost', price: 179.99, stock: 80, category: 'Footwear', imageUrl: 'https://placehold.co/600x400?text=Sneakers' },
    { name: 'Nike Air Jordan 1', price: 199.99, stock: 20, category: 'Footwear', imageUrl: 'https://placehold.co/600x400?text=Jordans' },

    // Home & Office
    { name: 'Herman Miller Aeron Chair', price: 1299.99, stock: 10, category: 'Home', imageUrl: 'https://placehold.co/600x400?text=Chair' },
    { name: 'Nespresso Coffee Machine', price: 149.99, stock: 60, category: 'Home', imageUrl: 'https://placehold.co/600x400?text=Coffee' },
  ];

  for (const product of products) {
    // Check if product already exists by name
    const existingProduct = await prisma.product.findFirst({
      where: { name: product.name }
    });

    if (!existingProduct) {
      await prisma.product.create({ data: product });
      console.log(`✅ Added: ${product.name}`);
    } else {
      console.log(`⏩ Skipped (Already exists): ${product.name}`);
    }
  }

  // Ensure Test User exists
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: 'placeholder_hash_password', 
    },
  });
  console.log(`👤 User Verified: ${testUser.email}`);

  console.log('✅ Seeding Finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });