import { Request, Response, NextFunction } from 'express';
import { firebaseService } from '../services/firebaseService';
import 'express-session';
import { Session } from 'express-session';
import { GoogleTokens } from '../services/authService';
import '../types/express';
import { ApiError } from './errorMiddleware';
import { logger } from '../utils/logger';

/**
 * Middleware to verify Firebase authentication
 * Extracts and verifies the Firebase ID token from the Authorization header
 * Adds the user object to the request if authentication is successful
 */
export const verifyFirebaseAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get the ID token from the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, but we'll continue (unauthenticated access)
      return next();
    }
    
    // Extract the token
    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      // No token provided, but we'll continue (unauthenticated access)
      return next();
    }
    
    try {
      // Verify the ID token
      const decodedToken = await firebaseService.verifyIdToken(idToken);
      
      // Add the user to the request
      (req as any).user = {
        uid: decodedToken.uid,
        email: decodedToken.email || undefined,
        displayName: decodedToken.name,
        photoURL: decodedToken.picture
      };
      
      // Log successful authentication
      logger.debug('User authenticated successfully', {
        userId: decodedToken.uid,
        email: decodedToken.email
      });
      
      // Continue to the next middleware or route handler
      next();
    } catch (error) {
      // Invalid token, but we'll continue (unauthenticated access)
      logger.warn('Invalid Firebase ID token', {
        error: error instanceof Error ? error.message : String(error),
        url: req.originalUrl
      });
      next();
    }
  } catch (error) {
    logger.error('Error in Firebase authentication middleware', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: req.originalUrl
    });
    next();
  }
};

/**
 * Middleware to require Firebase authentication
 * This middleware should be used after verifyFirebaseAuth
 * It will return a 401 Unauthorized response if the user is not authenticated
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!(req as any).user) {
    next(ApiError.authentication('Authentication required. Please sign in to access this resource.'));
    return;
  }
  
  next();
};

/**
 * Middleware to check if the user has linked their Google account
 * This middleware should be used after verifyFirebaseAuth
 * It will return a 403 Forbidden response if the user has not linked their Google account
 */
export const requireGoogleAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!(req as any).user) {
      next(ApiError.authentication('Authentication required. Please sign in to access this resource.'));
      return;
    }
    
    // Check if the user has Google tokens in Firestore
    const { firestoreService } = require('../services/firestoreService');
    const tokens = await firestoreService.getUserTokens((req as any).user.uid);
    
    if (!tokens) {
      next(ApiError.authorization('Google account not linked. Please connect your Google account.', {
        googleAuthRequired: true
      }));
      return;
    }
    
    next();
  } catch (error) {
    logger.error('Error checking Google authentication', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: (req as any).user?.uid
    });
    next(ApiError.internal('Failed to check Google authentication status.'));
  }
};
