# Firebase Configuration for Dottie AI Assistant

This guide provides detailed instructions for configuring Firebase for the Dottie AI Assistant backend. Firebase is used for authentication, user management, and data storage.

## Creating a Firebase Project

### 1. Create a New Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "Dottie AI Assistant")
4. Choose whether to enable Google Analytics (recommended)
5. Accept the terms and click "Create project"
6. Wait for the project to be created, then click "Continue"

### 2. Register Your Web Application

1. From the Firebase project dashboard, click the web icon (</>) to add a web app
2. Enter a nickname for your app (e.g., "Dottie Web App")
3. Check the box for "Also set up Firebase Hosting" if you plan to use Firebase Hosting
4. Click "Register app"
5. Copy the Firebase configuration object (you'll need this for your `.env` file)
6. Click "Continue to console"

## Setting Up Firebase Authentication

### 1. Enable Email/Password Authentication

1. In the Firebase console, navigate to "Authentication" from the left sidebar
2. Click the "Sign-in method" tab
3. Click on "Email/Password"
4. Toggle the "Enable" switch to on
5. Click "Save"

### 2. Enable Google Authentication

1. In the "Sign-in method" tab, click on "Google"
2. Toggle the "Enable" switch to on
3. Enter a project support email
4. Click "Save"

### 3. Configure OAuth Consent Screen

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" > "OAuth consent screen"
4. Select "External" user type (unless you're using Google Workspace)
5. Click "Create"
6. Fill in the required information:
   - App name: "Dottie AI Assistant"
   - User support email: your email address
   - Developer contact information: your email address
7. Click "Save and Continue"
8. Add the following scopes:
   - `./auth/userinfo.email`
   - `./auth/userinfo.profile`
   - `./auth/calendar`
   - `./auth/gmail.send`
   - `./auth/gmail.readonly`
   - `./auth/spreadsheets`
9. Click "Save and Continue"
10. Add test users if you're in testing mode
11. Click "Save and Continue"
12. Review your settings and click "Back to Dashboard"

### 4. Create OAuth Client ID

1. In the Google Cloud Console, navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Enter a name (e.g., "Dottie Web Client")
5. Add authorized JavaScript origins:
   - For development: `http://localhost:3000`
   - For production: `https://your-domain.com`
6. Add authorized redirect URIs:
   - For development: `http://localhost:3000/auth/google/callback`
   - For production: `https://your-domain.com/auth/google/callback`
7. Click "Create"
8. Copy the Client ID and Client Secret (you'll need these for your `.env` file)

## Setting Up Firestore Database

### 1. Create a Firestore Database

1. In the Firebase console, navigate to "Firestore Database" from the left sidebar
2. Click "Create database"
3. Choose "Start in production mode" (recommended for security)
4. Select a location for your database (choose the region closest to your users)
5. Click "Enable"

### 2. Set Up Firestore Security Rules

1. In the Firestore Database section, click the "Rules" tab
2. Replace the default rules with the following:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles can be read by anyone but only written by the authenticated user
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
      
      // Tokens can only be accessed by the authenticated user
      match /tokens/{tokenId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Other collections can be added with appropriate rules
  }
}
```

3. Click "Publish"

### 3. Create Firestore Indexes (if needed)

If your application requires complex queries, you may need to create indexes:

1. In the Firestore Database section, click the "Indexes" tab
2. Click "Add index"
3. Select the collection, fields, and query scope as needed
4. Click "Create index"

## Setting Up Firebase Storage (Optional)

If your application needs to store files:

1. In the Firebase console, navigate to "Storage" from the left sidebar
2. Click "Get started"
3. Choose "Start in production mode" (recommended for security)
4. Select a location for your storage bucket
5. Click "Done"

### Set Up Storage Security Rules

1. In the Storage section, click the "Rules" tab
2. Replace the default rules with the following:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click "Publish"

## Setting Up Firebase Admin SDK

### 1. Generate a Service Account Key

1. In the Firebase console, navigate to Project Settings (gear icon)
2. Click the "Service accounts" tab
3. Click "Generate new private key" under the Firebase Admin SDK section
4. Click "Generate key"
5. Save the JSON file securely (this is your service account key)

### 2. Configure the Service Account in Your Application

1. Rename the downloaded JSON file to `firebase-service-account.json`
2. Place it in the `backend/config` directory of your project
3. Make sure this file is included in your `.gitignore` to prevent it from being committed to version control

## Configuring Environment Variables

Update your `.env` file with the Firebase configuration:

```
# Firebase Configuration
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
FIREBASE_APP_ID=your-app-id

# Google OAuth Configuration
GOOGLE_OAUTH_CLIENT_ID=your-oauth-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-oauth-client-secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

Replace the placeholder values with your actual configuration values.

## Verifying Firebase Configuration

To verify that your Firebase configuration is working correctly:

1. Start your application:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to http://localhost:3000/auth/status

3. You should see a JSON response indicating that you're not authenticated

4. Try the authentication flow by navigating to http://localhost:3000/auth/google

5. After successful authentication, you should be redirected back to your application

## Troubleshooting

### Common Issues

#### CORS Errors

If you encounter CORS errors:

1. Go to the Google Cloud Console
2. Navigate to "APIs & Services" > "Credentials"
3. Edit your OAuth client ID
4. Ensure that your domain is listed in the authorized JavaScript origins
5. Ensure that your callback URL is listed in the authorized redirect URIs

#### Authentication Errors

If authentication fails:

1. Check that your OAuth client ID and secret are correct in your `.env` file
2. Verify that you've enabled the Google sign-in method in Firebase Authentication
3. Check that your redirect URI matches exactly what's configured in the Google Cloud Console

#### Firestore Access Errors

If you can't access Firestore:

1. Check that your service account key is correctly placed in the `config` directory
2. Verify that your Firestore security rules allow the operations you're trying to perform
3. Check that you've initialized the Firebase Admin SDK correctly in your code

## Next Steps

Once you have configured Firebase, proceed to [Google API Setup](./04-google-api-setup.md) to configure the Google APIs for Gmail, Calendar, and Sheets integration.
