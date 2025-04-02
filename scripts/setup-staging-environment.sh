#!/bin/bash
# Script to set up the staging environment for Dottie AI Assistant

# Set variables
STAGING_PROJECT_ID="dottie-staging"  # Staging project ID
REGION="us-central1"                 # Region for deployment
SERVICE_ACCOUNT_NAME="dottie-backend-sa" # Service account name

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up staging environment for Dottie AI Assistant...${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}Error: Firebase CLI is not installed. Please install it first.${NC}"
    echo -e "Run: npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
ACCOUNT=$(gcloud config get-value account 2>/dev/null)
if [ -z "$ACCOUNT" ]; then
    echo -e "${RED}Error: You are not logged in to gcloud. Please run 'gcloud auth login' first.${NC}"
    exit 1
fi

# Create staging project if it doesn't exist
echo -e "${YELLOW}Creating staging project if it doesn't exist...${NC}"
if ! gcloud projects describe ${STAGING_PROJECT_ID} &>/dev/null; then
    echo -e "${YELLOW}Creating project ${STAGING_PROJECT_ID}...${NC}"
    gcloud projects create ${STAGING_PROJECT_ID} --name="Dottie AI Assistant Staging"
    
    # Link billing account
    echo -e "${YELLOW}Please select a billing account to link to the project:${NC}"
    gcloud billing accounts list
    read -p "Enter the billing account ID: " BILLING_ACCOUNT_ID
    gcloud billing projects link ${STAGING_PROJECT_ID} --billing-account=${BILLING_ACCOUNT_ID}
else
    echo -e "${YELLOW}Project ${STAGING_PROJECT_ID} already exists.${NC}"
fi

# Set the current project
gcloud config set project ${STAGING_PROJECT_ID}

# Enable required APIs
echo -e "${YELLOW}Enabling required APIs...${NC}"
gcloud services enable cloudrun.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com \
  apigateway.googleapis.com \
  artifactregistry.googleapis.com

# Create Firebase project
echo -e "${YELLOW}Setting up Firebase for staging...${NC}"
firebase use --add
# This will prompt to select the project and give it an alias (staging)

# Initialize Firestore
echo -e "${YELLOW}Initializing Firestore in Native mode...${NC}"
gcloud firestore databases create --region=${REGION}

# Set up service account for backend
echo -e "${YELLOW}Setting up service account for backend...${NC}"
if ! gcloud iam service-accounts describe ${SERVICE_ACCOUNT_NAME}@${STAGING_PROJECT_ID}.iam.gserviceaccount.com &>/dev/null; then
    echo -e "${YELLOW}Creating service account ${SERVICE_ACCOUNT_NAME}...${NC}"
    gcloud iam service-accounts create ${SERVICE_ACCOUNT_NAME} \
        --display-name="Dottie Backend Service Account" \
        --description="Service account for Dottie AI Assistant backend"
else
    echo -e "${YELLOW}Service account ${SERVICE_ACCOUNT_NAME} already exists.${NC}"
fi

# Grant necessary roles to the service account
echo -e "${YELLOW}Granting necessary roles to service account...${NC}"
gcloud projects add-iam-policy-binding ${STAGING_PROJECT_ID} \
    --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${STAGING_PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding ${STAGING_PROJECT_ID} \
    --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${STAGING_PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/datastore.user"

gcloud projects add-iam-policy-binding ${STAGING_PROJECT_ID} \
    --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${STAGING_PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/logging.logWriter"

# Create a key for the service account
echo -e "${YELLOW}Creating key for service account...${NC}"
KEY_FILE="${SERVICE_ACCOUNT_NAME}-key.json"
gcloud iam service-accounts keys create ${KEY_FILE} \
    --iam-account=${SERVICE_ACCOUNT_NAME}@${STAGING_PROJECT_ID}.iam.gserviceaccount.com

# Set up Secret Manager with staging secrets
echo -e "${YELLOW}Setting up Secret Manager for staging...${NC}"

# Function to create or update a secret
create_or_update_secret() {
    local secret_name=$1
    local secret_value=$2
    local description=$3
    
    # Check if secret exists
    if gcloud secrets describe ${secret_name} &>/dev/null; then
        echo -e "${YELLOW}Secret ${secret_name} already exists. Adding new version...${NC}"
        echo -n "${secret_value}" | gcloud secrets versions add ${secret_name} --data-file=-
    else
        echo -e "${YELLOW}Creating new secret ${secret_name}...${NC}"
        echo -n "${secret_value}" | gcloud secrets create ${secret_name} \
            --replication-policy="automatic" \
            --data-file=- \
            --description="${description}"
    fi
    
    # Set IAM policy to allow service account to access the secret
    echo -e "${YELLOW}Setting IAM policy for ${secret_name}...${NC}"
    gcloud secrets add-iam-policy-binding ${secret_name} \
        --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${STAGING_PROJECT_ID}.iam.gserviceaccount.com" \
        --role="roles/secretmanager.secretAccessor"
}

# Read Firebase service account key from file or prompt
FIREBASE_SA_FILE="./firebase-service-account-staging.json"
if [ -f "$FIREBASE_SA_FILE" ]; then
    FIREBASE_SA=$(cat ${FIREBASE_SA_FILE})
    echo -e "${YELLOW}Using Firebase service account key from ${FIREBASE_SA_FILE}${NC}"
else
    echo -e "${YELLOW}Please go to Firebase console > Project settings > Service accounts > Generate new private key${NC}"
    echo -e "${YELLOW}Save the file as ${FIREBASE_SA_FILE} in this directory${NC}"
    read -p "Press Enter once you've downloaded the file..." 
    if [ -f "$FIREBASE_SA_FILE" ]; then
        FIREBASE_SA=$(cat ${FIREBASE_SA_FILE})
    else
        echo -e "${RED}File not found. Please try again.${NC}"
        exit 1
    fi
fi

# Prompt for Google OAuth credentials for staging
echo -e "${YELLOW}Enter Google OAuth client ID for staging:${NC}"
read -r GOOGLE_CLIENT_ID

echo -e "${YELLOW}Enter Google OAuth client secret for staging:${NC}"
read -r GOOGLE_CLIENT_SECRET

# Generate a random session secret
SESSION_SECRET=$(openssl rand -base64 32)

# Create or update the secrets
create_or_update_secret "firebase-service-account" "${FIREBASE_SA}" "Firebase service account key for Dottie AI Assistant"
create_or_update_secret "google-client-id" "${GOOGLE_CLIENT_ID}" "Google OAuth client ID for Dottie AI Assistant"
create_or_update_secret "google-client-secret" "${GOOGLE_CLIENT_SECRET}" "Google OAuth client secret for Dottie AI Assistant"
create_or_update_secret "session-secret" "${SESSION_SECRET}" "Session secret for Dottie AI Assistant"

# Create staging environment files
echo -e "${YELLOW}Creating environment files for staging...${NC}"

# Backend .env file for staging
cat > ../backend/.env.staging << EOF
NODE_ENV=staging
PORT=8080
PROJECT_ID=${STAGING_PROJECT_ID}
REGION=${REGION}
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
ALLOWED_ORIGINS=https://dottie-staging.web.app,http://localhost:3000
LOG_LEVEL=debug
EOF

# Frontend .env file for staging
cat > ../frontend/.env.staging << EOF
VITE_API_URL=https://dottie-backend-${STAGING_PROJECT_ID}.run.app
VITE_FIREBASE_API_KEY=$(grep "apiKey" ../frontend/src/config/firebase.ts | cut -d'"' -f2)
VITE_FIREBASE_AUTH_DOMAIN=${STAGING_PROJECT_ID}.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=${STAGING_PROJECT_ID}
VITE_FIREBASE_STORAGE_BUCKET=${STAGING_PROJECT_ID}.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=$(grep "messagingSenderId" ../frontend/src/config/firebase.ts | cut -d'"' -f2)
VITE_FIREBASE_APP_ID=$(grep "appId" ../frontend/src/config/firebase.ts | cut -d'"' -f2)
VITE_ENVIRONMENT=staging
EOF

# Set up monitoring for staging
echo -e "${YELLOW}Setting up monitoring for staging...${NC}"
./setup-monitoring.sh

echo -e "${GREEN}Staging environment setup completed successfully!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Deploy backend to Cloud Run in the staging environment"
echo -e "2. Deploy frontend to Firebase Hosting in the staging environment"
echo -e "3. Set up API Gateway for the staging environment"
echo -e "4. Invite the internal testing group to test the staging environment"

exit 0
