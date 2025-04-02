# Dottie AI Assistant - Technical Architecture

This document describes the technical architecture of the Dottie AI Assistant application, including components, data flow, and integration points.

## System Overview

Dottie AI Assistant is a full-stack application that enables users to interact with their Google Workspace data through natural language and voice interfaces. The system consists of a React frontend, Node.js backend, and integrates with various Google Cloud services.

## Architecture Diagram

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  React Frontend │◄────►│  Express Backend│◄────►│  Google Services │
│                 │      │                 │      │                 │
└────────┬────────┘      └────────┬────────┘      └─────────────────┘
         │                        │
         │                        │
         ▼                        ▼
┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │
│     Firebase    │      │  Cloud Logging  │
│                 │      │                 │
└─────────────────┘      └─────────────────┘
```

## Component Details

### Frontend (React)

The frontend is a React application with TypeScript that provides the user interface for interacting with Dottie.

#### Key Components:

1. **Authentication Module**
   - Firebase Authentication integration
   - Google OAuth flow
   - User profile management

2. **Chat Interface**
   - Message display and history
   - Input handling
   - Function call visualization

3. **Voice Module**
   - Speech recognition (Web Speech API)
   - Text-to-speech synthesis
   - Voice control commands

4. **Service Layer**
   - API client for backend communication
   - Authentication token management
   - Error handling and retries

### Backend (Node.js/Express)

The backend is a Node.js application with Express that handles business logic, API integration, and data processing.

#### Key Components:

1. **API Gateway**
   - Route definitions
   - Request validation
   - Response formatting

2. **Authentication Middleware**
   - Firebase token verification
   - Google OAuth token management
   - Permission validation

3. **Service Integrations**
   - Gmail service
   - Calendar service
   - Sheets service
   - Other Google API integrations

4. **Error Handling**
   - Centralized error middleware
   - Standardized error responses
   - Correlation ID tracking

5. **Logging System**
   - Structured logging
   - Cloud Logging integration
   - Request/response logging

### Data Storage

1. **Firestore**
   - User preferences
   - OAuth tokens
   - Conversation history

2. **Secret Manager**
   - API credentials
   - Service account keys
   - Environment secrets

## Authentication Flow

1. User signs in with Firebase Authentication
2. User authorizes Google Workspace access via OAuth
3. Backend stores refresh token in Firestore
4. Backend uses refresh token to obtain access tokens for Google APIs
5. All API requests include Firebase ID token for authentication

## Request Flow

1. User sends a message via chat or voice
2. Frontend sends authenticated request to backend
3. Backend validates the request and Firebase token
4. Backend processes the request and calls appropriate Google APIs
5. Backend formats the response and sends it back to frontend
6. Frontend displays the response to the user

## Deployment Architecture

### Frontend Deployment (Firebase Hosting)

```
┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │
│  Source Code    │─────►│  Firebase       │
│  (GitHub)       │      │  Hosting        │
│                 │      │                 │
└─────────────────┘      └─────────────────┘
```

### Backend Deployment (Cloud Run)

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  Source Code    │─────►│  Container      │─────►│  Cloud Run      │
│  (GitHub)       │      │  Registry       │      │                 │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

## Security Considerations

1. **Authentication**
   - Firebase Authentication for user identity
   - JWT token verification for API requests
   - Short-lived access tokens for Google APIs

2. **Data Protection**
   - Firestore security rules
   - HTTPS for all communications
   - Secret Manager for credentials

3. **Authorization**
   - Principle of least privilege
   - Scoped OAuth tokens
   - Role-based access control

## Monitoring and Observability

1. **Logging**
   - Structured logs with correlation IDs
   - Cloud Logging integration
   - Error tracking and alerting

2. **Metrics**
   - Request latency
   - Error rates
   - Resource utilization

3. **Alerting**
   - Service availability
   - Error thresholds
   - Performance degradation

## Scalability Considerations

1. **Horizontal Scaling**
   - Stateless backend design
   - Cloud Run auto-scaling
   - Firebase Hosting CDN

2. **Performance Optimization**
   - Response caching
   - Efficient API usage
   - Batch operations

3. **Resource Management**
   - Memory and CPU limits
   - Connection pooling
   - Throttling and rate limiting

## Future Architecture Considerations

1. **Microservices**
   - Split backend into domain-specific services
   - API Gateway for routing
   - Service mesh for communication

2. **Advanced AI Features**
   - Integration with additional AI models
   - Custom model training
   - Personalized recommendations

3. **Additional Integrations**
   - Microsoft 365 integration
   - Slack integration
   - Custom enterprise integrations
