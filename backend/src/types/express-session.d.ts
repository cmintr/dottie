import 'express-session';
import { GoogleTokens } from '../services/authService';

declare module 'express-session' {
  interface SessionData {
    /**
     * OAuth state parameter for CSRF protection
     */
    oauthState?: string | null;
    
    /**
     * Google OAuth tokens
     * Temporarily stored in session for development purposes
     * Will be moved to a secure database in production
     */
    tokens?: GoogleTokens | null;
  }
}
