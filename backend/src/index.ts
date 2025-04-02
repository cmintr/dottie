import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';
import chatRoutes from './routes/chatRoutes';
import authRoutes from './routes/authRoutes';
import { firebaseService } from './services/firebaseService';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware';
import { logger, requestLogger } from './utils/logger';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
firebaseService.initialize();

// Initialize Express app
const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(helmet()); // Security headers
app.use(requestLogger); // Custom request logging
app.use(express.json()); // Parse JSON request bodies
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
  credentials: true // Allow cookies to be sent with requests
}));

// Session middleware (using in-memory store for development)
// Note: In production, we'll use Firestore for token storage, but we still need
// session for temporary state storage during the OAuth flow and for backward compatibility
app.use(session({
  secret: process.env.SESSION_SECRET || uuidv4(), // Use environment variable or generate a random secret
  resave: false, // Don't save session if unmodified
  saveUninitialized: true, // Save uninitialized sessions
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true, // Prevent client-side JS from reading cookies
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start the server
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
