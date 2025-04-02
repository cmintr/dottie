# Firebase Authentication for Dottie AI Assistant

This guide provides detailed information on how Firebase Authentication is implemented and used in the Dottie AI Assistant backend.

## Overview

Firebase Authentication provides a secure and easy-to-use authentication system for the Dottie AI Assistant. It handles user registration, login, and session management, allowing the application to focus on its core functionality.

## Firebase Authentication Setup

### Prerequisites

Before using Firebase Authentication, you need to:

1. Create a Firebase project (see [Firebase Configuration](../deployment/03-firebase-configuration.md))
2. Enable authentication methods in the Firebase Console
3. Set up the Firebase Admin SDK in your application

### Firebase Configuration

The Firebase configuration is stored in environment variables:

```
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
FIREBASE_APP_ID=your-app-id
```

### Firebase Admin SDK Setup

The Firebase Admin SDK is initialized in the `firebaseService.ts` file:

```typescript
import * as admin from 'firebase-admin';
import * as serviceAccount from '../config/firebase-service-account.json';

class FirebaseService {
  constructor() {
    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
      });
    }
  }
  
  // Service methods...
}

export const firebaseService = new FirebaseService();
```

## Authentication Flow

### User Registration and Login

The client application handles user registration and login using the Firebase Authentication client SDK. The backend doesn't need to implement these flows directly.

### Token Verification

When a client makes a request to the backend, it includes a Firebase ID token in the Authorization header. The backend verifies this token using the Firebase Admin SDK:

```typescript
async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  try {
    // Verify the ID token
    const decodedToken = await admin.auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    throw new Error('Invalid Firebase ID token');
  }
}
```

### Authentication Middleware

The `verifyFirebaseAuth` middleware extracts and verifies the Firebase ID token from the Authorization header:

```typescript
export const verifyFirebaseAuth = async (req: Express.Request, res: Express.Response, next: NextFunction): Promise<void> => {
  try {
    // Get the ID token from the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, but we'll continue (unauthenticated access)
      return next();
    }
    
    // Extract the token
    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      // No token provided, but we'll continue (unauthenticated access)
      return next();
    }
    
    try {
      // Verify the ID token
      const decodedToken = await firebaseService.verifyIdToken(idToken);
      
      // Add the user to the request
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email || undefined,
        displayName: decodedToken.name,
        photoURL: decodedToken.picture
      };
      
      // Continue to the next middleware or route handler
      next();
    } catch (error) {
      // Invalid token, but we'll continue (unauthenticated access)
      console.warn('Invalid Firebase ID token:', error);
      next();
    }
  } catch (error) {
    console.error('Error in Firebase authentication middleware:', error);
    next();
  }
};
```

### Protecting Routes

The `requireAuth` middleware ensures that a user is authenticated before accessing protected routes:

```typescript
export const requireAuth = (req: Express.Request, res: Express.Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized. Authentication required.' });
    return;
  }
  
  next();
};
```

## User Management

Firebase Authentication provides several methods for managing users:

### Creating Users

```typescript
async createUser(email: string, password: string): Promise<admin.auth.UserRecord> {
  try {
    const userRecord = await admin.auth.createUser({
      email,
      password,
      emailVerified: false
    });
    return userRecord;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}
```

### Getting User Information

```typescript
async getUser(uid: string): Promise<admin.auth.UserRecord> {
  try {
    const userRecord = await admin.auth.getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
}
```

### Updating User Information

```typescript
async updateUser(uid: string, updates: admin.auth.UpdateRequest): Promise<admin.auth.UserRecord> {
  try {
    const userRecord = await admin.auth.updateUser(uid, updates);
    return userRecord;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}
```

### Deleting Users

```typescript
async deleteUser(uid: string): Promise<void> {
  try {
    await admin.auth.deleteUser(uid);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}
```

## Custom Tokens

Firebase Authentication allows you to create custom tokens for special authentication scenarios:

```typescript
async createCustomToken(uid: string, claims?: object): Promise<string> {
  try {
    const customToken = await admin.auth.createCustomToken(uid, claims);
    return customToken;
  } catch (error) {
    console.error('Error creating custom token:', error);
    throw error;
  }
}
```

## Session Management

Firebase Authentication handles session management automatically. The client SDK manages the user's session and refreshes the ID token as needed.

## Security Considerations

### Token Expiration

Firebase ID tokens expire after one hour. The client SDK automatically refreshes the token when needed.

### Token Verification

Always verify Firebase ID tokens on the server side before granting access to protected resources.

### Secure Storage

Store Firebase service account credentials securely and never expose them to the client.

## Troubleshooting

### Common Issues

#### "Firebase is not initialized" error

Ensure that the Firebase Admin SDK is initialized correctly and that the service account credentials are valid.

#### "Invalid Firebase ID token" error

Check that the client is sending a valid Firebase ID token and that it hasn't expired.

#### "User not found" error

Ensure that the user exists in your Firebase project.

## Next Steps

Once you understand Firebase Authentication, proceed to [Google OAuth Integration](./02-google-oauth.md) to learn how Google OAuth is integrated with Firebase Authentication.
