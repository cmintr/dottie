import 'express-session';
import { GoogleTokens } from '../services/authService';

/**
 * Extend the Express session type definition to include our custom properties
 */
declare module 'express-session' {
  interface Session {
    // OAuth flow properties
    oauthState?: string;
    oauthUserId?: string;
    redirectUrl?: string;
    
    // Google OAuth tokens
    tokens?: GoogleTokens;
    
    // User information
    userEmail?: string;
    userName?: string;
    userPicture?: string;
  }
}

/**
 * Extend the Express Request type definition to include our custom properties
 */
declare global {
  namespace Express {
    interface Request {
      // Firebase authenticated user
      user?: {
        uid: string;
        email?: string;
        displayName?: string;
        photoURL?: string;
      };
      
      // Correlation ID for request tracking
      correlationId?: string;
    }
  }
}
