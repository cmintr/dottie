// Mock implementation of the chat service for testing
import { Message } from '../pages/Conversation';

// Configuration for enhanced testing
interface MockServiceConfig {
  delayMin: number;
  delayMax: number;
  randomErrors: boolean;
  debug: boolean;
}

// Default configuration
const defaultConfig: MockServiceConfig = {
  delayMin: 300,
  delayMax: 2000,
  randomErrors: false,
  debug: false
};

// Get configuration from localStorage or environment variables
const getConfig = (): MockServiceConfig => {
  // Check if running in a browser environment
  if (typeof window !== 'undefined' && window.localStorage) {
    return {
      delayMin: parseInt(localStorage.getItem('mockServiceDelayMin') || 
                process.env.REACT_APP_MOCK_DELAY_MIN || 
                String(defaultConfig.delayMin), 10),
      delayMax: parseInt(localStorage.getItem('mockServiceDelayMax') || 
                process.env.REACT_APP_MOCK_DELAY_MAX || 
                String(defaultConfig.delayMax), 10),
      randomErrors: localStorage.getItem('mockServiceRandomErrors') === 'true' || false,
      debug: localStorage.getItem('mockServiceDebug') === 'true' || false
    };
  }
  return defaultConfig;
};

// Conversation history storage
const conversationHistory: Record<string, Message[]> = {};

// Sample responses for different types of queries
const mockResponses: Record<string, any> = {
  email: {
    response: "Here are your recent emails:",
    functionCalls: [
      {
        name: "getEmails",
        arguments: { limit: 5 },
        result: [
          {
            id: "email1",
            subject: "Project Update",
            from: "john.doe@example.com",
            snippet: "The latest project metrics show improvement...",
            date: "2025-04-02T14:30:00Z"
          },
          {
            id: "email2",
            subject: "Meeting Notes",
            from: "sarah.smith@example.com",
            snippet: "Attached are the notes from yesterday's meeting...",
            date: "2025-04-01T09:15:00Z"
          },
          {
            id: "email3",
            subject: "Weekly Newsletter",
            from: "team@company.com",
            snippet: "This week's highlights include...",
            date: "2025-03-31T11:20:00Z"
          }
        ]
      }
    ]
  },
  importantEmails: {
    response: "Here are your important and urgent emails:",
    functionCalls: [
      {
        name: "getEmails",
        arguments: { query: "is:important", limit: 5 },
        result: [
          {
            id: "urgent1",
            subject: "URGENT: Client Presentation Tomorrow",
            from: "vp@company.com",
            snippet: "We need to finalize the slides for tomorrow's client presentation...",
            date: "2025-04-02T16:45:00Z",
            labels: ["IMPORTANT", "URGENT"],
            flags: { priority: "high", deadline: "2025-04-03T09:00:00Z" }
          },
          {
            id: "urgent2",
            subject: "Action Required: Security Incident",
            from: "security@company.com",
            snippet: "Please update your password immediately due to a potential security breach...",
            date: "2025-04-02T14:20:00Z",
            labels: ["IMPORTANT", "URGENT"],
            flags: { priority: "critical", deadline: "2025-04-02T23:59:59Z" }
          },
          {
            id: "urgent3",
            subject: "Final Budget Approval Needed",
            from: "finance@company.com",
            snippet: "The Q2 budget requires your approval before end of day...",
            date: "2025-04-02T11:30:00Z",
            labels: ["IMPORTANT"],
            flags: { priority: "high", deadline: "2025-04-03T17:00:00Z" }
          }
        ]
      }
    ]
  },
  calendar: {
    response: "Here are your upcoming events:",
    functionCalls: [
      {
        name: "getCalendarEvents",
        arguments: { timeMin: "2025-04-03T00:00:00Z", timeMax: "2025-04-04T23:59:59Z" },
        result: [
          {
            id: "event1",
            summary: "Team Standup",
            start: { dateTime: "2025-04-03T10:00:00Z" },
            end: { dateTime: "2025-04-03T10:30:00Z" },
            location: "Conference Room A"
          },
          {
            id: "event2",
            summary: "Client Presentation",
            start: { dateTime: "2025-04-03T14:00:00Z" },
            end: { dateTime: "2025-04-03T15:30:00Z" },
            location: "Virtual Meeting"
          },
          {
            id: "event3",
            summary: "Project Planning",
            start: { dateTime: "2025-04-04T09:00:00Z" },
            end: { dateTime: "2025-04-04T11:00:00Z" },
            location: "Main Office"
          }
        ]
      }
    ]
  },
  meetingInvites: {
    response: "Here are your pending meeting invitations:",
    functionCalls: [
      {
        name: "getCalendarEvents",
        arguments: { query: "responseStatus=needsAction" },
        result: [
          {
            id: "invite1",
            summary: "Quarterly Strategy Review",
            organizer: { email: "ceo@company.com", displayName: "CEO" },
            start: { dateTime: "2025-04-05T13:00:00Z" },
            end: { dateTime: "2025-04-05T15:00:00Z" },
            location: "Executive Boardroom",
            responseStatus: "needsAction",
            attendees: [
              { email: "user@company.com", responseStatus: "needsAction" },
              { email: "vp@company.com", responseStatus: "accepted" },
              { email: "director@company.com", responseStatus: "accepted" }
            ]
          },
          {
            id: "invite2",
            summary: "Product Demo with New Client",
            organizer: { email: "sales@company.com", displayName: "Sales Manager" },
            start: { dateTime: "2025-04-06T10:00:00Z" },
            end: { dateTime: "2025-04-06T11:30:00Z" },
            location: "Virtual Meeting",
            responseStatus: "needsAction",
            attendees: [
              { email: "user@company.com", responseStatus: "needsAction" },
              { email: "client@example.com", responseStatus: "accepted" },
              { email: "product@company.com", responseStatus: "accepted" }
            ]
          }
        ]
      }
    ]
  },
  sheets: {
    response: "I've created a spreadsheet for Q1 sales data:",
    functionCalls: [
      {
        name: "createSpreadsheet",
        arguments: { title: "Q1 Sales Report" },
        result: {
          spreadsheetId: "mock-spreadsheet-id",
          spreadsheetUrl: "https://example.com/sheets/mock-spreadsheet-id",
          title: "Q1 Sales Report",
          sheets: [
            {
              title: "Summary",
              data: [
                ["Region", "Q1 2024", "Q1 2025", "YoY Change"],
                ["North", 125000, 142500, "14%"],
                ["South", 98000, 115000, "17%"],
                ["East", 110000, 118000, "7%"],
                ["West", 135000, 152000, "13%"]
              ]
            }
          ]
        }
      }
    ]
  },
  complexSpreadsheet: {
    response: "I've created a comprehensive quarterly financial analysis:",
    functionCalls: [
      {
        name: "createSpreadsheet",
        arguments: { title: "Q1 2025 Financial Analysis" },
        result: {
          spreadsheetId: "mock-complex-spreadsheet-id",
          spreadsheetUrl: "https://example.com/sheets/mock-complex-spreadsheet-id",
          title: "Q1 2025 Financial Analysis",
          sheets: [
            {
              title: "Executive Summary",
              data: [
                ["Metric", "Q1 2024", "Q1 2025", "YoY Change", "Target", "Status"],
                ["Revenue", "$2.45M", "$3.12M", "+27.3%", "$3.00M", "EXCEEDED"],
                ["Expenses", "$1.85M", "$2.14M", "+15.7%", "$2.20M", "ON TARGET"],
                ["Profit", "$0.60M", "$0.98M", "+63.3%", "$0.80M", "EXCEEDED"],
                ["Customer Acquisition", "245", "312", "+27.3%", "300", "EXCEEDED"],
                ["Customer Retention", "87%", "92%", "+5.7%", "90%", "EXCEEDED"]
              ]
            },
            {
              title: "Revenue Breakdown",
              data: [
                ["Product Line", "Q1 2024", "Q1 2025", "YoY Change", "% of Total"],
                ["Product A", "$1.20M", "$1.45M", "+20.8%", "46.5%"],
                ["Product B", "$0.85M", "$1.10M", "+29.4%", "35.3%"],
                ["Product C", "$0.40M", "$0.57M", "+42.5%", "18.3%"]
              ]
            },
            {
              title: "Regional Performance",
              data: [
                ["Region", "Q1 2024", "Q1 2025", "YoY Change", "% of Total"],
                ["North America", "$1.35M", "$1.72M", "+27.4%", "55.1%"],
                ["Europe", "$0.75M", "$0.95M", "+26.7%", "30.4%"],
                ["Asia Pacific", "$0.35M", "$0.45M", "+28.6%", "14.4%"]
              ]
            },
            {
              title: "Forecast",
              data: [
                ["Metric", "Q2 2025 (Forecast)", "H1 2025 (Forecast)", "2025 (Forecast)"],
                ["Revenue", "$3.45M", "$6.57M", "$14.2M"],
                ["Expenses", "$2.30M", "$4.44M", "$9.8M"],
                ["Profit", "$1.15M", "$2.13M", "$4.4M"]
              ]
            }
          ],
          charts: [
            { title: "Revenue by Product", sheetIndex: 1, chartType: "PIE" },
            { title: "Revenue by Region", sheetIndex: 2, chartType: "PIE" },
            { title: "YoY Performance", sheetIndex: 0, chartType: "COLUMN" },
            { title: "Forecast Trends", sheetIndex: 3, chartType: "LINE" }
          ]
        }
      }
    ]
  },
  draft: {
    response: "Here's a draft email to John about the project status:",
    functionCalls: [
      {
        name: "createDraft",
        arguments: {
          to: "john@example.com",
          subject: "Project Status Update",
          body: "Hi John,\n\nI wanted to provide you with an update on our project status.\n\nWe've completed the initial phase of development and are on track to meet our Q2 milestones. The team has addressed all the critical issues identified in the last review.\n\nLet me know if you have any questions or need additional information.\n\nBest regards,\nTest User"
        },
        result: {
          id: "draft1",
          threadId: "thread1",
          labelIds: ["DRAFT"],
          snippet: "I wanted to provide you with an update on our project status."
        }
      }
    ]
  },
  sharedDocuments: {
    response: "Here are your shared documents and their collaboration status:",
    functionCalls: [
      {
        name: "getSharedDocuments",
        arguments: { limit: 5 },
        result: [
          {
            id: "doc1",
            name: "Q2 Strategy Document",
            mimeType: "application/vnd.google-apps.document",
            webViewLink: "https://example.com/docs/mock-doc-id-1",
            lastModified: "2025-04-02T15:30:00Z",
            collaborators: [
              { email: "user@company.com", role: "owner" },
              { email: "manager@company.com", role: "editor", lastActive: "2025-04-02T14:20:00Z" },
              { email: "team@company.com", role: "commenter" }
            ],
            comments: 12,
            pendingComments: 5
          },
          {
            id: "doc2",
            name: "Project Timeline",
            mimeType: "application/vnd.google-apps.spreadsheet",
            webViewLink: "https://example.com/sheets/mock-doc-id-2",
            lastModified: "2025-04-01T11:45:00Z",
            collaborators: [
              { email: "user@company.com", role: "editor" },
              { email: "pm@company.com", role: "owner", lastActive: "2025-04-01T11:45:00Z" },
              { email: "dev@company.com", role: "editor", lastActive: "2025-04-01T10:30:00Z" }
            ],
            comments: 8,
            pendingComments: 0
          },
          {
            id: "doc3",
            name: "Client Presentation",
            mimeType: "application/vnd.google-apps.presentation",
            webViewLink: "https://example.com/slides/mock-doc-id-3",
            lastModified: "2025-04-02T09:15:00Z",
            collaborators: [
              { email: "user@company.com", role: "editor" },
              { email: "sales@company.com", role: "owner" },
              { email: "design@company.com", role: "editor", lastActive: "2025-04-02T09:15:00Z" }
            ],
            comments: 15,
            pendingComments: 3
          }
        ]
      }
    ]
  },
  default: {
    response: "I'm Dottie, your AI assistant for Google Workspace. I can help you manage emails, calendar events, and documents. What would you like to do today?",
    functionCalls: []
  },
  // Error responses for testing
  authError: {
    error: {
      code: 401,
      message: "Authentication failed. Please sign in again.",
      details: "The authentication token has expired or is invalid."
    }
  },
  rateLimit: {
    error: {
      code: 429,
      message: "Rate limit exceeded. Please try again later.",
      details: "You have exceeded the maximum number of requests allowed in a given time period."
    }
  },
  serverError: {
    error: {
      code: 500,
      message: "Server error. Please try again later.",
      details: "An unexpected error occurred on the server. Our team has been notified."
    }
  },
  networkError: {
    error: {
      code: -1,
      message: "Network error. Please check your connection.",
      details: "Unable to connect to the server. Please verify your internet connection."
    }
  },
  timeout: {
    error: {
      code: 408,
      message: "Request timeout. Please try again.",
      details: "The request took too long to complete and was terminated."
    }
  }
};

// Generate a unique ID for messages
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Simulate network delay
async function simulateNetworkDelay(): Promise<void> {
  const config = getConfig();
  const delay = Math.floor(Math.random() * (config.delayMax - config.delayMin + 1)) + config.delayMin;
  
  if (config.debug) {
    console.log(`[MockService] Simulating network delay: ${delay}ms`);
  }
  
  return new Promise(resolve => setTimeout(resolve, delay));
}

// Simulate random errors
function shouldSimulateError(): boolean {
  const config = getConfig();
  return config.randomErrors && Math.random() < 0.1; // 10% chance of error
}

// Get a random error type
function getRandomError(): any {
  const errorTypes = ['authError', 'rateLimit', 'serverError', 'networkError', 'timeout'];
  const randomIndex = Math.floor(Math.random() * errorTypes.length);
  return mockResponses[errorTypes[randomIndex]];
}

// Store a message in conversation history
function storeMessage(conversationId: string, message: Message): void {
  if (!conversationHistory[conversationId]) {
    conversationHistory[conversationId] = [];
  }
  
  // Ensure timestamp is a Date object
  if (typeof message.timestamp === 'string') {
    message.timestamp = new Date(message.timestamp);
  }
  
  conversationHistory[conversationId].push(message);
  
  const config = getConfig();
  if (config.debug) {
    console.log(`[MockService] Stored message in conversation ${conversationId}`, message);
    console.log(`[MockService] Conversation history:`, conversationHistory[conversationId]);
  }
}

// Mock chat service implementation
export class MockChatService {
  // Send a message to the mock service
  async sendMessage(message: string, conversationId?: string): Promise<{ 
    response: string;
    conversationId: string;
    functionCalls?: Array<{
      name: string;
      arguments: Record<string, any>;
      result?: any;
    }>;
    error?: {
      code: number;
      message: string;
      details?: string;
    };
  }> {
    // Simulate network delay
    await simulateNetworkDelay();
    
    // Generate a new conversation ID if not provided
    const newOrExistingConversationId = conversationId || generateId();
    
    // Check if we should simulate an error
    if (shouldSimulateError()) {
      const errorResponse = getRandomError();
      
      // Store the user message in conversation history
      storeMessage(newOrExistingConversationId, {
        id: generateId(),
        role: 'user',
        content: message,
        timestamp: new Date()
      });
      
      // Store the error message in conversation history
      storeMessage(newOrExistingConversationId, {
        id: generateId(),
        role: 'assistant',
        content: `Error: ${errorResponse.error.message}`,
        timestamp: new Date(),
        functionCalls: []
      });
      
      return {
        response: `Error: ${errorResponse.error.message}`,
        conversationId: newOrExistingConversationId,
        error: errorResponse.error
      };
    }
    
    // Determine which mock response to use based on message content
    const lowerMessage = message.toLowerCase();
    let responseData;
    
    // Check for explicit error testing triggers
    if (lowerMessage.includes('force auth error') || lowerMessage.includes('simulate authentication failure')) {
      responseData = mockResponses.authError;
    } else if (lowerMessage.includes('force rate limit') || lowerMessage.includes('simulate rate limit')) {
      responseData = mockResponses.rateLimit;
    } else if (lowerMessage.includes('force server error') || lowerMessage.includes('simulate 500 error')) {
      responseData = mockResponses.serverError;
    } else if (lowerMessage.includes('force network error') || lowerMessage.includes('simulate offline')) {
      responseData = mockResponses.networkError;
    } else if (lowerMessage.includes('force timeout') || lowerMessage.includes('simulate request timeout')) {
      responseData = mockResponses.timeout;
    }
    // Check for enhanced testing triggers
    else if (lowerMessage.includes('important email') || lowerMessage.includes('urgent email')) {
      responseData = mockResponses.importantEmails;
    } else if (lowerMessage.includes('meeting invite') || lowerMessage.includes('pending invitation')) {
      responseData = mockResponses.meetingInvites;
    } else if (lowerMessage.includes('quarterly report') || lowerMessage.includes('financial analysis')) {
      responseData = mockResponses.complexSpreadsheet;
    } else if (lowerMessage.includes('shared document') || lowerMessage.includes('collaboration status')) {
      responseData = mockResponses.sharedDocuments;
    }
    // Check for standard triggers
    else if (lowerMessage.includes('email') && !lowerMessage.includes('draft')) {
      responseData = mockResponses.email;
    } else if (lowerMessage.includes('calendar') || lowerMessage.includes('schedule') || lowerMessage.includes('event')) {
      responseData = mockResponses.calendar;
    } else if (lowerMessage.includes('sheet') || lowerMessage.includes('spreadsheet') || lowerMessage.includes('report')) {
      responseData = mockResponses.sheets;
    } else if (lowerMessage.includes('draft') || lowerMessage.includes('compose')) {
      responseData = mockResponses.draft;
    } else {
      responseData = mockResponses.default;
    }
    
    // Store the user message in conversation history
    storeMessage(newOrExistingConversationId, {
      id: generateId(),
      role: 'user',
      content: message,
      timestamp: new Date()
    });
    
    // If there's an error in the response data
    if (responseData.error) {
      // Store the error message in conversation history
      storeMessage(newOrExistingConversationId, {
        id: generateId(),
        role: 'assistant',
        content: `Error: ${responseData.error.message}`,
        timestamp: new Date(),
        functionCalls: []
      });
      
      return {
        response: `Error: ${responseData.error.message}`,
        conversationId: newOrExistingConversationId,
        error: responseData.error
      };
    }
    
    // Store the assistant response in conversation history
    storeMessage(newOrExistingConversationId, {
      id: generateId(),
      role: 'assistant',
      content: responseData.response,
      timestamp: new Date(),
      functionCalls: responseData.functionCalls
    });
    
    // Return the response
    return {
      response: responseData.response,
      conversationId: newOrExistingConversationId,
      functionCalls: responseData.functionCalls
    };
  }
  
  // Get conversation history
  async getConversationHistory(conversationId: string): Promise<Message[]> {
    // Simulate network delay
    await simulateNetworkDelay();
    
    // Return the stored conversation history or an empty array if none exists
    return conversationHistory[conversationId] || [];
  }
  
  // Clear conversation history (for testing purposes)
  async clearConversationHistory(conversationId: string): Promise<void> {
    // Simulate network delay
    await simulateNetworkDelay();
    
    // Clear the conversation history
    if (conversationHistory[conversationId]) {
      delete conversationHistory[conversationId];
    }
    
    const config = getConfig();
    if (config.debug) {
      console.log(`[MockService] Cleared conversation history for ${conversationId}`);
    }
  }
}

// Export a singleton instance
export const mockChatService = new MockChatService();
