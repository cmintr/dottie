import { VertexAI } from '@google-cloud/vertexai';

// Extend the VertexAI type to include the missing methods
declare module '@google-cloud/vertexai' {
  interface VertexAI {
    getGenerativeModel(options: {
      model: string;
      generationConfig?: {
        maxOutputTokens?: number;
        temperature?: number;
        topP?: number;
        topK?: number;
      };
    }): GenerativeModel;
  }

  interface GenerativeModel {
    generateContent(request: {
      contents: any[];
      tools?: any;
    }): Promise<{
      response: {
        candidates?: Array<{
          content: {
            parts: Array<{
              text?: string;
              functionCall?: any;
            }>;
          };
        }>;
      };
    }>;
  }
}
