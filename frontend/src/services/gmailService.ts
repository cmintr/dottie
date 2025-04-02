import { ApiService } from './api';

/**
 * Interface for Gmail message
 */
export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  subject?: string;
  from?: {
    name?: string;
    email: string;
  };
  date: string;
  hasAttachments: boolean;
  isUnread: boolean;
}

/**
 * Interface for Gmail message list response
 */
interface GmailMessagesResponse {
  messages: GmailMessage[];
  nextPageToken?: string;
}

/**
 * Interface for Gmail message detail
 */
export interface GmailMessageDetail extends GmailMessage {
  body: {
    html?: string;
    text?: string;
  };
  to: Array<{
    name?: string;
    email: string;
  }>;
  cc?: Array<{
    name?: string;
    email: string;
  }>;
  bcc?: Array<{
    name?: string;
    email: string;
  }>;
  attachments?: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: number;
  }>;
}

/**
 * Interface for sending email request
 */
interface SendEmailRequest {
  to: string | string[];
  subject: string;
  body: string;
  cc?: string | string[];
  bcc?: string | string[];
  isHtml?: boolean;
}

/**
 * Interface for sending email response
 */
interface SendEmailResponse {
  messageId: string;
  threadId: string;
}

/**
 * Service for Gmail-related API calls
 */
export class GmailService {
  /**
   * Get recent Gmail messages
   * @param maxResults Maximum number of messages to retrieve
   * @param pageToken Optional token for pagination
   * @returns Promise with list of Gmail messages
   */
  static async getMessages(
    maxResults: number = 20,
    pageToken?: string
  ): Promise<GmailMessagesResponse> {
    try {
      const endpoint = pageToken
        ? `/gmail/messages?maxResults=${maxResults}&pageToken=${pageToken}`
        : `/gmail/messages?maxResults=${maxResults}`;
        
      return await ApiService.get<GmailMessagesResponse>(endpoint);
    } catch (error) {
      console.error('Error fetching Gmail messages:', error);
      throw error;
    }
  }

  /**
   * Get a specific Gmail message by ID
   * @param messageId ID of the message to retrieve
   * @returns Promise with the message details
   */
  static async getMessage(messageId: string): Promise<GmailMessageDetail> {
    try {
      return await ApiService.get<GmailMessageDetail>(`/gmail/messages/${messageId}`);
    } catch (error) {
      console.error(`Error fetching Gmail message ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Send a new email
   * @param emailData Email data including recipients, subject, and body
   * @returns Promise with the sent message ID
   */
  static async sendEmail(emailData: SendEmailRequest): Promise<SendEmailResponse> {
    try {
      return await ApiService.post<SendEmailResponse>('/gmail/messages', emailData);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
}
