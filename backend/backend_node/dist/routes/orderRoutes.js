"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// PROTECTED ROUTE: User must be logged in to order
// Syntax: router.post(path, middleware, controller)
router.post('/', authMiddleware_1.authenticateToken, orderController_1.createOrder);
// GET /api/orders
router.get('/', authMiddleware_1.authenticateToken, orderController_1.getUserOrders);
exports.default = router;
