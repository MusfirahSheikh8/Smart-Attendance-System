import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { config } from './config/env';
import { apiRouter } from './routes/index';
import { errorHandler } from './middleware/error';

const app: Application = express();

// --- Security & Utility Middleware ---
app.use(helmet()); // Secure HTTP headers

// Allow multiple origins in development (3000 and 3001)
const allowedOrigins = [config.frontendUrl, 'http://localhost:3000', 'http://localhost:3001'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' })); // Allows parsing of Base64 image payloads
app.use(express.urlencoded({ extended: true }));

// --- Logging ---
// app.use(morgan(config.isDev ? 'dev' : 'combined'));

// --- Rate Limiting ---
// General API Rate limit: 1000 requests per 15 minutes (to allow for frequent polling)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP Rate limit: 5 requests per 15 minutes to prevent SMS/Email spam
const otpLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // Relaxed for development
  message: 'Too many OTP requests. Please wait a minute before trying again.',
});

// Apply limits
app.use(apiLimiter);
app.use('/otp', otpLimiter);

// --- Routes ---
app.use('/', apiRouter);

// --- Global Error Boundary ---
// Must be registered after all routes
app.use(errorHandler);

export default app;
