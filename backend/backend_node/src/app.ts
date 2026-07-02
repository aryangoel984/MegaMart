import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // <--- Import CORS

import authRoutes from './routes/authRoutes'; // <-- Import the routes
import orderRoutes from './routes/orderRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import productRoutes from './routes/productRoutes';
import searchRoutes from './routes/searchRoutes';
import chatRoutes from './routes/chatRoutes';

dotenv.config();

const app = express();
// ✅ ENABLE CORS MIDDLEWARE
// This tells the browser: "It is okay to accept requests from localhost:3001"
app.use(cors({
  origin: process.env.FRONTEND_URL, // The URL of your Frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Use the routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/chat', chatRoutes);

export default app;