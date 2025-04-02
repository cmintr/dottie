#!/bin/bash
# Script to deploy Dottie AI Assistant to the staging environment

# Set variables
STAGING_PROJECT_ID="dottie-staging"  # Staging project ID
REGION="us-central1"                 # Region for deployment
SERVICE_NAME="dottie-backend"        # Cloud Run service name

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Deploying Dottie AI Assistant to staging environment...${NC}"

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

# Set the current project
gcloud config set project ${STAGING_PROJECT_ID}

# Deploy backend to Cloud Run
echo -e "${YELLOW}Deploying backend to Cloud Run...${NC}"
cd ../backend

# Copy service account key to backend directory
if [ -f "../scripts/${SERVICE_NAME}-key.json" ]; then
    cp "../scripts/${SERVICE_NAME}-key.json" ./service-account-key.json
else
    echo -e "${RED}Error: Service account key not found. Please run setup-staging-environment.sh first.${NC}"
    exit 1
fi

# Copy .env.staging to .env
cp .env.staging .env

# Build and deploy using Cloud Build
echo -e "${YELLOW}Building and deploying backend...${NC}"
gcloud builds submit --config cloudbuild.yaml \
    --substitutions=_ENVIRONMENT=staging,_REGION=${REGION},_SERVICE_NAME=${SERVICE_NAME}

# Deploy frontend to Firebase Hosting
echo -e "${YELLOW}Deploying frontend to Firebase Hosting...${NC}"
cd ../frontend

# Copy .env.staging to .env
cp .env.staging .env

# Install dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
npm install

# Build the frontend
echo -e "${YELLOW}Building frontend...${NC}"
npm run build

# Deploy to Firebase Hosting
echo -e "${YELLOW}Deploying to Firebase Hosting...${NC}"
firebase use staging
firebase deploy --only hosting

# Set up API Gateway
echo -e "${YELLOW}Setting up API Gateway...${NC}"
cd ..

# Check if api-gateway.yaml exists
if [ ! -f "api-gateway.yaml" ]; then
    echo -e "${RED}Error: api-gateway.yaml not found.${NC}"
    exit 1
fi

# Deploy API Gateway
echo -e "${YELLOW}Deploying API Gateway...${NC}"
gcloud api-gateway apis create dottie-api \
    --project=${STAGING_PROJECT_ID}

gcloud api-gateway api-configs create dottie-api-config \
    --api=dottie-api \
    --openapi-spec=api-gateway.yaml \
    --project=${STAGING_PROJECT_ID} \
    --backend-auth-service-account=${SERVICE_NAME}@${STAGING_PROJECT_ID}.iam.gserviceaccount.com

gcloud api-gateway gateways create dottie-gateway \
    --api=dottie-api \
    --api-config=dottie-api-config \
    --location=global \
    --project=${STAGING_PROJECT_ID}

# Get the gateway URL
GATEWAY_URL=$(gcloud api-gateway gateways describe dottie-gateway \
    --location=global \
    --project=${STAGING_PROJECT_ID} \
    --format="value(defaultHostname)")

echo -e "${GREEN}Deployment to staging environment completed successfully!${NC}"
echo -e "${YELLOW}Backend URL: https://${SERVICE_NAME}-${STAGING_PROJECT_ID}.run.app${NC}"
echo -e "${YELLOW}Frontend URL: https://${STAGING_PROJECT_ID}.web.app${NC}"
echo -e "${YELLOW}API Gateway URL: https://${GATEWAY_URL}${NC}"

# Create a document with testing instructions
echo -e "${YELLOW}Creating testing instructions document...${NC}"
cat > internal-testing-instructions.md << EOF
# Dottie AI Assistant - Internal Testing Instructions

## Testing Period
April 3, 2025 - April 10, 2025

## Staging Environment URLs
- Frontend: https://${STAGING_PROJECT_ID}.web.app
- Backend API: https://${SERVICE_NAME}-${STAGING_PROJECT_ID}.run.app
- API Gateway: https://${GATEWAY_URL}

## Testing Accounts
Please use your company Google account to sign in. You will need to authorize the application to access your Google Workspace data.

## Testing Focus Areas

### 1. Authentication
- Sign in with Google
- Sign out
- Account linking with Google Workspace

### 2. Chat Interface
- Sending and receiving messages
- Handling of function calls (e.g., "Show my recent emails")
- Error handling and recovery

### 3. Google Workspace Integration
- Gmail integration (reading emails, composing emails)
- Calendar integration (viewing events, creating events)
- Sheets integration (viewing and updating sheets)

### 4. Voice Features
- Voice input functionality
- Voice output quality and clarity
- Browser compatibility

### 5. Performance
- Response time for different operations
- UI responsiveness
- Error handling and recovery

## How to Report Issues
Please report any issues or feedback using the following Google Form:
[Dottie Testing Feedback Form](https://forms.gle/example)

Include the following information:
- Issue description
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Browser and device information

## Testing Schedule
- Daily check-in meeting: 10:00 AM (15 minutes)
- Final feedback session: April 10, 2025, 2:00 PM

Thank you for participating in the internal testing of Dottie AI Assistant!
EOF

echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Share the internal-testing-instructions.md with the testing group"
echo -e "2. Monitor the application performance in Cloud Monitoring"
echo -e "3. Collect and address feedback from the testing group"

exit 0
