# Google Services Integration

This document outlines the integration of Google services (Gmail, Calendar, Sheets) in the Dottie AI Assistant application.

## Overview

Dottie AI Assistant integrates with Google Workspace services to provide a comprehensive assistant experience. The integration follows a consistent architectural pattern across all Google services.

## Architecture

The integration follows these steps:

1. User authenticates with Firebase Authentication
2. User links their Google Workspace account through OAuth
3. Tokens are stored securely in Firestore
4. Backend uses these tokens to make authenticated calls to Google APIs
5. Frontend displays the results to the user

## Google OAuth Flow

### Initial Authentication

1. User clicks "Link Google Workspace" button in the frontend
2. Frontend makes an authenticated request to `/api/auth/google`
3. Backend generates an OAuth URL and returns it to the frontend
4. User is redirected to Google consent screen
5. After consent, Google redirects to `/api/auth/google/callback` with an authorization code
6. Backend exchanges the code for access and refresh tokens
7. Tokens are stored in Firestore associated with the user's Firebase UID

### Token Refresh

1. When making API calls, the backend checks if the access token is valid
2. If expired, the refresh token is used to obtain a new access token
3. The new tokens are stored in Firestore
4. The API call proceeds with the new access token

## Service Integration

### Gmail

The Gmail integration allows users to:
- View recent emails
- Search for specific emails
- Send emails

Backend endpoints:
- `GET /api/gmail/messages`: Retrieve recent messages
- `GET /api/gmail/messages/:id`: Get a specific message
- `POST /api/gmail/messages`: Send a new email

### Google Calendar

The Calendar integration allows users to:
- View upcoming events
- Create new events
- Update existing events

Backend endpoints:
- `GET /api/calendar/events`: Retrieve upcoming events
- `GET /api/calendar/events/:id`: Get a specific event
- `POST /api/calendar/events`: Create a new event
- `PUT /api/calendar/events/:id`: Update an existing event

### Google Sheets

The Sheets integration allows users to:
- View spreadsheet data
- Update spreadsheet data
- Create new spreadsheets

Backend endpoints:
- `GET /api/sheets/data`: Retrieve spreadsheet data
- `POST /api/sheets/data`: Update spreadsheet data
- `POST /api/sheets/create`: Create a new spreadsheet

## Frontend Implementation

The frontend makes authenticated calls to these endpoints by:

1. Getting the current user's ID token: `await user.getIdToken()`
2. Including the token in the Authorization header: `Authorization: Bearer ${idToken}`
3. Making the API request to the appropriate endpoint
4. Handling and displaying the response data

Example:

```typescript
const fetchGmailMessages = async () => {
  if (!user) return;
  
  try {
    const idToken = await user.getIdToken();
    const response = await fetch('http://localhost:3000/api/gmail/messages', {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    setMessages(data.messages);
  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
  }
};
```

## Backend Implementation

The backend services follow a consistent pattern:

1. Authentication middleware verifies the Firebase ID token
2. Service retrieves the user's Google tokens from Firestore
3. Service creates an authenticated client using the tokens
4. Service makes the API call to Google
5. Service handles any errors, including token refresh
6. Service returns the formatted response to the frontend

## Error Handling

Common error scenarios and handling:

1. **Expired Access Token**: Automatically refresh and retry
2. **Invalid Refresh Token**: Prompt user to re-authenticate
3. **API Quota Exceeded**: Implement exponential backoff and retry
4. **User Not Linked**: Guide user to link their Google account
5. **Permission Denied**: Inform user of missing permissions

## Security Considerations

1. Tokens are stored securely in Firestore with appropriate security rules
2. All API calls use HTTPS
3. Scope of OAuth permissions is limited to what's necessary
4. Tokens are refreshed securely on the backend
5. User data is not persisted unnecessarily

## Testing

Testing strategies for Google service integration:

1. **Unit Tests**: Mock Google API responses
2. **Integration Tests**: Use test accounts with limited permissions
3. **End-to-End Tests**: Test complete flows from frontend to backend to Google APIs

## Future Improvements

1. Add support for additional Google services (Drive, Docs, etc.)
2. Implement batch operations for efficiency
3. Add offline capabilities with background sync
4. Improve error recovery mechanisms
5. Implement more granular permission controls
