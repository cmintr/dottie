import { google } from 'googleapis';
import { OAuth2Client, Credentials } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid';
import { secretManagerService } from './secretManagerService';
import { firestoreService } from './firestoreService';

/**
 * Google API scopes required for Dottie AI Assistant
 * These determine what resources the application can access on behalf of the user
 */
export const GOOGLE_API_SCOPES = [
  'https://www.googleapis.com/auth/calendar',          // Full access to Google Calendar
  'https://www.googleapis.com/auth/gmail.send',        // Send emails via Gmail
  'https://www.googleapis.com/auth/gmail.readonly',    // Read emails via Gmail
  'https://www.googleapis.com/auth/spreadsheets',      // Read/write access to Google Sheets
  'https://www.googleapis.com/auth/userinfo.email',    // Get user's email address
  'https://www.googleapis.com/auth/userinfo.profile',  // Get user's basic profile info
];

/**
 * Token response from Google OAuth 2.0
 */
export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

/**
 * Callback function type for updating tokens when they are refreshed
 */
export type TokenUpdateCallback = (newTokens: Credentials) => void;

/**
 * Service for handling Google OAuth 2.0 authentication
 */
export class AuthService {
  /**
   * Create a new Google OAuth 2.0 client
   * @returns OAuth2Client instance
   */
  getGoogleOAuth2Client(): OAuth2Client {
    // For initial implementation, use environment variables directly
    // In production, these would be retrieved from Secret Manager
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Missing required OAuth 2.0 configuration. Check environment variables.');
    }

    // Handle type compatibility issue with different versions of the OAuth2Client type
    // by first casting to unknown and then to OAuth2Client
    return new google.auth.OAuth2(clientId, clientSecret, redirectUri) as unknown as OAuth2Client;
  }

  /**
   * Generate a Google OAuth 2.0 authorization URL with the provided state parameter
   * @param state CSRF protection state parameter
   * @returns Authorization URL
   */
  generateGoogleAuthUrl(state: string): string {
    // Create OAuth 2.0 client
    const oauth2Client = this.getGoogleOAuth2Client();
    
    // Generate the authorization URL
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',      // Request a refresh token for offline access
      scope: GOOGLE_API_SCOPES,    // Specify required API scopes
      prompt: 'consent',           // Force consent screen to ensure refresh token
      state: state,                // Include state parameter for CSRF protection
      include_granted_scopes: true // Include previously granted scopes
    });
    
    return url;
  }

  /**
   * Exchange an authorization code for access and refresh tokens
   * This is called after the user grants permission and is redirected back to our application
   * @param code Authorization code from Google OAuth 2.0 redirect
   * @param userId User identifier (can be session ID initially)
   * @returns Promise resolving to the token response
   */
  async exchangeCodeForTokens(code: string, userId: string): Promise<GoogleTokens> {
    try {
      // Create OAuth 2.0 client
      const oauth2Client = this.getGoogleOAuth2Client();
      
      // Exchange the authorization code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      
      // Log the tokens (for development only - remove in production)
      console.log('Received tokens from Google:');
      console.log('Access Token:', tokens.access_token ? 'Present' : 'Missing');
      console.log('Refresh Token:', tokens.refresh_token ? 'Present' : 'Missing');
      console.log('Expiry Date:', tokens.expiry_date);
      
      // Convert to our GoogleTokens interface
      const googleTokens: GoogleTokens = {
        access_token: tokens.access_token as string,
        refresh_token: tokens.refresh_token as string | undefined,
        scope: tokens.scope as string,
        token_type: tokens.token_type as string,
        expiry_date: tokens.expiry_date as number,
      };
      
      // Store tokens in Firestore
      if (userId) {
        try {
          await this.storeTokensInFirestore(userId, googleTokens);
          console.log(`Tokens stored in Firestore for user ${userId}`);
        } catch (firestoreError) {
          console.error('Error storing tokens in Firestore:', firestoreError);
          // Continue even if Firestore storage fails
          // The tokens will still be returned and stored in session
        }
      }
      
      return googleTokens;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Create an authenticated OAuth 2.0 client using stored tokens
   * This will be used by service methods that need to make authenticated API calls
   * @param tokens Access and refresh tokens
   * @param userId User identifier for persistent storage
   * @param onTokensRefreshed Optional callback function to update tokens when refreshed
   * @returns Authenticated OAuth2Client instance
   */
  createAuthenticatedClient(
    tokens: GoogleTokens, 
    userId?: string,
    onTokensRefreshed?: TokenUpdateCallback
  ): OAuth2Client {
    if (!tokens || !tokens.access_token) {
      throw new Error('Invalid tokens provided. Access token is required.');
    }

    try {
      // Create a new OAuth2 client
      const oauth2Client = this.getGoogleOAuth2Client();
      
      // Set the credentials on the OAuth 2.0 client
      // This includes the refresh_token which enables automatic token refresh
      oauth2Client.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        token_type: tokens.token_type,
        scope: tokens.scope
      });
      
      // Add a listener for token refresh events
      // Note: This event is triggered when the access token is automatically refreshed
      oauth2Client.on('tokens', (newTokens) => {
        console.log('Google tokens refreshed!', new Date().toISOString());
        
        // Create an updated tokens object that preserves the original refresh token
        // if a new one isn't provided (which is the common case)
        const updatedTokens: Partial<GoogleTokens> = {
          access_token: newTokens.access_token as string,
          expiry_date: newTokens.expiry_date as number,
          // Only update refresh_token if a new one was provided
          refresh_token: newTokens.refresh_token ? (newTokens.refresh_token as string) : tokens.refresh_token,
          // Only update these if provided
          scope: newTokens.scope ? (newTokens.scope as string) : tokens.scope,
          token_type: newTokens.token_type ? (newTokens.token_type as string) : tokens.token_type
        };
        
        // If a new refresh token is provided (rare), log it
        if (newTokens.refresh_token) {
          console.log('Received a new refresh token. This will be stored securely.');
        }
        
        // Log the new access token and expiry date
        console.log('New access token received with expiry:', newTokens.expiry_date);
        
        // Update tokens in Firestore if userId is provided
        if (userId) {
          this.storeTokensInFirestore(userId, updatedTokens as GoogleTokens)
            .then(() => {
              console.log(`Updated tokens in Firestore for user ${userId}`);
            })
            .catch((error) => {
              console.error(`Error updating tokens in Firestore for user ${userId}:`, error);
            });
        }
        
        // Call the callback function if provided to update the session/database
        if (onTokensRefreshed) {
          console.log('Calling token update callback to persist refreshed tokens...');
          onTokensRefreshed(updatedTokens);
        } else {
          console.warn('Token refresh occurred, but no callback provided to update session/storage.');
          console.log('Need to update stored tokens (session/DB) with:', {
            access_token: updatedTokens.access_token ? '(new token)' : '(unchanged)',
            refresh_token: updatedTokens.refresh_token !== tokens.refresh_token ? '(new token)' : '(unchanged)',
            expiry_date: updatedTokens.expiry_date
          });
        }
      });
      
      console.log('Created authenticated client with access token and refresh capability');
      
      return oauth2Client;
    } catch (error) {
      console.error('Error creating authenticated client:', error);
      throw new Error('Failed to create authenticated client');
    }
  }

  /**
   * Store tokens in Firestore for a user
   * @param userId User ID to store tokens for
   * @param tokens Tokens to store
   * @returns Promise resolving to success status
   */
  async storeTokensInFirestore(userId: string, tokens: GoogleTokens): Promise<boolean> {
    try {
      await firestoreService.storeUserTokens(userId, tokens);
      return true;
    } catch (error) {
      console.error('Error storing tokens in Firestore:', error);
      return false;
    }
  }

  /**
   * Get user information using the provided access token
   * @param tokens Access and refresh tokens
   * @param userId User identifier for persistent storage
   * @param onTokensRefreshed Optional callback function to update tokens when refreshed
   * @returns Promise resolving to user information
   */
  async getUserInfo(
    tokens: GoogleTokens, 
    userId?: string,
    onTokensRefreshed?: TokenUpdateCallback
  ): Promise<any> {
    try {
      // Create authenticated client with token refresh callback
      const oauth2Client = this.createAuthenticatedClient(tokens, userId, onTokensRefreshed);
      
      // Create Google People API client
      // Fix for TypeScript error: Use the correct overload for people API
      const people = google.people({
        version: 'v1',
        auth: oauth2Client as any // Type cast to any to avoid TypeScript error
      });
      
      // Get user information
      const userInfo = await people.people.get({
        resourceName: 'people/me',
        personFields: 'emailAddresses,names,photos'
      });
      
      return userInfo.data;
    } catch (error) {
      console.error('Error getting user info:', error);
      throw new Error('Failed to get user information');
    }
  }

  /**
   * Get tokens from Firestore for a user
   * @param userId User ID to get tokens for
   * @returns Tokens if found, undefined if not found
   */
  async getTokensFromFirestore(userId: string): Promise<GoogleTokens | undefined> {
    try {
      const userTokens = await firestoreService.getUserTokens(userId);
      
      if (!userTokens) {
        return undefined;
      }
      
      return userTokens as GoogleTokens;
    } catch (error) {
      console.error('Error getting tokens from Firestore:', error);
      return undefined;
    }
  }

  /**
   * Revoke Google OAuth tokens and remove them from storage
   * @param userId User identifier
   * @param tokens Tokens to revoke
   * @returns Promise resolving to success boolean
   */
  async revokeTokens(userId: string, tokens: GoogleTokens): Promise<boolean> {
    try {
      // Create OAuth 2.0 client
      const oauth2Client = this.getGoogleOAuth2Client();
      
      // Revoke access token
      if (tokens.access_token) {
        try {
          await oauth2Client.revokeToken(tokens.access_token);
          console.log('Access token revoked successfully');
        } catch (error) {
          console.error('Error revoking access token:', error);
          // Continue even if revocation fails
        }
      }
      
      // Revoke refresh token if present
      if (tokens.refresh_token) {
        try {
          await oauth2Client.revokeToken(tokens.refresh_token);
          console.log('Refresh token revoked successfully');
        } catch (error) {
          console.error('Error revoking refresh token:', error);
          // Continue even if revocation fails
        }
      }
      
      // Delete tokens from Firestore
      try {
        await firestoreService.deleteUserTokens(userId);
        console.log(`Tokens deleted from Firestore for user ${userId}`);
      } catch (error) {
        console.error('Error deleting tokens from Firestore:', error);
        // Continue even if deletion fails
      }
      
      return true;
    } catch (error) {
      console.error('Error revoking tokens:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const authService = new AuthService();
