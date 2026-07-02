"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatController_1 = require("../controllers/chatController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// PROTECTED ROUTE: User must be logged in to chat with the concierge
router.post('/', authMiddleware_1.authenticateToken, chatController_1.handleChat);
exports.default = router;
