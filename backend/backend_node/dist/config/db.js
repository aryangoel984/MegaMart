"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/config/db.ts
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient({
    // @ts-ignore
    datasources: {
        db: {
            // The App needs the POOLED connection for speed
            url: process.env.DATABASE_URL,
        },
    },
});
exports.default = prisma;
