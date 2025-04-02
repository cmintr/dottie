# Dottie AI Assistant - Local Testing Guide

This guide provides detailed instructions for testing the Dottie AI Assistant locally on a Windows development environment before deploying to GCP.

## Prerequisites

Before starting local testing, ensure you have:

1. **Node.js v20+** installed (verify with `node -v`)
2. **Git** for version control
3. **Google Cloud SDK** installed and configured
4. **Firebase CLI** installed (`npm install -g firebase-tools`)
5. **Java JDK** (required for Firebase emulators)

## Setting Up the Local Environment

### 1. Environment Variables

#### Backend Configuration

Create a `.env` file in the `backend` directory:

```
# Server Configuration
NODE_ENV=development
PORT=8080
LOG_LEVEL=debug

# GCP Configuration
GCP_PROJECT_ID=your-gcp-project-id
REGION=us-central1

# Authentication
SESSION_SECRET=your-random-session-secret
GOOGLE_OAUTH_CLIENT_ID=your-oauth-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-oauth-client-secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8080/api/auth/google/callback

# Firebase
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIRESTORE_EMULATOR_HOST=localhost:8080

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# API Keys (if applicable)
TAVILY_API_KEY=your-tavily-api-key
```

#### Frontend Configuration

Create a `.env` file in the `frontend` directory:

```
# API Configuration
VITE_API_URL=http://localhost:8080
VITE_ENVIRONMENT=development

# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id

# Emulator Configuration
VITE_USE_EMULATORS=true
VITE_AUTH_EMULATOR_URL=http://localhost:9099
VITE_FIRESTORE_EMULATOR_URL=http://localhost:8080

# Mock Configuration (optional)
VITE_MOCK_API=false
```

### 2. Google Application Default Credentials (ADC)

For local development, authenticate with your Google account:

```powershell
gcloud auth application-default login
```

This will open a browser window for authentication. After completing the process, credentials will be stored locally for Google Cloud client libraries to use.

### 3. OAuth Redirect URI Configuration

In the Google Cloud Console:

1. Go to **APIs & Services** > **Credentials**
2. Edit your OAuth 2.0 Client ID
3. Add `http://localhost:8080/api/auth/google/callback` to the Authorized Redirect URIs
4. Save the changes

### 4. Firebase Emulator Setup

Set up Firebase emulators for local testing:

```powershell
cd c:\Users\ber\dottie
firebase login
firebase init emulators
```

When prompted:
- Select Authentication, Firestore, and Functions emulators
- Accept default ports or specify custom ones
- Choose whether to download emulators now

Create a `firebase.json` file (if not created by the init command):

```json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

## Running the Application Locally

### 1. Start Firebase Emulators

```powershell
cd c:\Users\ber\dottie
firebase emulators:start
```

This will start the Firebase emulators. You can access the emulator UI at http://localhost:4000

### 2. Start the Backend Server

```powershell
cd c:\Users\ber\dottie\backend
npm install
npm run dev
```

The backend server will start on http://localhost:8080 (or the port specified in your `.env` file)

### 3. Start the Frontend Development Server

```powershell
cd c:\Users\ber\dottie\frontend
npm install
npm run dev
```

The frontend development server will start, typically on http://localhost:5173 or http://localhost:3000

## What Can Be Tested Locally

### 1. Frontend UI and Interactions

- Complete UI rendering and responsiveness
- Component interactions and state management
- Form validation and submission
- Navigation and routing
- Error handling and display

### 2. Authentication Flows

- Firebase Authentication (using emulator)
- Google OAuth flow (using real Google authentication)
- Token verification and session management
- Protected route access control

### 3. Google Workspace Integration

Using your authenticated Google account, you can test:
- Gmail API integration
- Google Calendar API integration
- Google Sheets API integration
- OAuth token refresh logic

### 4. Chat Interface

- Natural language input processing
- Response rendering
- Message history display
- Loading states and error handling

### 5. Voice Features

- Speech recognition (browser's Web Speech API)
- Text-to-speech output
- Voice command processing

### 6. Data Persistence

- Firestore read/write operations (using emulator)
- User preference storage
- Conversation history

## Mocking Strategies

For components that are difficult to test with real services, implement mocking:

### 1. Frontend API Mocking

Create a mock API service in `frontend/src/services/mockApi.ts`:

```typescript
// Example mock implementation
export const fetchChatResponse = async (message: string) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock response based on message content
  if (message.toLowerCase().includes('email')) {
    return {
      type: 'email',
      content: 'Here are your recent emails...',
      data: [
        { id: '1', subject: 'Project Update', from: 'john@example.com', date: '2025-04-01' },
        { id: '2', subject: 'Meeting Notes', from: 'sarah@example.com', date: '2025-03-30' }
      ]
    };
  }
  
  if (message.toLowerCase().includes('calendar')) {
    return {
      type: 'calendar',
      content: 'Here are your upcoming events...',
      data: [
        { id: '1', title: 'Team Meeting', start: '2025-04-03T10:00:00', end: '2025-04-03T11:00:00' },
        { id: '2', title: 'Project Review', start: '2025-04-04T14:00:00', end: '2025-04-04T15:30:00' }
      ]
    };
  }
  
  return {
    type: 'text',
    content: 'I\'m a mock response. I can help with emails, calendar, and more.'
  };
};
```

Enable mocking with an environment variable toggle in your API service:

```typescript
import * as mockApi from './mockApi';

export const fetchChatResponse = async (message: string) => {
  if (import.meta.env.VITE_MOCK_API === 'true') {
    return mockApi.fetchChatResponse(message);
  }
  
  // Real API implementation
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  
  return response.json();
};
```

### 2. Backend Service Mocking

Create mock implementations of Google services in `backend/src/services/mocks/`:

```typescript
// mockGmailService.ts
export const listMessages = async (userId: string, query?: string) => {
  return {
    messages: [
      { id: 'msg1', threadId: 'thread1' },
      { id: 'msg2', threadId: 'thread2' }
    ],
    nextPageToken: null
  };
};

export const getMessage = async (userId: string, messageId: string) => {
  return {
    id: messageId,
    threadId: 'thread1',
    labelIds: ['INBOX'],
    snippet: 'This is a sample email...',
    payload: {
      headers: [
        { name: 'From', value: 'John Doe <john@example.com>' },
        { name: 'Subject', value: 'Project Update' },
        { name: 'Date', value: 'Tue, 1 Apr 2025 10:00:00 +0000' }
      ],
      body: { data: 'SGVsbG8sIHRoaXMgaXMgYSB0ZXN0IGVtYWlsLg==' } // Base64 "Hello, this is a test email."
    }
  };
};
```

Use environment variables to toggle between real and mock services:

```typescript
// gmailService.ts
import * as mockGmailService from './mocks/mockGmailService';

export const listMessages = async (userId: string, query?: string) => {
  if (process.env.USE_MOCK_SERVICES === 'true') {
    return mockGmailService.listMessages(userId, query);
  }
  
  // Real implementation using Google APIs
  // ...
};
```

## Testing Specific Features

### 1. Testing Authentication

1. Open the application in your browser
2. Click "Sign In" or "Login"
3. If using emulators, you'll be directed to the Firebase Auth Emulator
4. Create a test user or use an existing one
5. Verify that you can access protected routes after authentication

### 2. Testing Google OAuth Integration

1. Ensure you've configured the OAuth redirect URI in Google Cloud Console
2. In the application, click "Connect Google Account" or similar
3. Complete the Google authentication flow
4. Verify that you're redirected back to the application
5. Check that Google service integrations work with your account

### 3. Testing Chat Interface

1. Enter natural language queries in the chat input
2. Test various query types:
   - "Show me my recent emails"
   - "What's on my calendar today?"
   - "Create a new spreadsheet for project expenses"
3. Verify that responses are rendered correctly
4. Test error handling by triggering known error conditions

### 4. Testing Voice Features

1. Click the microphone icon or voice input button
2. Speak a command or query
3. Verify that speech is recognized correctly
4. Check that responses are spoken aloud (if text-to-speech is enabled)

## Automated Testing

### Running Unit Tests

```powershell
# Backend tests
cd c:\Users\ber\dottie\backend
npm test

# Frontend tests
cd c:\Users\ber\dottie\frontend
npm test
```

### Running End-to-End Tests

With the application running locally:

```powershell
cd c:\Users\ber\dottie\frontend
npm run test:e2e
```

## Troubleshooting Common Issues

### CORS Errors

If you see CORS errors in the browser console:

1. Verify that `ALLOWED_ORIGINS` in the backend `.env` includes your frontend URL
2. Check that your API requests include the correct headers
3. Ensure the backend CORS middleware is configured correctly

### Authentication Issues

If authentication fails:

1. Check that Firebase emulators are running
2. Verify that environment variables for Firebase are set correctly
3. For Google OAuth issues, confirm the redirect URI is authorized in Google Cloud Console
4. Clear browser cookies and local storage if you encounter persistent issues

### API Connection Problems

If frontend cannot connect to backend:

1. Verify that backend server is running
2. Check that `VITE_API_URL` points to the correct backend URL
3. Ensure there are no network issues (firewalls, VPNs)
4. Check for errors in the backend console

### Google API Integration Issues

If Google API calls fail:

1. Verify that you've run `gcloud auth application-default login`
2. Check that OAuth scopes are configured correctly
3. Ensure the Google APIs are enabled in your GCP project
4. Verify that your OAuth credentials are correct

## Conclusion

Local testing is a crucial step before deploying to GCP. By following this guide, you can thoroughly test the Dottie AI Assistant on your Windows machine, including the frontend UI, authentication flows, and integration with Google services.

Remember to use mocking strategies for components that are difficult to test locally, and leverage Firebase emulators to avoid interacting with production services during development.

If you encounter issues not covered in this guide, check the project documentation or reach out to the development team for assistance.
