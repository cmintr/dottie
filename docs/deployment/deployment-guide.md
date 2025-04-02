# Dottie AI Assistant Deployment Guide

This guide outlines the steps to deploy the Dottie AI Assistant application to Google Cloud Platform (GCP).

## Architecture Overview

The application consists of:

1. **Frontend**: React application deployed to Firebase Hosting
2. **Backend**: Node.js API deployed to Cloud Run
3. **Database**: Firestore for data storage
4. **Authentication**: Firebase Authentication
5. **API Gateway**: For managing API access and security

## Prerequisites

- Google Cloud Platform account with billing enabled
- Firebase project configured
- Google Cloud SDK installed locally
- Node.js and npm installed
- Git repository access

## Environment Setup

### 1. Set Up GCP Project

```bash
# Set project ID
export PROJECT_ID=dottie-ai-assistant

# Create a new project (if needed)
gcloud projects create $PROJECT_ID

# Set the project as default
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com \
    run.googleapis.com \
    secretmanager.googleapis.com \
    firestore.googleapis.com \
    apigateway.googleapis.com
```

### 2. Set Up Secret Manager

```bash
# Create secrets
gcloud secrets create firebase-service-account --replication-policy="automatic"
gcloud secrets create google-client-id --replication-policy="automatic"
gcloud secrets create google-client-secret --replication-policy="automatic"
gcloud secrets create session-secret --replication-policy="automatic"

# Add secret versions (replace with actual values)
echo -n "YOUR_FIREBASE_SERVICE_ACCOUNT_JSON" | gcloud secrets versions add firebase-service-account --data-file=-
echo -n "YOUR_GOOGLE_CLIENT_ID" | gcloud secrets versions add google-client-id --data-file=-
echo -n "YOUR_GOOGLE_CLIENT_SECRET" | gcloud secrets versions add google-client-secret --data-file=-
echo -n "YOUR_SESSION_SECRET" | gcloud secrets versions add session-secret --data-file=-
```

## Backend Deployment

### 1. Build and Deploy to Cloud Run

```bash
# Navigate to backend directory
cd backend

# Build and deploy using Cloud Build
gcloud builds submit --config=cloudbuild.yaml
```

### 2. Verify Deployment

```bash
# Get the deployed service URL
gcloud run services describe dottie-backend --platform managed --region us-central1 --format="value(status.url)"
```

## Frontend Deployment

### 1. Configure Environment Variables

Create a `.env.production` file in the frontend directory:

```
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_URL=https://your-backend-url/api
```

### 2. Build and Deploy to Firebase Hosting

```bash
# Navigate to frontend directory
cd frontend

# Install Firebase CLI (if needed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if needed)
firebase init hosting

# Build the application
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

## API Gateway Setup

### 1. Create API Configuration

Create an API Gateway configuration file `api-config.yaml`:

```yaml
swagger: '2.0'
info:
  title: Dottie AI Assistant API
  description: API Gateway for Dottie AI Assistant
  version: 1.0.0
schemes:
  - https
produces:
  - application/json
paths:
  /api/**:
    get:
      operationId: getApiProxy
      x-google-backend:
        address: [CLOUD_RUN_URL]/api
      security:
        - api_key: []
    post:
      operationId: postApiProxy
      x-google-backend:
        address: [CLOUD_RUN_URL]/api
      security:
        - api_key: []
securityDefinitions:
  api_key:
    type: apiKey
    name: x-api-key
    in: header
```

### 2. Deploy API Gateway

```bash
# Create API
gcloud api-gateway apis create dottie-api --project=$PROJECT_ID

# Create API Config
gcloud api-gateway api-configs create dottie-api-config \
  --api=dottie-api \
  --openapi-spec=api-config.yaml \
  --project=$PROJECT_ID

# Create Gateway
gcloud api-gateway gateways create dottie-gateway \
  --api=dottie-api \
  --api-config=dottie-api-config \
  --location=us-central1 \
  --project=$PROJECT_ID
```

## Monitoring and Maintenance

### 1. Set Up Logging and Monitoring

```bash
# View Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=dottie-backend" --limit=10

# Set up alerts (optional)
gcloud alpha monitoring channels create --display-name="Email Alerts" --type=email --channel-labels=email_address=alerts@example.com
```

### 2. Configure Continuous Deployment (Optional)

Set up Cloud Build triggers to automatically deploy on repository changes.

## Troubleshooting

### Common Issues

1. **Authentication Failures**: Verify Firebase configuration and service account permissions
2. **API Gateway Issues**: Check backend URL and CORS configuration
3. **Cloud Run Errors**: Review logs and ensure memory/CPU allocation is sufficient
4. **Frontend Connection Issues**: Verify API URL in environment variables

### Support Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [API Gateway Documentation](https://cloud.google.com/api-gateway/docs)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)

## Security Considerations

1. Regularly rotate API keys and secrets
2. Enable audit logging for all services
3. Configure appropriate IAM roles with least privilege
4. Set up VPC Service Controls for additional security (advanced)
5. Implement rate limiting on API Gateway
