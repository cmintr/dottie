# Dottie AI Assistant - Enhanced Testing Guide

This guide provides detailed instructions for using the enhanced testing environment for Dottie AI Assistant. The enhanced testing environment includes additional mock responses, network delay simulation, error simulation, and conversation history storage.

## Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
3. [Enhanced Mock Responses](#enhanced-mock-responses)
4. [Network Delay Simulation](#network-delay-simulation)
5. [Error Simulation](#error-simulation)
6. [Conversation History Testing](#conversation-history-testing)
7. [Testing Scenarios](#testing-scenarios)
8. [Troubleshooting](#troubleshooting)

## Overview

The enhanced testing environment is designed to provide a more realistic testing experience for the Dottie AI Assistant. It includes:

- **Enhanced Mock Responses**: Additional response types for important emails, meeting invitations, and complex spreadsheets
- **Network Delay Simulation**: Configurable delays (300-2000ms) to simulate real-world network conditions
- **Error Simulation**: Both random errors and explicit error testing capabilities
- **Conversation History Storage**: Support for testing multi-turn conversations

## Setup

To start the enhanced testing environment:

1. Run the `start-enhanced-testing.bat` script from the project root directory:
   ```
   ./start-enhanced-testing.bat
   ```

2. The script will:
   - Set the necessary environment variables
   - Start the frontend application in enhanced testing mode
   - Open your default browser to the application

3. You can now interact with the enhanced testing environment through the browser interface.

## Enhanced Mock Responses

The enhanced testing environment includes the following additional mock response types:

### Important Emails

Trigger with: "show me important emails" or "urgent emails"

This will display a list of mock important emails with priority flags, deadlines, and action items.

### Meeting Invitations

Trigger with: "show meeting invites" or "pending invitations"

This will display a list of mock meeting invitations that require acceptance or rejection.

### Complex Spreadsheets

Trigger with: "create quarterly report" or "financial analysis"

This will generate a mock complex spreadsheet with multiple sheets, formulas, and charts.

### Document Collaboration

Trigger with: "shared documents" or "collaboration status"

This will display a list of mock documents being shared with others, including their edit status.

## Network Delay Simulation

The enhanced testing environment simulates network delays to provide a more realistic testing experience:

- **Default Delay**: 1000ms (1 second)
- **Random Delay Range**: 300-2000ms

To test with specific delay settings:

1. Add the query parameter `?delay=X` to the URL, where X is the delay in milliseconds
   Example: `http://localhost:3000/?delay=1500`

2. Or use the developer console to set the delay:
   ```javascript
   localStorage.setItem('mockServiceDelay', '1500');
   location.reload();
   ```

## Error Simulation

The enhanced testing environment includes error simulation capabilities:

### Random Errors

To enable random errors (approximately 10% of requests will fail):

1. Add the query parameter `?randomErrors=true` to the URL
   Example: `http://localhost:3000/?randomErrors=true`

2. Or use the developer console:
   ```javascript
   localStorage.setItem('mockServiceRandomErrors', 'true');
   location.reload();
   ```

### Explicit Error Testing

To test specific error scenarios, use the following trigger phrases:

- **Authentication Error**: "force auth error" or "simulate authentication failure"
- **Rate Limit Error**: "force rate limit" or "simulate rate limit"
- **Server Error**: "force server error" or "simulate 500 error"
- **Network Error**: "force network error" or "simulate offline"
- **Timeout Error**: "force timeout" or "simulate request timeout"

## Conversation History Testing

The enhanced testing environment supports testing multi-turn conversations:

1. Start a conversation with any query
2. The conversation ID will be stored in the mock service
3. Subsequent queries will maintain context from previous messages
4. To test conversation history persistence:
   - Refresh the page
   - Use the "continue previous conversation" button
   - Verify that the conversation context is maintained

## Testing Scenarios

Here are some recommended testing scenarios to validate different aspects of the application:

### Basic Functionality Testing

1. **Email Retrieval**: "Show me my recent emails"
2. **Calendar Events**: "What meetings do I have today?"
3. **Spreadsheet Creation**: "Create a sales report spreadsheet"
4. **Email Drafting**: "Draft an email to John about the project status"

### Enhanced Functionality Testing

1. **Important Email Handling**: "Show me important emails"
2. **Meeting Invitation Workflow**: "Show meeting invites"
3. **Complex Data Analysis**: "Create quarterly financial report"
4. **Document Collaboration**: "Show shared documents status"

### Error Handling Testing

1. **Authentication Errors**: "Force auth error"
2. **Rate Limiting**: "Force rate limit"
3. **Server Errors**: "Force server error"
4. **Network Issues**: "Force network error"
5. **Timeouts**: "Force timeout"

### Multi-turn Conversation Testing

1. **Context Maintenance**:
   - "Show me my emails"
   - "Which one is from John?"
   - "Reply to that email"

2. **Reference Resolution**:
   - "Create a meeting for tomorrow at 10 AM"
   - "Invite the marketing team"
   - "Add a note about Q2 planning"

## Troubleshooting

### Common Issues

1. **Mock Service Not Responding**:
   - Check that the application is running in enhanced testing mode
   - Verify that no other instances of the application are running
   - Clear browser cache and local storage

2. **Delays Not Working**:
   - Verify that the delay parameter is correctly set
   - Check browser console for any errors

3. **Error Simulation Not Working**:
   - Ensure the error simulation is enabled
   - Verify that the trigger phrases are correctly used

### Debug Mode

To enable debug mode for more detailed logging:

1. Add the query parameter `?debug=true` to the URL
   Example: `http://localhost:3000/?debug=true`

2. Or use the developer console:
   ```javascript
   localStorage.setItem('mockServiceDebug', 'true');
   location.reload();
   ```

3. Open the browser console to view detailed logs of the mock service operations
