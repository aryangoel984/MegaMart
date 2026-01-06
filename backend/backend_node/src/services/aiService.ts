// src/services/aiService.ts
import axios from 'axios';

// Base URL for the Python Service
const PYTHON_URL = 'http://localhost:8000';

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

/**
 * 2. Recommendation Logic (Existing)
 * Sends past purchases to get smart suggestions.
 */
export const getRecommendations = async (userId: number, pastPurchases: any[]) => {
  try {
    const response = await axios.post(`${PYTHON_URL}/recommend`, {
      user_id: userId,
      past_purchases: pastPurchases
    });
    return response.data.recommendations;
  } catch (error) {
    console.error("⚠️ AI Recommendation Service Error:", error);
    return []; 
  }
};