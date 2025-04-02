#!/bin/bash
# Script to set up end-to-end testing environment for Dottie AI Assistant

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up end-to-end testing environment for Dottie AI Assistant...${NC}"

# Navigate to frontend directory
cd ../frontend

# Install Cypress for E2E testing
echo -e "${YELLOW}Installing Cypress for E2E testing...${NC}"
npm install --save-dev cypress @cypress/code-coverage cypress-firebase

# Create Cypress configuration
echo -e "${YELLOW}Creating Cypress configuration...${NC}"
cat > cypress.config.ts << EOF
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      require('@cypress/code-coverage/task')(on, config)
      return config
    },
  },
  env: {
    coverage: true,
    codeCoverage: {
      exclude: ['cypress/**/*.*'],
    },
  },
  viewportWidth: 1280,
  viewportHeight: 720,
})
EOF

# Create Cypress support file
echo -e "${YELLOW}Creating Cypress support files...${NC}"
mkdir -p cypress/support
cat > cypress/support/e2e.ts << EOF
// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests in the Cypress command log
const app = window.top;
if (!app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML =
    '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}
EOF

# Create Cypress commands file
cat > cypress/support/commands.ts << EOF
/// <reference types="cypress" />
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import 'firebase/compat/firestore';
import { attachCustomCommands } from 'cypress-firebase';

// Initialize firebase auth
const fbConfig = {
  apiKey: Cypress.env('FIREBASE_API_KEY'),
  authDomain: Cypress.env('FIREBASE_AUTH_DOMAIN'),
  projectId: Cypress.env('FIREBASE_PROJECT_ID'),
  storageBucket: Cypress.env('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: Cypress.env('FIREBASE_MESSAGING_SENDER_ID'),
  appId: Cypress.env('FIREBASE_APP_ID'),
};

firebase.initializeApp(fbConfig);

attachCustomCommands({ Cypress, cy, firebase });

// Custom command to login with Google
Cypress.Commands.add('loginWithGoogle', () => {
  cy.log('Logging in with Google');
  cy.visit('/');
  cy.get('[data-testid=google-sign-in]').click();
  // This will be handled by the firebase.auth().onAuthStateChanged in the app
});

// Custom command to send a chat message
Cypress.Commands.add('sendChatMessage', (message) => {
  cy.get('[data-testid=chat-input]').type(message);
  cy.get('[data-testid=send-button]').click();
});

// Custom command to check for chat response
Cypress.Commands.add('waitForChatResponse', () => {
  cy.get('[data-testid=message-list]')
    .find('[data-testid=assistant-message]')
    .last()
    .should('be.visible');
});

// Custom command to toggle voice input
Cypress.Commands.add('toggleVoiceInput', () => {
  cy.get('[data-testid=voice-input-button]').click();
});

declare global {
  namespace Cypress {
    interface Chainable {
      loginWithGoogle(): Chainable<void>
      sendChatMessage(message: string): Chainable<void>
      waitForChatResponse(): Chainable<void>
      toggleVoiceInput(): Chainable<void>
    }
  }
}
EOF

# Create Cypress environment file
cat > cypress.env.json << EOF
{
  "FIREBASE_API_KEY": "",
  "FIREBASE_AUTH_DOMAIN": "",
  "FIREBASE_PROJECT_ID": "",
  "FIREBASE_STORAGE_BUCKET": "",
  "FIREBASE_MESSAGING_SENDER_ID": "",
  "FIREBASE_APP_ID": "",
  "TEST_UID": "",
  "TEST_PASSWORD": ""
}
EOF

# Create sample E2E tests
echo -e "${YELLOW}Creating sample E2E tests...${NC}"
mkdir -p cypress/e2e

# Authentication test
cat > cypress/e2e/auth.cy.ts << EOF
describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display login page', () => {
    cy.get('[data-testid=login-page]').should('be.visible');
    cy.get('[data-testid=google-sign-in]').should('be.visible');
  });

  it('should redirect to dashboard after login', () => {
    // This test requires firebase authentication to be set up
    // with test credentials in cypress.env.json
    cy.loginWithGoogle();
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid=user-profile]').should('be.visible');
  });

  it('should allow user to sign out', () => {
    cy.loginWithGoogle();
    cy.get('[data-testid=user-menu]').click();
    cy.get('[data-testid=sign-out]').click();
    cy.url().should('include', '/login');
  });
});
EOF

# Chat interface test
cat > cypress/e2e/chat.cy.ts << EOF
describe('Chat Interface', () => {
  beforeEach(() => {
    cy.loginWithGoogle();
    cy.visit('/chat');
  });

  it('should display chat interface', () => {
    cy.get('[data-testid=chat-container]').should('be.visible');
    cy.get('[data-testid=chat-input]').should('be.visible');
    cy.get('[data-testid=send-button]').should('be.visible');
  });

  it('should send a message and receive a response', () => {
    const message = 'Hello Dottie';
    cy.sendChatMessage(message);
    
    // Verify message appears in the chat
    cy.get('[data-testid=message-list]')
      .find('[data-testid=user-message]')
      .last()
      .should('contain', message);
    
    // Wait for assistant response
    cy.waitForChatResponse();
  });

  it('should handle function calls', () => {
    const message = 'Show my recent emails';
    cy.sendChatMessage(message);
    
    // Wait for assistant response
    cy.waitForChatResponse();
    
    // Check for function call result
    cy.get('[data-testid=function-call-result]').should('be.visible');
  });
});
EOF

# Voice features test
cat > cypress/e2e/voice.cy.ts << EOF
describe('Voice Features', () => {
  beforeEach(() => {
    cy.loginWithGoogle();
    cy.visit('/chat');
  });

  it('should display voice input button', () => {
    cy.get('[data-testid=voice-input-button]').should('be.visible');
  });

  it('should toggle voice input mode', () => {
    cy.toggleVoiceInput();
    cy.get('[data-testid=voice-input-active]').should('be.visible');
    cy.toggleVoiceInput();
    cy.get('[data-testid=voice-input-active]').should('not.exist');
  });

  // Note: Actual voice input/output testing requires browser permissions
  // and is difficult to automate. These tests focus on UI elements.
});
EOF

# Update package.json with E2E test scripts
echo -e "${YELLOW}Updating package.json with E2E test scripts...${NC}"
# Using node to update package.json to avoid parsing issues
node -e "
const fs = require('fs');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.scripts = {
  ...packageJson.scripts,
  'cy:open': 'cypress open',
  'cy:run': 'cypress run',
  'test:e2e': 'cypress run',
  'test:e2e:dev': 'start-server-and-test dev http://localhost:3000 cy:open'
};
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
"

# Install start-server-and-test for running tests with dev server
echo -e "${YELLOW}Installing start-server-and-test...${NC}"
npm install --save-dev start-server-and-test

# Create a README for E2E testing
echo -e "${YELLOW}Creating E2E testing README...${NC}"
mkdir -p docs
cat > docs/E2E-TESTING.md << EOF
# End-to-End Testing for Dottie AI Assistant

This document provides instructions for running and writing end-to-end tests for the Dottie AI Assistant frontend.

## Setup

The E2E testing environment uses Cypress, a JavaScript end-to-end testing framework.

### Prerequisites

- Node.js (v20 or higher)
- npm (v9 or higher)
- A running instance of the backend API (local or staging)

### Configuration

1. Update the \`cypress.env.json\` file with your Firebase credentials:
   ```json
   {
     "FIREBASE_API_KEY": "your-api-key",
     "FIREBASE_AUTH_DOMAIN": "your-project-id.firebaseapp.com",
     "FIREBASE_PROJECT_ID": "your-project-id",
     "FIREBASE_STORAGE_BUCKET": "your-project-id.appspot.com",
     "FIREBASE_MESSAGING_SENDER_ID": "your-messaging-sender-id",
     "FIREBASE_APP_ID": "your-app-id",
     "TEST_UID": "test-user-uid",
     "TEST_PASSWORD": "test-user-password"
   }
   ```

2. For testing against a local backend, update the \`baseUrl\` in \`cypress.config.ts\` to point to your local frontend server.

3. For testing against staging, update the \`baseUrl\` to the staging URL:
   ```typescript
   baseUrl: 'https://dottie-staging.web.app',
   ```

## Running Tests

### Open Cypress Test Runner

```bash
npm run cy:open
```

This opens the Cypress Test Runner, allowing you to run tests interactively.

### Run All Tests Headlessly

```bash
npm run cy:run
```

This runs all tests in headless mode, suitable for CI/CD pipelines.

### Run Tests with Development Server

```bash
npm run test:e2e:dev
```

This starts the development server and opens the Cypress Test Runner.

## Writing Tests

Tests are located in the \`cypress/e2e\` directory. Each test file should focus on a specific feature or component.

### Custom Commands

We've defined several custom commands to simplify testing:

- \`cy.loginWithGoogle()\`: Simulates Google sign-in
- \`cy.sendChatMessage(message)\`: Types and sends a chat message
- \`cy.waitForChatResponse()\`: Waits for an assistant response
- \`cy.toggleVoiceInput()\`: Toggles voice input mode

### Example Test

```typescript
describe('Chat Feature', () => {
  beforeEach(() => {
    cy.loginWithGoogle();
    cy.visit('/chat');
  });

  it('should send a message and receive a response', () => {
    cy.sendChatMessage('Hello Dottie');
    cy.waitForChatResponse();
    cy.get('[data-testid=assistant-message]').last().should('contain', 'Hello');
  });
});
```

## Best Practices

1. Use data-testid attributes for selecting elements
2. Keep tests independent and isolated
3. Mock external services when appropriate
4. Test the critical user flows first
5. Add new tests for each new feature or bug fix

## CI/CD Integration

The E2E tests are configured to run in the CI/CD pipeline. The \`test:e2e\` script is used for this purpose.
EOF

echo -e "${GREEN}End-to-end testing environment setup completed successfully!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Update cypress.env.json with your Firebase credentials"
echo -e "2. Run 'npm run cy:open' to open the Cypress Test Runner"
echo -e "3. Run 'npm run test:e2e:dev' to start the dev server and run tests"
echo -e "4. See docs/E2E-TESTING.md for more information"

exit 0
