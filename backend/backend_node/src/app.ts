import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes';
import orderRoutes from './routes/orderRoutes';
import cartRoutes from './routes/cartRoutes';
import checkoutRoutes from './routes/checkoutRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import productRoutes from './routes/productRoutes';
import searchRoutes from './routes/searchRoutes';
import chatRoutes from './routes/chatRoutes';
import healthRoutes from './routes/healthRoutes';
import { requestLogger } from './middlewares/requestLogger';
import { requestId } from './middlewares/requestId';

const app = express();

const frontendUrl = process.env.FRONTEND_URL;
if (!frontendUrl) {
  console.warn('⚠️ FRONTEND_URL is not set — CORS will block browser requests');
}

// disable: the API serves no HTML, so CSP/other browser-page directives
// don't apply and would only get in the way of API responses.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: frontendUrl,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));
app.use(express.json());
app.use(requestId);
app.use(requestLogger);

// Auth endpoints are a classic credential-stuffing / brute-force target;
// chat proxies to a paid LLM API, so an unthrottled loop there is a cost
// (and abuse) vector, not just a load one.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const chatLimiter = rateLimit({ windowMs: 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

app.use('/api/health', healthRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);

// JSON 404 — Express's default is an HTML page that also leaks the
// framework. Must come after every real route is mounted.
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// JSON 500 — a final error handler so an uncaught exception in a route
// still returns JSON, not Express's default HTML stack trace page.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('⚠️ Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
