import { GoogleTokens } from '../services/authService';
import 'express-session';

// Extend the Express Session interface to include our custom properties
declare module 'express-session' {
  interface Session {
    tokens?: GoogleTokens;
    oauthState?: string;
    oauthUserId?: string;
  }
}
