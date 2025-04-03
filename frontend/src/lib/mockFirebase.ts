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
    currentUser = mockUser;
    authStateListeners.forEach(listener => listener(currentUser));
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
    currentUser = null;
    authStateListeners.forEach(listener => listener(null));
    return Promise.resolve();
  }
};

// Mock Google provider
export class MockGoogleAuthProvider {
  addScope() {
    return this;
  }
  setCustomParameters() {
    return this;
  }
}

export default mockAuth;
