# Frontend Testing Guide for Dottie AI Assistant

This document provides guidance on testing the Dottie AI Assistant frontend, including both manual testing with mock services and automated testing approaches.

## Table of Contents

- [Manual Testing with Mock Services](#manual-testing-with-mock-services)
- [Mock Implementation Details](#mock-implementation-details)
- [Testing Firebase Authentication](#testing-firebase-authentication)
- [Testing Google Workspace Integration](#testing-google-workspace-integration)
- [Automated Testing](#automated-testing)
- [Known Limitations](#known-limitations)

## Manual Testing with Mock Services

The Dottie frontend can be tested without real API credentials using mock implementations of Firebase Authentication and Google Workspace services.

### Running the Frontend Test Environment

1. Ensure you have the test environment files in place:
   ```
   c:\Users\ber\dottie-test-temp\
   ```

2. Run the frontend test script:
   ```powershell
   powershell -File c:\Users\ber\dottie-test-temp\run-frontend-test.ps1
   ```

3. The script will:
   - Set up environment files for both frontend and backend
   - Create necessary entry point files if they don't exist
   - Start the Vite development server

4. Access the application at `http://localhost:5173` or the URL shown in the console output

### Test Scenarios

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

## Mock Implementation Details

### Firebase Authentication Mock

The mock Firebase implementation (`src/lib/mockFirebase.ts`) provides:

- Mock user authentication state
- Sign in/sign out functionality
- User profile information

```typescript
// Example mock user data
const mockUser = {
  uid: 'mock-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: '...',
  // Other Firebase User properties
};
```

### Google Workspace API Mocks

The mock chat service (`src/services/mockChatService.ts`) simulates:

- AI responses based on message content
- Function calls for different Google Workspace services
- Conversation state management

Example mock responses include:

- Email listing (when asking about emails)
- Calendar events (when asking about schedule)
- Spreadsheet creation (when asking about reports/data)
- Email drafting (when asking to compose emails)

## Testing Firebase Authentication

To test the Firebase authentication flow:

1. Click the "Sign in with Google" button
2. The mock implementation will simulate a successful sign-in
3. The UI should update to show the authenticated user
4. Test the sign-out functionality to ensure it properly resets the auth state

## Testing Google Workspace Integration

Test the Google Workspace integration by sending these example queries:

1. **Email Testing**
   - "Show me my recent emails"
   - "Do I have any unread messages?"

2. **Calendar Testing**
   - "What's on my calendar today?"
   - "Schedule a meeting for tomorrow"

3. **Spreadsheet Testing**
   - "Create a spreadsheet for Q1 sales data"
   - "Show me my recent spreadsheets"

4. **Email Composition**
   - "Draft an email to John about the project status"
   - "Help me write a follow-up email"

## Automated Testing

While the current implementation focuses on manual testing, the following automated testing approaches are planned:

1. **Unit Tests**
   - Component testing with React Testing Library
   - Service and utility function tests with Jest

2. **Integration Tests**
   - Testing component interactions
   - Testing service integrations

3. **End-to-End Tests**
   - Full application flow testing with Cypress
   - User journey testing

## Known Limitations

The current mock implementation has several limitations:

1. **Limited Response Variety**
   - Mock responses are predefined and not dynamic
   - Limited set of recognized queries

2. **Simplified Authentication**
   - No token refresh handling
   - No error scenarios for authentication

3. **Basic Function Call Visualization**
   - Limited data visualization options
   - No interactive elements in function results

4. **No Persistent State**
   - Conversation history is not persisted between sessions
   - User preferences are not saved

These limitations are tracked in the technical debt register and will be addressed in future updates.

---

For more information on the overall testing strategy, see [TESTING.md](TESTING.md).
