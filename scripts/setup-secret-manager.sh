#!/bin/bash
# Script to set up Secret Manager for Dottie AI Assistant
# This script should be run with appropriate GCP permissions

# Set variables
PROJECT_ID="YOUR_GCP_PROJECT_ID"  # Replace with your actual GCP project ID
REGION="us-central1"              # Replace with your preferred region
SERVICE_ACCOUNT_NAME="dottie-backend-sa" # Service account name for the backend

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up Secret Manager for Dottie AI Assistant...${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if user is logged in
ACCOUNT=$(gcloud config get-value account 2>/dev/null)
if [ -z "$ACCOUNT" ]; then
    echo -e "${RED}Error: You are not logged in to gcloud. Please run 'gcloud auth login' first.${NC}"
    exit 1
fi

echo -e "${YELLOW}Using GCP project: ${PROJECT_ID}${NC}"
echo -e "${YELLOW}Using region: ${REGION}${NC}"

# Enable required APIs
echo -e "${YELLOW}Enabling required APIs...${NC}"
gcloud services enable secretmanager.googleapis.com --project=${PROJECT_ID}
gcloud services enable iam.googleapis.com --project=${PROJECT_ID}
gcloud services enable cloudresourcemanager.googleapis.com --project=${PROJECT_ID}

# Create service account if it doesn't exist
echo -e "${YELLOW}Setting up service account...${NC}"
if ! gcloud iam service-accounts describe ${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com --project=${PROJECT_ID} &>/dev/null; then
    echo -e "${YELLOW}Creating service account ${SERVICE_ACCOUNT_NAME}...${NC}"
    gcloud iam service-accounts create ${SERVICE_ACCOUNT_NAME} \
        --display-name="Dottie Backend Service Account" \
        --description="Service account for Dottie AI Assistant backend" \
        --project=${PROJECT_ID}
else
    echo -e "${YELLOW}Service account ${SERVICE_ACCOUNT_NAME} already exists.${NC}"
fi

# Grant the service account the Secret Manager Secret Accessor role
echo -e "${YELLOW}Granting Secret Manager Secret Accessor role to service account...${NC}"
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

# Function to create or update a secret
create_or_update_secret() {
    local secret_name=$1
    local secret_value=$2
    local description=$3
    
    # Check if secret exists
    if gcloud secrets describe ${secret_name} --project=${PROJECT_ID} &>/dev/null; then
        echo -e "${YELLOW}Secret ${secret_name} already exists. Adding new version...${NC}"
        echo -n "${secret_value}" | gcloud secrets versions add ${secret_name} --data-file=- --project=${PROJECT_ID}
    else
        echo -e "${YELLOW}Creating new secret ${secret_name}...${NC}"
        echo -n "${secret_value}" | gcloud secrets create ${secret_name} \
            --replication-policy="automatic" \
            --data-file=- \
            --description="${description}" \
            --project=${PROJECT_ID}
    fi
    
    # Set IAM policy to allow service account to access the secret
    echo -e "${YELLOW}Setting IAM policy for ${secret_name}...${NC}"
    gcloud secrets add-iam-policy-binding ${secret_name} \
        --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
        --role="roles/secretmanager.secretAccessor" \
        --project=${PROJECT_ID}
}

# Create or update secrets
echo -e "${YELLOW}Setting up required secrets...${NC}"

# Read Firebase service account key from file or prompt
FIREBASE_SA_FILE="./firebase-service-account.json"
if [ -f "$FIREBASE_SA_FILE" ]; then
    FIREBASE_SA=$(cat ${FIREBASE_SA_FILE})
    echo -e "${YELLOW}Using Firebase service account key from ${FIREBASE_SA_FILE}${NC}"
else
    echo -e "${YELLOW}Enter Firebase service account key (JSON format):${NC}"
    read -r FIREBASE_SA
fi

# Prompt for Google OAuth credentials
echo -e "${YELLOW}Enter Google OAuth client ID:${NC}"
read -r GOOGLE_CLIENT_ID

echo -e "${YELLOW}Enter Google OAuth client secret:${NC}"
read -r GOOGLE_CLIENT_SECRET

# Generate a random session secret
SESSION_SECRET=$(openssl rand -base64 32)

# Create or update the secrets
create_or_update_secret "firebase-service-account" "${FIREBASE_SA}" "Firebase service account key for Dottie AI Assistant"
create_or_update_secret "google-client-id" "${GOOGLE_CLIENT_ID}" "Google OAuth client ID for Dottie AI Assistant"
create_or_update_secret "google-client-secret" "${GOOGLE_CLIENT_SECRET}" "Google OAuth client secret for Dottie AI Assistant"
create_or_update_secret "session-secret" "${SESSION_SECRET}" "Session secret for Dottie AI Assistant"

# Create a key for the service account and save it
echo -e "${YELLOW}Creating key for service account...${NC}"
KEY_FILE="${SERVICE_ACCOUNT_NAME}-key.json"
gcloud iam service-accounts keys create ${KEY_FILE} \
    --iam-account=${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com \
    --project=${PROJECT_ID}

echo -e "${GREEN}Secret Manager setup completed successfully!${NC}"
echo -e "${YELLOW}Service account key saved to ${KEY_FILE}${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Update your Cloud Run deployment to use these secrets"
echo -e "2. Add the service account key to your deployment environment"
echo -e "3. Update your application code to retrieve secrets from Secret Manager"
echo -e "4. For local development, set the GOOGLE_APPLICATION_CREDENTIALS environment variable:"
echo -e "   export GOOGLE_APPLICATION_CREDENTIALS=\"$(pwd)/${KEY_FILE}\""

exit 0
