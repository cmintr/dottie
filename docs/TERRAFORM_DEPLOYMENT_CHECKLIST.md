# Dottie AI Assistant: Terraform Deployment Checklist

This checklist provides a simplified, step-by-step guide for deploying the Dottie AI Assistant using Terraform and Cloud Build. It's designed for non-technical users who need to deploy the application without deep technical knowledge.

## Before You Begin

- [ ] You have a Google Cloud Platform (GCP) account with billing enabled
- [ ] You have the Google Cloud SDK installed on your computer
- [ ] You have Terraform installed on your computer
- [ ] You have access to the Dottie repository

## Step 1: Initial Setup

- [ ] Log in to Google Cloud using the command: `gcloud auth login`
- [ ] Set up application default credentials: `gcloud auth application-default login`
- [ ] Create or select a GCP project in the Google Cloud Console
- [ ] Note down your Project ID: ________________

## Step 2: Enable Required APIs

Run this command (replace `YOUR_PROJECT_ID` with your actual project ID):

```
gcloud config set project YOUR_PROJECT_ID

gcloud services enable cloudbuild.googleapis.com \
    run.googleapis.com \
    secretmanager.googleapis.com \
    firestore.googleapis.com \
    apigateway.googleapis.com \
    firebase.googleapis.com
```

## Step 3: Prepare Your Secrets

You'll need these values (get them from your technical team):

- [ ] Firebase service account JSON file
- [ ] Google OAuth client ID
- [ ] Google OAuth client secret
- [ ] Session secret (can be any random string)

## Step 4: Set Up Secret Manager

Run these commands (replace placeholder values with your actual data):

```
# Create secrets
gcloud secrets create firebase-service-account --replication-policy="automatic"
gcloud secrets create google-client-id --replication-policy="automatic"
gcloud secrets create google-client-secret --replication-policy="automatic"
gcloud secrets create session-secret --replication-policy="automatic"

# Add secret values (replace YOUR_VALUE with actual values)
echo -n "YOUR_FIREBASE_SERVICE_ACCOUNT_JSON" | gcloud secrets versions add firebase-service-account --data-file=-
echo -n "YOUR_GOOGLE_CLIENT_ID" | gcloud secrets versions add google-client-id --data-file=-
echo -n "YOUR_GOOGLE_CLIENT_SECRET" | gcloud secrets versions add google-client-secret --data-file=-
echo -n "YOUR_SESSION_SECRET" | gcloud secrets versions add session-secret --data-file=-
```

## Step 5: Deploy Infrastructure with Terraform

- [ ] Navigate to the terraform directory: `cd terraform`
- [ ] Initialize Terraform: `terraform init`
- [ ] Create a file named `terraform.tfvars` with this content (replace with your values):

```
project_id = "YOUR_PROJECT_ID"
region     = "us-central1"  # or your preferred region
```

- [ ] Plan the deployment: `terraform plan -out=tfplan`
- [ ] Apply the plan: `terraform apply tfplan`

## Step 6: Deploy the Application

### Backend Deployment

- [ ] Navigate to the backend directory: `cd ../backend`
- [ ] Submit the build: `gcloud builds submit --config=cloudbuild.yaml`

### API Gateway Deployment

- [ ] Navigate to the project root: `cd ..`
- [ ] Submit the build: `gcloud builds submit --config=api-gateway-cloudbuild.yaml`

### Frontend Deployment

- [ ] Navigate to the frontend directory: `cd frontend`
- [ ] Install Firebase tools: `npm install -g firebase-tools`
- [ ] Log in to Firebase: `firebase login`
- [ ] Install dependencies: `npm install`
- [ ] Build the frontend: `npm run build`
- [ ] Deploy to Firebase: `firebase deploy --only hosting`

## Step 7: Verify Deployment

- [ ] Check the backend URL: `gcloud run services describe dottie-backend --platform managed --region us-central1 --format="value(status.url)"`
- [ ] Visit the backend URL in a browser to verify it's running
- [ ] Visit the Firebase Hosting URL to verify the frontend is working

## Common Issues and Solutions

### If Terraform deployment fails:

- Check that all required APIs are enabled
- Verify you have the necessary permissions
- Look for specific error messages in the output

### If Cloud Build fails:

- Check the build logs in the Google Cloud Console
- Verify your configuration files are correct
- Ensure all dependencies are properly specified

### If the application doesn't work:

- Check that all secrets are correctly set up
- Verify the backend URL is correctly configured in the frontend
- Check the application logs in the Google Cloud Console

## Need Help?

If you encounter issues not covered in this checklist:

1. Check the detailed logs in the Google Cloud Console
2. Refer to the more detailed documentation in the `docs/deployment` directory
3. Contact your technical team for assistance

---

**Deployment Completed On:** ________________

**Deployed By:** ________________

**Notes:** ________________