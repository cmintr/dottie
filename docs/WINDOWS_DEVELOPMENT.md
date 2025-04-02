# Dottie AI Assistant - Windows Development Guide

This guide provides detailed instructions for setting up and running the Dottie AI Assistant on Windows development environments.

## Prerequisites

### Required Software

1. **Node.js (v20+)**
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version` and `npm --version`

2. **Git**
   - Download from [git-scm.com](https://git-scm.com/download/win)
   - Verify installation: `git --version`

3. **Google Cloud SDK**
   - Download from [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)
   - Run the installer and follow the prompts
   - Initialize: `gcloud init`
   - Verify installation: `gcloud --version`

4. **Firebase CLI**
   - Install using npm: `npm install -g firebase-tools`
   - Login: `firebase login`
   - Verify installation: `firebase --version`

5. **Visual Studio Code** (recommended)
   - Download from [code.visualstudio.com](https://code.visualstudio.com/)
   - Recommended extensions:
     - ESLint
     - Prettier
     - TypeScript Vue Plugin
     - Tailwind CSS IntelliSense

### GCP Project Access

Before starting, ensure you have:

1. Access to the Dottie GCP project (staging or development)
2. A service account key with appropriate permissions
3. Firebase project configuration details

## Project Setup

### Clone the Repository

```powershell
git clone https://github.com/yourusername/dottie.git
cd dottie
```

### Backend Setup

1. **Install Dependencies**

   ```powershell
   cd backend
   npm install
   ```

2. **Set Up Environment Variables**

   Create a `.env` file in the backend directory:

   ```
   NODE_ENV=development
   PORT=8080
   PROJECT_ID=dottie-staging  # or your development project
   REGION=us-central1
   GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
   ALLOWED_ORIGINS=http://localhost:3000
   LOG_LEVEL=debug
   ```

3. **Set Up Service Account Key**

   - Download your service account key from GCP
   - Save it as `service-account-key.json` in the backend directory
   - Ensure this file is in your `.gitignore`

4. **Start the Backend Server**

   ```powershell
   npm run dev
   ```

   The server should start on http://localhost:8080

### Frontend Setup

1. **Install Dependencies**

   ```powershell
   cd frontend
   npm install
   ```

2. **Set Up Environment Variables**

   Create a `.env` file in the frontend directory:

   ```
   VITE_API_URL=http://localhost:8080
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_ENVIRONMENT=development
   ```

3. **Start the Frontend Development Server**

   ```powershell
   npm run dev
   ```

   The application should be available at http://localhost:3000

## Running Tests

### Backend Tests

```powershell
cd backend
npm test
```

For watching mode:

```powershell
npm test -- --watch
```

### Frontend Tests

```powershell
cd frontend
npm test
```

### End-to-End Tests

1. **Configure Cypress**

   Update `cypress.env.json` with your Firebase credentials:

   ```json
   {
     "FIREBASE_API_KEY": "your_firebase_api_key",
     "FIREBASE_AUTH_DOMAIN": "your_project_id.firebaseapp.com",
     "FIREBASE_PROJECT_ID": "your_project_id",
     "FIREBASE_STORAGE_BUCKET": "your_project_id.appspot.com",
     "FIREBASE_MESSAGING_SENDER_ID": "your_messaging_sender_id",
     "FIREBASE_APP_ID": "your_app_id",
     "TEST_UID": "test_user_uid",
     "TEST_PASSWORD": "test_password"
   }
   ```

2. **Run Cypress Tests**

   With the development server running:

   ```powershell
   npm run test:e2e:dev
   ```

   Or headless mode:

   ```powershell
   npm run test:e2e
   ```

## Windows-Specific Considerations

### PowerShell Script Execution Policy

If you encounter issues running PowerShell scripts, you may need to adjust the execution policy:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Path Length Limitations

Windows has path length limitations that can cause issues with Node.js projects. To avoid these problems:

1. Clone the repository to a short path (e.g., `C:\Projects\dottie`)
2. Enable long paths in Git:
   ```powershell
   git config --global core.longpaths true
   ```
3. Enable long paths in Windows (requires admin privileges):
   ```powershell
   reg add "HKLM\SYSTEM\CurrentControlSet\Control\FileSystem" /v LongPathsEnabled /t REG_DWORD /d 1 /f
   ```

### Line Endings

To avoid line ending issues between Windows and Unix systems:

```powershell
git config --global core.autocrlf true
```

## Troubleshooting

### Common Issues

1. **EACCES or EPERM errors**
   - Close any applications using the files
   - Run the terminal as administrator
   - Check antivirus software

2. **Node-gyp errors during npm install**
   - Install Visual C++ Build Tools:
     ```powershell
     npm install --global --production windows-build-tools
     ```

3. **Firebase emulator issues**
   - Ensure Java JDK is installed
   - Add Java to your PATH

4. **"Error: Cannot find module" errors**
   - Verify node_modules exists
   - Try deleting node_modules and package-lock.json, then run `npm install`

5. **Port already in use**
   - Find the process using the port:
     ```powershell
     netstat -ano | findstr :8080
     ```
   - Kill the process:
     ```powershell
     taskkill /PID <PID> /F
     ```

### Getting Help

If you encounter issues not covered here:

1. Check the project documentation in the `docs` directory
2. Search for similar issues in the project's GitHub repository
3. Reach out to the development team on the project's communication channels

## Local Deployment Testing

### Testing with Firebase Emulators

1. **Install Java JDK** (required for Firebase emulators)
   - Download from [adoptopenjdk.net](https://adoptopenjdk.net/)
   - Add to PATH

2. **Start Firebase Emulators**
   ```powershell
   firebase emulators:start
   ```

3. **Configure Frontend to Use Emulators**
   Update your `.env` file:
   ```
   VITE_USE_EMULATORS=true
   ```

### Testing with Local Docker

1. **Install Docker Desktop for Windows**
   - Download from [docker.com](https://www.docker.com/products/docker-desktop)

2. **Build the Docker Image**
   ```powershell
   cd backend
   docker build -t dottie-backend:local .
   ```

3. **Run the Container**
   ```powershell
   docker run -p 8080:8080 --env-file .env dottie-backend:local
   ```

## Recommended Development Workflow

1. **Feature Branches**
   - Create a new branch for each feature or bug fix:
     ```powershell
     git checkout -b feature/your-feature-name
     ```

2. **Regular Commits**
   - Commit changes frequently with descriptive messages:
     ```powershell
     git commit -m "feat: add new feature"
     ```

3. **Testing**
   - Write tests for new features
   - Run tests before submitting pull requests

4. **Code Formatting**
   - Use ESLint and Prettier:
     ```powershell
     npm run lint
     npm run format
     ```

5. **Pull Requests**
   - Push your branch and create a pull request
   - Ensure CI checks pass before merging

## Performance Tips

1. **Windows Defender Exclusions**
   - Add your project directory to Windows Defender exclusions to improve file system performance

2. **Use WSL2 for Better Performance**
   - Consider using Windows Subsystem for Linux 2 for improved development experience
   - Follow the [WSL installation guide](https://docs.microsoft.com/en-us/windows/wsl/install)

3. **Hardware Recommendations**
   - 16GB+ RAM
   - SSD storage
   - Multi-core processor

## Conclusion

This guide should help you set up and run the Dottie AI Assistant on Windows for development purposes. If you encounter any issues or have suggestions for improving this guide, please contribute to the documentation.
