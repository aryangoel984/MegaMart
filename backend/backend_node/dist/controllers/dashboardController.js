"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = void 0;
const db_1 = __importDefault(require("../config/db"));
const aiService_1 = require("../services/aiService");
const getDashboard = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        // 1. Fetch User's Past Orders (Complex Query)
        // We need the products inside the orders
        const orders = await db_1.default.order.findMany({
            where: { userId },
            include: {
                items: {
                    include: { product: true }
                }
            }
        });
        // 2. Format Data for Python
        // Python expects a list of categories (strings), e.g. ["Electronics", "Clothing"]
        // We extracted objects before, which caused the bug.
        // @ts-ignore
        const pastPurchases = orders.flatMap(order => 
        // @ts-ignore
        order.items.map(item => item.product.category));
        // 3. Get Recommendation Embedding from Python
        const vector = await (0, aiService_1.getRecommendations)(userId, pastPurchases);
        let recommendedProducts = [];
        if (vector) {
            // SCENARIO 1: Personalized (Vector Search)
            const vectorString = JSON.stringify(vector);
            // @ts-ignore
            recommendedProducts = await db_1.default.$queryRaw `
        SELECT id, name, description, price, "imageUrl", category,
        1 - ("descriptionVector" <=> ${vectorString}::vector) as similarity
        FROM "Product"
        ORDER BY similarity DESC
        LIMIT 3;
      `;
        }
        else {
            // SCENARIO 2: Cold Start (Fallback to real DB "Trending" / Latest)
            recommendedProducts = await db_1.default.product.findMany({
                take: 3,
                orderBy: { id: 'desc' } // Just get the latest ones for now
            });
        }
        // 4. Return Final Dashboard Data
        res.json({
            message: `Welcome back!`,
            pastOrdersCount: orders.length,
            aiRecommendations: recommendedProducts.map((p) => ({
                id: p.id,
                name: p.name,
                imageUrl: p.imageUrl, // <-- FIXED: Attached the image
                // Add a helpful reason tag
                reason: vector ? 'Based on your history' : 'Popular right now'
            }))
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Dashboard failed', error });
    }
};
exports.getDashboard = getDashboard;
