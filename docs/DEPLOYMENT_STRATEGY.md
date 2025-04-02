# Dottie AI Assistant - Deployment Strategy

This document outlines the comprehensive strategy for deploying the Dottie AI Assistant to Google Cloud Platform (GCP), including staging and production environments, as well as local development setup for Windows.

## Deployment Architecture

The Dottie AI Assistant uses a modern cloud-native architecture:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  Firebase       │◄────►│  API Gateway    │◄────►│  Cloud Run      │
│  Hosting        │      │                 │      │  (Backend)      │
│  (Frontend)     │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  Firebase Auth  │      │  Firestore      │      │  Secret Manager │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                                          │
                                                          ▼
                                                  ┌─────────────────┐
                                                  │                 │
                                                  │  Google APIs    │
                                                  │  (Workspace,    │
                                                  │   Vertex AI)    │
                                                  └─────────────────┘
```

## Deployment Phases

### Phase 1: Staging Environment Setup

#### 1.1 GCP Project Setup

1. Create a new GCP project for staging:
   ```bash
   gcloud projects create dottie-staging --name="Dottie AI Assistant Staging"
   ```

2. Link billing account:
   ```bash
   gcloud billing projects link dottie-staging --billing-account=YOUR_BILLING_ACCOUNT_ID
   ```

3. Enable required APIs:
   ```bash
   gcloud services enable cloudrun.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com \
     firestore.googleapis.com logging.googleapis.com monitoring.googleapis.com \
     apigateway.googleapis.com artifactregistry.googleapis.com \
     --project=dottie-staging
   ```

#### 1.2 Firebase Setup

1. Create a new Firebase project linked to the GCP project:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Add project > Select "dottie-staging"
   - Enable Google Analytics (optional)

2. Configure Firebase Authentication:
   - Go to Authentication > Sign-in method
   - Enable Google sign-in
   - Add authorized domains (staging URL)

3. Initialize Firestore:
   ```bash
   gcloud firestore databases create --region=us-central1 --project=dottie-staging
   ```

4. Set up Firestore security rules:
   - Deploy the rules file:
     ```bash
     firebase deploy --only firestore:rules --project=dottie-staging
     ```

#### 1.3 Service Account Setup

1. Create service account for backend:
   ```bash
   gcloud iam service-accounts create dottie-backend-sa \
     --display-name="Dottie Backend Service Account" \
     --description="Service account for Dottie AI Assistant backend" \
     --project=dottie-staging
   ```

2. Grant necessary roles:
   ```bash
   gcloud projects add-iam-policy-binding dottie-staging \
     --member="serviceAccount:dottie-backend-sa@dottie-staging.iam.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"

   gcloud projects add-iam-policy-binding dottie-staging \
     --member="serviceAccount:dottie-backend-sa@dottie-staging.iam.gserviceaccount.com" \
     --role="roles/datastore.user"

   gcloud projects add-iam-policy-binding dottie-staging \
     --member="serviceAccount:dottie-backend-sa@dottie-staging.iam.gserviceaccount.com" \
     --role="roles/logging.logWriter"
   ```

3. Create service account key:
   ```bash
   gcloud iam service-accounts keys create dottie-backend-sa-key.json \
     --iam-account=dottie-backend-sa@dottie-staging.iam.gserviceaccount.com \
     --project=dottie-staging
   ```

#### 1.4 Secret Manager Setup

1. Create required secrets:
   ```bash
   # Firebase service account
   cat firebase-service-account-staging.json | gcloud secrets create firebase-service-account \
     --replication-policy="automatic" --data-file=- \
     --project=dottie-staging

   # Google OAuth credentials
   echo -n "YOUR_CLIENT_ID" | gcloud secrets create google-client-id \
     --replication-policy="automatic" --data-file=- \
     --project=dottie-staging

   echo -n "YOUR_CLIENT_SECRET" | gcloud secrets create google-client-secret \
     --replication-policy="automatic" --data-file=- \
     --project=dottie-staging

   # Session secret
   openssl rand -base64 32 | gcloud secrets create session-secret \
     --replication-policy="automatic" --data-file=- \
     --project=dottie-staging
   ```

2. Grant service account access to secrets:
   ```bash
   for SECRET in firebase-service-account google-client-id google-client-secret session-secret; do
     gcloud secrets add-iam-policy-binding $SECRET \
       --member="serviceAccount:dottie-backend-sa@dottie-staging.iam.gserviceaccount.com" \
       --role="roles/secretmanager.secretAccessor" \
       --project=dottie-staging
   done
   ```

### Phase 2: Backend Deployment

#### 2.1 Backend Configuration

1. Create environment file (.env.staging):
   ```
   NODE_ENV=staging
   PORT=8080
   PROJECT_ID=dottie-staging
   REGION=us-central1
   GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
   ALLOWED_ORIGINS=https://dottie-staging.web.app,http://localhost:3000
   LOG_LEVEL=debug
   ```

2. Copy service account key to backend directory:
   ```bash
   cp dottie-backend-sa-key.json backend/service-account-key.json
   ```

#### 2.2 Cloud Run Deployment

1. Build and deploy using Cloud Build:
   ```bash
   cd backend
   gcloud builds submit --config cloudbuild.yaml \
     --substitutions=_ENVIRONMENT=staging,_REGION=us-central1,_SERVICE_NAME=dottie-backend \
     --project=dottie-staging
   ```

2. Verify deployment:
   ```bash
   gcloud run services describe dottie-backend \
     --region=us-central1 \
     --project=dottie-staging
   ```

### Phase 3: Frontend Deployment

#### 3.1 Frontend Configuration

1. Create environment file (.env.staging):
   ```
   VITE_API_URL=https://dottie-backend-dottie-staging.run.app
   VITE_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN=dottie-staging.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=dottie-staging
   VITE_FIREBASE_STORAGE_BUCKET=dottie-staging.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID
   VITE_ENVIRONMENT=staging
   ```

#### 3.2 Firebase Hosting Deployment

1. Build the frontend:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. Deploy to Firebase Hosting:
   ```bash
   firebase use staging
   firebase deploy --only hosting
   ```

### Phase 4: API Gateway Setup

1. Create API Gateway configuration:
   ```bash
   gcloud api-gateway apis create dottie-api \
     --project=dottie-staging

   gcloud api-gateway api-configs create dottie-api-config \
     --api=dottie-api \
     --openapi-spec=api-gateway.yaml \
     --project=dottie-staging \
     --backend-auth-service-account=dottie-backend-sa@dottie-staging.iam.gserviceaccount.com

   gcloud api-gateway gateways create dottie-gateway \
     --api=dottie-api \
     --api-config=dottie-api-config \
     --location=global \
     --project=dottie-staging
   ```

2. Get the gateway URL:
   ```bash
   gcloud api-gateway gateways describe dottie-gateway \
     --location=global \
     --project=dottie-staging \
     --format="value(defaultHostname)"
   ```

### Phase 5: Monitoring Setup

1. Create uptime checks:
   ```bash
   gcloud beta monitoring uptime-checks create http \
     --display-name="Dottie Backend API Health Check" \
     --uri="https://dottie-backend-dottie-staging.run.app/api/health" \
     --http-method=GET \
     --content-type=plain \
     --check-interval=60s \
     --timeout=10s \
     --project=dottie-staging
   ```

2. Create alert policies:
   ```bash
   # Example: Error rate alert
   gcloud alpha monitoring policies create \
     --display-name="Dottie Backend API Error Rate Alert" \
     --condition-filter="metric.type=\"run.googleapis.com/request_count\" AND resource.type=\"cloud_run_revision\" AND metric.label.response_code_class=\"4xx\" OR metric.label.response_code_class=\"5xx\"" \
     --condition-threshold-value=5 \
     --condition-threshold-comparison=COMPARISON_GT \
     --condition-aggregations-alignment-period=60s \
     --condition-aggregations-per-series-aligner=ALIGN_RATE \
     --condition-aggregations-cross-series-reducer=REDUCE_SUM \
     --condition-trigger-count=1 \
     --project=dottie-staging
   ```

3. Create dashboard:
   ```bash
   # Use Cloud Console to create a dashboard with key metrics
   # - Request count
   # - Error rate
   # - Latency
   # - Memory usage
   ```

## Production Deployment

The production deployment follows the same steps as staging, with these key differences:

1. Create a separate GCP project:
   ```bash
   gcloud projects create dottie-prod --name="Dottie AI Assistant Production"
   ```

2. Use production-specific environment variables:
   - Set `NODE_ENV=production`
   - Use production URLs
   - Set `LOG_LEVEL=info`

3. Configure more restrictive IAM permissions

4. Set up additional monitoring and alerting

5. Configure custom domain mapping:
   ```bash
   gcloud beta run domain-mappings create --service=dottie-backend \
     --domain=api.dottie.yourdomain.com \
     --project=dottie-prod \
     --region=us-central1
   ```

6. Set up Cloud CDN for frontend assets

## Local Development on Windows

### Prerequisites

1. Install Node.js (v20+) and npm (v9+)
2. Install Git
3. Install Google Cloud SDK
4. Install Firebase CLI:
   ```
   npm install -g firebase-tools
   ```

### Backend Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/dottie.git
   cd dottie
   ```

2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

3. Create .env file:
   ```
   NODE_ENV=development
   PORT=8080
   PROJECT_ID=dottie-staging
   REGION=us-central1
   GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
   ALLOWED_ORIGINS=http://localhost:3000
   LOG_LEVEL=debug
   ```

4. Copy service account key:
   - Download from GCP or use existing key
   - Save as `service-account-key.json` in backend directory

5. Start backend:
   ```
   npm run dev
   ```

### Frontend Setup

1. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

2. Create .env file:
   ```
   VITE_API_URL=http://localhost:8080
   VITE_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN=dottie-staging.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=dottie-staging
   VITE_FIREBASE_STORAGE_BUCKET=dottie-staging.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID
   VITE_ENVIRONMENT=development
   ```

3. Start frontend:
   ```
   npm run dev
   ```

4. Access the application at http://localhost:3000

### Running Tests

1. Backend tests:
   ```
   cd backend
   npm test
   ```

2. Frontend tests:
   ```
   cd frontend
   npm test
   ```

3. E2E tests:
   ```
   cd frontend
   npm run test:e2e:dev
   ```

## Continuous Integration/Continuous Deployment (CI/CD)

For a complete CI/CD pipeline, consider setting up:

1. GitHub Actions for automated testing
2. Cloud Build triggers for automated deployment
3. Separate pipelines for staging and production

Example GitHub Actions workflow:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, staging ]
  pull_request:
    branches: [ main, staging ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install backend dependencies
        run: cd backend && npm ci
      - name: Run backend tests
        run: cd backend && npm test
      - name: Install frontend dependencies
        run: cd frontend && npm ci
      - name: Run frontend tests
        run: cd frontend && npm test

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up gcloud
        uses: google-github-actions/setup-gcloud@v1
        with:
          project_id: dottie-staging
          service_account_key: ${{ secrets.GCP_SA_KEY }}
      - name: Deploy backend
        run: cd backend && gcloud builds submit --config cloudbuild.yaml --substitutions=_ENVIRONMENT=staging,_REGION=us-central1,_SERVICE_NAME=dottie-backend
      - name: Deploy frontend
        run: |
          cd frontend
          npm ci
          npm run build
          npx firebase-tools deploy --only hosting --project dottie-staging
```

## Rollback Procedures

In case of deployment issues:

1. Backend rollback:
   ```bash
   gcloud run services update dottie-backend \
     --image=gcr.io/dottie-staging/dottie-backend:PREVIOUS_VERSION \
     --project=dottie-staging \
     --region=us-central1
   ```

2. Frontend rollback:
   ```bash
   firebase hosting:rollback --project=dottie-staging
   ```

## Security Considerations

1. Ensure all secrets are stored in Secret Manager
2. Use service accounts with minimal permissions
3. Enable VPC Service Controls for production
4. Set up Cloud Armor for API protection
5. Implement regular security scanning

## Conclusion

This deployment strategy provides a comprehensive approach to deploying the Dottie AI Assistant on Google Cloud Platform, with separate staging and production environments. By following these steps, you can ensure a smooth deployment process and maintain a robust, scalable, and secure application.
