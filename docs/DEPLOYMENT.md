# Dottie AI Assistant - Deployment Guide

This guide provides detailed instructions for deploying the Dottie AI Assistant to staging and production environments.

## Prerequisites

- Google Cloud Platform account with billing enabled
- Firebase project configured
- Google Cloud SDK installed and configured
- Firebase CLI installed and configured
- Necessary API permissions and service accounts

## Environment Setup

### 1. Google Cloud Project Setup

1. Create separate projects for staging and production:
   ```
   gcloud projects create dottie-staging --name="Dottie AI Assistant Staging"
   gcloud projects create dottie-prod --name="Dottie AI Assistant Production"
   ```

2. Enable required APIs:
   ```
   gcloud services enable cloudrun.googleapis.com \
     cloudbuild.googleapis.com \
     secretmanager.googleapis.com \
     firestore.googleapis.com \
     logging.googleapis.com \
     monitoring.googleapis.com \
     --project=PROJECT_ID
   ```

3. Set up Firebase for each project:
   ```
   firebase use --add
   # Select your GCP project and give it an alias (staging/prod)
   ```

### 2. Secret Management

Run the Secret Manager setup script:
```
cd scripts
./setup-secret-manager.sh
```

This script will:
- Create a service account for the backend
- Grant necessary permissions
- Create secrets for:
  - Firebase service account key
  - Google OAuth credentials
  - Session secret

## Backend Deployment (Cloud Run)

### 1. Build and Deploy

1. Update environment variables in `cloudbuild.yaml` if needed

2. Submit the build to Cloud Build:
   ```
   gcloud builds submit --config cloudbuild.yaml --project=PROJECT_ID
   ```

3. Verify deployment:
   ```
   gcloud run services describe dottie-backend --project=PROJECT_ID --region=us-central1
   ```

### 2. Configure Domain Mapping (Production Only)

1. Add a custom domain:
   ```
   gcloud beta run domain-mappings create --service=dottie-backend \
     --domain=api.dottie.yourdomain.com \
     --project=PROJECT_ID \
     --region=us-central1
   ```

2. Update DNS records as instructed by the command output

## Frontend Deployment (Firebase Hosting)

### 1. Configure Environment Variables

1. Create environment files for each environment:
   - `.env.staging`
   - `.env.production`

2. Update the API URL and Firebase configuration in each file

### 2. Deploy to Firebase Hosting

Use the deployment script:
```
cd frontend/scripts
./deploy-firebase.sh
```

Follow the prompts to select the environment (staging/production).

### 3. Configure Custom Domain (Production Only)

1. Add a custom domain in Firebase console:
   - Go to Hosting > Add custom domain
   - Follow the instructions to verify and configure DNS

## API Gateway Setup (Optional)

For additional security and management, set up API Gateway:

1. Deploy the API Gateway configuration:
   ```
   gcloud api-gateway gateways create dottie-gateway \
     --api=dottie-api \
     --api-config=dottie-api-config \
     --location=global \
     --project=PROJECT_ID
   ```

2. Update the frontend to use the API Gateway URL

## Monitoring Setup

1. Run the monitoring setup script:
   ```
   cd scripts
   ./setup-monitoring.sh
   ```

2. Configure notification channels in the Google Cloud Console:
   - Go to Monitoring > Alerting > Notification channels
   - Set up email, SMS, or other notification methods
   - Update the script with the notification channel IDs

3. Verify dashboard creation in Cloud Monitoring

## Staged Rollout Process

Follow this process for a controlled rollout:

### 1. Internal Testing (Staging)

1. Deploy to staging environment
2. Provide access to internal testers
3. Collect feedback and fix issues
4. Run load tests and performance tests

### 2. Limited Beta (Production)

1. Deploy to production environment
2. Enable access for a limited group of users
3. Monitor performance and error rates
4. Gradually increase user access

### 3. Full Release

1. Open access to all users
2. Continue monitoring for issues
3. Set up regular backup and maintenance schedule

## Rollback Procedure

If issues are detected in production:

1. Identify the issue source (frontend/backend)

2. For backend issues:
   ```
   gcloud run services update dottie-backend \
     --image=gcr.io/PROJECT_ID/dottie-backend:PREVIOUS_VERSION \
     --project=PROJECT_ID \
     --region=us-central1
   ```

3. For frontend issues:
   ```
   firebase hosting:rollback --project=PROJECT_ID
   ```

## Maintenance and Updates

### Regular Updates

1. Deploy to staging first
2. Run automated tests
3. Perform manual testing
4. Deploy to production during off-peak hours

### Database Backups

Set up regular Firestore backups:
```
gcloud firestore export gs://PROJECT_ID-backups/$(date +%Y-%m-%d) \
  --collection-ids=userTokens \
  --project=PROJECT_ID
```

## Troubleshooting

### Common Issues

1. **Deployment Failures**
   - Check Cloud Build logs
   - Verify service account permissions
   - Check for syntax errors in configuration files

2. **Authentication Issues**
   - Verify Firebase configuration
   - Check Secret Manager access
   - Validate OAuth credentials

3. **Performance Problems**
   - Check Cloud Monitoring metrics
   - Review Cloud Logging for errors
   - Adjust Cloud Run instance settings

### Support Resources

- Google Cloud Support
- Firebase Support
- Internal documentation
- Development team contact information
