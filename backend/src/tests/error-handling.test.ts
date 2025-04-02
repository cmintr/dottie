import request from 'supertest';
import express from 'express';
import { errorHandler, notFoundHandler, ApiError, ErrorType } from '../middleware/errorMiddleware';
import { logger } from '../utils/logger';

// Mock the logger to prevent actual logging during tests
jest.mock('../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    http: jest.fn(),
    debug: jest.fn(),
  },
  requestLogger: jest.fn((req, res, next) => next()),
}));

describe('Error Handling Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
  });

  it('should handle ApiError with correct status code and message', async () => {
    // Set up a route that throws an ApiError
    app.get('/test-api-error', (req, res, next) => {
      next(ApiError.validation('Invalid input data'));
    });
    
    // Add error handler middleware
    app.use(errorHandler);
    
    // Make request and check response
    const response = await request(app).get('/test-api-error');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Invalid input data');
    expect(response.body).toHaveProperty('type', ErrorType.VALIDATION);
    expect(response.body).toHaveProperty('correlationId');
    
    // Check that logger was called with appropriate level
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should handle authentication errors', async () => {
    app.get('/test-auth-error', (req, res, next) => {
      next(ApiError.authentication('Authentication required'));
    });
    
    app.use(errorHandler);
    
    const response = await request(app).get('/test-auth-error');
    
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Authentication required');
    expect(response.body).toHaveProperty('type', ErrorType.AUTHENTICATION);
  });

  it('should handle authorization errors', async () => {
    app.get('/test-auth-error', (req, res, next) => {
      next(ApiError.authorization('Not authorized to access this resource'));
    });
    
    app.use(errorHandler);
    
    const response = await request(app).get('/test-auth-error');
    
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error', 'Not authorized to access this resource');
    expect(response.body).toHaveProperty('type', ErrorType.AUTHORIZATION);
  });

  it('should handle not found errors', async () => {
    app.get('/test-not-found', (req, res, next) => {
      next(ApiError.notFound('Resource not found'));
    });
    
    app.use(errorHandler);
    
    const response = await request(app).get('/test-not-found');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Resource not found');
    expect(response.body).toHaveProperty('type', ErrorType.NOT_FOUND);
  });

  it('should handle Google API errors', async () => {
    app.get('/test-google-api-error', (req, res, next) => {
      next(ApiError.googleApi('Failed to fetch Google Calendar events'));
    });
    
    app.use(errorHandler);
    
    const response = await request(app).get('/test-google-api-error');
    
    expect(response.status).toBe(502);
    expect(response.body).toHaveProperty('error', 'Failed to fetch Google Calendar events');
    expect(response.body).toHaveProperty('type', ErrorType.GOOGLE_API);
    
    // Check that logger was called with error level for 5xx errors
    expect(logger.error).toHaveBeenCalled();
  });

  it('should handle Firebase errors', async () => {
    app.get('/test-firebase-error', (req, res, next) => {
      next(ApiError.firebase('Failed to authenticate with Firebase'));
    });
    
    app.use(errorHandler);
    
    const response = await request(app).get('/test-firebase-error');
    
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Failed to authenticate with Firebase');
    expect(response.body).toHaveProperty('type', ErrorType.FIREBASE);
  });

  it('should handle generic errors', async () => {
    app.get('/test-generic-error', (req, res, next) => {
      next(new Error('Something went wrong'));
    });
    
    app.use(errorHandler);
    
    const response = await request(app).get('/test-generic-error');
    
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'An unexpected error occurred');
    expect(response.body).toHaveProperty('type', ErrorType.INTERNAL);
    
    // Check that logger was called with error level
    expect(logger.error).toHaveBeenCalled();
  });

  it('should handle route not found with notFoundHandler', async () => {
    // Set up app with notFoundHandler
    app.use(notFoundHandler);
    app.use(errorHandler);
    
    const response = await request(app).get('/non-existent-route');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Route not found: GET /non-existent-route');
    expect(response.body).toHaveProperty('type', ErrorType.NOT_FOUND);
  });

  it('should include details in development environment', async () => {
    // Save original NODE_ENV
    const originalNodeEnv = process.env.NODE_ENV;
    
    // Set to development
    process.env.NODE_ENV = 'development';
    
    app.get('/test-error-with-details', (req, res, next) => {
      next(ApiError.validation('Invalid input', { field: 'email', reason: 'format' }));
    });
    
    app.use(errorHandler);
    
    const response = await request(app).get('/test-error-with-details');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('details');
    expect(response.body.details).toHaveProperty('field', 'email');
    
    // Restore NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should not include details in production environment', async () => {
    // Save original NODE_ENV
    const originalNodeEnv = process.env.NODE_ENV;
    
    // Set to production
    process.env.NODE_ENV = 'production';
    
    app.get('/test-error-without-details', (req, res, next) => {
      next(ApiError.validation('Invalid input', { field: 'email', reason: 'format' }));
    });
    
    app.use(errorHandler);
    
    const response = await request(app).get('/test-error-without-details');
    
    expect(response.status).toBe(400);
    expect(response.body).not.toHaveProperty('details');
    
    // Restore NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });
});
