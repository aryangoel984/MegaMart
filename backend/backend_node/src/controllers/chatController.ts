import { Request, Response } from 'express';
import { askAgent } from '../services/aiService';

interface AuthRequest extends Request {
  user?: { userId: number };
}

export const handleChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized. Please login to chat.' });
      return;
    }

    const { message, history } = req.body;
    if (!message) {
      res.status(400).json({ message: 'Message is required' });
      return;
    }

    const chatHistory = history || [];

    // Run Groq agent (or mock fallback)
    const agentResponse = await askAgent(userId, message, chatHistory);

    res.json(agentResponse);
  } catch (error: any) {
    console.error('⚠️ Chat Controller Error:', error);
    res.status(500).json({ message: 'Chat system encountered an error', error: error.message });
  }
};
