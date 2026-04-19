"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchProducts = void 0;
const db_1 = __importDefault(require("../config/db"));
const aiService_1 = require("../services/aiService");
const searchProducts = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            res.status(400).json({ message: "Query required" });
            return;
        }
        // 1. Convert User Search -> Vector (using Python)
        const queryVector = await (0, aiService_1.generateEmbedding)(query);
        if (queryVector.length === 0) {
            res.status(500).json({ message: "AI Service Failed" });
            return;
        }
        // 2. Perform Cosine Similarity Search in Postgres
        // We cast the array to a vector string '[...]'
        const vectorString = JSON.stringify(queryVector);
        // This is the Magic SQL: "ORDER BY distance"
        const products = await db_1.default.$queryRaw `
      SELECT id, name, description, price, "imageUrl", category,
      1 - ("descriptionVector" <=> ${vectorString}::vector) as similarity
      FROM "Product"
      ORDER BY similarity DESC
      LIMIT 5;
    `;
        res.json(products);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Search failed" });
    }
};
exports.searchProducts = searchProducts;
