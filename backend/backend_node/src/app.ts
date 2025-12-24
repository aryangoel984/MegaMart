import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // <--- Import CORS

import authRoutes from './routes/authRoutes'; // <-- Import the routes
import orderRoutes from './routes/orderRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import productRoutes from './routes/productRoutes';
dotenv.config();

const app = express();
// ✅ ENABLE CORS MIDDLEWARE
// This tells the browser: "It is okay to accept requests from localhost:3001"
app.use(cors({
  origin: 'http://localhost:3001', // The URL of your Frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Use the routes
app.use('/api/auth', authRoutes); 
app.use('/api/orders',orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products',productRoutes);

export default app;