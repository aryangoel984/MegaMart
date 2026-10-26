import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding AI-Ready Products...');

  const products = [
    {
      name: 'MacBook Pro 14"',
      price: 1999.99,
      stock: 50,
      category: 'Electronics',
      description: 'High-performance laptop with M3 chip, perfect for coding and video editing.',
      imageUrl: 'https://placehold.co/600x400?text=MacBook'
    },
    {
      name: 'iPhone 15 Pro',
      price: 999.99,
      stock: 100,
      category: 'Electronics',
      description: 'The latest iPhone with titanium design and A17 Pro chip.',
      imageUrl: 'https://placehold.co/600x400?text=iPhone'
    },
    {
      name: 'Sony WH-1000XM5',
      price: 349.99,
      stock: 30,
      category: 'Electronics',
      description: 'Industry-leading noise cancelling headphones with 30-hour battery life.',
      imageUrl: 'https://placehold.co/600x400?text=Headphones'
    },
    {
      name: 'Levis 501 Original Jeans',
      price: 69.99,
      stock: 150,
      category: 'Clothing',
      description: 'Classic straight-fit blue jeans made from durable denim.',
      imageUrl: 'https://placehold.co/600x400?text=Jeans'
    },
    {
      name: 'Adidas Ultraboost',
      price: 179.99,
      stock: 80,
      category: 'Footwear',
      description: 'Responsive running shoes with Boost cushioning technology.',
      imageUrl: 'https://placehold.co/600x400?text=Sneakers'
    },
    {
      name: 'Sony WH-1000XM6',
      price: 349.99,
      stock: 30,
      category: 'Electronics',
      description: "Sony's latest flagship noise-cancelling headphones, with improved ANC and call quality over the XM5.",
      imageUrl: 'https://placehold.co/600x400?text=Headphones'
    },
    {
      name: 'Logitech MX Master 3S',
      price: 99.99,
      stock: 180,
      category: 'Electronics',
      description: 'Precision wireless mouse with an 8000 DPI sensor and a silent MagSpeed scroll wheel, built for all-day productivity.',
      imageUrl: 'https://placehold.co/600x400?text=Mouse'
    },
    {
      name: 'Nike Dri-Fit T-Shirt',
      price: 29.99,
      stock: 300,
      category: 'Clothing',
      description: "Lightweight, moisture-wicking training t-shirt built with Nike's Dri-FIT technology.",
      imageUrl: 'https://placehold.co/600x400?text=T-Shirt'
    },
    {
      name: 'North Face Puffer Jacket',
      price: 299.99,
      stock: 40,
      category: 'Clothing',
      description: 'Insulated puffer jacket with a water-repellent shell, built to keep you warm down to 20°F (-6°C).',
      imageUrl: 'https://placehold.co/600x400?text=Jacket'
    },
    {
      name: 'Nike Air Jordan 1',
      price: 199.99,
      stock: 15,
      category: 'Footwear',
      description: 'Iconic high-top basketball sneaker with a full-grain leather upper and an encapsulated Air-Sole unit.',
      imageUrl: 'https://placehold.co/600x400?text=Sneakers'
    },
    {
      name: 'Herman Miller Aeron Chair',
      price: 1299.99,
      stock: 10,
      category: 'Home',
      description: 'Ergonomic office chair with PostureFit SL lumbar support and breathable 8Z Pellicle mesh.',
      imageUrl: 'https://placehold.co/600x400?text=Chair'
    },
    {
      name: 'Nespresso Coffee Machine',
      price: 149.99,
      stock: 60,
      category: 'Home',
      description: 'Compact espresso machine with 19-bar pump pressure and a 25-second heat-up time.',
      imageUrl: 'https://placehold.co/600x400?text=Coffee+Machine'
    },
  ];

  for (const product of products) {
    // Upsert ensures we don't create duplicates
    const existing = await prisma.product.findFirst({ where: { name: product.name } });
    if (!existing) {
      await prisma.product.create({ data: product });
      console.log(`✅ Added: ${product.name}`);
    } else {
      // If it exists, UPDATE the description to ensure it's not null
      await prisma.product.update({
        where: { id: existing.id },
        data: { description: product.description }
      });
      console.log(`🔄 Updated Description: ${product.name}`);
    }
  }
  
  // Ensure Test User
  await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: { email: 'test@example.com', name: 'Test User', password: 'hash' },
  });

  console.log('✅ Seeding Finished.');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());