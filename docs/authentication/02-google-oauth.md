# Google OAuth Integration for Dottie AI Assistant

This guide provides detailed information on how Google OAuth 2.0 is implemented and integrated with Firebase Authentication in the Dottie AI Assistant backend.

## Overview

Google OAuth 2.0 enables the Dottie AI Assistant to access Google services (Gmail, Calendar, Sheets) on behalf of users. The integration with Firebase Authentication allows users to link their Google accounts to their existing Firebase accounts, providing a seamless authentication experience.

## Google OAuth Setup

### Prerequisites

Before implementing Google OAuth, you need to:

1. Create a Google Cloud Platform project (see [Google API Setup](../deployment/04-google-api-setup.md))
2. Configure the OAuth consent screen
3. Create OAuth client credentials
4. Enable the necessary Google APIs

### OAuth Configuration

The OAuth configuration is stored in environment variables:

```
GOOGLE_OAUTH_CLIENT_ID=your-oauth-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-oauth-client-secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

### Required Scopes

The Dottie AI Assistant requires the following OAuth scopes:

```typescript
export const GOOGLE_API_SCOPES = [
  'https://www.googleapis.com/auth/calendar',          // Full access to Google Calendar
  'https://www.googleapis.com/auth/gmail.send',        // Send emails via Gmail
  'https://www.googleapis.com/auth/gmail.readonly',    // Read emails via Gmail
  'https://www.googleapis.com/auth/spreadsheets',      // Read/write access to Google Sheets
  'https://www.googleapis.com/auth/userinfo.email',    // Get user's email address
  'https://www.googleapis.com/auth/userinfo.profile',  // Get user's basic profile info
];
```

## OAuth Flow Implementation

### Creating the OAuth Client

The `authService.ts` file contains methods for creating and managing the OAuth client:

```typescript
getGoogleOAuth2Client(): OAuth2Client {
  // For initial implementation, use environment variables directly
  // In production, these would be retrieved from Secret Manager
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google OAuth configuration is missing');
  }

  return new OAuth2Client(clientId, clientSecret, redirectUri);
}
```

### Generating the Authorization URL

When a user wants to link their Google account, the application generates an authorization URL:

```typescript
generateAuthUrl(state: string): string {
  const oauth2Client = this.getGoogleOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GOOGLE_API_SCOPES,
    state,
    prompt: 'consent'
  });
}
```

The `state` parameter is a randomly generated string that helps prevent CSRF attacks.

### Handling the OAuth Callback

After the user grants permission, Google redirects them back to the application with an authorization code. The application exchanges this code for access and refresh tokens:

```typescript
async getTokensFromCode(code: string): Promise<GoogleTokens> {
  const oauth2Client = this.getGoogleOAuth2Client();
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      throw new Error('No access token returned from Google');
    }
    
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope || '',
      token_type: tokens.token_type || 'Bearer',
      expiry_date: tokens.expiry_date || 0
    };
  } catch (error) {
    console.error('Error getting tokens from code:', error);
    throw error;
  }
}
```

### Storing Tokens in Firestore

The tokens are stored securely in Firestore, associated with the user's Firebase UID:

```typescript
async storeTokensInFirestore(userId: string, tokens: GoogleTokens): Promise<void> {
  try {
    await firestoreService.setDocument(`users/${userId}/tokens/google`, tokens);
    console.log(`Stored tokens for user ${userId}`);
  } catch (error) {
    console.error('Error storing tokens in Firestore:', error);
    throw error;
  }
}
```

### Retrieving Tokens from Firestore

When the application needs to access Google APIs, it retrieves the tokens from Firestore:

```typescript
async getTokensFromFirestore(userId: string): Promise<GoogleTokens | null> {
  try {
    const tokensDoc = await firestoreService.getDocument(`users/${userId}/tokens/google`);
    
    if (!tokensDoc || !tokensDoc.access_token) {
      return null;
    }
    
    return tokensDoc as GoogleTokens;
  } catch (error) {
    console.error('Error getting tokens from Firestore:', error);
    return null;
  }
}
```

### Refreshing Tokens

If the access token expires, the application uses the refresh token to get a new access token:

```typescript
async refreshTokens(refreshToken: string): Promise<GoogleTokens> {
  const oauth2Client = this.getGoogleOAuth2Client();
  
  try {
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });
    
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    if (!credentials.access_token) {
      throw new Error('No access token returned from Google');
    }
    
    return {
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token || refreshToken,
      scope: credentials.scope || '',
      token_type: credentials.token_type || 'Bearer',
      expiry_date: credentials.expiry_date || 0
    };
  } catch (error) {
    console.error('Error refreshing tokens:', error);
    throw error;
  }
}
```

## Integration with Firebase Authentication

### Linking Google Account to Firebase User

The `linkGoogleAccount` method in the `authController.ts` file handles linking a Google account to an existing Firebase user:

```typescript
async linkGoogleAccount(req: Express.Request, res: Express.Response): Promise<void> {
  try {
    // This endpoint should be protected by requireAuth middleware
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized. Authentication required.' });
      return;
    }
    
    // Generate a random state for CSRF protection
    const state = uuidv4();
    
    // Store the state and user ID in the session
    req.session.state = state;
    
    // Generate the authorization URL
    const authUrl = authService.generateAuthUrl(state);
    
    // Redirect the user to the Google OAuth consent screen
    res.json({ authUrl });
  } catch (error) {
    console.error('Error linking Google account:', error);
    res.status(500).json({ error: 'Failed to link Google account' });
  }
}
```

### Handling the OAuth Callback for Account Linking

The `googleCallback` method handles the OAuth callback and completes the account linking process:

```typescript
async googleCallback(req: Express.Request, res: Express.Response): Promise<void> {
  try {
    const { code, state } = req.query;
    
    // Verify the state to prevent CSRF attacks
    if (!state || state !== req.session.state) {
      res.status(400).json({ error: 'Invalid state parameter' });
      return;
    }
    
    // Clear the state from the session
    req.session.state = undefined;
    
    // Exchange the authorization code for tokens
    const tokens = await authService.getTokensFromCode(code as string);
    
    // Store the tokens in the session for immediate use
    req.session.googleTokens = tokens;
    
    // If the user is authenticated with Firebase, store the tokens in Firestore
    if (req.user) {
      await authService.storeTokensInFirestore(req.user.uid, tokens);
      
      // Get the user's Google profile
      const profile = await authService.getGoogleProfile(tokens.access_token);
      
      // Update the user's profile in Firebase
      await firebaseService.updateUser(req.user.uid, {
        displayName: profile.name,
        photoURL: profile.picture
      });
      
      // Redirect to the frontend with a success message
      res.redirect(`${process.env.FRONTEND_URL}/auth/success`);
    } else {
      // Handle legacy session-based authentication
      // ...
    }
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
  }
}
```

### Unlinking Google Account

The `unlinkGoogleAccount` method allows users to unlink their Google account:

```typescript
async unlinkGoogleAccount(req: Express.Request, res: Express.Response): Promise<void> {
  try {
    // This endpoint should be protected by requireAuth middleware
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized. Authentication required.' });
      return;
    }
    
    // Delete the tokens from Firestore
    await firestoreService.deleteDocument(`users/${req.user.uid}/tokens/google`);
    
    // Clear the tokens from the session
    req.session.googleTokens = undefined;
    
    res.json({ message: 'Google account unlinked successfully' });
  } catch (error) {
    console.error('Error unlinking Google account:', error);
    res.status(500).json({ error: 'Failed to unlink Google account' });
  }
}
```

## Authenticated API Access

### Creating an Authenticated Client

The `createAuthenticatedClient` method creates an OAuth2 client with the user's tokens:

```typescript
createAuthenticatedClient(
  tokens: GoogleTokens, 
  userId?: string,
  onTokensRefreshed?: TokenUpdateCallback
): OAuth2Client {
  if (!tokens || !tokens.access_token) {
    throw new Error('Invalid tokens provided. Access token is required.');
  }

  try {
    // Create a new OAuth2 client
    const oauth2Client = this.getGoogleOAuth2Client();
    
    // Set the credentials on the OAuth 2.0 client
    // This includes the refresh_token which enables automatic token refresh
    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      token_type: tokens.token_type,
      scope: tokens.scope
    });
    
    // Add a listener for token refresh events
    if (userId && onTokensRefreshed) {
      oauth2Client.on('tokens', async (newTokens) => {
        console.log('Tokens refreshed for user', userId);
        
        // Merge the new tokens with the existing ones
        const updatedTokens: GoogleTokens = {
          ...tokens,
          access_token: newTokens.access_token || tokens.access_token,
          refresh_token: newTokens.refresh_token || tokens.refresh_token,
          expiry_date: newTokens.expiry_date || tokens.expiry_date
        };
        
        // Store the updated tokens in Firestore
        await this.storeTokensInFirestore(userId, updatedTokens);
        
        // Call the callback function with the new tokens
        onTokensRefreshed(newTokens);
      });
    }
    
    return oauth2Client;
  } catch (error) {
    console.error('Error creating authenticated client:', error);
    throw error;
  }
}
```

### Using the Authenticated Client with Google APIs

The authenticated client is used to access Google APIs:

```typescript
// Example: Sending an email with Gmail API
async sendGmail(
  tokens: GoogleTokens,
  emailParams: EmailParams,
  onTokensRefreshed?: TokenUpdateCallback
): Promise<SendEmailResult> {
  try {
    // Create an authenticated client
    const authClient = await authService.createAuthenticatedClient(
      tokens,
      undefined,
      onTokensRefreshed || undefined
    );
    
    // Initialize the Gmail API client
    const gmail = google.gmail({ version: 'v1', auth: authClient });
    
    // Create and send the email
    // ...
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
```

## Security Considerations

### Token Storage

OAuth tokens are sensitive information and should be stored securely:

- Store tokens in Firestore with appropriate security rules
- Never expose tokens to the client
- Use HTTPS for all communications

### Token Refresh

Implement proper token refresh mechanisms:

- Use the refresh token to get a new access token when needed
- Store the updated tokens securely
- Handle token refresh errors gracefully

### CSRF Protection

Prevent Cross-Site Request Forgery (CSRF) attacks:

- Use a random state parameter for OAuth flows
- Verify the state parameter in the callback
- Clear the state parameter after use

## Troubleshooting

### Common Issues

#### "Invalid OAuth client" error

Check that your OAuth client ID and secret are correct and that your redirect URI matches exactly what's configured in the Google Cloud Console.

#### "Access denied" error after Google authentication

Ensure that you've added all required scopes to your OAuth consent screen and that your application is in the correct verification state.

#### "Token refresh failed" error

Check that you have a valid refresh token and that it hasn't been revoked. If the refresh token is invalid, you may need to re-authenticate the user.

## Next Steps

Once you understand Google OAuth integration, proceed to [Token Management](./03-token-management.md) to learn how OAuth tokens are managed in the Dottie AI Assistant.
