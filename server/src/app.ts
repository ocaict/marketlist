import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import apiRoutes from './routes';
import { errorHandler, notFoundHandler } from './middleware';

const app = express();

const corsOrigins = [
  ...config.corsOrigin.split(',').map((origin) => origin.trim()),
  ...(config.nodeEnv === 'production' ? [] : ['http://localhost', 'https://localhost']),
];

// Security middleware
app.use(helmet());
app.use(cors({ origin: corsOrigins }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.',
  },
});
app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again later.',
  },
});
app.use('/api/auth/', authLimiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
