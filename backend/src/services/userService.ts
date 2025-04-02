import { firebaseService } from './firebaseService';
import { firestoreService } from './firestoreService';
import { GoogleTokens } from './authService';

/**
 * User profile information
 */
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt?: Date;
  lastLoginAt?: Date;
}

/**
 * Service for user management
 */
class UserService {
  /**
   * Get user profile by ID
   * @param uid User ID
   * @returns User profile
   */
  async getUserProfile(uid: string): Promise<UserProfile> {
    try {
      const userRecord = await firebaseService.getUserById(uid);
      
      return {
        uid: userRecord.uid,
        email: userRecord.email || '',
        displayName: userRecord.displayName || undefined,
        photoURL: userRecord.photoURL || undefined,
        createdAt: userRecord.metadata.creationTime ? new Date(userRecord.metadata.creationTime) : undefined,
        lastLoginAt: userRecord.metadata.lastSignInTime ? new Date(userRecord.metadata.lastSignInTime) : undefined
      };
    } catch (error) {
      console.error(`Error getting user profile for ${uid}:`, error);
      throw new Error('Failed to get user profile');
    }
  }

  /**
   * Store user tokens in Firestore using the user's UID
   * @param uid User ID
   * @param tokens Google OAuth tokens
   * @returns User ID
   */
  async storeUserTokens(uid: string, tokens: GoogleTokens): Promise<string> {
    try {
      return await firestoreService.storeUserTokens(uid, tokens);
    } catch (error) {
      console.error(`Error storing tokens for user ${uid}:`, error);
      throw new Error('Failed to store user tokens');
    }
  }

  /**
   * Get user tokens from Firestore
   * @param uid User ID
   * @returns Google OAuth tokens or undefined if not found
   */
  async getUserTokens(uid: string): Promise<GoogleTokens | undefined> {
    try {
      const tokens = await firestoreService.getUserTokens(uid);
      return tokens || undefined;
    } catch (error) {
      console.error(`Error getting tokens for user ${uid}:`, error);
      return undefined;
    }
  }

  /**
   * Update user tokens in Firestore
   * @param uid User ID
   * @param tokens Partial Google OAuth tokens to update
   * @returns Success status
   */
  async updateUserTokens(uid: string, tokens: Partial<GoogleTokens>): Promise<boolean> {
    try {
      await firestoreService.updateUserTokens(uid, tokens);
      return true;
    } catch (error) {
      console.error(`Error updating tokens for user ${uid}:`, error);
      throw new Error('Failed to update user tokens');
    }
  }

  /**
   * Delete user tokens from Firestore
   * @param uid User ID
   * @returns Success status
   */
  async deleteUserTokens(uid: string): Promise<boolean> {
    try {
      await firestoreService.deleteUserTokens(uid);
      return true;
    } catch (error) {
      console.error(`Error deleting tokens for user ${uid}:`, error);
      throw new Error('Failed to delete user tokens');
    }
  }

  /**
   * Link Google account to user
   * This associates Google OAuth tokens with a Firebase user
   * @param uid User ID
   * @param tokens Google OAuth tokens
   * @returns Success status
   */
  async linkGoogleAccount(uid: string, tokens: GoogleTokens): Promise<boolean> {
    try {
      // Store tokens in Firestore under the user's UID
      await this.storeUserTokens(uid, tokens);
      
      // Update user profile with Google information if available
      // This would typically come from getUserInfo in authService
      // but for now we'll just return success
      
      return true;
    } catch (error) {
      console.error(`Error linking Google account for user ${uid}:`, error);
      throw new Error('Failed to link Google account');
    }
  }

  /**
   * Unlink Google account from user
   * This removes the association between a Firebase user and their Google account
   * @param uid User ID
   * @returns Success status
   */
  async unlinkGoogleAccount(uid: string): Promise<boolean> {
    try {
      // Delete tokens from Firestore
      await this.deleteUserTokens(uid);
      
      return true;
    } catch (error) {
      console.error(`Error unlinking Google account for user ${uid}:`, error);
      throw new Error('Failed to unlink Google account');
    }
  }

  /**
   * Check if user has linked their Google account
   * @param uid User ID
   * @returns True if Google account is linked
   */
  async hasLinkedGoogleAccount(uid: string): Promise<boolean> {
    try {
      const tokens = await this.getUserTokens(uid);
      return !!tokens;
    } catch (error) {
      console.error(`Error checking Google account link for user ${uid}:`, error);
      return false;
    }
  }
}

// Export a singleton instance
export const userService = new UserService();
