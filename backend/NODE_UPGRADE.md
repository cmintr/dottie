# Node.js Upgrade Guide for Dottie AI Assistant

## Overview

This document outlines the process for upgrading the Node.js environment for the Dottie AI Assistant backend from Node.js 12.16.2 to Node.js 20.x LTS.

## Prerequisites

- Backup your project before starting
- Ensure you have administrator access to your development machine

## Upgrade Steps

### 1. Install Node.js 20.x LTS

#### Windows
1. Download the Node.js 20.x LTS installer from [nodejs.org](https://nodejs.org/)
2. Run the installer and follow the installation wizard
3. Restart your terminal/command prompt
4. Verify the installation with `node -v` (should show v20.x.x)

#### macOS/Linux
1. Using NVM (recommended):
   ```bash
   nvm install 20
   nvm use 20
   nvm alias default 20
   ```
2. Without NVM:
   - Download the installer from [nodejs.org](https://nodejs.org/)
   - Follow the installation instructions

### 2. Update Project Dependencies

1. Navigate to the project directory:
   ```bash
   cd path/to/dottie/backend
   ```

2. Install dependencies:
   ```bash
   npm ci
   ```
   or
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Fix any TypeScript errors that may appear

### 3. Test the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Test key endpoints:
   - `/health`
   - `/api/auth/status`
   - `/api/auth/google`

### 4. Update CI/CD Pipelines

1. Update any GitHub Actions workflows to use Node.js 20.x
2. Update Cloud Build configuration if applicable

## Compatibility Notes

The following dependencies have been updated to be compatible with Node.js 20.x:

- Firebase Admin SDK: 10.3.0 → 11.11.1
- Firebase: 9.22.0 → 10.8.0
- Google Auth Library: 7.14.1 → 9.4.2
- Googleapis: 105.0.0 → 131.0.0
- @google-cloud packages to latest versions

## Troubleshooting

If you encounter issues:

1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules
   npm cache clean --force
   npm install
   ```

2. Check for TypeScript errors:
   ```bash
   npx tsc --noEmit
   ```

3. Ensure environment variables are correctly set
