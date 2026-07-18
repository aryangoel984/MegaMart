import express from 'express';
import cors from 'cors';

import authRoutes from './routes/authRoutes';
import orderRoutes from './routes/orderRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import productRoutes from './routes/productRoutes';
import searchRoutes from './routes/searchRoutes';
import chatRoutes from './routes/chatRoutes';
import { requestLogger } from './middlewares/requestLogger';

const app = express();

const frontendUrl = process.env.FRONTEND_URL;
if (!frontendUrl) {
  console.warn('⚠️ FRONTEND_URL is not set — CORS will block browser requests');
}

app.use(cors({
  origin: frontendUrl,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(express.json());
app.use(requestLogger);

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/chat', chatRoutes);

export default app;