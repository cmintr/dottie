import { ApiService } from './api';

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
