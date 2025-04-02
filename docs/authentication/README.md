# Authentication System Documentation

This section provides comprehensive documentation on the authentication system used in the Dottie AI Assistant. The application uses Firebase Authentication for user management and Google OAuth for accessing Google services.

## Authentication System Overview

The Dottie AI Assistant uses a multi-layered authentication approach:

1. **Firebase Authentication**: Provides user management, authentication, and session handling
2. **Google OAuth 2.0**: Enables access to Google services (Gmail, Calendar, Sheets)
3. **Token Management**: Securely stores and refreshes OAuth tokens

This architecture provides several benefits:
- Secure user authentication with industry-standard practices
- Seamless integration with Google services
- Automatic token refresh for uninterrupted service
- Separation of concerns between user authentication and API access

## Authentication Flow

The authentication flow in Dottie AI Assistant follows these steps:

1. **User Registration/Login**:
   - User registers or logs in using Firebase Authentication
   - A Firebase ID token is generated and sent to the client

2. **Google Account Linking**:
   - User initiates Google account linking
   - Application redirects to Google OAuth consent screen
   - User grants permissions to the application
   - Google returns an authorization code

3. **Token Exchange**:
   - Application exchanges the authorization code for access and refresh tokens
   - Tokens are stored securely in Firestore
   - User's Firebase account is linked to their Google account

4. **API Access**:
   - Application uses the stored tokens to access Google APIs
   - If tokens expire, they are automatically refreshed
   - Refreshed tokens are stored back in Firestore

## Key Components

The authentication system consists of several key components:

1. **Firebase Service**: Manages Firebase Authentication
2. **Auth Service**: Handles OAuth flows and token management
3. **Auth Middleware**: Verifies authentication for protected routes
4. **Auth Controller**: Exposes authentication endpoints
5. **User Service**: Manages user profiles and account linking

## Detailed Documentation

For detailed information on each aspect of the authentication system, refer to the following documents:

1. [Firebase Authentication](./01-firebase-authentication.md): Setting up and using Firebase Authentication
2. [Google OAuth Integration](./02-google-oauth.md): Configuring and using Google OAuth
3. [Token Management](./03-token-management.md): Storing, refreshing, and using OAuth tokens
4. [User Management](./04-user-management.md): Managing user profiles and account linking

## Security Considerations

The authentication system is designed with security in mind:

- Firebase ID tokens are verified on every request
- OAuth tokens are stored securely in Firestore
- Sensitive information is never exposed to the client
- Token refresh is handled automatically
- HTTPS is used for all communications

## Troubleshooting

For common authentication issues and their solutions, refer to the [Troubleshooting](../deployment/06-troubleshooting.md) guide.
