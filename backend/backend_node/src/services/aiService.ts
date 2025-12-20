// src/services/aiService.ts
import axios from 'axios';

// The URL of your running Python Service
const AI_SERVICE_URL = 'http://localhost:8000/recommend';

export const getRecommendations = async (userId: number, pastPurchases: any[]) => {
  try {
    // Talk to Python
    const response = await axios.post(AI_SERVICE_URL, {
      user_id: userId,
      past_purchases: pastPurchases
    });
    
    return response.data.recommendations;
  } catch (error) {
    console.error("⚠️ AI Service is down or failed. Returning empty list.");
    // Fail Gracefully: If AI is broken, just return empty, don't crash the app
    return []; 
  }
};