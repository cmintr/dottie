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
  async getGoogleOAuth2Client(): Promise<OAuth2Client> {
    try {
      // Get client ID and redirect URI from environment variables
      const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
      const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
      
      // Get client secret from Secret Manager
      let clientSecret;
      if (process.env.NODE_ENV === 'production') {
        // In production, fetch from Secret Manager
        clientSecret = await secretManagerService.getSecret('google-oauth-client-secret');
      } else {
        // In development, can use environment variable
        clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
      }

      if (!clientId || !clientSecret || !redirectUri) {
        throw new Error('Missing required OAuth 2.0 configuration. Check environment variables or Secret Manager.');
      }

      // Handle type compatibility issue with different versions of the OAuth2Client type
      // by first casting to unknown and then to OAuth2Client
      return new google.auth.OAuth2(clientId, clientSecret, redirectUri) as unknown as OAuth2Client;
    } catch (error) {
      console.error('Failed to initialize OAuth client:', error);
      throw new Error('Authentication service configuration error');
    }
  }

  /**
   * Generate a Google OAuth 2.0 authorization URL with the provided state parameter
   * @param state CSRF protection state parameter
   * @returns Authorization URL
   */
  async generateGoogleAuthUrl(state: string): Promise<string> {
    // Create OAuth 2.0 client
    const oauth2Client = await this.getGoogleOAuth2Client();
    
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
      const oauth2Client = await this.getGoogleOAuth2Client();
      
      // Exchange the authorization code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      
      // Log success without exposing token details
      console.log('Successfully exchanged authorization code for tokens', {
        userId,
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'unknown'
      });
      
      // Verify we have the required tokens
      if (!tokens.access_token) {
        throw new Error('No access token received from Google OAuth');
      }
      
      // Store the tokens in Firestore
      const googleTokens: GoogleTokens = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope || '',
        token_type: tokens.token_type || 'Bearer',
        expiry_date: tokens.expiry_date || 0
      };
      
      await firestoreService.storeUserTokens(userId, googleTokens);
      
      return googleTokens;
    } catch (error) {
      console.error('Failed to exchange authorization code for tokens:', error);
      throw new Error('Failed to authenticate with Google');
    }
  }

  /**
   * Create an authenticated Google API client with the provided tokens
   * Handles token refresh automatically when needed
   * @param tokens Google OAuth 2.0 tokens
   * @param userId User identifier for storing refreshed tokens
   * @param onTokensRefreshed Optional callback for token refresh notification
   * @returns Authenticated OAuth2Client
   */
  async createAuthenticatedClient(
    tokens: GoogleTokens,
    userId: string,
    onTokensRefreshed?: TokenUpdateCallback
  ): Promise<OAuth2Client> {
    try {
      // Create OAuth 2.0 client
      const oauth2Client = await this.getGoogleOAuth2Client();
      
      // Set the credentials from the stored tokens
      oauth2Client.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date
      });
      
      // Set up token refresh listener
      oauth2Client.on('tokens', async (newTokens) => {
        console.log('Tokens refreshed', { userId });
        
        // Update the tokens object with new values
        if (newTokens.access_token) {
          tokens.access_token = newTokens.access_token;
        }
        
        if (newTokens.expiry_date) {
          tokens.expiry_date = newTokens.expiry_date;
        }
        
        // Only update refresh_token if a new one was provided
        if (newTokens.refresh_token) {
          tokens.refresh_token = newTokens.refresh_token;
        }
        
        // Store updated tokens in Firestore
        try {
          await firestoreService.storeUserTokens(userId, tokens);
          console.log('Updated tokens stored in Firestore', { userId });
        } catch (storeError) {
          console.error('Failed to store refreshed tokens:', storeError);
        }
        
        // Call the optional callback if provided
        if (onTokensRefreshed) {
          onTokensRefreshed(newTokens);
        }
      });
      
      // Proactively refresh if token is close to expiry (within 5 minutes)
      const now = Date.now();
      if (tokens.expiry_date && tokens.expiry_date < now + 5 * 60 * 1000) {
        try {
          console.log('Proactively refreshing token near expiry', { userId });
          await oauth2Client.refreshAccessToken();
        } catch (refreshError) {
          console.error('Failed to proactively refresh token:', refreshError);
          // Continue with the existing token, it might still work
        }
      }
      
      return oauth2Client;
    } catch (error) {
      console.error('Failed to create authenticated client:', error);
      throw new Error('Failed to authenticate with Google APIs');
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
      const oauth2Client = await this.createAuthenticatedClient(tokens, userId, onTokensRefreshed);
      
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
      const oauth2Client = await this.getGoogleOAuth2Client();
      
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
