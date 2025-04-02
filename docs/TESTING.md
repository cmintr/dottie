# Dottie AI Assistant - Testing Guide

This guide outlines the testing strategy and procedures for the Dottie AI Assistant application.

## Testing Strategy

Our testing approach follows a comprehensive strategy that includes:

1. **Unit Testing**: Testing individual components and functions in isolation
2. **Integration Testing**: Testing interactions between components
3. **End-to-End Testing**: Testing complete user flows
4. **Performance Testing**: Measuring and optimizing application performance
5. **Security Testing**: Identifying and addressing security vulnerabilities

## Test Environments

- **Local Development**: Individual developer machines
- **CI/CD Pipeline**: Automated tests run on each commit
- **Staging Environment**: Pre-production testing environment
- **Production Environment**: Live application monitoring

## Unit Testing

### Backend Unit Tests

Backend unit tests use Jest and focus on testing individual functions and services.

#### Running Backend Tests

```bash
cd backend
npm test
```

#### Key Test Areas

- Authentication middleware
- Error handling middleware
- Service integrations
- Utility functions
- API controllers

#### Writing Backend Tests

Example of a service test:

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GmailService } from '../services/gmailService';

describe('GmailService', () => {
  let gmailService: GmailService;
  let mockGoogleClient: any;

  beforeEach(() => {
    mockGoogleClient = {
      gmail: jest.fn().mockReturnValue({
        users: {
          messages: {
            list: jest.fn().mockResolvedValue({ data: { messages: [] } }),
          },
        },
      }),
    };
    gmailService = new GmailService(mockGoogleClient);
  });

  it('should list messages', async () => {
    const result = await gmailService.listMessages('user@example.com');
    expect(result).toEqual([]);
    expect(mockGoogleClient.gmail).toHaveBeenCalled();
  });
});
```

### Frontend Unit Tests

Frontend unit tests use Vitest and React Testing Library to test React components and hooks.

#### Running Frontend Tests

```bash
cd frontend
npm test
```

#### Key Test Areas

- Authentication components
- Chat interface
- Voice input/output
- Service layer
- Utility functions

#### Writing Frontend Tests

Example of a component test:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInput } from '../components/ChatInput';

describe('ChatInput', () => {
  it('should render the input field', () => {
    render(<ChatInput onSendMessage={() => {}} />);
    const inputElement = screen.getByPlaceholderText(/type a message/i);
    expect(inputElement).toBeInTheDocument();
  });

  it('should call onSendMessage when submit button is clicked', () => {
    const mockSendMessage = vi.fn();
    render(<ChatInput onSendMessage={mockSendMessage} />);
    
    const inputElement = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(inputElement, { target: { value: 'Hello' } });
    
    const submitButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(submitButton);
    
    expect(mockSendMessage).toHaveBeenCalledWith('Hello');
  });
});
```

## Integration Testing

Integration tests verify that different parts of the application work together correctly.

### Backend Integration Tests

Backend integration tests use Supertest to test API endpoints.

#### Running Backend Integration Tests

```bash
cd backend
npm run test:integration
```

#### Key Test Areas

- API endpoints
- Authentication flow
- Error handling
- Database interactions

#### Writing Backend Integration Tests

Example of an API endpoint test:

```typescript
import request from 'supertest';
import { app } from '../app';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { setupTestDatabase, teardownTestDatabase } from './helpers/database';

describe('Auth API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('should return 401 for unauthenticated requests', async () => {
    const response = await request(app).get('/api/user/profile');
    expect(response.status).toBe(401);
  });
});
```

### Frontend Integration Tests

Frontend integration tests focus on component interactions and data flow.

#### Running Frontend Integration Tests

```bash
cd frontend
npm run test:integration
```

#### Key Test Areas

- Authentication flow
- Chat conversation flow
- Voice interaction
- Error handling

## End-to-End Testing

End-to-end tests verify complete user flows from frontend to backend.

### Setting Up E2E Tests

We use Cypress for end-to-end testing:

```bash
cd frontend
npm install --save-dev cypress
```

### Running E2E Tests

```bash
cd frontend
npm run test:e2e
```

### Key Test Scenarios

1. **User Authentication**
   - Sign up
   - Sign in
   - Sign out
   - Password reset

2. **Google Integration**
   - Connect Google account
   - Access Gmail
   - Access Calendar
   - Access Sheets

3. **Chat Functionality**
   - Send and receive messages
   - Handle function calls
   - Display rich responses

4. **Voice Interaction**
   - Voice input
   - Voice output
   - Voice commands

### Writing E2E Tests

Example of an authentication E2E test:

```javascript
describe('Authentication', () => {
  it('should allow a user to sign in', () => {
    cy.visit('/');
    cy.get('[data-testid=signin-button]').click();
    cy.get('[data-testid=email-input]').type('test@example.com');
    cy.get('[data-testid=password-input]').type('password123');
    cy.get('[data-testid=submit-button]').click();
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid=user-profile]').should('be.visible');
  });
});
```

## Performance Testing

Performance testing ensures the application meets performance requirements.

### Tools

- Lighthouse for frontend performance
- Artillery for API load testing
- Google Cloud Monitoring for production metrics

### Key Metrics

- API response time
- Time to interactive
- Memory usage
- CPU utilization
- Error rates

### Running Performance Tests

```bash
# Frontend performance
cd frontend
npm run test:performance

# Backend load testing
cd backend
npm run test:load
```

## Security Testing

Security testing identifies and addresses vulnerabilities.

### Areas of Focus

- Authentication and authorization
- Data protection
- API security
- Dependency vulnerabilities

### Tools

- OWASP ZAP for vulnerability scanning
- npm audit for dependency checking
- Firebase Security Rules testing

### Running Security Tests

```bash
# Check dependencies
npm audit

# Test Firebase security rules
cd firebase
npm run test:security
```

## Test Automation in CI/CD

Our CI/CD pipeline automates testing on each commit:

1. **Pull Request Checks**
   - Lint checks
   - Unit tests
   - Integration tests
   - Build verification

2. **Pre-Deployment Checks**
   - E2E tests
   - Performance tests
   - Security scans

3. **Post-Deployment Checks**
   - Smoke tests
   - Uptime monitoring

## Test Coverage Requirements

We aim for the following test coverage:

- Backend: 80% statement coverage
- Frontend: 70% statement coverage
- Critical paths: 100% coverage

## Bug Reporting and Tracking

When finding issues during testing:

1. Create a detailed bug report in the issue tracker
2. Include steps to reproduce
3. Add screenshots or videos if applicable
4. Assign a severity level
5. Link to relevant test cases

## Test Documentation

For each feature, maintain:

1. Test plan
2. Test cases
3. Test results
4. Coverage reports

## Continuous Improvement

Our testing strategy evolves through:

1. Regular review of test effectiveness
2. Analysis of production issues
3. Updating tests for new features
4. Refining test automation
