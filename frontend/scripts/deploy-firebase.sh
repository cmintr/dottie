#!/bin/bash
# Script to build and deploy the frontend to Firebase Hosting

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Building and deploying Dottie AI Assistant frontend to Firebase Hosting...${NC}"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}Error: Firebase CLI is not installed. Please install it first:${NC}"
    echo -e "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
FIREBASE_USER=$(firebase login:list | grep -o 'User:.*' || echo "")
if [ -z "$FIREBASE_USER" ]; then
    echo -e "${YELLOW}You are not logged in to Firebase. Please log in:${NC}"
    firebase login
fi

# Environment selection
echo -e "${YELLOW}Select deployment environment:${NC}"
echo -e "1) Development"
echo -e "2) Staging"
echo -e "3) Production"
read -p "Enter your choice (1-3): " ENV_CHOICE

case $ENV_CHOICE in
    1)
        ENVIRONMENT="development"
        ;;
    2)
        ENVIRONMENT="staging"
        ;;
    3)
        ENVIRONMENT="production"
        ;;
    *)
        echo -e "${RED}Invalid choice. Defaulting to development.${NC}"
        ENVIRONMENT="development"
        ;;
esac

# Load environment variables
echo -e "${YELLOW}Loading environment variables for ${ENVIRONMENT}...${NC}"
ENV_FILE=".env.${ENVIRONMENT}"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Environment file ${ENV_FILE} not found. Creating from template...${NC}"
    cp .env.example "$ENV_FILE"
    echo -e "${YELLOW}Please edit ${ENV_FILE} with appropriate values and run this script again.${NC}"
    exit 1
fi

# Build the application
echo -e "${YELLOW}Building the application for ${ENVIRONMENT}...${NC}"
echo -e "${YELLOW}Running npm install...${NC}"
npm install

echo -e "${YELLOW}Running npm run build...${NC}"
npm run build

# Select Firebase project
echo -e "${YELLOW}Selecting Firebase project for ${ENVIRONMENT}...${NC}"
case $ENVIRONMENT in
    "development")
        PROJECT_ID="dottie-dev"
        ;;
    "staging")
        PROJECT_ID="dottie-staging"
        ;;
    "production")
        PROJECT_ID="dottie-prod"
        ;;
esac

# Use Firebase project
firebase use $PROJECT_ID

# Deploy to Firebase Hosting
echo -e "${YELLOW}Deploying to Firebase Hosting...${NC}"
firebase deploy --only hosting

# Check deployment status
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Deployment successful!${NC}"
    echo -e "${YELLOW}Your application is now live at:${NC}"
    echo -e "https://${PROJECT_ID}.web.app"
else
    echo -e "${RED}Deployment failed. Please check the error messages above.${NC}"
    exit 1
fi

exit 0
