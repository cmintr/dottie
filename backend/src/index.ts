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
import { FirestoreSessionStore } from './utils/firestoreSessionStore';

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

// Validate required environment variables
if (!process.env.SESSION_SECRET) {
  logger.error('SESSION_SECRET environment variable is required');
  process.exit(1);
}

// Session middleware with Firestore session store for production
// This ensures sessions work correctly in multi-instance environments like Cloud Run
const sessionOptions: session.SessionOptions = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false, // Don't save uninitialized sessions
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true, // Prevent client-side JS from reading cookies
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// Use Firestore session store in production, memory store in development
if (process.env.NODE_ENV === 'production') {
  logger.info('Using Firestore session store for production');
  sessionOptions.store = new FirestoreSessionStore({
    collection: 'express-sessions',
    ttl: 86400 // 24 hours in seconds
  });
} else {
  logger.info('Using in-memory session store for development');
}

app.use(session(sessionOptions));

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
