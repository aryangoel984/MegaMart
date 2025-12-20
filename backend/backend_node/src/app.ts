import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes'; // <-- Import the routes
import orderRoutes from './routes/orderRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
dotenv.config();

const app = express();
app.use(express.json());

// Use the routes
app.use('/api/auth', authRoutes); 
app.use('/api/orders',orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
export default app;