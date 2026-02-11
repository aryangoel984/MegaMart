"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    // We use raw SQL to select the vector column
    const result = await prisma.$queryRaw `
    SELECT id, name, "descriptionVector"::text 
    FROM "Product" 
    WHERE id = 1;
  `;
    console.log("🔍 Database Record for ID 1:", result);
}
main().finally(() => prisma.$disconnect());
