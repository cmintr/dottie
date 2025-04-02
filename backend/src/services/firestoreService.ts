import { Firestore } from '@google-cloud/firestore';
import { GoogleTokens } from './authService';
import * as admin from 'firebase-admin'; // Add this line

/**
 * Interface for user token document in Firestore
 */
interface UserTokenDocument {
  userId: string;
  tokens: GoogleTokens;
  createdAt: admin.firestore.Timestamp; // Update this line
  updatedAt: admin.firestore.Timestamp; // Update this line
}

/**
 * Service for interacting with Firestore database
 * Handles persistent storage of user tokens and other data
 */
export class FirestoreService {
  private firestore: Firestore;
  private readonly userTokensCollection = 'userTokens';
  
  constructor() {
    // Initialize Firestore client
    // In production, this would use GCP credentials
    // For development, it uses application default credentials or environment variables
    this.firestore = new Firestore({
      // Optional: projectId can be specified explicitly or from environment variable
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
    });
    
    console.log('Firestore service initialized');
  }
  
  /**
   * Store or update Google OAuth tokens for a user
   * @param userId User identifier (can be session ID initially)
   * @param tokens Google OAuth tokens
   * @returns Promise resolving to the document ID
   */
  async storeUserTokens(userId: string, tokens: GoogleTokens): Promise<string> {
    try {
      // Reference to the user's tokens document
      const userTokenRef = this.firestore.collection(this.userTokensCollection).doc(userId);
      
      // Create or update the document
      const now = admin.firestore.Timestamp.now(); // Update this line
      
      // Check if document exists
      const doc = await userTokenRef.get();
      
      if (doc.exists) {
        // Update existing document
        await userTokenRef.update({
          tokens: tokens,
          updatedAt: now, // Update this line
        });
        console.log(`Updated tokens for user ${userId}`);
      } else {
        // Create new document
        await userTokenRef.set({
          userId: userId,
          tokens: tokens,
          createdAt: now, // Update this line
          updatedAt: now, // Update this line
        });
        console.log(`Stored new tokens for user ${userId}`);
      }
      
      return userId;
    } catch (error) {
      console.error('Error storing user tokens:', error);
      throw new Error('Failed to store user tokens in Firestore');
    }
  }
  
  /**
   * Retrieve Google OAuth tokens for a user
   * @param userId User identifier
   * @returns Promise resolving to the tokens or null if not found
   */
  async getUserTokens(userId: string): Promise<GoogleTokens | null> {
    try {
      // Reference to the user's tokens document
      const userTokenRef = this.firestore.collection(this.userTokensCollection).doc(userId);
      
      // Get the document
      const doc = await userTokenRef.get();
      
      if (!doc.exists) {
        console.log(`No tokens found for user ${userId}`);
        return null;
      }
      
      const data = doc.data() as UserTokenDocument;
      console.log(`Retrieved tokens for user ${userId}`);
      
      return data.tokens;
    } catch (error) {
      console.error('Error retrieving user tokens:', error);
      throw new Error('Failed to retrieve user tokens from Firestore');
    }
  }
  
  /**
   * Update Google OAuth tokens for a user
   * This is specifically for token refresh operations
   * @param userId User identifier
   * @param newTokens New or partial token data
   * @returns Promise resolving to success boolean
   */
  async updateUserTokens(userId: string, newTokens: Partial<GoogleTokens>): Promise<boolean> {
    try {
      // Reference to the user's tokens document
      const userTokenRef = this.firestore.collection(this.userTokensCollection).doc(userId);
      
      // Get the current document
      const doc = await userTokenRef.get();
      
      if (!doc.exists) {
        console.error(`Cannot update tokens: No tokens found for user ${userId}`);
        return false;
      }
      
      // Get current tokens
      const data = doc.data() as UserTokenDocument;
      const currentTokens = data.tokens;
      
      // Merge current tokens with new token data
      const updatedTokens: GoogleTokens = {
        ...currentTokens,
        ...newTokens,
        // Ensure refresh_token is preserved if not provided in newTokens
        refresh_token: newTokens.refresh_token || currentTokens.refresh_token,
      };
      
      // Update the document
      await userTokenRef.update({
        'tokens': updatedTokens,
        'updatedAt': admin.firestore.Timestamp.now(), // Update this line
      });
      
      console.log(`Updated tokens for user ${userId} after refresh`);
      return true;
    } catch (error) {
      console.error('Error updating user tokens:', error);
      throw new Error('Failed to update user tokens in Firestore');
    }
  }
  
  /**
   * Delete Google OAuth tokens for a user
   * Used for logout or token revocation
   * @param userId User identifier
   * @returns Promise resolving to success boolean
   */
  async deleteUserTokens(userId: string): Promise<boolean> {
    try {
      // Reference to the user's tokens document
      const userTokenRef = this.firestore.collection(this.userTokensCollection).doc(userId);
      
      // Delete the document
      await userTokenRef.delete();
      
      console.log(`Deleted tokens for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error deleting user tokens:', error);
      throw new Error('Failed to delete user tokens from Firestore');
    }
  }
}

// Export a singleton instance
export const firestoreService = new FirestoreService();
