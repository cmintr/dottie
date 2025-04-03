// Mock API service for frontend testing
// This allows testing the UI without real backend connections

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
        date: '2025-04-02T14:30:00Z'
      },
      {
        id: 'email2',
        from: 'sarah.smith@example.com',
        subject: 'Meeting Notes',
        snippet: 'Attached are the notes from yesterday\'s meeting...',
        date: '2025-04-01T09:15:00Z'
      },
      {
        id: 'email3',
        from: 'team@company.com',
        subject: 'Weekly Newsletter',
        snippet: 'This week\'s highlights include...',
        date: '2025-03-31T11:20:00Z'
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
      },
      {
        id: 'event3',
        title: 'Project Planning',
        start: '2025-04-04T09:00:00Z',
        end: '2025-04-04T11:00:00Z',
        location: 'Main Office'
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
  help: {
    type: 'text',
    content: 'I can help you with the following tasks:\n\n- Email management (reading, composing, searching)\n- Calendar management (viewing events, scheduling meetings)\n- Document management (creating and editing spreadsheets)\n- Voice interaction (speaking commands and hearing responses)\n\nJust ask me what you need in natural language!'
  },
  default: {
    type: 'text',
    content: 'I\'m Dottie, your AI assistant for Google Workspace. I can help you manage emails, calendar events, and documents. What would you like to do today?'
  }
};

// Mock chat service
export const sendMessage = async (message) => {
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
  
  if (lowerMessage.includes('help') || lowerMessage.includes('what can you do') || lowerMessage.includes('capabilities')) {
    return mockResponses.help;
  }
  
  return mockResponses.default;
};

// Mock user data
const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://via.placeholder.com/150'
};

// Mock authentication functions
export const signIn = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  localStorage.setItem('mockUser', JSON.stringify(mockUser));
  return { user: mockUser };
};

export const signOut = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  localStorage.removeItem('mockUser');
  return true;
};

export const getCurrentUser = () => {
  const storedUser = localStorage.getItem('mockUser');
  return storedUser ? JSON.parse(storedUser) : null;
};

// Mock voice transcription
export const transcribeAudio = async (audioBlob) => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  // Return mock transcription
  return "This is a mock transcription of the audio input.";
};
