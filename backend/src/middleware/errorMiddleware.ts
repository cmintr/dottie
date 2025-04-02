import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Error types for standardized error handling
 */
export enum ErrorType {
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  GOOGLE_API = 'GOOGLE_API_ERROR',
  FIREBASE = 'FIREBASE_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
}

/**
 * Custom API error class with type and status code
 */
export class ApiError extends Error {
  type: ErrorType;
  statusCode: number;
  details?: any;

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL,
    statusCode: number = 500,
    details?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
  }

  /**
   * Create an authentication error
   */
  static authentication(message: string = 'Authentication required', details?: any): ApiError {
    return new ApiError(message, ErrorType.AUTHENTICATION, 401, details);
  }

  /**
   * Create an authorization error
   */
  static authorization(message: string = 'Not authorized', details?: any): ApiError {
    return new ApiError(message, ErrorType.AUTHORIZATION, 403, details);
  }

  /**
   * Create a validation error
   */
  static validation(message: string = 'Validation failed', details?: any): ApiError {
    return new ApiError(message, ErrorType.VALIDATION, 400, details);
  }

  /**
   * Create a not found error
   */
  static notFound(message: string = 'Resource not found', details?: any): ApiError {
    return new ApiError(message, ErrorType.NOT_FOUND, 404, details);
  }

  /**
   * Create a Google API error
   */
  static googleApi(message: string = 'Google API error', details?: any): ApiError {
    return new ApiError(message, ErrorType.GOOGLE_API, 502, details);
  }

  /**
   * Create a Firebase error
   */
  static firebase(message: string = 'Firebase error', details?: any): ApiError {
    return new ApiError(message, ErrorType.FIREBASE, 500, details);
  }

  /**
   * Create an internal server error
   */
  static internal(message: string = 'Internal server error', details?: any): ApiError {
    return new ApiError(message, ErrorType.INTERNAL, 500, details);
  }
}

/**
 * Error handler middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Generate a correlation ID for tracking this error
  const correlationId = req.headers['x-correlation-id'] || 
                        `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Default error response
  let statusCode = 500;
  let errorType = ErrorType.INTERNAL;
  let errorMessage = 'An unexpected error occurred';
  let errorDetails: any = undefined;
  
  // Extract user ID if available
  const userId = (req as any).user?.uid || 'unauthenticated';
  
  // Handle ApiError instances
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    errorType = err.type;
    errorMessage = err.message;
    errorDetails = err.details;
    
    // Log the error with appropriate level based on status code
    if (statusCode >= 500) {
      logger.error(`[${errorType}] ${errorMessage}`, {
        correlationId,
        userId,
        statusCode,
        path: req.path,
        method: req.method,
        error: err,
        ...(errorDetails ? { details: errorDetails } : {})
      });
    } else {
      logger.warn(`[${errorType}] ${errorMessage}`, {
        correlationId,
        userId,
        statusCode,
        path: req.path,
        method: req.method,
        ...(errorDetails ? { details: errorDetails } : {})
      });
    }
  } else {
    // Handle unknown errors
    logger.error(`[UNCAUGHT_ERROR] ${err.message}`, {
      correlationId,
      userId,
      path: req.path,
      method: req.method,
      error: err
    });
  }
  
  // Send error response to client
  res.status(statusCode).json({
    error: errorMessage,
    type: errorType,
    correlationId,
    ...(process.env.NODE_ENV === 'development' && errorDetails ? { details: errorDetails } : {})
  });
};

/**
 * Not found middleware for handling 404 errors
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};
