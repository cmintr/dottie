# Dottie AI Assistant - Security Documentation

This document outlines the security architecture, practices, and considerations for the Dottie AI Assistant application, focusing on data protection, authentication, and secure deployment.

## Security Architecture

The Dottie AI Assistant implements a defense-in-depth approach with multiple security layers:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Firebase Hosting)               │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        HTTPS / TLS 1.3                           │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                               │
│                   (Request Validation, Rate Limiting)            │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Firebase Authentication                    │
│                   (JWT Verification, User Identity)              │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend (Cloud Run)                       │
│                   (Authorization, Business Logic)                │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Secret Manager                            │
│                   (Credential Management)                        │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Google APIs                               │
│                   (OAuth 2.0, Scoped Access)                     │
└─────────────────────────────────────────────────────────────────┘
```

## Authentication & Authorization

### User Authentication

As directed by the CTO, the application uses Firebase Authentication exclusively:

1. **Firebase Authentication**
   - Users authenticate via Google Sign-In
   - Firebase issues ID tokens (JWTs)
   - ID tokens are included in Authorization header for all API requests

2. **Token Verification**
   - Backend verifies Firebase ID tokens using Firebase Admin SDK
   - Tokens are checked for validity, expiration, and correct audience
   - User identity is extracted from verified tokens

3. **Session Management**
   - No server-side sessions (express-session is being phased out)
   - Stateless authentication using Firebase ID tokens
   - Tokens automatically refresh via Firebase SDK

### Google OAuth Integration

1. **Token Storage**
   - Google OAuth refresh tokens stored in Firestore
   - Associated with Firebase User ID
   - Protected by Firestore Security Rules

2. **Token Refresh**
   - Backend uses refresh tokens to obtain new access tokens
   - Access tokens never stored long-term
   - Automatic token refresh when tokens expire

3. **Scoped Access**
   - OAuth scopes limited to required functionality
   - Principle of least privilege applied
   - Users can revoke access at any time

## Data Protection

### Data in Transit

1. **HTTPS Everywhere**
   - All communications use HTTPS with TLS 1.3
   - HTTP Strict Transport Security (HSTS) enabled
   - Modern cipher suites only

2. **API Gateway Security**
   - Request validation
   - Rate limiting to prevent abuse
   - Backend authentication

### Data at Rest

1. **Firestore Security**
   - Strict security rules for userTokens collection
   - Users can only access their own data
   - Field-level security for sensitive data

2. **Secret Management**
   - All credentials stored in Secret Manager
   - Service accounts with minimal permissions
   - Automatic secret rotation (where applicable)

3. **No Local Storage of Sensitive Data**
   - Sensitive data not stored in browser localStorage
   - Temporary data cleared on session end
   - Secure cookie handling

## Secure Deployment

### Infrastructure Security

1. **Cloud Run**
   - Isolated container execution
   - Automatic security patching
   - No SSH access to containers

2. **Firebase Hosting**
   - DDoS protection
   - Global CDN with edge security
   - Automatic TLS certificate management

3. **Least Privilege**
   - Service accounts with minimal required permissions
   - IAM roles following principle of least privilege
   - Regular permission audits

### CI/CD Security

1. **Secure Build Process**
   - Dependency scanning
   - Container image scanning
   - Code quality checks

2. **Deployment Controls**
   - Separation of staging and production environments
   - Approval process for production deployments
   - Rollback capabilities

## Security Monitoring & Incident Response

### Monitoring

1. **Logging**
   - Centralized logging with Cloud Logging
   - Structured log format with correlation IDs
   - Sensitive data redaction in logs

2. **Alerting**
   - Alerts for suspicious activities
   - Performance degradation monitoring
   - Error rate thresholds

3. **Audit Trail**
   - Authentication events logged
   - Admin actions recorded
   - API access auditing

### Incident Response

1. **Response Plan**
   - Defined security incident response process
   - Roles and responsibilities documented
   - Communication templates prepared

2. **Containment & Recovery**
   - Ability to revoke compromised tokens
   - Account lockout capabilities
   - Disaster recovery procedures

## Security Testing

1. **Regular Testing**
   - Automated security scanning
   - Dependency vulnerability checking
   - OWASP Top 10 vulnerability assessment

2. **Pre-Production Security Review**
   - Code review for security issues
   - Configuration review
   - Deployment process review

## Compliance Considerations

While not currently implementing formal compliance frameworks, the application is designed with these principles in mind:

1. **Data Privacy**
   - Transparent data collection and usage
   - User control over their data
   - Data minimization principles

2. **Future Compliance**
   - Architecture supports future compliance needs
   - Logging and monitoring for compliance evidence
   - Separation of concerns for easier compliance mapping

## Security Best Practices for Developers

1. **Code Security**
   - Input validation for all user inputs
   - Output encoding to prevent XSS
   - Parameterized queries to prevent injection
   - Regular dependency updates

2. **Authentication & Authorization**
   - Always verify Firebase ID tokens
   - Check user permissions for each operation
   - Never trust client-side authorization

3. **Sensitive Data Handling**
   - Never log sensitive data
   - Use Secret Manager for all secrets
   - Minimize sensitive data collection

4. **Error Handling**
   - Use centralized error handling
   - Don't expose internal details in error messages
   - Log detailed errors for debugging

## Security Roadmap

Future security enhancements planned:

1. **Short-term (Q2 2025)**
   - Complete migration away from express-session
   - Implement API rate limiting
   - Add automated dependency scanning

2. **Medium-term (Q3-Q4 2025)**
   - Add Web Application Firewall (WAF)
   - Implement more granular access controls
   - Add security headers scanning

3. **Long-term (2026)**
   - Consider SOC 2 compliance
   - Implement advanced threat detection
   - Add formal penetration testing program

## Security Contacts

For security concerns or questions:

- **Security Team Email**: security@example.com
- **Responsible Disclosure**: https://example.com/security
- **Emergency Contact**: security-emergency@example.com

## Conclusion

Security is a continuous process, not a one-time implementation. This document will be regularly reviewed and updated as the application evolves and new security challenges emerge.
