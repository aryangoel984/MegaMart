"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_1 = require("../controllers/dashboardController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Protected Route
router.get('/', authMiddleware_1.authenticateToken, dashboardController_1.getDashboard);
exports.default = router;
