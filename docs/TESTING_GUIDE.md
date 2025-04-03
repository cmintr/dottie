# Dottie AI Assistant - Comprehensive Testing Guide

This guide provides a consolidated reference for all testing approaches and environments for the Dottie AI Assistant application.

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Test Environments](#test-environments)
3. [Local Testing Setup](#local-testing-setup)
4. [Unit Testing](#unit-testing)
5. [Integration Testing](#integration-testing)
6. [End-to-End Testing](#end-to-end-testing)
7. [Frontend Testing](#frontend-testing)
8. [Enhanced Testing Environment](#enhanced-testing-environment)
9. [Performance Testing](#performance-testing)
10. [Security Testing](#security-testing)
11. [Troubleshooting](#troubleshooting)

## Testing Strategy

Our testing approach follows a comprehensive strategy that includes:

1. **Unit Testing**: Testing individual components and functions in isolation
2. **Integration Testing**: Testing interactions between components
3. **End-to-End Testing**: Testing complete user flows
4. **Performance Testing**: Measuring and optimizing application performance
5. **Security Testing**: Identifying and addressing security vulnerabilities

## Test Environments

- **Local Development**: Individual developer machines
- **Enhanced Testing Environment**: Local environment with advanced mock services
- **CI/CD Pipeline**: Automated tests run on each commit
- **Staging Environment**: Pre-production testing environment
- **Production Environment**: Live application monitoring

## Local Testing Setup

### Prerequisites

Before starting local testing, ensure you have:

1. **Node.js v20+** installed (verify with `node -v`)
2. **Git** for version control
3. **Google Cloud SDK** installed and configured
4. **Firebase CLI** installed (`npm install -g firebase-tools`)
5. **Java JDK** (required for Firebase emulators)

### Environment Variables

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

### Google Application Default Credentials (ADC)

For local development, authenticate with your Google account:

```powershell
gcloud auth application-default login
```

This will open a browser window for authentication. After completing the process, credentials will be stored locally for Google Cloud client libraries to use.

### Firebase Emulator Setup

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

### Running the Application Locally

1. **Start Firebase Emulators**

```powershell
cd c:\Users\ber\dottie
firebase emulators:start
```

2. **Start the Backend Server**

```powershell
cd c:\Users\ber\dottie\backend
npm install
npm run dev
```

3. **Start the Frontend Development Server**

```powershell
cd c:\Users\ber\dottie\frontend
npm install
npm run dev
```

## Unit Testing

### Backend Unit Tests

Backend unit tests use Jest and focus on testing individual functions and services.

#### Running Backend Tests

```bash
cd backend
npm test
```

#### Key Test Areas

- Authentication middleware
- Error handling middleware
- Service integrations
- Utility functions
- API controllers

#### Writing Backend Tests

Example of a service test:

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GmailService } from '../services/gmailService';

describe('GmailService', () => {
  let gmailService: GmailService;
  let mockGoogleClient: any;

  beforeEach(() => {
    mockGoogleClient = {
      gmail: jest.fn().mockReturnValue({
        users: {
          messages: {
            list: jest.fn().mockResolvedValue({ data: { messages: [] } }),
          },
        },
      }),
    };
    gmailService = new GmailService(mockGoogleClient);
  });

  it('should list messages', async () => {
    const result = await gmailService.listMessages('user@example.com');
    expect(result).toEqual([]);
    expect(mockGoogleClient.gmail).toHaveBeenCalled();
  });
});
```

### Frontend Unit Tests

Frontend unit tests use Vitest and React Testing Library to test React components and hooks.

#### Running Frontend Tests

```bash
cd frontend
npm test
```

#### Key Test Areas

- Authentication components
- Chat interface
- Voice input/output
- Service layer
- Utility functions

#### Writing Frontend Tests

Example of a component test:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInput } from '../components/ChatInput';

describe('ChatInput', () => {
  it('should render the input field', () => {
    render(<ChatInput onSendMessage={() => {}} />);
    const inputElement = screen.getByPlaceholderText(/type a message/i);
    expect(inputElement).toBeInTheDocument();
  });

  it('should call onSendMessage when submit button is clicked', () => {
    const mockSendMessage = vi.fn();
    render(<ChatInput onSendMessage={mockSendMessage} />);
    
    const inputElement = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(inputElement, { target: { value: 'Hello' } });
    
    const submitButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(submitButton);
    
    expect(mockSendMessage).toHaveBeenCalledWith('Hello');
  });
});
```

## Integration Testing

Integration tests verify that different parts of the application work together correctly.

### Backend Integration Tests

Backend integration tests use Supertest to test API endpoints.

#### Running Backend Integration Tests

```bash
cd backend
npm run test:integration
```

#### Key Test Areas

- API endpoints
- Authentication flow
- Error handling
- Database interactions

### Frontend Integration Tests

Frontend integration tests focus on component interactions and data flow.

#### Running Frontend Integration Tests

```bash
cd frontend
npm run test:integration
```

#### Key Test Areas

- Authentication flow
- Chat conversation flow
- Voice interaction
- Error handling

## End-to-End Testing

End-to-end tests verify complete user flows from frontend to backend.

### Setting Up E2E Tests

We use Cypress for end-to-end testing:

```bash
cd frontend
npm run test:e2e
```

### Key Test Scenarios

1. **User Authentication**
   - Sign up
   - Sign in
   - Sign out
   - Password reset

2. **Chat Interaction**
   - Sending messages
   - Receiving responses
   - Function call visualization
   - Error handling

3. **Google Workspace Integration**
   - Email management
   - Calendar operations
   - Spreadsheet creation and editing
   - Document collaboration

## Frontend Testing

### Manual Testing with Mock Services

The Dottie frontend can be tested without real API credentials using mock implementations of Firebase Authentication and Google Workspace services.

#### Mock Implementation Details

The mock Firebase implementation (`src/lib/mockFirebase.ts`) provides:
- Mock user authentication state
- Sign in/sign out functionality
- User profile information

The mock chat service (`src/services/mockChatService.ts`) simulates:
- AI responses based on message content
- Function calls for different Google Workspace services
- Conversation state management

#### Test Scenarios

The mock environment supports the following test scenarios:

1. **Authentication Flow**
   - Sign in with Google (mock)
   - View authentication status
   - Sign out

2. **Chat Interface**
   - Send text messages
   - Receive AI responses
   - View message history

3. **Google Workspace Integration**
   - Email management (viewing, composing)
   - Calendar events (viewing, scheduling)
   - Spreadsheet creation and viewing

4. **Function Call Visualization**
   - Email list display
   - Calendar event display
   - Spreadsheet data visualization
   - Email draft composition

## Enhanced Testing Environment

For more advanced testing scenarios, we provide an enhanced testing environment with additional mock responses, network delay simulation, error simulation, and conversation history storage.

### Setup

To start the enhanced testing environment:

1. Run the `start-enhanced-testing.bat` script from the project root directory:
   ```
   ./start-enhanced-testing.bat
   ```

2. The script will:
   - Set the necessary environment variables
   - Start the frontend application in enhanced testing mode
   - Open your default browser to the application

For detailed information on the enhanced testing environment, refer to the [Enhanced Testing Guide](./ENHANCED_TESTING_GUIDE.md).

## Performance Testing

Performance testing ensures the application meets performance requirements under various conditions.

### Key Performance Metrics

- **Response Time**: Time taken to respond to user requests
- **Load Handling**: System behavior under increased load
- **Resource Utilization**: CPU, memory, and network usage
- **Scalability**: Performance as user base grows

### Performance Testing Tools

- **Lighthouse**: For frontend performance metrics
- **Artillery**: For API load testing
- **Google Cloud Monitoring**: For production performance monitoring

## Security Testing

Security testing identifies and addresses potential vulnerabilities in the application.

### Key Security Test Areas

- **Authentication**: Ensuring secure user authentication
- **Authorization**: Verifying proper access controls
- **Data Protection**: Ensuring sensitive data is protected
- **API Security**: Protecting against common API vulnerabilities
- **Dependency Scanning**: Checking for vulnerable dependencies

### Security Testing Tools

- **OWASP ZAP**: For automated security scanning
- **npm audit**: For dependency vulnerability checks
- **Firebase Security Rules Testing**: For testing Firestore security rules

## Troubleshooting

### Common Testing Issues

#### CORS Issues

If you encounter CORS errors:

1. Check that the backend CORS configuration includes all frontend origins
2. Verify that the request includes the correct origin header
3. Ensure the backend CORS middleware is configured correctly

#### Authentication Issues

If authentication fails:

1. Check that OAuth credentials are correctly configured
2. Verify that redirect URIs match in both frontend and backend
3. Ensure Firebase configuration is correct
4. Check for token expiration and refresh logic

#### API Connection Issues

If the frontend cannot connect to the backend:

1. Verify that the backend server is running
2. Check that the API URL in the frontend configuration is correct
3. Look for network errors in the browser console
4. Ensure there are no firewall or proxy issues

#### Mock Service Issues

If mock services are not working correctly:

1. Check that mock mode is enabled in the environment configuration
2. Verify that mock implementations are complete and up-to-date
3. Check the browser console for errors
4. Ensure the mock service is correctly imported and initialized

For additional troubleshooting guidance, contact the development team or refer to the project's internal documentation.
