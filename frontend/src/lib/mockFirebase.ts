// Mock Firebase implementation for testing
import { User, IdTokenResult } from 'firebase/auth';

// Mock user data
const mockUser: User = {
  uid: 'mock-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://ui-avatars.com/api/?name=Test+User&background=0D8ABC&color=fff',
  emailVerified: true,
  isAnonymous: false,
  phoneNumber: null,
  providerId: 'google.com',
  metadata: {
    creationTime: Date.now().toString(),
    lastSignInTime: Date.now().toString()
  },
  providerData: [],
  refreshToken: 'mock-refresh-token',
  tenantId: null,
  delete: async () => Promise.resolve(),
  getIdToken: async () => 'mock-id-token',
  getIdTokenResult: async (): Promise<IdTokenResult> => ({
    token: 'mock-id-token',
    signInProvider: 'google.com',
    expirationTime: new Date(Date.now() + 3600000).toISOString(),
    issuedAtTime: new Date().toISOString(),
    authTime: new Date().toISOString(),
    signInSecondFactor: null,
    claims: {}
  }),
  reload: async () => Promise.resolve(),
  toJSON: () => ({})
};

// Mock auth state
let currentUser: User | null = null;
const authStateListeners: Array<(user: User | null) => void> = [];

// Export direct mock sign-in and sign-out functions for easier testing
export const mockSignIn = async (): Promise<void> => {
  console.log("Mock signIn function called directly");
  currentUser = mockUser;
  authStateListeners.forEach(listener => listener(currentUser));
  return Promise.resolve();
};

export const mockSignOut = async (): Promise<void> => {
  console.log("Mock signOut function called directly");
  currentUser = null;
  authStateListeners.forEach(listener => listener(null));
  return Promise.resolve();
};

// Mock auth functions
export const mockAuth = {
  currentUser,
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    authStateListeners.push(callback);
    // Simulate auth state change after a short delay
    setTimeout(() => callback(currentUser), 500);
    
    // Return unsubscribe function
    return () => {
      const index = authStateListeners.indexOf(callback);
      if (index !== -1) authStateListeners.splice(index, 1);
    };
  },
  signInWithPopup: async () => {
    console.log("Mock signInWithPopup called");
    // Set the current user
    currentUser = mockUser;
    
    // Notify all listeners of the auth state change
    console.log("Notifying auth state listeners with user:", currentUser);
    authStateListeners.forEach(listener => listener(currentUser));
    
    // Return a mock credential
    return {
      user: mockUser,
      credential: {
        accessToken: 'mock-access-token',
        idToken: 'mock-id-token',
        providerId: 'google.com',
        signInMethod: 'google.com'
      }
    };
  },
  signOut: async () => {
    console.log("Mock signOut called");
    // Clear the current user
    currentUser = null;
    
    // Notify all listeners of the auth state change
    console.log("Notifying auth state listeners with null user");
    authStateListeners.forEach(listener => listener(null));
    
    return Promise.resolve();
  }
};

export default mockAuth;
