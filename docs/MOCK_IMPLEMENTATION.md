# Dottie AI Assistant - Mock Implementation Guide

This document provides practical examples and code snippets for implementing mocks to test the Dottie AI Assistant locally without relying on actual cloud services.

## Mock Implementation Strategy

When testing locally, we use three levels of mocking:

1. **Frontend API Mocks**: For UI development without a backend
2. **Backend Service Mocks**: For testing backend logic without cloud services
3. **Firebase Emulators**: For authentication and database operations

## Frontend Mock Implementations

### Chat Service Mock

Create a file at `frontend/src/services/mocks/chatService.ts`:

```typescript
// Sample chat responses based on input patterns
const mockResponses = {
  email: {
    type: 'email',
    content: 'Here are your recent emails:',
    data: [
      {
        id: 'email1',
        from: 'john.doe@example.com',
        subject: 'Project Update',
        snippet: 'The latest project metrics show improvement...',
        date: '2025-04-01T14:30:00Z'
      },
      {
        id: 'email2',
        from: 'sarah.smith@example.com',
        subject: 'Meeting Notes',
        snippet: 'Attached are the notes from yesterday\'s meeting...',
        date: '2025-03-31T09:15:00Z'
      }
    ]
  },
  calendar: {
    type: 'calendar',
    content: 'Here are your upcoming events:',
    data: [
      {
        id: 'event1',
        title: 'Team Standup',
        start: '2025-04-03T10:00:00Z',
        end: '2025-04-03T10:30:00Z',
        location: 'Conference Room A'
      },
      {
        id: 'event2',
        title: 'Client Presentation',
        start: '2025-04-03T14:00:00Z',
        end: '2025-04-03T15:30:00Z',
        location: 'Virtual Meeting'
      }
    ]
  },
  sheets: {
    type: 'sheets',
    content: 'Here\'s the spreadsheet data you requested:',
    data: {
      title: 'Q1 Sales Report',
      sheets: [
        {
          name: 'Summary',
          data: [
            ['Region', 'Q1 2024', 'Q1 2025', 'YoY Change'],
            ['North', 125000, 142500, '14%'],
            ['South', 98000, 115000, '17%'],
            ['East', 110000, 118000, '7%'],
            ['West', 135000, 152000, '13%']
          ]
        }
      ]
    }
  },
  default: {
    type: 'text',
    content: 'I can help you manage emails, calendar events, and documents. What would you like to do?'
  }
};

// Mock chat service implementation
export const sendMessage = async (message: string) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Determine response based on message content
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('email') || lowerMessage.includes('mail')) {
    return mockResponses.email;
  }
  
  if (lowerMessage.includes('calendar') || lowerMessage.includes('schedule') || lowerMessage.includes('event')) {
    return mockResponses.calendar;
  }
  
  if (lowerMessage.includes('sheet') || lowerMessage.includes('spreadsheet') || lowerMessage.includes('report')) {
    return mockResponses.sheets;
  }
  
  return mockResponses.default;
};

// Mock for voice transcription
export const transcribeAudio = async (audioBlob: Blob) => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  // Return mock transcription
  return "This is a mock transcription of the audio input.";
};
```

### Authentication Mock

Create a file at `frontend/src/services/mocks/authService.ts`:

```typescript
// Mock user data
const mockUsers = [
  {
    uid: 'user1',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://via.placeholder.com/150',
    emailVerified: true
  }
];

// Mock authentication state
let currentUser = null;

export const signInWithGoogle = async () => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Set current user to first mock user
  currentUser = mockUsers[0];
  
  // Return mock user credential
  return {
    user: currentUser,
    credential: {
      accessToken: 'mock-access-token',
      idToken: 'mock-id-token'
    }
  };
};

export const signOut = async () => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Clear current user
  currentUser = null;
};

export const getCurrentUser = () => {
  return currentUser;
};

export const onAuthStateChanged = (callback) => {
  // Initial callback with current state
  callback(currentUser);
  
  // Return unsubscribe function
  return () => {};
};
```

### Integration with Real Services

Modify your actual service files to use mocks when in development mode:

```typescript
// frontend/src/services/chatService.ts
import * as mockChatService from './mocks/chatService';

export const sendMessage = async (message: string) => {
  // Use mock in development mode when mock flag is enabled
  if (import.meta.env.DEV && import.meta.env.VITE_MOCK_API === 'true') {
    return mockChatService.sendMessage(message);
  }
  
  // Real implementation for production
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getIdToken()}`
    },
    body: JSON.stringify({ message })
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
};
```

## Backend Mock Implementations

### Gmail Service Mock

Create a file at `backend/src/services/mocks/gmailService.ts`:

```typescript
// Mock Gmail data
const mockEmails = [
  {
    id: 'msg1',
    threadId: 'thread1',
    labelIds: ['INBOX', 'IMPORTANT'],
    snippet: 'Hi, I wanted to follow up on our discussion...',
    payload: {
      headers: [
        { name: 'From', value: 'John Doe <john@example.com>' },
        { name: 'To', value: 'me@example.com' },
        { name: 'Subject', value: 'Follow-up from meeting' },
        { name: 'Date', value: 'Mon, 1 Apr 2025 09:30:45 +0000' }
      ],
      mimeType: 'text/plain',
      body: {
        data: Buffer.from('Hi, I wanted to follow up on our discussion about the new project timeline. Can we schedule a call tomorrow?').toString('base64')
      }
    }
  },
  {
    id: 'msg2',
    threadId: 'thread2',
    labelIds: ['INBOX'],
    snippet: 'Please find attached the quarterly report...',
    payload: {
      headers: [
        { name: 'From', value: 'Sarah Smith <sarah@example.com>' },
        { name: 'To', value: 'me@example.com' },
        { name: 'Subject', value: 'Q1 2025 Report' },
        { name: 'Date', value: 'Tue, 31 Mar 2025 16:45:22 +0000' }
      ],
      mimeType: 'multipart/mixed',
      parts: [
        {
          mimeType: 'text/plain',
          body: {
            data: Buffer.from('Please find attached the quarterly report for Q1 2025. Let me know if you have any questions.').toString('base64')
          }
        },
        {
          mimeType: 'application/pdf',
          filename: 'Q1_2025_Report.pdf',
          body: {
            attachmentId: 'attachment1'
          }
        }
      ]
    }
  }
];

// Mock Gmail service functions
export const listMessages = async (userId: string, query?: string) => {
  // Filter emails based on query if provided
  let filteredEmails = [...mockEmails];
  if (query) {
    const lowerQuery = query.toLowerCase();
    filteredEmails = filteredEmails.filter(email => {
      const subject = email.payload.headers.find(h => h.name === 'Subject')?.value || '';
      const from = email.payload.headers.find(h => h.name === 'From')?.value || '';
      return subject.toLowerCase().includes(lowerQuery) || from.toLowerCase().includes(lowerQuery);
    });
  }
  
  return {
    messages: filteredEmails.map(email => ({ id: email.id, threadId: email.threadId })),
    nextPageToken: null
  };
};

export const getMessage = async (userId: string, messageId: string) => {
  const email = mockEmails.find(e => e.id === messageId);
  if (!email) {
    throw new Error(`Email with ID ${messageId} not found`);
  }
  return email;
};

export const sendMessage = async (userId: string, message: any) => {
  // Simulate sending an email
  return {
    id: 'new_msg_' + Date.now(),
    threadId: 'new_thread_' + Date.now(),
    labelIds: ['SENT']
  };
};
```

### Calendar Service Mock

Create a file at `backend/src/services/mocks/calendarService.ts`:

```typescript
// Mock calendar data
const mockEvents = [
  {
    id: 'event1',
    summary: 'Team Standup',
    description: 'Daily team standup meeting',
    location: 'Conference Room A',
    start: { dateTime: '2025-04-03T10:00:00Z' },
    end: { dateTime: '2025-04-03T10:30:00Z' },
    attendees: [
      { email: 'john@example.com', responseStatus: 'accepted' },
      { email: 'sarah@example.com', responseStatus: 'accepted' },
      { email: 'mike@example.com', responseStatus: 'tentative' }
    ]
  },
  {
    id: 'event2',
    summary: 'Client Presentation',
    description: 'Presentation of Q1 results to client',
    location: 'Virtual Meeting',
    start: { dateTime: '2025-04-03T14:00:00Z' },
    end: { dateTime: '2025-04-03T15:30:00Z' },
    attendees: [
      { email: 'client@example.com', responseStatus: 'accepted' },
      { email: 'manager@example.com', responseStatus: 'accepted' }
    ]
  }
];

// Mock calendar service functions
export const listEvents = async (calendarId: string, params: any) => {
  // Filter events based on time range if provided
  let filteredEvents = [...mockEvents];
  if (params.timeMin) {
    const timeMin = new Date(params.timeMin).getTime();
    filteredEvents = filteredEvents.filter(event => {
      const eventStart = new Date(event.start.dateTime).getTime();
      return eventStart >= timeMin;
    });
  }
  
  if (params.timeMax) {
    const timeMax = new Date(params.timeMax).getTime();
    filteredEvents = filteredEvents.filter(event => {
      const eventStart = new Date(event.start.dateTime).getTime();
      return eventStart <= timeMax;
    });
  }
  
  return {
    items: filteredEvents,
    nextPageToken: null
  };
};

export const getEvent = async (calendarId: string, eventId: string) => {
  const event = mockEvents.find(e => e.id === eventId);
  if (!event) {
    throw new Error(`Event with ID ${eventId} not found`);
  }
  return event;
};

export const createEvent = async (calendarId: string, event: any) => {
  // Create a new mock event with the provided details
  const newEvent = {
    id: 'new_event_' + Date.now(),
    ...event,
    creator: { email: 'me@example.com' },
    organizer: { email: 'me@example.com' },
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  };
  
  // In a real implementation, we would add this to the mockEvents array
  // mockEvents.push(newEvent);
  
  return newEvent;
};
```

### Integration with Real Services

Modify your actual service files to use mocks when in development mode:

```typescript
// backend/src/services/gmailService.ts
import * as mockGmailService from './mocks/gmailService';

export const listMessages = async (userId: string, query?: string) => {
  // Use mock in development mode when mock flag is enabled
  if (process.env.NODE_ENV === 'development' && process.env.USE_MOCK_SERVICES === 'true') {
    return mockGmailService.listMessages(userId, query);
  }
  
  // Real implementation using Google APIs
  const gmail = getGmailClient(userId);
  const response = await gmail.users.messages.list({
    userId: 'me',
    q: query
  });
  
  return response.data;
};
```

## Setting Up Mock Toggle

### Backend Environment

Add to your `.env` file:

```
USE_MOCK_SERVICES=true
```

### Frontend Environment

Add to your `.env` file:

```
VITE_MOCK_API=true
```

## Testing with Mocks

1. Set the environment variables to enable mocking
2. Start the frontend and backend servers
3. Interact with the application as normal
4. Observe the mock responses in the UI

## Mock Data Guidelines

When creating mock data, follow these guidelines:

1. **Realistic Data**: Create mock data that resembles real-world data
2. **Edge Cases**: Include edge cases (empty results, large datasets, etc.)
3. **Consistency**: Ensure IDs and references are consistent across mocks
4. **Variability**: Include enough variety to test different UI states

## Conclusion

Using these mock implementations, you can effectively test the Dottie AI Assistant locally without relying on actual cloud services. This approach allows for faster development iterations and more reliable testing.

Remember to toggle mocking on/off as needed, and to keep mock data updated as the real APIs evolve.
