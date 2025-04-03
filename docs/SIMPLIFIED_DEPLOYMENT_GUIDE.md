# Simplified Deployment Guide for Dottie AI Assistant

This guide provides easy-to-follow instructions for deploying the Dottie AI Assistant to Google Cloud Platform (GCP) using Terraform and Cloud Build. It's designed for people with minimal technical experience.

## What You'll Need

1. **Google Cloud Platform Account** with billing enabled
2. **Google Cloud SDK** installed on your computer ([Download here](https://cloud.google.com/sdk/docs/install))
3. **Terraform** installed on your computer ([Download here](https://www.terraform.io/downloads.html))
4. **Git** installed on your computer ([Download here](https://git-scm.com/downloads))
5. **Access to the Dottie repository** (you should have this already if you're reading this guide)

## Step 1: Initial Setup

### Log in to Google Cloud

1. Open a command prompt (Windows) or terminal (Mac/Linux)
2. Run the following command and follow the instructions to log in:
   ```
   gcloud auth login
   ```
3. After logging in, run this command to configure the application default credentials:
   ```
   gcloud auth application-default login
   ```

### Clone the Repository (if you haven't already)

```
git clone https://github.com/yourusername/dottie.git
cd dottie
```

## Step 2: Set Up Your Project

### Create a New GCP Project (or use an existing one)

1. Create a new project in the [Google Cloud Console](https://console.cloud.google.com/)
2. Note down the **Project ID** - you'll need this later

### Enable Required APIs

Run the following command, replacing `YOUR_PROJECT_ID` with your actual project ID:

```
gcloud config set project YOUR_PROJECT_ID

gcloud services enable cloudbuild.googleapis.com \
    run.googleapis.com \
    secretmanager.googleapis.com \
    firestore.googleapis.com \
    apigateway.googleapis.com \
    firebase.googleapis.com
```

## Step 3: Set Up Secrets

You'll need to create several secrets that the application will use. Run the following commands, replacing the placeholder values with your actual data:

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

> **Note:** For the Firebase service account JSON, you'll need to download this from the Firebase console. The Google client ID and secret come from setting up OAuth credentials in the Google Cloud Console.

## Step 4: Deploy with Terraform

Terraform will automatically set up all the infrastructure you need.

### Initialize Terraform

```
cd terraform
terraform init
```

### Create a terraform.tfvars File

Create a file named `terraform.tfvars` in the terraform directory with the following content (replace with your values):

```
project_id = "YOUR_PROJECT_ID"
region     = "us-central1"  # or your preferred region
```

### Plan and Apply the Terraform Configuration

```
terraform plan -out=tfplan
terraform apply tfplan
```

This will create all the necessary infrastructure in your GCP project, including:
- Cloud Run service for the backend
- Firestore database
- Secret Manager secrets
- API Gateway
- Firebase configuration

## Step 5: Deploy the Application with Cloud Build

Now that the infrastructure is set up, you can deploy the application code.

### Deploy the Backend

```
cd ../backend
gcloud builds submit --config=cloudbuild.yaml
```

### Deploy the API Gateway

```
cd ..
gcloud builds submit --config=api-gateway-cloudbuild.yaml
```

### Deploy the Frontend

```
cd frontend
npm install -g firebase-tools
firebase login
npm install
npm run build
firebase deploy --only hosting
```

## Step 6: Verify the Deployment

### Check the Backend

```
gcloud run services describe dottie-backend --platform managed --region us-central1 --format="value(status.url)"
```

This will output the URL of your backend service. Visit this URL in a browser to verify it's running.

### Check the Frontend

After deploying the frontend to Firebase Hosting, you'll receive a URL where your application is hosted. Visit this URL in a browser to verify the frontend is working.

## Troubleshooting

### Common Issues

#### Terraform Errors

- **Error:** "Error: Error creating Service"
  - **Solution:** Make sure all required APIs are enabled in your GCP project

- **Error:** "Error: Error creating Secret"
  - **Solution:** Make sure you have the necessary permissions to create secrets

#### Cloud Build Errors

- **Error:** "Build failed"
  - **Solution:** Check the build logs for specific errors. Common issues include missing dependencies or configuration errors.

#### Application Errors

- **Error:** "Firebase is not initialized"
  - **Solution:** Make sure your Firebase service account secret is correctly set up

- **Error:** "Invalid OAuth client"
  - **Solution:** Verify your Google OAuth client ID and secret are correctly set up

### Getting Help

If you encounter issues not covered in this guide:

1. Check the detailed logs in the Google Cloud Console
2. Refer to the more detailed documentation in the `docs/deployment` directory
3. Contact your technical team for assistance

## Maintenance

### Updating the Application

To update the application after making changes to the code:

1. Push your changes to the repository
2. Run the Cloud Build commands again to deploy the updated code

### Monitoring

You can monitor your application's performance and errors in the Google Cloud Console:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to Cloud Run to monitor the backend
3. Navigate to Firebase Hosting to monitor the frontend
4. Check Cloud Logging for detailed logs

## Security Considerations

1. Regularly rotate your secrets (Google client secret, session secret, etc.)
2. Keep your Firebase service account JSON secure and never commit it to the repository
3. Regularly update dependencies to patch security vulnerabilities
4. Monitor your application for unusual activity

---

Congratulations! You've successfully deployed the Dottie AI Assistant to Google Cloud Platform using Terraform and Cloud Build.