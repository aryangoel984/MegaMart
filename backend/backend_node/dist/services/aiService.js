"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecommendations = exports.generateEmbedding = void 0;
// src/services/aiService.ts
const axios_1 = __importDefault(require("axios"));
// Base URL for the Python Service
const PYTHON_URL = process.env.PYTHON_SERVICE_URL;
/**
 * 1. Semantic Search Logic
 * Converts text (e.g., "coding laptop") into a Vector (list of numbers).
 */
const generateEmbedding = async (text) => {
    try {
        const response = await axios_1.default.post(`${PYTHON_URL}/embed`, { text });
        return response.data.vector;
    }
    catch (error) {
        console.error("⚠️ AI Embedding Service Error:", error);
        return []; // Return empty array on failure
    }
};
exports.generateEmbedding = generateEmbedding;
// 2. Recommendation Logic
// Returns a Vector (number[]) OR null
const getRecommendations = async (userId, pastPurchases) => {
    try {
        const response = await axios_1.default.post(`${PYTHON_URL}/recommend`, {
            user_id: userId,
            past_purchases: pastPurchases
        });
        return response.data.vector;
    }
    catch (error) {
        console.error("⚠️ AI Recommendation Service Error:", error.response?.data || error.message);
        return [];
    }
};
exports.getRecommendations = getRecommendations;
