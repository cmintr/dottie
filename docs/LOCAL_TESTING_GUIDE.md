# Dottie AI Assistant - Comprehensive Local Testing Guide

This guide provides detailed instructions for conducting thorough local testing of the Dottie AI Assistant application, including advanced testing scenarios and troubleshooting.

## Table of Contents

1. [Basic Setup](#basic-setup)
2. [Advanced Testing Scenarios](#advanced-testing-scenarios)
3. [Mocking Different User Profiles](#mocking-different-user-profiles)
4. [Testing Edge Cases](#testing-edge-cases)
5. [Performance Testing](#performance-testing)
6. [Troubleshooting](#troubleshooting)
7. [Extending the Mock Services](#extending-the-mock-services)

## Basic Setup

### Prerequisites

- Node.js (v18 or later)
- npm (v9 or later)
- Git
- Modern web browser (Chrome, Firefox, or Edge recommended)

### Initial Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/cmintr/dottie.git
   cd dottie
   ```

2. **Install dependencies**:
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Start the application**:
   ```bash
   # Start the frontend development server
   cd frontend
   npm run dev
   ```

4. **Access the application**:
   - Open your browser and navigate to http://localhost:5173/
   - Click "Sign in with Google" to authenticate with the mock user

## Advanced Testing Scenarios

### 1. Testing Different Message Types

Test the application's ability to handle various message types:

#### Email Queries
- "Show me my recent emails"
- "Do I have any unread messages?"
- "Show emails from John"
- "Find emails about the project meeting"

#### Calendar Queries
- "What's on my calendar today?"
- "Show my meetings for tomorrow"
- "When is my next meeting with Sarah?"
- "Schedule a team meeting for next Tuesday at 2pm"

#### Spreadsheet Queries
- "Create a spreadsheet for Q1 sales data"
- "Show me my recent spreadsheets"
- "Make a budget tracker spreadsheet"
- "Create a project timeline spreadsheet"

#### Email Composition
- "Draft an email to John about the project status"
- "Write a follow-up email to the marketing team"
- "Compose a meeting invitation for tomorrow"
- "Draft a thank you email to the client"

### 2. Testing UI Components

Verify that all UI components function correctly:

#### Chat Interface
- Messages should alternate between user (right) and assistant (left)
- Long messages should wrap properly
- Messages should be properly timestamped
- Scrolling should work smoothly with many messages

#### Function Call Results
- Email lists should display sender, subject, and snippet
- Calendar events should show title, time, and location
- Spreadsheets should display data in a formatted table
- Email drafts should show recipient, subject, and body

#### Authentication Components
- Sign-in button should show loading state when clicked
- User profile should display correctly after sign-in
- Sign-out should clear the authentication state
- Header should adapt to authentication state changes

## Mocking Different User Profiles

You can modify the mock user profile to test different scenarios:

1. **Edit the mock user data**:
   Open `frontend/src/lib/mockFirebase.ts` and modify the `mockUser` object:

   ```typescript
   // Example: Change to a different user
   const mockUser: User = {
     uid: 'mock-user-456',
     email: 'jane.doe@example.com',
     displayName: 'Jane Doe',
     photoURL: 'https://ui-avatars.com/api/?name=Jane+Doe&background=EA4335&color=fff',
     // Other properties remain the same
   };
   ```

2. **Add multiple mock users**:
   You can extend the mock implementation to support multiple users:

   ```typescript
   // Add to mockFirebase.ts
   const mockUsers = {
     default: { /* current mock user */ },
     premium: { 
       uid: 'premium-user-789',
       email: 'premium@example.com',
       displayName: 'Premium User',
       // Other properties
     }
   };
   
   // Then modify mockSignIn to accept a user type
   export const mockSignIn = async (userType = 'default'): Promise<void> => {
     currentUser = mockUsers[userType] || mockUsers.default;
     // Rest of the function
   };
   ```

3. **Test different authentication states**:
   - New users vs. returning users
   - Users with different permission levels
   - Users with different profile completeness

## Testing Edge Cases

### 1. Error Handling

Test how the application handles various error scenarios:

#### Network Issues
- Disconnect your internet and test the application behavior
- Simulate slow connections using browser developer tools

#### Invalid Queries
- Send empty messages
- Send extremely long messages (1000+ characters)
- Send messages with special characters or code snippets

#### Authentication Errors
- Modify the mock implementation to simulate authentication failures
- Test token expiration scenarios

### 2. Accessibility Testing

Verify that the application is accessible to all users:

- Test keyboard navigation throughout the application
- Verify proper focus management
- Check color contrast ratios
- Test with screen readers

### 3. Responsive Design Testing

Test the application on different screen sizes:

- Desktop (1920×1080, 1366×768)
- Tablet (768×1024)
- Mobile (375×667, 360×640)
- Use browser developer tools to simulate different devices

## Performance Testing

### 1. Load Testing

Test the application's performance under load:

- Generate a large number of messages (100+)
- Test with large function call results (50+ emails, events)
- Monitor memory usage in browser developer tools

### 2. Rendering Performance

Measure and optimize rendering performance:

- Use Chrome Performance tab to record interactions
- Look for long tasks and rendering bottlenecks
- Test animations and transitions for smoothness

## Troubleshooting

### Common Issues and Solutions

#### Sign-In Not Working
- Check browser console for authentication errors
- Verify that mockFirebase.ts is properly exporting the mock functions
- Ensure AuthContext is correctly using the mock implementation

#### Function Call Results Not Displaying
- Check that the message parsing logic is working correctly
- Verify that the mock data format matches what the UI expects
- Look for CSS issues that might be hiding the results

#### UI Rendering Issues
- Clear browser cache and reload
- Check for CSS conflicts
- Verify that the correct CSS classes are being applied

### Debugging Tools

- **Browser Developer Tools**: Use for inspecting elements, network requests, and JavaScript errors
- **React Developer Tools**: Install as a browser extension to inspect component state and props
- **Console Logging**: Check the extensive console logs added to the authentication flow

## Extending the Mock Services

### 1. Adding New Mock Data

You can extend the mock data to test more scenarios:

1. **Add new email templates**:
   Edit `frontend/src/services/mockChatService.ts` to add more email variations:

   ```typescript
   // Add to mockResponses
   emailImportant: {
     response: "Here are your important emails:",
     functionCalls: [
       {
         name: "getEmails",
         arguments: { important: true, limit: 3 },
         result: [
           // New mock emails
         ]
       }
     ]
   }
   ```

2. **Add new calendar event types**:
   Add different types of calendar events (all-day events, recurring meetings, etc.)

3. **Add more complex spreadsheet data**:
   Create mock spreadsheets with charts, formulas, or multiple sheets

### 2. Creating Custom Test Scenarios

Develop specific test scenarios for thorough testing:

1. **Create a test script file**:
   ```typescript
   // frontend/src/tests/scenarios/emailWorkflow.ts
   export const runEmailWorkflow = async (sendMessage) => {
     // 1. Ask for recent emails
     await sendMessage("Show me my recent emails");
     
     // 2. Ask to draft a reply to the first email
     await sendMessage("Draft a reply to the first email");
     
     // 3. Ask to schedule a meeting based on the email
     await sendMessage("Schedule a follow-up meeting");
     
     return "Email workflow test completed";
   };
   ```

2. **Add a UI for running test scenarios**:
   Create a testing panel that can trigger these scenarios automatically

### 3. Simulating Backend API Behavior

For more realistic testing, simulate actual backend API behavior:

1. **Add request delays**:
   ```typescript
   // Add to mockChatService.ts
   const simulateNetworkDelay = async (min = 500, max = 2000) => {
     const delay = Math.random() * (max - min) + min;
     await new Promise(resolve => setTimeout(resolve, delay));
   };
   ```

2. **Simulate occasional errors**:
   ```typescript
   // Add to mockChatService.ts
   const simulateRandomError = (probability = 0.05) => {
     if (Math.random() < probability) {
       throw new Error("Simulated backend error");
     }
   };
   ```

3. **Create more realistic data progression**:
   Make the mock data change over time to simulate a real environment

By following this guide, you'll be able to conduct thorough local testing of the Dottie AI Assistant, identifying and resolving issues before deployment.
