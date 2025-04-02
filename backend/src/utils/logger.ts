import winston from 'winston';
import { LoggingWinston } from '@google-cloud/logging-winston';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// Define custom format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define transports
const transports = [
  // Console transport for all environments
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
      )
    ),
  }),
];

// Add Google Cloud Logging in production
if (process.env.NODE_ENV === 'production') {
  // Create a Winston transport that streams to Cloud Logging
  const loggingWinston = new LoggingWinston({
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
    logName: 'dottie-backend',
    serviceContext: {
      service: 'dottie-backend',
      version: process.env.npm_package_version || 'unknown',
    },
  });
  
  transports.push(loggingWinston);
}

// Create the logger
export const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  defaultMeta: { service: 'dottie-backend' },
});

/**
 * Log HTTP requests
 * @param req Express request object
 * @param res Express response object
 * @param next Next middleware function
 */
export const requestLogger = (req: any, res: any, next: any) => {
  // Generate a correlation ID for request tracking
  const correlationId = req.headers['x-correlation-id'] || 
                        `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Add correlation ID to request headers for downstream use
  req.headers['x-correlation-id'] = correlationId;
  
  // Extract user ID if available
  const userId = req.user?.uid || 'unauthenticated';
  
  // Log the request
  logger.http(`${req.method} ${req.url}`, {
    correlationId,
    userId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  
  // Calculate response time
  const start = Date.now();
  
  // Log the response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'http';
    
    logger.log(level, `${req.method} ${req.url} ${res.statusCode} - ${duration}ms`, {
      correlationId,
      userId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
    });
  });
  
  next();
};
