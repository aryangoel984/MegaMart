"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleChat = void 0;
const aiService_1 = require("../services/aiService");
const handleChat = async (req, res) => {
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
        const agentResponse = await (0, aiService_1.askAgent)(userId, message, chatHistory);
        res.json(agentResponse);
    }
    catch (error) {
        console.error('⚠️ Chat Controller Error:', error);
        res.status(500).json({ message: 'Chat system encountered an error', error: error.message });
    }
};
exports.handleChat = handleChat;
