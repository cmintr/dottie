# Google API Setup for Dottie AI Assistant

This guide provides detailed instructions for setting up and configuring Google APIs for the Dottie AI Assistant backend. The application integrates with Gmail, Google Calendar, and Google Sheets to provide a comprehensive assistant experience.

## Enabling Google APIs

### 1. Access the Google Cloud Console

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (the same one linked to your Firebase project)

### 2. Enable Required APIs

You need to enable the following APIs:

1. Navigate to "APIs & Services" > "Library"
2. Search for and enable each of the following APIs:
   - Gmail API
   - Google Calendar API
   - Google Sheets API
   - Google Drive API (required for Sheets API)
   - People API (for contact information)
   - Identity and Access Management (IAM) API

For each API:
1. Click on the API in the search results
2. Click "Enable" button
3. Wait for the API to be enabled

## Configuring OAuth Consent Screen

If you haven't already configured the OAuth consent screen during Firebase setup, follow these steps:

1. In the Google Cloud Console, navigate to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (unless you're using Google Workspace)
3. Click "Create"
4. Fill in the required information:
   - App name: "Dottie AI Assistant"
   - User support email: your email address
   - Developer contact information: your email address
5. Click "Save and Continue"
6. Add the following scopes:
   - `./auth/userinfo.email`
   - `./auth/userinfo.profile`
   - `./auth/calendar`
   - `./auth/gmail.send`
   - `./auth/gmail.readonly`
   - `./auth/spreadsheets`
7. Click "Save and Continue"
8. Add test users if you're in testing mode
9. Click "Save and Continue"
10. Review your settings and click "Back to Dashboard"

## Creating OAuth Client Credentials

If you haven't already created OAuth client credentials during Firebase setup, follow these steps:

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

## Configuring API Access and Permissions

### 1. Set Up API Keys (Optional)

For some APIs, you may want to create API keys for server-to-server requests:

1. In the Google Cloud Console, navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API key"
3. Copy the API key
4. Click "Restrict key" to limit its usage:
   - Select the APIs this key can access (e.g., Sheets API)
   - Add application restrictions (e.g., IP addresses)
5. Click "Save"

### 2. Configure Domain Verification (for Production)

For production environments, you should verify ownership of your domain:

1. In the Google Cloud Console, navigate to "APIs & Services" > "Domain verification"
2. Click "Add domain"
3. Enter your domain name
4. Follow the verification instructions (usually involves adding a DNS record)
5. Click "Verify"

## Testing API Access

### 1. Gmail API Test

To test Gmail API access:

1. Ensure your application is running
2. Navigate to http://localhost:3000/auth/google (or your production URL)
3. Complete the authentication flow
4. Try sending a test email through your application
5. Verify that the email was sent successfully

### 2. Calendar API Test

To test Calendar API access:

1. Ensure your application is running
2. Navigate to http://localhost:3000/auth/google (or your production URL)
3. Complete the authentication flow
4. Try creating a test calendar event through your application
5. Verify that the event was created successfully in your Google Calendar

### 3. Sheets API Test

To test Sheets API access:

1. Ensure your application is running
2. Navigate to http://localhost:3000/auth/google (or your production URL)
3. Complete the authentication flow
4. Try creating a test spreadsheet or reading data from an existing spreadsheet
5. Verify that the operation was successful

## Handling API Quotas and Limits

Google APIs have usage limits and quotas. For a production application, you should be aware of these limits:

### Gmail API

- Free tier: 1 billion units per day (sending an email costs about 100 units)
- Maximum of 2,000 emails per day per user

### Calendar API

- Free tier: 1 million queries per day
- Maximum of 60 queries per minute per user

### Sheets API

- Free tier: 500 requests per 100 seconds per project
- 100 requests per 100 seconds per user

### Monitoring and Increasing Quotas

1. In the Google Cloud Console, navigate to "APIs & Services" > "Dashboard"
2. Click on an API to view its usage metrics
3. To request a quota increase:
   - Click on "Quotas" in the left sidebar
   - Find the quota you want to increase
   - Click "Edit Quotas" and follow the instructions

## Configuring Environment Variables

Update your `.env` file with the Google API configuration:

```
# Google OAuth Configuration
GOOGLE_OAUTH_CLIENT_ID=your-oauth-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-oauth-client-secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Google API Configuration
GOOGLE_API_KEY=your-api-key (optional)
```

Replace the placeholder values with your actual configuration values.

## Troubleshooting

### Common Issues

#### API Access Errors

If you encounter API access errors:

1. Check that you've enabled the required APIs in the Google Cloud Console
2. Verify that your OAuth client ID and secret are correct in your `.env` file
3. Ensure that you've added the correct scopes to your OAuth consent screen
4. Check that your redirect URI matches exactly what's configured in the Google Cloud Console

#### Rate Limiting

If you encounter rate limiting:

1. Implement exponential backoff in your API requests
2. Consider caching responses to reduce the number of API calls
3. Request a quota increase if necessary

#### Token Refresh Issues

If tokens aren't refreshing correctly:

1. Ensure that you're storing the refresh token securely
2. Verify that your token refresh logic is working correctly
3. Check that your OAuth client ID and secret haven't changed or been revoked

## Next Steps

Once you have configured the Google APIs, proceed to [Deployment Steps](./05-deployment-steps.md) to deploy your application to your chosen environment.
