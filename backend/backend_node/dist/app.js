"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors")); // <--- Import CORS
const authRoutes_1 = __importDefault(require("./routes/authRoutes")); // <-- Import the routes
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const searchRoutes_1 = __importDefault(require("./routes/searchRoutes"));
const chatRoutes_1 = __importDefault(require("./routes/chatRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// ✅ ENABLE CORS MIDDLEWARE
// This tells the browser: "It is okay to accept requests from localhost:3001"
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL, // The URL of your Frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express_1.default.json());
// Use the routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/orders', orderRoutes_1.default);
app.use('/api/dashboard', dashboardRoutes_1.default);
app.use('/api/products', productRoutes_1.default);
app.use('/api/search', searchRoutes_1.default);
app.use('/api/chat', chatRoutes_1.default);
exports.default = app;
