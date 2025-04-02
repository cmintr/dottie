import { Session } from 'express-session';
import { GoogleTokens } from '../services/authService';

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        displayName?: string;
        photoURL?: string;
      };
      body: any;
      sessionID: string;
      headers: any;
      query: any;
      session: Session & Partial<SessionData>;
    }

    interface Response {
      status(code: number): Response;
      json(body: any): Response;
      redirect(url: string): void;
    }

    interface SessionData {
      googleTokens?: GoogleTokens;
      refreshToken?: string;
      tokens?: GoogleTokens;
      state?: string;
    }
  }
}

export {};
