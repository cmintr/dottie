# Prerequisites for Deploying Dottie AI Assistant

Before you begin deploying the Dottie AI Assistant, ensure you have all the necessary tools, accounts, and permissions. This document provides a detailed list of prerequisites with instructions on how to obtain them.

## Required Tools

### Node.js and npm

Dottie AI Assistant requires Node.js version 16.x or higher and npm version 8.x or higher.

**Installation Steps:**

1. Visit [Node.js official website](https://nodejs.org/)
2. Download the LTS (Long Term Support) version
3. Run the installer and follow the prompts
4. Verify installation by opening a terminal/command prompt and running:
   ```
   node --version
   npm --version
   ```

### Git

Git is required for version control and deployment.

**Installation Steps:**

1. Visit [Git official website](https://git-scm.com/downloads)
2. Download the version for your operating system
3. Run the installer and follow the prompts
4. Verify installation by opening a terminal/command prompt and running:
   ```
   git --version
   ```

### Firebase CLI

The Firebase Command Line Interface (CLI) is required for Firebase configuration and deployment.

**Installation Steps:**

1. Open a terminal/command prompt
2. Run the following command:
   ```
   npm install -g firebase-tools
   ```
3. Verify installation by running:
   ```
   firebase --version
   ```

## Required Accounts

### Google Cloud Platform Account

A Google Cloud Platform (GCP) account is required for accessing Google APIs.

**Setup Steps:**

1. Visit [Google Cloud Platform](https://cloud.google.com/)
2. Sign in with your Google account or create a new one
3. Set up a new project for Dottie AI Assistant
4. Enable billing for the project (a credit card is required, but there's a free tier)

### Firebase Account

A Firebase account is required for authentication and data storage.

**Setup Steps:**

1. Visit [Firebase](https://firebase.google.com/)
2. Sign in with your Google account (the same one used for GCP)
3. Create a new project (you can link it to your GCP project)

## Required Permissions

### Google API Permissions

You need to enable the following Google APIs in your GCP project:

- Gmail API
- Google Calendar API
- Google Sheets API
- Google Drive API
- OAuth 2.0 API

**Enabling APIs:**

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" > "Library"
4. Search for each API and click "Enable"

### Firebase Permissions

You need to enable the following Firebase services:

- Firebase Authentication
- Firestore Database
- Firebase Hosting (if deploying to Firebase)

**Enabling Services:**

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to each service from the left sidebar and follow the setup instructions

## Domain and SSL Certificate (for Production)

For production deployment, you'll need:

- A registered domain name
- An SSL certificate for secure HTTPS connections

**Obtaining a Domain:**

1. Choose a domain registrar (e.g., Google Domains, Namecheap, GoDaddy)
2. Search for an available domain name
3. Purchase the domain name

**Obtaining an SSL Certificate:**

1. You can use Let's Encrypt for a free SSL certificate
2. Many hosting providers offer free SSL certificates
3. For Firebase Hosting, SSL certificates are provided automatically

## Next Steps

Once you have all the prerequisites in place, you can proceed to [Environment Setup](./02-environment-setup.md) to configure your development and deployment environments.
