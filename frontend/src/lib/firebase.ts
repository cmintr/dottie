// Firebase configuration and initialization
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { mockAuth } from './mockFirebase';

// Check if we're in development mode and should use mock implementations
const useMocks = true; // Always use mocks for testing

// Firebase configuration
// These values should be replaced with actual values from your Firebase project
// and stored in environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'mock-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'mock-project.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'mock-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'mock-project.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef123456'
};

// Initialize Firebase
let app: FirebaseApp | undefined = undefined;
if (!useMocks) {
  app = initializeApp(firebaseConfig);
}

// Initialize Firebase Authentication and get a reference to the service
export const auth: Auth = useMocks ? mockAuth as unknown as Auth : getAuth(app);

export default app;
