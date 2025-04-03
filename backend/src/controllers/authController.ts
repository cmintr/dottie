import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authService, GoogleTokens } from '../services/authService';
import { userService } from '../services/userService';
import { firebaseService } from '../services/firebaseService';
import 'express-session';
// Import the shared Express type definitions
import '../types/express';

/**
 * Controller for handling authentication-related requests
 */
export const authController = {
  /**
   * Initiate Google OAuth flow
   * @param req Express request object
   * @param res Express response object
   */
  async googleAuth(req: Express.Request, res: Express.Response): Promise<void> {
    try {
      // Generate a random state parameter for CSRF protection
      const state = uuidv4();
      
      // Store the state in the session for verification
      req.session.oauthState = state;
      
      // Store the user ID in the state if authenticated
      if (req.user) {
        req.session.oauthUserId = req.user.uid;
      }
      
      // Store the original URL if provided (for redirection after auth)
      if (req.query.redirectUrl) {
        req.session.redirectUrl = req.query.redirectUrl as string;
      }
      
      // Generate the Google OAuth URL with the state parameter
      const authUrl = await authService.generateGoogleAuthUrl(state);
      
      // Redirect the user to the Google OAuth consent screen
      res.redirect(authUrl);
    } catch (error: any) {
      console.error('Error initiating Google OAuth flow:', error);
      res.status(500).json({ error: 'Failed to initiate Google authentication' });
    }
  },
  
  /**
   * Handle Google OAuth callback
   * @param req Express request object
   * @param res Express response object
   */
  async googleCallback(req: Express.Request, res: Express.Response): Promise<void> {
    try {
      const { code, state } = req.query;
      
      // Get the expected state from the session
      const expectedState = req.session.oauthState;
      
      // Verify the state parameter to prevent CSRF attacks
      if (!state || !expectedState || state !== expectedState) {
        console.error('OAuth state mismatch. Possible CSRF attack.', {
          receivedState: state,
          expectedState: expectedState ? 'present' : 'missing'
        });
        res.status(400).json({ error: 'Invalid OAuth state. Please try again.' });
        return;
      }
      
      // Clear the state from the session
      delete req.session.oauthState;
      
      if (!code) {
        console.error('No authorization code received from Google');
        res.status(400).json({ error: 'No authorization code received' });
        return;
      }
      
      // Get the user ID from the session if available (for authenticated users)
      // Otherwise, use the session ID as a temporary identifier
      const userId = req.session.oauthUserId || req.sessionID;
      
      // Clear the user ID from the session
      delete req.session.oauthUserId;
      
      // Exchange the authorization code for tokens
      const tokens = await authService.exchangeCodeForTokens(code as string, userId);
      
      // Store the tokens in the session for immediate use
      req.session.tokens = tokens;
      
      // Get user info from Google
      const userInfo = await authService.getUserInfo(tokens, userId);
      const email = userInfo.emailAddresses?.[0]?.value;
      const name = userInfo.names?.[0]?.displayName;
      const picture = userInfo.photos?.[0]?.url;
      
      // If the user is already authenticated with Firebase, link the Google account
      if (req.user) {
        await userService.linkGoogleAccount(req.user.uid, tokens);
        
        // Redirect to the frontend with success status
        const redirectUrl = `${process.env.FRONTEND_URL || '/'}/auth/success?provider=google`;
        res.redirect(redirectUrl);
        return;
      }
      
      // If not authenticated, try to find or create a Firebase user
      try {
        let firebaseUser;
        
        // Try to find the user by email
        if (email) {
          try {
            firebaseUser = await firebaseService.getUserByEmail(email);
          } catch (error) {
            // User not found, will create a new one
          }
        }
        
        // If user not found, create a new Firebase user
        if (!firebaseUser && email) {
          firebaseUser = await firebaseService.createUser({
            email,
            displayName: name,
            photoURL: picture
          });
          
          console.log(`Created new Firebase user with ID: ${firebaseUser.uid}`);
        }
        
        if (firebaseUser) {
          // Link the Google account to the Firebase user
          await userService.linkGoogleAccount(firebaseUser.uid, tokens);
          
          // Create a custom token for the frontend to sign in with Firebase
          const customToken = await firebaseService.createCustomToken(firebaseUser.uid);
          
          // Redirect to the frontend with the custom token
          const redirectUrl = `${process.env.FRONTEND_URL || '/'}/auth/success?token=${customToken}&provider=google`;
          res.redirect(redirectUrl);
        } else {
          // Could not find or create a user, redirect to error page
          const redirectUrl = `${process.env.FRONTEND_URL || '/'}/auth/error?error=user_creation_failed`;
          res.redirect(redirectUrl);
        }
      } catch (error) {
        console.error('Error handling Firebase user creation/linking:', error);
        const redirectUrl = `${process.env.FRONTEND_URL || '/'}/auth/error?error=firebase_error`;
        res.redirect(redirectUrl);
      }
    } catch (error: any) {
      console.error('Error handling Google OAuth callback:', error);
      const redirectUrl = `${process.env.FRONTEND_URL || '/'}/auth/error?error=${encodeURIComponent(error.message)}`;
      res.redirect(redirectUrl);
    }
  },
  
  /**
   * Check if the user is authenticated
   * @param req Express request object
   * @param res Express response object
   */
  async checkAuthStatus(req: Express.Request, res: Express.Response): Promise<void> {
    try {
      // If the user is authenticated with Firebase, return their profile
      if (req.user) {
        // Check if the user has linked their Google account
        const hasGoogleAccount = await userService.hasLinkedGoogleAccount(req.user.uid);
        
        res.status(200).json({
          authenticated: true,
          user: {
            uid: req.user.uid,
            email: req.user.email,
            displayName: req.user.displayName || 'User',
            photoURL: req.user.photoURL,
            googleLinked: hasGoogleAccount
          }
        });
        return;
      }
      
      // If not authenticated with Firebase, check for session-based authentication (legacy)
      let tokens = req.session.tokens;
      const userId = req.sessionID;
      
      // If not in session, try to get from Firestore
      if (!tokens && userId) {
        tokens = await authService.getTokensFromFirestore(userId);
        
        // If found in Firestore, store in session for future use
        if (tokens !== null && tokens !== undefined) {
          req.session.tokens = tokens;
          console.log('Retrieved tokens from Firestore and stored in session');
        }
      }
      
      if (!tokens) {
        res.status(200).json({ authenticated: false });
        return;
      }
      
      // Check if the tokens are valid by getting user info
      try {
        const userInfo = await authService.getUserInfo(tokens, userId);
        
        // Return authentication status and basic user info
        res.status(200).json({
          authenticated: true,
          legacy: true, // Indicate this is legacy session-based auth
          user: {
            email: userInfo.emailAddresses?.[0]?.value || 'Unknown',
            displayName: userInfo.names?.[0]?.displayName || 'Unknown',
            photoURL: userInfo.photos?.[0]?.url || null,
            googleLinked: true
          }
        });
      } catch (error) {
        console.error('Error validating tokens:', error);
        
        // Tokens are invalid or expired
        res.status(200).json({ authenticated: false });
      }
    } catch (error: any) {
      console.error('Error checking authentication status:', error);
      res.status(500).json({ error: 'Failed to check authentication status' });
    }
  },
  
  /**
   * Logout the user
   * @param req Express request object
   * @param res Express response object
   */
  async logout(req: Express.Request, res: Express.Response): Promise<void> {
    try {
      // Handle Firebase authenticated users
      if (req.user) {
        const uid = req.user.uid;
        
        // Check if the user has Google tokens
        const hasGoogleAccount = await userService.hasLinkedGoogleAccount(uid);
        
        if (hasGoogleAccount) {
          // Get the tokens
          const tokens = await userService.getUserTokens(uid);
          
          if (tokens) {
            // Revoke the tokens but don't delete them
            await authService.revokeTokens(uid, tokens);
          }
        }
        
        // We don't actually delete the Firebase user or their tokens
        // Just let the frontend handle the sign-out
      } else {
        // Legacy session-based authentication
        const tokens = req.session.tokens;
        const userId = req.sessionID;
        
        if (tokens && userId) {
          // Revoke the tokens and remove from storage
          await authService.revokeTokens(userId, tokens);
        }
      }
      
      // Clear the session
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
        }
      });
      
      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error: any) {
      console.error('Error logging out:', error);
      res.status(500).json({ error: 'Failed to log out' });
    }
  },
  
  /**
   * Link a Google account to a Firebase user
   * @param req Express request object
   * @param res Express response object
   */
  async linkGoogleAccount(req: Express.Request, res: Express.Response): Promise<void> {
    try {
      // This endpoint should be protected by requireAuth middleware
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      
      // Redirect to Google OAuth flow, storing the user ID in the session
      req.session.oauthUserId = req.user.uid;
      
      // Call the googleAuth method to handle the redirect
      await this.googleAuth(req, res);
    } catch (error: any) {
      console.error('Error initiating Google account linking:', error);
      res.status(500).json({ error: 'Failed to initiate Google account linking' });
    }
  },
  
  /**
   * Unlink a Google account from a Firebase user
   * @param req Express request object
   * @param res Express response object
   */
  async unlinkGoogleAccount(req: Express.Request, res: Express.Response): Promise<void> {
    try {
      // This endpoint should be protected by requireAuth middleware
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      
      // Unlink the Google account
      await userService.unlinkGoogleAccount(req.user.uid);
      
      res.status(200).json({ success: true, message: 'Google account unlinked successfully' });
    } catch (error: any) {
      console.error('Error unlinking Google account:', error);
      res.status(500).json({ error: 'Failed to unlink Google account' });
    }
  }
};
