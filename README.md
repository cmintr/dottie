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

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Deployment Strategy](docs/DEPLOYMENT_STRATEGY.md)
- [Testing Guide](docs/TESTING.md)
- [Windows Development Guide](docs/WINDOWS_DEVELOPMENT.md)
- [Security Documentation](docs/SECURITY.md)
- [Technical Debt Register](docs/TECHNICAL_DEBT.md)
- [Product Roadmap](docs/ROADMAP.md)
- [Budget Planning](docs/BUDGET.md)
- [Contributing Guidelines](CONTRIBUTING.md)

## Getting Started

### Prerequisites

- Node.js (v20 or higher)
- npm (v9 or higher)
- Google Cloud SDK
- Firebase CLI
- Google Cloud project with required APIs enabled
- Firebase project configured

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/dottie.git
   cd dottie
   ```

2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```
   cd ../frontend
   npm install
   ```

4. Set up environment variables:
   - Create `.env.development` in the frontend directory
   - Create `.env` in the backend directory
   - See `.env.example` files for required variables

5. Set up Secret Manager (for deployment):
   ```
   cd ../scripts
   ./setup-secret-manager.sh
   ```

### Running Locally

1. Start the backend:
   ```
   cd backend
   npm run dev
   ```

2. Start the frontend:
   ```
   cd frontend
   npm run dev
   ```

3. Access the application at `http://localhost:3000`

## Deployment

For detailed deployment instructions, see [DEPLOYMENT_STRATEGY.md](docs/DEPLOYMENT_STRATEGY.md).

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
│   ├── DEPLOYMENT_STRATEGY.md
│   ├── TESTING.md
│   ├── WINDOWS_DEVELOPMENT.md
│   ├── SECURITY.md
│   ├── TECHNICAL_DEBT.md
│   ├── ROADMAP.md
│   └── BUDGET.md
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
