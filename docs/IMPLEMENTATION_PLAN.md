# Dottie AI Assistant - Implementation Plan

## Overview

This document provides specific implementation guidance to address the critical and important issues identified in the CTO and architecture team's pre-production review. Each section includes concrete code examples and implementation strategies.

## Critical Issues Implementation

### 1. Secure Client Secret Handling

**Current Issue:** OAuth client secrets are read directly from environment variables in `authService.ts`.

**Implementation:**

```typescript
// authService.ts
async getGoogleOAuth2Client(): Promise<OAuth2Client> {
  try {
    // Get client ID and redirect URI from environment variables
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
    
    // Get client secret from Secret Manager
    const clientSecret = await secretManagerService.getSecret('google-oauth-client-secret');
    
    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Missing required OAuth 2.0 configuration');
    }
    
    return new google.auth.OAuth2(clientId, clientSecret, redirectUri) as unknown as OAuth2Client;
  } catch (error) {
    logger.error('Failed to initialize OAuth client', {
      error: error instanceof Error ? error.message : String(error),
      stack: process.env.NODE_ENV !== 'production' ? (error instanceof Error ? error.stack : undefined) : undefined
    });
    throw ApiError.internal('Authentication service configuration error');
  }
}
```

**Deployment Changes:**
- Add the client secret to Google Secret Manager
- Update Cloud Run configuration to use the Secret Manager secret
- Remove the client secret from environment variables

### 2. Token Refresh Implementation

**Current Issue:** Missing robust token refresh logic for Google API access.

**Implementation:**

```typescript
// authService.ts
async createAuthenticatedClient(
  tokens: GoogleTokens,
  userId: string,
  onTokensRefreshed?: TokenUpdateCallback
): Promise<OAuth2Client> {
  const oauth2Client = await this.getGoogleOAuth2Client();
  
  // Set the credentials from the stored tokens
  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date
  });
  
  // Set up token refresh listener
  oauth2Client.on('tokens', async (newTokens) => {
    logger.info('Tokens refreshed', { userId });
    
    // Update the tokens object with new values
    if (newTokens.access_token) {
      tokens.access_token = newTokens.access_token;
    }
    
    if (newTokens.expiry_date) {
      tokens.expiry_date = newTokens.expiry_date;
    }
    
    // Only update refresh_token if a new one was provided
    if (newTokens.refresh_token) {
      tokens.refresh_token = newTokens.refresh_token;
    }
    
    // Store updated tokens in Firestore
    try {
      await firestoreService.storeUserTokens(userId, tokens);
      logger.debug('Updated tokens stored in Firestore', { userId });
    } catch (error) {
      logger.error('Failed to store refreshed tokens', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // Call the optional callback if provided
    if (onTokensRefreshed) {
      onTokensRefreshed(newTokens);
    }
  });
  
  // Proactively refresh if token is close to expiry (within 5 minutes)
  const now = Date.now();
  if (tokens.expiry_date && tokens.expiry_date < now + 5 * 60 * 1000) {
    try {
      logger.debug('Proactively refreshing token near expiry', { userId });
      await oauth2Client.refreshAccessToken();
    } catch (error) {
      logger.error('Failed to proactively refresh token', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      // Continue with the existing token, it might still work
    }
  }
  
  return oauth2Client;
}
```

**Service Implementation:**

```typescript
// gmailService.ts (and other Google API services)
export async function sendGmail(
  tokens: GoogleTokens,
  params: SendEmailParams,
  userId: string, // Add userId parameter
  onTokensRefreshed?: TokenUpdateCallback
): Promise<SendEmailResult> {
  try {
    // Create authenticated client with userId for token storage
    const authClient = await authService.createAuthenticatedClient(tokens, userId, onTokensRefreshed);
    
    // Initialize Gmail API client
    const gmail = google.gmail({ version: 'v1', auth: authClient });
    
    // ... rest of the function ...
  } catch (error: any) {
    // Improved error handling
    if (error.code === 401 || error.code === 403) {
      logger.error('Authentication error when sending email', {
        userId,
        errorCode: error.code,
        errorMessage: error.message
      });
      return {
        success: false,
        error: 'Authentication error. Please try again or reconnect your Google account.'
      };
    }
    
    logger.error('Error sending email', {
      userId,
      error: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
    
    return {
      success: false,
      error: 'Failed to send email. Please try again later.'
    };
  }
}
```

### 3. Distributed Session Store

**Current Issue:** In-memory session store won't work in Cloud Run's multi-instance environment.

**Implementation:**

```typescript
// index.ts
import session from 'express-session';
import { FirestoreStore } from '@google-cloud/connect-firestore';
import { Firestore } from '@google-cloud/firestore';

// Initialize Firestore for session storage
const firestore = new Firestore();

// Session middleware with Firestore store
app.use(session({
  store: new FirestoreStore({
    dataset: firestore,
    kind: 'express-sessions'
  }),
  secret: process.env.SESSION_SECRET!, // Must be set in environment
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Add validation for required environment variables
if (!process.env.SESSION_SECRET) {
  logger.error('SESSION_SECRET environment variable is required');
  process.exit(1);
}
```

**Deployment Changes:**
- Add `SESSION_SECRET` to Cloud Run environment variables (via Secret Manager)
- Install `@google-cloud/connect-firestore` package

### 4. CSRF Protection in OAuth Flow

**Current Issue:** Missing validation of the OAuth state parameter.

**Implementation:**

```typescript
// authController.ts - initiateOAuth endpoint
export const initiateOAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Generate a random state for CSRF protection
    const state = uuidv4();
    
    // Store the state in the user's session
    req.session.oauthState = state;
    
    // Generate the authorization URL with the state parameter
    const authUrl = authService.generateGoogleAuthUrl(state);
    
    // Redirect the user to the Google OAuth consent screen
    res.redirect(authUrl);
  } catch (error) {
    next(ApiError.internal('Failed to initiate OAuth flow', error));
  }
};

// authController.ts - handleOAuthCallback endpoint
export const handleOAuthCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract code and state from query parameters
    const { code, state } = req.query;
    
    // Get the expected state from the session
    const expectedState = req.session.oauthState;
    
    // Clear the state from the session
    req.session.oauthState = undefined;
    
    // Validate the state parameter to prevent CSRF attacks
    if (!state || !expectedState || state !== expectedState) {
      return next(ApiError.authentication('Invalid OAuth state parameter'));
    }
    
    // Ensure code is provided
    if (!code) {
      return next(ApiError.validation('Missing authorization code'));
    }
    
    // Exchange the code for tokens
    const userId = req.user?.uid || req.sessionID;
    const tokens = await authService.exchangeCodeForTokens(code.toString(), userId);
    
    // Store the tokens in Firestore
    await firestoreService.storeUserTokens(userId, tokens);
    
    // Redirect to the application
    res.redirect('/dashboard');
  } catch (error) {
    next(ApiError.internal('OAuth callback failed', error));
  }
};
```

### 5. Remove Sensitive Data Logging

**Current Issue:** Sensitive information like tokens and full error stacks are being logged.

**Implementation:**

```typescript
// authService.ts - Remove token logging
async exchangeCodeForTokens(code: string, userId: string): Promise<GoogleTokens> {
  try {
    // Create OAuth 2.0 client
    const oauth2Client = await this.getGoogleOAuth2Client();
    
    // Exchange the authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    // Log success without token details
    logger.info('Successfully exchanged authorization code for tokens', {
      userId,
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token
    });
    
    // Return the tokens
    return {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope!,
      token_type: tokens.token_type!,
      expiry_date: tokens.expiry_date!
    };
  } catch (error) {
    logger.error('Failed to exchange authorization code for tokens', {
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
    throw ApiError.googleApi('Failed to authenticate with Google');
  }
}
```

**Error Middleware:**

```typescript
// errorMiddleware.ts - Sanitize error logging
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Generate a correlation ID for tracking this error
  const correlationId = req.headers['x-correlation-id'] || 
                       `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Default error response
  let statusCode = 500;
  let errorType = ErrorType.INTERNAL;
  let errorMessage = 'Internal server error';
  let errorDetails: any = undefined;
  
  // Handle ApiError instances
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    errorType = err.type;
    errorMessage = err.message;
    
    // Only include sanitized details in non-production
    if (process.env.NODE_ENV !== 'production') {
      errorDetails = err.details;
    }
  }
  
  // Log the error with appropriate context
  logger.error(`${errorType}: ${errorMessage}`, {
    correlationId,
    statusCode,
    path: req.path,
    method: req.method,
    userId: (req as any).user?.uid,
    // Only include stack trace in development
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });
  
  // Send the error response to the client
  res.status(statusCode).json({
    error: {
      type: errorType,
      message: errorMessage,
      correlationId
    }
  });
};
```

## Important Issues Implementation

### 1. LLM Context Window Management

**Current Issue:** No limit on conversation history sent to the LLM.

**Implementation:**

```typescript
// llmService.ts
formatConversationHistory(history: Message[], query: string): GeminiMessage[] {
  // Maximum number of messages to include (adjust based on testing)
  const MAX_MESSAGES = 10;
  
  // Format the conversation history
  let formattedHistory: GeminiMessage[] = [];
  
  // If history is longer than MAX_MESSAGES, keep the most recent ones
  // but always include the first message for context
  if (history.length > MAX_MESSAGES) {
    // Always include the first message (system prompt or initial context)
    formattedHistory.push({
      role: history[0].role === 'user' ? 'user' : 'model',
      parts: [{ text: history[0].content }]
    });
    
    // Add the most recent messages
    const recentMessages = history.slice(-MAX_MESSAGES + 1);
    
    for (const message of recentMessages) {
      formattedHistory.push({
        role: message.role === 'user' ? 'user' : 'model',
        parts: [{ text: message.content }]
      });
    }
  } else {
    // If history is shorter than MAX_MESSAGES, include all messages
    for (const message of history) {
      formattedHistory.push({
        role: message.role === 'user' ? 'user' : 'model',
        parts: [{ text: message.content }]
      });
    }
  }
  
  // Add the current query as a user message
  formattedHistory.push({
    role: 'user',
    parts: [{ text: query }]
  });
  
  return formattedHistory;
}
```

### 2. LLM Error Handling

**Current Issue:** Insufficient error handling for Vertex AI API calls.

**Implementation:**

```typescript
// llmService.ts
async getGeminiResponse(
  query: string, 
  history: Message[] = [], 
  functionCall?: any, 
  functionResponse?: any
): Promise<LlmResponse> {
  try {
    // Format the conversation history
    const formattedHistory = this.formatConversationHistory(history, query);
    
    // Log the request (without full message content)
    logger.debug('Sending request to Gemini', {
      modelName: this.modelName,
      historyLength: history.length,
      hasFunctionCall: !!functionCall,
      hasFunctionResponse: !!functionResponse
    });
    
    // Create the generative model
    const generativeModel = this.vertexAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      },
      tools: [{ functionDeclarations: this.functionDeclarations }]
    });
    
    // Generate content with retry logic
    let response;
    const maxRetries = 3;
    let retryCount = 0;
    let lastError;
    
    while (retryCount < maxRetries) {
      try {
        response = await generativeModel.generateContent({
          contents: formattedHistory,
          tools: [{ functionDeclarations: this.functionDeclarations }]
        });
        break; // Success, exit the retry loop
      } catch (error: any) {
        lastError = error;
        retryCount++;
        
        // Check for specific error types
        if (error.message?.includes('quota')) {
          logger.error('Vertex AI quota exceeded', { retryCount, error: error.message });
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        } else if (error.message?.includes('safety')) {
          logger.warn('Vertex AI safety filters triggered', { error: error.message });
          // Don't retry safety filter issues
          throw ApiError.validation('Your request was flagged by content safety filters');
        } else if (retryCount >= maxRetries) {
          // Final retry failed, give up
          throw error;
        } else {
          // Other errors, retry with backoff
          logger.warn('Vertex AI error, retrying', { retryCount, error: error.message });
          await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
        }
      }
    }
    
    if (!response) {
      throw lastError || new Error('Failed to get response from Gemini');
    }
    
    // Process the response
    const result = response.response;
    const candidates = result.candidates || [];
    
    if (candidates.length === 0) {
      logger.warn('No candidates returned from Gemini');
      return {
        type: 'text',
        content: 'I apologize, but I couldn\'t generate a response. Please try rephrasing your question.'
      };
    }
    
    const candidate = candidates[0];
    const content = candidate.content;
    
    // Check for function call
    if (content.parts && content.parts[0] && content.parts[0].functionCall) {
      const functionCall = content.parts[0].functionCall;
      
      logger.info('Function call requested by LLM', {
        functionName: functionCall.name
      });
      
      return {
        type: 'functionCall',
        call: {
          name: functionCall.name,
          args: functionCall.args
        }
      };
    }
    
    // Regular text response
    const textResponse = content.parts
      .map(part => part.text)
      .filter(Boolean)
      .join('');
    
    return {
      type: 'text',
      content: textResponse
    };
  } catch (error: any) {
    logger.error('Error getting Gemini response', {
      error: error instanceof Error ? error.message : String(error),
      stack: process.env.NODE_ENV !== 'production' ? (error instanceof Error ? error.stack : undefined) : undefined
    });
    
    // Map to appropriate API error
    if (error instanceof ApiError) {
      throw error; // Already an ApiError, rethrow
    } else if (error.message?.includes('quota')) {
      throw ApiError.internal('Service temporarily unavailable due to high demand');
    } else if (error.message?.includes('safety')) {
      throw ApiError.validation('Your request was flagged by content safety filters');
    } else {
      throw ApiError.internal('Failed to process your request');
    }
  }
}
```

### 3. Function Result Sanitization

**Current Issue:** Raw function results sent to LLM without sanitization.

**Implementation:**

```typescript
// chatController.ts
async handleFunctionResult(
  initialResult: LlmResponse,
  functionName: string,
  functionResult: any,
  functionError: string | null
): Promise<LlmResponse> {
  try {
    // Format the function result as a string
    let functionResultString: string;
    
    if (functionError) {
      functionResultString = `Error: ${functionError}`;
    } else {
      // Sanitize/summarize based on function type
      switch (functionName) {
        case 'get_recent_emails':
          functionResultString = this.summarizeEmails(functionResult);
          break;
        
        case 'get_calendar_events':
          functionResultString = this.summarizeCalendarEvents(functionResult);
          break;
        
        case 'get_sheet_data':
          functionResultString = this.summarizeSheetData(functionResult);
          break;
        
        default:
          // For other functions, use standard JSON stringify but limit size
          if (typeof functionResult === 'string') {
            functionResultString = functionResult.substring(0, 2000);
            if (functionResult.length > 2000) {
              functionResultString += ' [content truncated for brevity]';
            }
          } else {
            functionResultString = JSON.stringify(functionResult, null, 2);
            if (functionResultString.length > 2000) {
              // Create a summary version
              const summary = this.createSummaryObject(functionResult);
              functionResultString = JSON.stringify(summary, null, 2);
            }
          }
      }
    }
    
    logger.debug('Sending function result to LLM', {
      functionName,
      resultLength: functionResultString.length
    });
    
    // Call the LLM with the function result
    return await llmService.getFunctionResponseFromGemini(
      initialResult,
      functionName,
      functionResultString
    );
  } catch (error: any) {
    logger.error('Error handling function result', {
      functionName,
      error: error instanceof Error ? error.message : String(error)
    });
    
    return {
      type: 'text',
      content: `I encountered an error while processing the ${functionName} result. Please try again or ask a different question.`
    };
  }
},

// Helper methods for summarizing different data types
summarizeEmails(emails: any[]): string {
  if (!Array.isArray(emails) || emails.length === 0) {
    return 'No emails found.';
  }
  
  const emailCount = emails.length;
  const summary = `Found ${emailCount} email(s). Here's a summary:\n\n`;
  
  // Create a summarized version with just essential fields
  const summarizedEmails = emails.map(email => ({
    subject: email.subject,
    from: email.from,
    date: email.date,
    snippet: email.snippet?.substring(0, 100) + (email.snippet?.length > 100 ? '...' : '')
  }));
  
  return summary + JSON.stringify(summarizedEmails, null, 2);
},

summarizeCalendarEvents(events: any[]): string {
  // Similar implementation for calendar events
},

summarizeSheetData(data: any): string {
  // Similar implementation for sheet data
},

createSummaryObject(obj: any): any {
  // Generic function to create a summary of any object
  // by keeping only essential fields and truncating long strings
  if (Array.isArray(obj)) {
    // For arrays, summarize if too long
    if (obj.length > 5) {
      return [
        ...obj.slice(0, 3).map(item => this.createSummaryObject(item)),
        `... ${obj.length - 3} more items ...`,
        this.createSummaryObject(obj[obj.length - 1])
      ];
    } else {
      return obj.map(item => this.createSummaryObject(item));
    }
  } else if (obj && typeof obj === 'object') {
    // For objects, keep structure but summarize values
    const result: any = {};
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'string' && obj[key].length > 100) {
        result[key] = obj[key].substring(0, 100) + '...';
      } else if (Array.isArray(obj[key]) || (obj[key] && typeof obj[key] === 'object')) {
        result[key] = this.createSummaryObject(obj[key]);
      } else {
        result[key] = obj[key];
      }
    }
    return result;
  } else {
    return obj;
  }
}
```

## Testing and Deployment Checklist

### Pre-Deployment Testing

1. **Authentication Flow Testing**
   - Test OAuth flow with state validation
   - Verify token refresh mechanism works
   - Test token storage in Firestore

2. **Error Handling Testing**
   - Simulate API errors (Google APIs, Vertex AI)
   - Test error responses and logging
   - Verify no sensitive data is logged

3. **Session Management Testing**
   - Test Firestore session store
   - Verify sessions work across multiple instances

### Deployment Configuration

1. **Secret Management**
   - Move all secrets to Google Secret Manager
   - Update Cloud Run configuration to use secrets

2. **Monitoring Setup**
   - Configure structured logging
   - Set up Cloud Monitoring dashboards
   - Create alerts for critical errors

3. **Security Configuration**
   - Enable Cloud Run security features
   - Configure appropriate IAM permissions
   - Set up VPC Service Controls if needed

## Conclusion

This implementation plan addresses the critical and important issues identified in the CTO and architecture team's review. By following these guidelines, the development team can ensure that Dottie AI Assistant is secure, stable, and ready for GCP testing.

The enhanced testing environment already in place will be valuable for validating these changes before deployment to GCP.
