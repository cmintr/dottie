import { ApiService } from './api';

/**
 * Interface for authentication status response
 */
interface AuthStatusResponse {
  authenticated: boolean;
  user?: {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
  };
  googleLinked?: boolean;
}

/**
 * Interface for Google auth URL response
 */
interface GoogleAuthUrlResponse {
  authUrl: string;
}

/**
 * Service for authentication-related API calls
 */
export class AuthService {
  /**
   * Check the user's authentication status
   * @returns Promise with authentication status information
   */
  static async checkStatus(): Promise<AuthStatusResponse> {
    try {
      return await ApiService.get<AuthStatusResponse>('/auth/status');
    } catch (error) {
      console.error('Error checking auth status:', error);
      return { authenticated: false };
    }
  }

  /**
   * Get Google OAuth authorization URL
   * @returns Promise with Google auth URL
   */
  static async getGoogleAuthUrl(): Promise<string> {
    try {
      const response = await ApiService.get<GoogleAuthUrlResponse>('/auth/google');
      return response.authUrl;
    } catch (error) {
      console.error('Error getting Google auth URL:', error);
      throw error;
    }
  }

  /**
   * Initiate Google account linking process
   * Redirects the user to the Google authorization page
   */
  static async linkGoogleAccount(): Promise<void> {
    try {
      const authUrl = await this.getGoogleAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error linking Google account:', error);
      throw error;
    }
  }
}
