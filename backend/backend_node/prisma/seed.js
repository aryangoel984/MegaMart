"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
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
    ];
    for (const product of products) {
        // Upsert ensures we don't create duplicates
        const existing = await prisma.product.findFirst({ where: { name: product.name } });
        if (!existing) {
            await prisma.product.create({ data: product });
            console.log(`✅ Added: ${product.name}`);
        }
        else {
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
