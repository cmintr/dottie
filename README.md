# Dottie AI Assistant

Dottie is an AI-powered assistant that integrates with Google Workspace to help users manage their emails, calendar, and documents through natural language conversations and voice interactions.

![Dottie AI Assistant](docs/images/dottie-logo.png)

## Project Status

**Current Stage**: Ready for Internal Testing (April 2025)

## Features

- **Natural Language Interface**: Chat with Dottie using natural language to perform tasks
- **Google Workspace Integration**: Connect with Gmail, Google Calendar, and Google Sheets
- **Voice Interaction**: Speak to Dottie and hear responses through voice synthesis
- **Authentication**: Secure Firebase authentication with Google OAuth integration
- **Responsive Design**: Works on desktop and mobile devices

## Architecture

Dottie consists of two main components:

1. **Frontend**: React application with Firebase Authentication and voice capabilities
2. **Backend**: Node.js/Express API with Google Workspace integration and AI processing

For detailed architecture information, see [ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Tech Stack

### Frontend
- React with TypeScript
- Firebase Authentication
- Web Speech API for voice input/output
- Tailwind CSS for styling

### Backend
- Node.js with Express
- TypeScript
- Firebase Admin SDK
- Google APIs (Gmail, Calendar, Sheets)
- Cloud Logging for centralized logging

### Infrastructure
- Firebase Hosting (Frontend)
- Google Cloud Run (Backend)
- Firestore (Data storage)
- Secret Manager (Credentials)
- Cloud Monitoring (Performance tracking)

## Documentation

For detailed information about the project, please refer to the following documentation:

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Comprehensive Testing Guide](docs/TESTING_GUIDE.md)
- [Enhanced Testing Guide](docs/ENHANCED_TESTING_GUIDE.md)
- [Monitoring Setup](docs/MONITORING_SETUP.md)
- [Technical Debt](docs/TECHNICAL_DEBT.md)
- [Roadmap](docs/ROADMAP.md)
- [Windows Development](docs/WINDOWS_DEVELOPMENT.md)
- [Security](docs/SECURITY.md)
- [Budget](docs/BUDGET.md)

## Recent Updates

### Frontend Improvements (April 2025)

- **Mock Services Implementation**: Added comprehensive mock implementations for Firebase authentication and Google Workspace services
- **Enhanced UI Components**: Improved chat interface with better styling and user experience
- **Function Call Visualization**: Added components to display email lists, calendar events, and spreadsheet data
- **Authentication Flow**: Implemented complete sign-in and sign-out functionality with mock credentials
- **Documentation**: Added detailed guides for local testing and deployment

### Backend Improvements (March 2025)

- **Firebase Authentication**: Integrated Firebase for secure user authentication
- **Google OAuth Integration**: Implemented token refresh and persistence
- **Core Google Services**: Added support for Gmail, Calendar, and Sheets
- **Consistent Architecture**: Applied uniform patterns across all Google service integrations

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm (v9 or later)
- Google Cloud account (for production deployment)
- Firebase project (for authentication)

### Local Development Setup

1. **Clone the repository**

```bash
git clone https://github.com/cmintr/dottie.git
cd dottie
```

2. **Set up environment variables**

Create `.env` files for both frontend and backend using the provided examples:

```bash
# For backend
cp backend/.env.example backend/.env

# For frontend
cp frontend/.env.example frontend/.env
```

3. **Install dependencies**

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

4. **Start the development servers**

```bash
# Start backend server
cd backend
npm run dev

# Start frontend server
cd ../frontend
npm run dev
```

5. **Testing with mock services**

For testing without real API credentials, you can use the provided mock services:

```bash
# Run the frontend test script
powershell -File ./dottie-test-temp/run-frontend-test.ps1
```

This will start the frontend with mock implementations for:
- Firebase Authentication
- Google Workspace APIs (Gmail, Calendar, Sheets)
- Chat functionality

The mock environment allows you to test the full application flow without real credentials.

For Windows-specific development instructions, see [WINDOWS_DEVELOPMENT.md](docs/WINDOWS_DEVELOPMENT.md).

## Deployment

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md).

### Backend (Cloud Run)

1. Build and deploy using Cloud Build:
   ```
   gcloud builds submit --config cloudbuild.yaml
   ```

### Frontend (Firebase Hosting)

1. Deploy using the provided script:
   ```
   cd frontend/scripts
   ./deploy-firebase.sh
   ```

## Testing

### Backend Tests

Run the backend tests:
```
cd backend
npm test
```

### Frontend Tests

Run the frontend tests:
```
cd frontend
npm test
```

### End-to-End Tests

Run end-to-end tests:
```
cd frontend
npm run test:e2e
```

## Project Structure

```
dottie/
├── backend/                # Node.js backend
│   ├── src/
│   │   ├── controllers/    # API controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   └── index.ts        # Entry point
│   ├── tests/              # Backend tests
│   └── package.json
│
├── frontend/               # React frontend
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── styles/         # CSS styles
│   │   ├── tests/          # Frontend tests
│   │   └── App.tsx         # Root component
│   └── package.json
│
├── scripts/                # Deployment and setup scripts
│   ├── setup-secret-manager.sh
│   ├── setup-monitoring.sh
│   ├── setup-staging-environment.sh
│   └── deploy-to-staging.sh
│
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── LOCAL_TESTING_GUIDE.md
│   ├── TESTING_STRATEGY.md
│   ├── MONITORING_SETUP.md
│   ├── FRONTEND_TESTING.md
│   ├── TECHNICAL_DEBT.md
│   ├── ROADMAP.md
│   └── WINDOWS_DEVELOPMENT.md
│
├── firestore.rules         # Firestore security rules
├── api-gateway.yaml        # API Gateway configuration
├── CONTRIBUTING.md         # Contributing guidelines
└── README.md               # Project documentation
```

## Security

Dottie AI Assistant implements comprehensive security measures:

- Firebase Authentication for user authentication
- Firestore security rules for data protection
- Secret Manager for credential storage
- HTTPS for all communications

For detailed security information, see [SECURITY.md](docs/SECURITY.md).

## Roadmap

For information about planned features and development timeline, see [ROADMAP.md](docs/ROADMAP.md).

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is proprietary and confidential.

## Acknowledgments

- Google Cloud Platform
- Firebase
- OpenAI
- The development team
