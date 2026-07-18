"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const searchRoutes_1 = __importDefault(require("./routes/searchRoutes"));
const chatRoutes_1 = __importDefault(require("./routes/chatRoutes"));
const requestLogger_1 = require("./middlewares/requestLogger");
const app = (0, express_1.default)();
const frontendUrl = process.env.FRONTEND_URL;
if (!frontendUrl) {
    console.warn('⚠️ FRONTEND_URL is not set — CORS will block browser requests');
}
app.use((0, cors_1.default)({
    origin: frontendUrl,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));
app.use(express_1.default.json());
app.use(requestLogger_1.requestLogger);
app.use('/api/auth', authRoutes_1.default);
app.use('/api/orders', orderRoutes_1.default);
app.use('/api/dashboard', dashboardRoutes_1.default);
app.use('/api/products', productRoutes_1.default);
app.use('/api/search', searchRoutes_1.default);
app.use('/api/chat', chatRoutes_1.default);
exports.default = app;
