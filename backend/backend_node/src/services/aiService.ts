// src/services/aiService.ts
import axios from 'axios';

// Base URL for the Python Service
const PYTHON_URL = process.env.PYTHON_SERVICE_URL;

/**
 * 1. Semantic Search Logic
 * Converts text (e.g., "coding laptop") into a Vector (list of numbers).
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const response = await axios.post(`${PYTHON_URL}/embed`, { text });
    return response.data.vector;
  } catch (error) {
    console.error("⚠️ AI Embedding Service Error:", error);
    return []; // Return empty array on failure
  }
};

// 2. Recommendation Logic
// Returns a Vector (number[]) OR null
export const getRecommendations = async (userId: number, pastPurchases: any[]): Promise<number[] | null> => {
  try {
    const response = await axios.post(`${PYTHON_URL}/recommend`, {
      user_id: userId,
      past_purchases: pastPurchases
    });
    return response.data.vector;
  } catch (error: any) {
    console.error("⚠️ AI Recommendation Service Error:", error.response?.data || error.message);
    return [];
  }
};