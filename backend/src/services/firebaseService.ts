import * as admin from 'firebase-admin';
import { UserRecord } from 'firebase-admin/auth';

/**
 * Service for interacting with Firebase Authentication
 */
class FirebaseService {
  private initialized = false;

  /**
   * Initialize Firebase Admin SDK
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }

    try {
      // Check if running in a GCP environment (Cloud Run, etc.)
      const useDefaultCredentials = process.env.NODE_ENV === 'production' || 
                                   process.env.USE_GCP_DEFAULT_CREDENTIALS === 'true';
      
      if (useDefaultCredentials) {
        // In production or when specified, use default credentials
        admin.initializeApp({
          projectId: process.env.GOOGLE_CLOUD_PROJECT,
        });
        console.log('Firebase Admin initialized with default credentials');
      } else {
        // In development, use service account key file if provided
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
        
        if (serviceAccountPath) {
          // Use service account file - updated for Firebase Admin v11
          try {
            const serviceAccount = require(serviceAccountPath);
            admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
              projectId: process.env.GOOGLE_CLOUD_PROJECT,
            });
            console.log('Firebase Admin initialized with service account file');
          } catch (error) {
            console.error('Error loading service account file:', error);
            // Fallback to application default credentials
            admin.initializeApp({
              projectId: process.env.GOOGLE_CLOUD_PROJECT,
            });
            console.log('Failed to load service account, using application default credentials');
          }
        } else {
          // Fallback to application default credentials
          admin.initializeApp({
            projectId: process.env.GOOGLE_CLOUD_PROJECT,
          });
          console.log('Firebase Admin initialized with application default credentials');
        }
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing Firebase Admin:', error);
      throw new Error('Failed to initialize Firebase Admin');
    }
  }

  /**
   * Get Firebase Auth instance
   * @returns Firebase Auth instance
   */
  getAuth(): admin.auth.Auth {
    if (!this.initialized) {
      this.initialize();
    }
    return admin.auth();
  }

  /**
   * Get Firebase Firestore instance
   * @returns Firebase Firestore instance
   */
  getFirestore(): admin.firestore.Firestore {
    if (!this.initialized) {
      this.initialize();
    }
    return admin.firestore();
  }

  /**
   * Verify a Firebase ID token
   * @param idToken Firebase ID token
   * @returns Decoded token with user information
   */
  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      const auth = this.getAuth();
      return await auth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Error verifying Firebase ID token:', error);
      throw new Error('Invalid or expired Firebase ID token');
    }
  }

  /**
   * Get user by ID
   * @param uid User ID
   * @returns User record
   */
  async getUserById(uid: string): Promise<UserRecord> {
    try {
      const auth = this.getAuth();
      return await auth.getUser(uid);
    } catch (error) {
      console.error(`Error getting user by ID ${uid}:`, error);
      throw new Error('User not found');
    }
  }

  /**
   * Get user by email
   * @param email User email
   * @returns User record
   */
  async getUserByEmail(email: string): Promise<UserRecord> {
    try {
      const auth = this.getAuth();
      return await auth.getUserByEmail(email);
    } catch (error) {
      console.error(`Error getting user by email ${email}:`, error);
      throw new Error('User not found');
    }
  }

  /**
   * Create a new user
   * @param userData User data
   * @returns Created user record
   */
  async createUser(userData: {
    email: string;
    password?: string;
    displayName?: string;
    photoURL?: string;
  }): Promise<UserRecord> {
    try {
      const auth = this.getAuth();
      return await auth.createUser(userData);
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  /**
   * Update user
   * @param uid User ID
   * @param userData User data to update
   * @returns Updated user record
   */
  async updateUser(uid: string, userData: {
    email?: string;
    displayName?: string;
    photoURL?: string;
    disabled?: boolean;
  }): Promise<UserRecord> {
    try {
      const auth = this.getAuth();
      return await auth.updateUser(uid, userData);
    } catch (error) {
      console.error(`Error updating user ${uid}:`, error);
      throw new Error('Failed to update user');
    }
  }

  /**
   * Delete user
   * @param uid User ID
   */
  async deleteUser(uid: string): Promise<void> {
    try {
      const auth = this.getAuth();
      await auth.deleteUser(uid);
    } catch (error) {
      console.error(`Error deleting user ${uid}:`, error);
      throw new Error('Failed to delete user');
    }
  }

  /**
   * Create a custom token for a user
   * @param uid User ID
   * @param claims Additional claims to include in the token
   * @returns Custom token
   */
  async createCustomToken(uid: string, claims?: Record<string, any>): Promise<string> {
    try {
      const auth = this.getAuth();
      return await auth.createCustomToken(uid, claims);
    } catch (error) {
      console.error(`Error creating custom token for user ${uid}:`, error);
      throw new Error('Failed to create custom token');
    }
  }
}

// Export a singleton instance
export const firebaseService = new FirebaseService();
