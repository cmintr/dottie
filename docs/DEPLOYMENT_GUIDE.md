# Dottie AI Assistant - Deployment Guide

This guide provides detailed instructions for deploying the Dottie AI Assistant for more extensive testing and eventual production use. It covers multiple deployment options, configuration requirements, and best practices.

## Table of Contents

1. [Deployment Options](#deployment-options)
2. [Prerequisites](#prerequisites)
3. [Firebase Configuration](#firebase-configuration)
4. [Google Cloud Setup](#google-cloud-setup)
5. [Staged Deployment Process](#staged-deployment-process)
6. [Monitoring and Logging](#monitoring-and-logging)
7. [Security Considerations](#security-considerations)
8. [Rollback Procedures](#rollback-procedures)
9. [FAQ and Troubleshooting](#faq-and-troubleshooting)

## Deployment Options

Dottie AI Assistant supports multiple deployment options, each suitable for different testing and production scenarios:

### 1. Internal Testing Deployment

- **Purpose**: Initial testing with a small team
- **Infrastructure**: Firebase Hosting + Cloud Run
- **Access Control**: Limited to specific test users
- **Data**: Test data with limited access to real Google Workspace accounts

### 2. Beta Testing Deployment

- **Purpose**: Expanded testing with selected external users
- **Infrastructure**: Firebase Hosting + Cloud Run with higher resource allocation
- **Access Control**: Invitation-based access
- **Data**: Mix of test data and limited real data access

### 3. Production Deployment

- **Purpose**: Full release to all users
- **Infrastructure**: Firebase Hosting + Cloud Run with auto-scaling
- **Access Control**: Open registration with proper authentication
- **Data**: Full access to authorized Google Workspace accounts

## Prerequisites

Before deploying Dottie AI Assistant, ensure you have:

1. **Google Cloud Platform Account**
   - Project with billing enabled
   - Required APIs activated:
     - Cloud Run API
     - Firebase API
     - Secret Manager API
     - Cloud Logging API
     - Cloud Monitoring API

2. **Firebase Project**
   - Linked to your Google Cloud project
   - Authentication configured with Google provider
   - Firestore database created
   - Firebase Hosting set up

3. **Google Workspace API Credentials**
   - OAuth 2.0 client ID and secret
   - API access configured for Gmail, Calendar, and Sheets
   - Proper scopes defined

4. **Domain and SSL**
   - Custom domain (optional but recommended)
   - SSL certificate (automatically provided by Firebase Hosting)

5. **Development Tools**
   - Google Cloud SDK installed and configured
   - Firebase CLI installed and configured
   - Node.js and npm

## Firebase Configuration

### Setting Up Firebase Project

1. **Create or select a Firebase project**:
   ```bash
   firebase projects:create dottie-ai-assistant
   # Or use an existing project
   firebase use --add
   ```

2. **Configure Firebase Authentication**:
   - Go to Firebase Console > Authentication
   - Enable Google sign-in method
   - Add authorized domains (localhost for testing, your production domain)

3. **Set up Firestore**:
   - Go to Firebase Console > Firestore Database
   - Create database in your preferred region
   - Start in production mode
   - Set up security rules:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // User profiles accessible by the user themselves
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // User tokens only accessible by the user themselves
       match /userTokens/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Conversations accessible by the user who created them
       match /conversations/{conversationId} {
         allow read, write: if request.auth != null && 
                             resource.data.userId == request.auth.uid;
       }
     }
   }
   ```

4. **Configure Firebase Hosting**:
   - Initialize Firebase Hosting:
   ```bash
   firebase init hosting
   ```
   - Configure single-page application redirects in `firebase.json`:
   ```json
   {
     "hosting": {
       "public": "frontend/dist",
       "ignore": [
         "firebase.json",
         "**/.*",
         "**/node_modules/**"
       ],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```

## Google Cloud Setup

### Setting Up Cloud Run

1. **Enable required APIs**:
   ```bash
   gcloud services enable run.googleapis.com \
     secretmanager.googleapis.com \
     logging.googleapis.com \
     monitoring.googleapis.com
   ```

2. **Create secrets in Secret Manager**:
   ```bash
   # Create secret for Firebase service account
   gcloud secrets create firebase-service-account --data-file=./firebase-service-account.json

   # Create secret for Google OAuth client
   gcloud secrets create google-oauth-client --data-file=./google-oauth-client.json
   ```

3. **Configure Cloud Run service**:
   ```bash
   gcloud run deploy dottie-backend \
     --source ./backend \
     --region us-central1 \
     --allow-unauthenticated \
     --set-secrets=FIREBASE_SERVICE_ACCOUNT=firebase-service-account:latest,GOOGLE_OAUTH_CLIENT=google-oauth-client:latest \
     --set-env-vars="NODE_ENV=production,FRONTEND_URL=https://your-app-domain.com"
   ```

4. **Set up Cloud Run service account**:
   ```bash
   # Create a service account for Cloud Run
   gcloud iam service-accounts create dottie-service-account \
     --display-name="Dottie Service Account"

   # Grant necessary permissions
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:dottie-service-account@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"

   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:dottie-service-account@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/datastore.user"
   ```

## Staged Deployment Process

Following the CTO's guidance, implement a staged rollout approach:

### 1. Internal Testing Deployment

1. **Prepare the environment**:
   ```bash
   # Create .env files for internal testing
   cp backend/.env.example backend/.env.internal
   cp frontend/.env.example frontend/.env.internal
   
   # Edit the .env files with appropriate values for internal testing
   ```

2. **Build the frontend**:
   ```bash
   cd frontend
   npm run build:internal  # Add this script to package.json
   ```

3. **Deploy to Firebase Hosting (internal)**:
   ```bash
   firebase deploy --only hosting -P internal
   ```

4. **Deploy backend to Cloud Run (internal)**:
   ```bash
   gcloud run deploy dottie-backend-internal \
     --source ./backend \
     --region us-central1 \
     --tag internal \
     --service-account dottie-service-account@YOUR_PROJECT_ID.iam.gserviceaccount.com \
     --set-secrets=... \
     --set-env-vars="NODE_ENV=internal,..."
   ```

5. **Set up access control**:
   - Add test users' email addresses to an allowlist in Firebase Authentication
   - Configure Firebase Security Rules to restrict access

### 2. Beta Testing Deployment

1. **Prepare the environment**:
   ```bash
   # Create .env files for beta testing
   cp backend/.env.example backend/.env.beta
   cp frontend/.env.example frontend/.env.beta
   
   # Edit the .env files with appropriate values for beta testing
   ```

2. **Build the frontend**:
   ```bash
   cd frontend
   npm run build:beta  # Add this script to package.json
   ```

3. **Deploy to Firebase Hosting (beta)**:
   ```bash
   firebase deploy --only hosting -P beta
   ```

4. **Deploy backend to Cloud Run (beta)**:
   ```bash
   gcloud run deploy dottie-backend-beta \
     --source ./backend \
     --region us-central1 \
     --tag beta \
     --service-account dottie-service-account@YOUR_PROJECT_ID.iam.gserviceaccount.com \
     --set-secrets=... \
     --set-env-vars="NODE_ENV=beta,..."
   ```

5. **Set up beta user management**:
   - Create a beta user registration system
   - Implement invitation codes for controlled access

### 3. Production Deployment

1. **Prepare the environment**:
   ```bash
   # Create .env files for production
   cp backend/.env.example backend/.env.production
   cp frontend/.env.example frontend/.env.production
   
   # Edit the .env files with appropriate values for production
   ```

2. **Build the frontend**:
   ```bash
   cd frontend
   npm run build  # Production build
   ```

3. **Deploy to Firebase Hosting (production)**:
   ```bash
   firebase deploy --only hosting -P production
   ```

4. **Deploy backend to Cloud Run (production)**:
   ```bash
   gcloud run deploy dottie-backend \
     --source ./backend \
     --region us-central1 \
     --service-account dottie-service-account@YOUR_PROJECT_ID.iam.gserviceaccount.com \
     --set-secrets=... \
     --set-env-vars="NODE_ENV=production,..."
   ```

5. **Configure custom domain**:
   ```bash
   firebase hosting:channel:deploy production
   firebase hosting:sites:update dottie-ai-assistant --site your-custom-domain.com
   ```

## Monitoring and Logging

### Setting Up Monitoring

1. **Create custom dashboard**:
   ```bash
   gcloud monitoring dashboards create --config-from-file=monitoring/dashboard.json
   ```

2. **Set up alerts**:
   ```bash
   # Create alert for high error rates
   gcloud alpha monitoring policies create \
     --display-name="Dottie Backend Error Rate Alert" \
     --condition-filter="metric.type=\"run.googleapis.com/request_count\" AND resource.type=\"cloud_run_revision\" AND metric.labels.response_code_class=\"4xx\"" \
     --condition-threshold-value=10 \
     --condition-threshold-comparison=COMPARISON_GT \
     --condition-threshold-duration=300s \
     --notification-channels=YOUR_NOTIFICATION_CHANNEL_ID
   ```

3. **Configure uptime checks**:
   ```bash
   gcloud monitoring uptime-checks create http \
     --display-name="Dottie Backend API" \
     --uri="https://dottie-backend-URL/api/health" \
     --http-method=GET \
     --timeout=10s
   ```

### Setting Up Logging

1. **Configure structured logging in backend**:
   ```javascript
   // Example logging configuration in backend/src/utils/logger.ts
   import { LoggingWinston } from '@google-cloud/logging-winston';
   import winston from 'winston';

   const loggingWinston = new LoggingWinston();

   export const logger = winston.createLogger({
     level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
     format: winston.format.combine(
       winston.format.timestamp(),
       winston.format.json()
     ),
     transports: [
       new winston.transports.Console(),
       // Add Cloud Logging in production
       ...(process.env.NODE_ENV === 'production' ? [loggingWinston] : [])
     ]
   });
   ```

2. **Set up log-based metrics**:
   ```bash
   gcloud logging metrics create dottie-auth-failures \
     --description="Count of authentication failures" \
     --log-filter="resource.type=cloud_run_revision AND jsonPayload.event=auth_failure"
   ```

3. **Create log sinks for long-term storage**:
   ```bash
   gcloud logging sinks create dottie-logs-archive \
     storage.googleapis.com/dottie-logs-bucket \
     --log-filter="resource.type=cloud_run_revision AND resource.labels.service_name=dottie-backend"
   ```

## Security Considerations

### Securing Firebase Authentication

1. **Configure proper authentication settings**:
   - Set password requirements (if using email/password)
   - Enable email verification
   - Set up multi-factor authentication for admin accounts

2. **Set up proper OAuth scopes**:
   - Request only the minimum required scopes
   - Use incremental authorization to request additional permissions as needed

3. **Implement proper session management**:
   - Set appropriate token expiration times
   - Implement secure token refresh mechanism
   - Store tokens securely in Firestore

### Securing API Endpoints

1. **Implement proper authentication middleware**:
   ```javascript
   // Example authentication middleware
   export const authenticateUser = async (req, res, next) => {
     try {
       const authHeader = req.headers.authorization;
       if (!authHeader || !authHeader.startsWith('Bearer ')) {
         return res.status(401).json({ error: 'Unauthorized' });
       }
       
       const token = authHeader.split('Bearer ')[1];
       const decodedToken = await admin.auth().verifyIdToken(token);
       req.user = decodedToken;
       next();
     } catch (error) {
       logger.error('Authentication error', { error });
       return res.status(401).json({ error: 'Unauthorized' });
     }
   };
   ```

2. **Set up CORS properly**:
   ```javascript
   // Example CORS configuration
   import cors from 'cors';

   const corsOptions = {
     origin: process.env.FRONTEND_URL,
     methods: ['GET', 'POST', 'PUT', 'DELETE'],
     allowedHeaders: ['Content-Type', 'Authorization'],
     credentials: true
   };

   app.use(cors(corsOptions));
   ```

3. **Implement rate limiting**:
   ```javascript
   // Example rate limiting with express-rate-limit
   import rateLimit from 'express-rate-limit';

   const apiLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // limit each IP to 100 requests per windowMs
     message: 'Too many requests, please try again later'
   });

   app.use('/api/', apiLimiter);
   ```

## Rollback Procedures

### Frontend Rollback

1. **Identify the previous stable version**:
   ```bash
   firebase hosting:versions:list
   ```

2. **Roll back to the previous version**:
   ```bash
   firebase hosting:clone VERSION_ID live
   ```

### Backend Rollback

1. **List available revisions**:
   ```bash
   gcloud run revisions list --service=dottie-backend
   ```

2. **Roll back to a specific revision**:
   ```bash
   gcloud run services update-traffic dottie-backend --to-revisions=REVISION_NAME=100
   ```

## FAQ and Troubleshooting

### Common Deployment Issues

#### Firebase Deployment Fails
- **Issue**: `Error: Failed to get Firebase project`
- **Solution**: Ensure you're authenticated with the correct Firebase account and have access to the project
  ```bash
  firebase login
  firebase use --add
  ```

#### Cloud Run Deployment Fails
- **Issue**: `ERROR: (gcloud.run.deploy) Cloud Build operation failed`
- **Solution**: Check build logs for specific errors
  ```bash
  gcloud builds list
  gcloud builds log BUILD_ID
  ```

#### Authentication Not Working
- **Issue**: Users cannot sign in after deployment
- **Solution**: Verify Firebase Authentication configuration
  - Check authorized domains in Firebase Console
  - Verify environment variables are correctly set
  - Check for CORS issues in browser console

#### API Calls Failing
- **Issue**: Frontend cannot connect to backend API
- **Solution**: Check API URL configuration and CORS settings
  - Verify the `BACKEND_URL` in frontend environment
  - Check CORS configuration in backend
  - Verify Cloud Run service is publicly accessible

### Questions for the CTO

1. **Authentication Strategy**:
   - Should we implement additional authentication methods beyond Google OAuth?
   - What is the preferred token refresh strategy for long-lived sessions?

2. **Data Retention Policy**:
   - What is the data retention policy for user conversations and function call results?
   - Should we implement automatic data purging after a certain period?

3. **Scaling Considerations**:
   - What are the expected user numbers for each deployment stage?
   - Should we implement regional deployments for better global performance?

4. **Compliance Requirements**:
   - Are there specific compliance requirements (GDPR, CCPA, etc.) we need to address?
   - Do we need to implement data export/deletion functionality for compliance?

5. **Integration Testing**:
   - What level of integration testing is required before each deployment stage?
   - Should we set up a dedicated testing environment with synthetic Google Workspace accounts?

By following this deployment guide, you'll be able to deploy the Dottie AI Assistant for more extensive testing and eventual production use, ensuring a smooth transition between deployment stages.
