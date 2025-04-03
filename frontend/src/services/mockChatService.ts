// Mock implementation of the chat service for testing
import { Message } from '../pages/Conversation';

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
  default: {
    response: "I'm Dottie, your AI assistant for Google Workspace. I can help you manage emails, calendar events, and documents. What would you like to do today?",
    functionCalls: []
  }
};

// Generate a unique ID for messages
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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
  }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Determine which mock response to use based on message content
    const lowerMessage = message.toLowerCase();
    let responseData;
    
    if (lowerMessage.includes('email') && !lowerMessage.includes('draft')) {
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
    
    // Return the response with a new or existing conversation ID
    const newOrExistingConversationId = conversationId || generateId();
    
    return {
      response: responseData.response,
      conversationId: newOrExistingConversationId,
      functionCalls: responseData.functionCalls
    };
  }
  
  // Get conversation history (mock implementation)
  async getConversationHistory(conversationId: string): Promise<Message[]> {
    // In a real implementation, this would fetch from a database or API
    return [];
  }
}

// Export a singleton instance
export const mockChatService = new MockChatService();
