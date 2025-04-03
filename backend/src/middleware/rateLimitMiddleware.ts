import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

/**
 * Default rate limit options
 */
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_MAX_REQUESTS = 100; // 100 requests per windowMs

/**
 * Rate limit options for unauthenticated users (more restrictive)
 */
const UNAUTHENTICATED_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const UNAUTHENTICATED_MAX_REQUESTS = 50; // 50 requests per windowMs

/**
 * Rate limit options for the chat endpoint (more restrictive)
 */
const CHAT_WINDOW_MS = 1 * 60 * 1000; // 1 minute
const CHAT_MAX_REQUESTS = 10; // 10 requests per minute

/**
 * Custom key generator function that uses user ID if available, otherwise IP
 * This ensures authenticated users have their own rate limit counter
 */
const keyGenerator = (req: Request): string => {
  // Use user ID if authenticated
  if (req.user?.uid) {
    return `user:${req.user.uid}`;
  }
  
  // Fall back to IP address
  const ip = req.ip || 
    req.headers['x-forwarded-for'] as string || 
    req.socket.remoteAddress || 
    'unknown';
  
  return `ip:${ip}`;
};

/**
 * Custom handler for when rate limit is exceeded
 */
const rateLimitExceededHandler = (req: Request, res: Response): void => {
  const key = keyGenerator(req);
  logger.warn('Rate limit exceeded', { 
    path: req.path, 
    method: req.method, 
    key,
    correlationId: req.correlationId
  });
  
  res.status(429).json({
    error: 'Too many requests, please try again later',
    retryAfter: Math.ceil(DEFAULT_WINDOW_MS / 1000), // in seconds
  });
};

/**
 * Standard rate limiter for most API endpoints
 */
export const standardRateLimiter = rateLimit({
  windowMs: DEFAULT_WINDOW_MS,
  max: (req: Request): number => {
    // More permissive limits for authenticated users
    return req.user ? DEFAULT_MAX_REQUESTS : UNAUTHENTICATED_MAX_REQUESTS;
  },
  keyGenerator,
  handler: rateLimitExceededHandler,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count all requests
});

/**
 * Stricter rate limiter for the chat endpoint
 */
export const chatRateLimiter = rateLimit({
  windowMs: CHAT_WINDOW_MS,
  max: CHAT_MAX_REQUESTS,
  keyGenerator,
  handler: rateLimitExceededHandler,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * Rate limiter factory that creates a custom rate limiter with specified options
 */
export const createRateLimiter = (windowMs: number, maxRequests: number) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    keyGenerator,
    handler: rateLimitExceededHandler,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
  });
};
