import { ApiService } from './api';
import { mockChatService } from './mockChatService';

// Check if we're in development mode and should use mock implementations
const useMocks = import.meta.env.MODE === 'development' || import.meta.env.VITE_USE_MOCKS === 'true';

/**
 * Interface for chat message request
 */
interface ChatMessageRequest {
  query: string;
  conversationId?: string;
}

/**
 * Interface for chat message response
 */
interface ChatMessageResponse {
  response: string;
  conversationId: string;
  functionCalls?: {
    name: string;
    arguments: Record<string, any>;
    result?: any;
  }[];
}

/**
 * Service for chat-related API calls
 */
export class ChatService {
  /**
   * Send a message to the chat API
   * @param message User's message text
   * @param conversationId Optional conversation ID for continuing a conversation
   * @returns Promise with the assistant's response
   */
  static async sendMessage(
    message: string, 
    conversationId?: string
  ): Promise<ChatMessageResponse> {
    // Use mock implementation in development mode
    if (useMocks) {
      console.log('Using mock chat service');
      return mockChatService.sendMessage(message, conversationId);
    }
    
    try {
      const requestData: ChatMessageRequest = {
        query: message,
      };
      
      if (conversationId) {
        requestData.conversationId = conversationId;
      }
      
      return await ApiService.post<ChatMessageResponse>('/chat', requestData);
    } catch (error) {
      console.error('Error sending message to chat API:', error);
      throw error;
    }
  }
}
