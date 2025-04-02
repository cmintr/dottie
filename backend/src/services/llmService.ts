import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';
import { Message, GeminiMessage, FunctionDefinition, LlmResponse, VertexContent, FunctionCall } from '../types';

/**
 * Service for interacting with Google Vertex AI Gemini Pro
 */
export class LlmService {
  private vertexAI: VertexAI;
  private modelName: string;
  private location: string;
  private functionDeclarations: FunctionDefinition[];

  constructor() {
    // Initialize Vertex AI with GCP project ID and location from environment variables
    this.location = process.env.GCP_REGION || 'us-central1';
    this.modelName = process.env.VERTEX_AI_MODEL_NAME || 'gemini-1.5-pro-001';
    
    // Initialize Vertex AI client with Application Default Credentials
    this.vertexAI = new VertexAI({
      project: process.env.GCP_PROJECT_ID || '',
      location: this.location,
    });

    // Define functions that Gemini can call
    this.functionDeclarations = [
      {
        name: "get_calendar_events",
        description: "Fetch calendar events for a given date range.",
        parameters: {
          type: "OBJECT",
          properties: {
            startDate: {
              type: "STRING",
              description: "The start date in ISO format (YYYY-MM-DD)"
            },
            endDate: {
              type: "STRING",
              description: "The end date in ISO format (YYYY-MM-DD)"
            },
            timeZone: {
              type: "STRING",
              description: "The timezone for the query (e.g., 'America/New_York')"
            },
            maxResults: {
              type: "INTEGER",
              description: "Maximum number of events to return"
            }
          },
          required: ["startDate"]
        }
      },
      {
        name: "send_email",
        description: "Send an email to specified recipients.",
        parameters: {
          type: "OBJECT",
          properties: {
            to: {
              type: "STRING",
              description: "Email address of the recipient"
            },
            subject: {
              type: "STRING",
              description: "Subject line of the email"
            },
            body: {
              type: "STRING",
              description: "Body content of the email"
            },
            cc: {
              type: "STRING",
              description: "CC recipients (comma-separated email addresses)"
            },
            bcc: {
              type: "STRING",
              description: "BCC recipients (comma-separated email addresses)"
            }
          },
          required: ["to", "subject", "body"]
        }
      },
      {
        name: "search_web",
        description: "Search the web for information.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: {
              type: "STRING",
              description: "The search query"
            },
            maxResults: {
              type: "INTEGER",
              description: "Maximum number of search results to return"
            }
          },
          required: ["query"]
        }
      },
      {
        name: "get_sheet_data",
        description: "Fetch data from a Google Sheet.",
        parameters: {
          type: "OBJECT",
          properties: {
            spreadsheetId: {
              type: "STRING",
              description: "The ID of the spreadsheet"
            },
            range: {
              type: "STRING",
              description: "The A1 notation of the range to retrieve"
            }
          },
          required: ["spreadsheetId", "range"]
        }
      },
      {
        name: "find_contact",
        description: "Find a contact in Airtable.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: {
              type: "STRING",
              description: "Search term (name, email, phone, etc.)"
            }
          },
          required: ["query"]
        }
      },
      {
        name: "initiate_voice_call",
        description: "Initiate a voice call using Vapi.",
        parameters: {
          type: "OBJECT",
          properties: {
            phoneNumber: {
              type: "STRING",
              description: "Phone number to call"
            },
            message: {
              type: "STRING",
              description: "Initial message to convey"
            }
          },
          required: ["phoneNumber"]
        }
      }
    ];
  }

  /**
   * Format conversation history for Gemini API
   * @param history Previous conversation messages
   * @param query Current user query
   * @returns Formatted messages for Gemini API
   */
  private formatConversationHistory(history: Message[], query: string): GeminiMessage[] {
    // Convert history to Gemini format
    const formattedHistory: GeminiMessage[] = history.map(message => ({
      role: message.role === 'user' ? 'user' : 'model',
      parts: [{ text: message.content }]
    }));

    // Add current query as the last message
    formattedHistory.push({
      role: 'user',
      parts: [{ text: query }]
    });

    return formattedHistory;
  }

  /**
   * Get a response from Gemini Pro based on the user query and conversation history
   * @param query User's query text
   * @param history Previous conversation history
   * @param functionCall Optional function call information from previous interaction
   * @param functionResponse Optional function response to include in the conversation
   * @returns Response from the LLM
   */
  async getGeminiResponse(
    query: string, 
    history: Message[] = [], 
    functionCall?: any, 
    functionResponse?: any
  ): Promise<LlmResponse> {
    try {
      console.log(`Sending query to Gemini Pro: ${query}`);
      console.log(`With history of ${history.length} messages`);
      if (functionCall) {
        console.log(`Including function call: ${functionCall.function.name}`);
      }
      if (functionResponse) {
        console.log(`Including function response for: ${functionResponse.name}`);
      }
      
      // Get the generative model
      const generativeModel = this.vertexAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.4,
          topP: 0.8,
          topK: 40
        }
      });
      
      // Format conversation history
      const formattedHistory = this.formatConversationHistory(history, query);

      // If we have a function call and response, add them to the history
      if (functionCall && functionResponse) {
        // Add the function call as a model message
        formattedHistory.push({
          role: 'model',
          parts: [{ 
            functionCall: functionCall
          }]
        });

        // Add the function response as a user message (from the function)
        formattedHistory.push({
          role: 'user',
          parts: [{ 
            functionResponse: {
              name: functionResponse.name,
              response: { content: JSON.stringify(functionResponse.content) }
            }
          }]
        });
      }
      
      // Create request with tools
      const request = {
        contents: formattedHistory,
        toolConfig: {
          functionDeclarations: this.functionDeclarations
        }
      };
      
      // Call Gemini API
      const result = await generativeModel.generateContent(request);
      const response = result.response;
      
      // Check if there's a function call in the response
      const firstCandidate = response.candidates?.[0];
      if (!firstCandidate) {
        return { type: 'error', message: 'No response from the model' };
      }
      
      const content = firstCandidate.content;
      
      // Check for function calls
      if (content.parts?.[0]?.functionCall) {
        console.log('Function call detected:', content.parts[0].functionCall);
        return {
          type: 'functionCall',
          call: content.parts[0].functionCall
        };
      }
      
      // Return text response
      const textResponse = content.parts?.[0]?.text || '';
      return {
        type: 'text',
        content: textResponse
      };
    } catch (error) {
      console.error('Error in LLM service:', error);
      return {
        type: 'error',
        message: 'Failed to communicate with the AI model.'
      };
    }
  }

  /**
   * Get a response from Gemini based on a function call result
   * @param initialResult The initial LLM response containing the function call
   * @param functionName The name of the function that was called
   * @param functionResult The result of the function call as a string
   * @returns A new LLM response
   */
  async getFunctionResponseFromGemini(
    initialResult: LlmResponse,
    functionName: string,
    functionResult: string
  ): Promise<LlmResponse> {
    try {
      // Get the generative model with updated Vertex AI SDK v0.4.0 configuration
      const generativeModel = this.vertexAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 2048,
        }
      });

      // Create a chat session with updated configuration for Vertex AI SDK v0.4.0
      const chat = generativeModel.generateContent({
        contents: [{
          role: 'user',
          parts: [{
            text: `Processing function result from ${functionName}: ${functionResult}`
          }]
        }]
      });
      const result = await chat;

      // Extract the response content
      const responseContent = result.response?.candidates?.[0]?.content as VertexContent;

      // Check if the response contains text
      if (responseContent.parts && responseContent.parts.length > 0 && responseContent.parts[0].text) {
        return {
          type: 'text',
          content: responseContent.parts[0].text
        };
      }

      // If no text, check if there's another function call
      if (responseContent.functionCalls && responseContent.functionCalls.length > 0) {
        return {
          type: 'functionCall',
          call: responseContent.functionCalls[0]
        };
      }

      // Default response if no text or function call
      return {
        type: 'text',
        content: 'I processed your request, but I don\'t have a specific response.'
      };
    } catch (error) {
      console.error('Error getting function response from Gemini:', error);
      return {
        type: 'text',
        content: 'Sorry, I encountered an error while processing the function result.'
      };
    }
  }
}

// Export a singleton instance
export const llmService = new LlmService();
