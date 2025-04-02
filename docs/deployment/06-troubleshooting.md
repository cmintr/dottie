# Troubleshooting Guide for Dottie AI Assistant

This guide provides solutions to common issues you might encounter when deploying and running the Dottie AI Assistant backend. It's designed to help novice users diagnose and resolve problems quickly.

## Authentication Issues

### Firebase Authentication Errors

#### Issue: "Firebase is not initialized" error

**Symptoms:**
- Error message in console: "Firebase is not initialized"
- Authentication endpoints return 500 errors

**Solutions:**
1. Check that your Firebase configuration is correctly set in your `.env` file
2. Verify that the Firebase service account JSON file is correctly placed in the `config` directory
3. Ensure that the Firebase Admin SDK is initialized in your code:

```typescript
// Check this code in your firebaseService.ts file
import * as admin from 'firebase-admin';
import * as serviceAccount from '../config/firebase-service-account.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
});
```

#### Issue: "Invalid Firebase ID token" error

**Symptoms:**
- Error message in console: "Invalid Firebase ID token"
- Authentication endpoints return 401 errors

**Solutions:**
1. Check that the client is sending a valid Firebase ID token
2. Verify that the token hasn't expired
3. Ensure that the Firebase project ID in the token matches your project ID
4. Check that your Firebase service account has the necessary permissions

### Google OAuth Errors

#### Issue: "Invalid OAuth client" error

**Symptoms:**
- Error message when trying to authenticate with Google
- Redirect to Google fails or returns an error

**Solutions:**
1. Verify that your OAuth client ID and secret are correct in your `.env` file
2. Check that your redirect URI matches exactly what's configured in the Google Cloud Console
3. Ensure that you've enabled the Google sign-in method in Firebase Authentication
4. Verify that your OAuth consent screen is configured correctly

#### Issue: "Access denied" error after Google authentication

**Symptoms:**
- Successfully redirected to Google, but get "access denied" after authentication
- Error message in console about missing scopes

**Solutions:**
1. Check that you've added all required scopes to your OAuth consent screen:
   - `./auth/userinfo.email`
   - `./auth/userinfo.profile`
   - `./auth/calendar`
   - `./auth/gmail.send`
   - `./auth/gmail.readonly`
   - `./auth/spreadsheets`
2. Verify that your application is in the correct verification state (testing or production)
3. If in testing mode, ensure that the user is added as a test user

## API Integration Issues

### Gmail API Errors

#### Issue: "Gmail API has not been enabled" error

**Symptoms:**
- Error message when trying to send emails
- Error code 403 from Gmail API

**Solutions:**
1. Go to the Google Cloud Console and enable the Gmail API
2. Verify that your OAuth client has the correct scopes
3. Check that the user has granted permission to your application

#### Issue: "Invalid credentials" error when sending emails

**Symptoms:**
- Error message about invalid credentials
- Unable to send emails

**Solutions:**
1. Check that the access token is valid and not expired
2. Verify that the token refresh mechanism is working correctly
3. Ensure that the user has granted the necessary permissions
4. Check that the Gmail API is enabled for your project

### Calendar API Errors

#### Issue: "Calendar API has not been enabled" error

**Symptoms:**
- Error message when trying to create calendar events
- Error code 403 from Calendar API

**Solutions:**
1. Go to the Google Cloud Console and enable the Calendar API
2. Verify that your OAuth client has the correct scopes
3. Check that the user has granted permission to your application

#### Issue: "Invalid time format" error when creating events

**Symptoms:**
- Error message about invalid time format
- Unable to create calendar events

**Solutions:**
1. Ensure that you're using the correct date-time format (ISO 8601)
2. Check that the time zone is specified correctly
3. Verify that the start time is before the end time

### Sheets API Errors

#### Issue: "Sheets API has not been enabled" error

**Symptoms:**
- Error message when trying to access spreadsheets
- Error code 403 from Sheets API

**Solutions:**
1. Go to the Google Cloud Console and enable the Sheets API
2. Verify that your OAuth client has the correct scopes
3. Check that the user has granted permission to your application

#### Issue: "Spreadsheet not found" error

**Symptoms:**
- Error message about spreadsheet not found
- Unable to access or modify spreadsheets

**Solutions:**
1. Check that the spreadsheet ID is correct
2. Verify that the user has access to the spreadsheet
3. Ensure that the Drive API is also enabled (required for Sheets API)

## Deployment Issues

### Node.js Server Issues

#### Issue: "Port already in use" error

**Symptoms:**
- Error message: "EADDRINUSE: address already in use"
- Server fails to start

**Solutions:**
1. Check if another process is using the same port:
   ```bash
   # For Linux/macOS
   lsof -i :3000
   
   # For Windows
   netstat -ano | findstr :3000
   ```
2. Kill the process using the port or change the port in your `.env` file
3. Restart your server

#### Issue: "Cannot find module" error

**Symptoms:**
- Error message: "Cannot find module 'some-module'"
- Server fails to start

**Solutions:**
1. Install the missing module:
   ```bash
   npm install some-module
   ```
2. Check that all dependencies are installed:
   ```bash
   npm install
   ```
3. Verify that the module is listed in your `package.json` file
4. Check for typos in the import statement

### Docker Deployment Issues

#### Issue: "Image not found" error

**Symptoms:**
- Error message when trying to run the Docker container
- Docker fails to start the container

**Solutions:**
1. Build the Docker image:
   ```bash
   docker-compose build
   ```
2. Check that the image name in your `docker-compose.yml` file is correct
3. Verify that the Dockerfile exists and is correctly configured

#### Issue: "Connection refused" error when accessing the application

**Symptoms:**
- Unable to connect to the application
- Browser shows "Connection refused" error

**Solutions:**
1. Check that the container is running:
   ```bash
   docker ps
   ```
2. Verify that the port mapping is correct in your `docker-compose.yml` file
3. Ensure that the application is listening on the correct port inside the container
4. Check the container logs for errors:
   ```bash
   docker logs container_name
   ```

### Cloud Deployment Issues

#### Issue: "Deployment failed" error in Google Cloud Run

**Symptoms:**
- Deployment fails with an error message
- Unable to access the application

**Solutions:**
1. Check the build logs for errors
2. Verify that your Dockerfile is correctly configured
3. Ensure that all environment variables are set
4. Check that your service account has the necessary permissions

#### Issue: "Application crashed" error in Heroku

**Symptoms:**
- Application crashes after deployment
- Heroku logs show error messages

**Solutions:**
1. Check the Heroku logs:
   ```bash
   heroku logs --tail
   ```
2. Verify that all environment variables are set:
   ```bash
   heroku config
   ```
3. Ensure that the Procfile is correctly configured
4. Check that your application is compatible with Heroku's environment

## TypeScript and Build Issues

### TypeScript Compilation Errors

#### Issue: "Cannot find name 'Express'" error

**Symptoms:**
- TypeScript compilation fails
- Error message about missing Express types

**Solutions:**
1. Install the Express type definitions:
   ```bash
   npm install --save-dev @types/express
   ```
2. Ensure that you've imported the Express types correctly:
   ```typescript
   import express from 'express';
   import { Request, Response } from 'express';
   ```
3. Check that your `tsconfig.json` file includes the necessary type definitions

#### Issue: "Property does not exist on type" error

**Symptoms:**
- TypeScript compilation fails
- Error message about a property not existing on a type

**Solutions:**
1. Check that you're using the correct type definitions
2. Add type assertions if necessary:
   ```typescript
   (req as any).customProperty = value;
   ```
3. Extend the type definitions to include the property:
   ```typescript
   declare global {
     namespace Express {
       interface Request {
         customProperty?: any;
       }
     }
   }
   ```

### Build Process Issues

#### Issue: "Build failed" error

**Symptoms:**
- Build process fails with error messages
- Unable to generate the `dist` directory

**Solutions:**
1. Check the error messages for specific issues
2. Verify that your `tsconfig.json` file is correctly configured
3. Ensure that all TypeScript files are correctly typed
4. Check for circular dependencies in your code

#### Issue: "Module not found" error during build

**Symptoms:**
- Build process fails with "Module not found" error
- Unable to resolve imports

**Solutions:**
1. Check that the module is installed
2. Verify that the import path is correct
3. Ensure that the module is included in your `tsconfig.json` file
4. Check for typos in the import statement

## Performance and Scaling Issues

### Slow Response Times

#### Issue: API requests take too long to complete

**Symptoms:**
- Application responds slowly
- Timeouts when making API requests

**Solutions:**
1. Implement caching to reduce API calls
2. Optimize your database queries
3. Use pagination for large data sets
4. Consider scaling your application horizontally

#### Issue: Memory leaks

**Symptoms:**
- Application uses increasingly more memory over time
- Performance degrades after running for a while

**Solutions:**
1. Use a tool like `node-memwatch` to detect memory leaks
2. Check for unresolved promises or callbacks
3. Ensure that event listeners are properly removed
4. Consider using a process manager like PM2 to automatically restart the application if it uses too much memory

### Rate Limiting and Quota Issues

#### Issue: "Quota exceeded" error from Google APIs

**Symptoms:**
- Error messages about quota limits
- Unable to make API requests

**Solutions:**
1. Implement exponential backoff for API requests
2. Use caching to reduce the number of API calls
3. Request a quota increase from Google Cloud Console
4. Optimize your code to use batch requests where possible

#### Issue: Too many requests to Firebase

**Symptoms:**
- Error messages about rate limiting
- Slow response times from Firebase

**Solutions:**
1. Implement caching for frequently accessed data
2. Use batch operations for multiple reads or writes
3. Optimize your Firestore queries
4. Consider using Firebase's offline capabilities

## Security Issues

### CORS Errors

#### Issue: "Cross-Origin Request Blocked" error

**Symptoms:**
- Browser console shows CORS errors
- Unable to make requests from the frontend

**Solutions:**
1. Configure CORS in your Express application:
   ```typescript
   import cors from 'cors';
   
   app.use(cors({
     origin: process.env.FRONTEND_URL,
     credentials: true
   }));
   ```
2. Ensure that your frontend URL is correctly set in the CORS configuration
3. Check that your API endpoints are correctly handling preflight requests

### Authentication Security Issues

#### Issue: Tokens are exposed in logs or URLs

**Symptoms:**
- Sensitive information appears in logs or URLs
- Potential security vulnerability

**Solutions:**
1. Never log sensitive information like tokens
2. Use POST requests instead of GET for authentication
3. Store tokens securely in HTTP-only cookies or secure storage
4. Implement token rotation and expiration

## Getting Additional Help

If you're still experiencing issues after trying the solutions in this guide, you can:

1. Check the project's GitHub repository for open issues
2. Consult the official documentation for Firebase, Google APIs, and other dependencies
3. Reach out to the development team for assistance
4. Search for similar issues on Stack Overflow or other developer forums

## Reporting Bugs

If you believe you've found a bug in the Dottie AI Assistant, please report it by:

1. Creating a detailed bug report with steps to reproduce
2. Including relevant error messages and logs
3. Specifying your environment (OS, Node.js version, etc.)
4. Submitting the report to the project's issue tracker

## Next Steps

Once you've resolved any issues, proceed to [Advanced Deployment](./07-advanced-deployment.md) for information on monitoring, logging, and scaling your application.
