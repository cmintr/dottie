# Rate Limiting Implementation

## Overview

This document outlines the rate limiting implementation added to the Dottie AI Assistant as part of the security architecture overhaul. Rate limiting is a critical security measure that protects our API endpoints from abuse, denial of service attacks, and excessive resource consumption.

## Implementation Details

### Middleware Structure

The rate limiting implementation uses the `express-rate-limit` package and consists of:

1. **Standard Rate Limiter**: Applied globally to all API endpoints
   - 100 requests per 15 minutes for authenticated users
   - 50 requests per 15 minutes for unauthenticated users

2. **Chat-specific Rate Limiter**: Stricter limits for the resource-intensive chat endpoint
   - 10 requests per minute regardless of authentication status

### Key Features

- **User-based Rate Limiting**: Limits are applied per user ID for authenticated users
- **IP-based Fallback**: For unauthenticated users, limits are applied per IP address
- **Standardized Headers**: Returns standard `RateLimit-*` headers in responses
- **Detailed Logging**: Logs rate limit violations with user/IP information
- **Customizable Configuration**: Easy to adjust limits based on environment or load

## File Structure

- `middleware/rateLimitMiddleware.ts`: Contains the rate limiting implementation
- `index.ts`: Applies the standard rate limiter globally
- `routes/chatRoutes.ts`: Applies the stricter chat-specific rate limiter

## Testing

### Automated Testing

A test script is provided at `backend/src/tests/rateLimit.test.ts` that verifies:
1. Standard rate limiting on the health endpoint
2. Stricter rate limiting on the chat endpoint

To run the test:

```bash
# Start the server in one terminal
cd backend
npm run dev

# Run the test in another terminal
cd backend
npx ts-node src/tests/rateLimit.test.ts
```

### Manual Testing

You can also test the rate limiting manually:

1. Send multiple rapid requests to any endpoint
2. Observe the `RateLimit-*` headers in the responses
3. After exceeding the limit, you'll receive a 429 status code with a message

## Rate Limit Response

When a client exceeds the rate limit, they will receive:

```json
{
  "error": "Too many requests, please try again later",
  "retryAfter": 900  // seconds until the rate limit window resets
}
```

## Customization

The rate limits can be adjusted in `middleware/rateLimitMiddleware.ts` by modifying:

- `DEFAULT_WINDOW_MS`: Time window for standard rate limiting (in milliseconds)
- `DEFAULT_MAX_REQUESTS`: Maximum requests per window for authenticated users
- `UNAUTHENTICATED_MAX_REQUESTS`: Maximum requests per window for unauthenticated users
- `CHAT_WINDOW_MS`: Time window for chat endpoint rate limiting
- `CHAT_MAX_REQUESTS`: Maximum requests per window for the chat endpoint

## Production Considerations

In production environments, consider:

1. **Distributed Rate Limiting**: For multi-instance deployments, implement a Redis-based store for rate limiting
2. **Monitoring**: Set up alerts for frequent rate limit violations
3. **Adaptive Limits**: Adjust limits based on observed usage patterns and server load

## Security Benefits

This implementation provides protection against:

1. **Brute Force Attacks**: Limits login and authentication attempts
2. **DoS Attacks**: Prevents resource exhaustion from excessive requests
3. **Scraping**: Discourages automated data harvesting
4. **API Abuse**: Ensures fair resource allocation among users

## Future Enhancements

Potential future improvements include:

1. **Redis-based Store**: For distributed rate limiting across multiple instances
2. **Dynamic Rate Limiting**: Adjust limits based on server load or user behavior
3. **Graduated Response**: Implement increasing timeouts for persistent violators
4. **Allowlisting**: Create exceptions for trusted internal services
