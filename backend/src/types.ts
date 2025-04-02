/**
 * Types for the Dottie AI Assistant backend
 */

/**
 * Message type for conversation history
 */
export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Gemini message part types
 */
export type GeminiPart = 
  | { text: string }
  | { functionCall: FunctionCall }
  | { functionResponse: { name: string; response: { content: string } } };

/**
 * Function call structure for Vertex AI
 */
export interface FunctionCall {
  name: string;
  args: Record<string, any>;
}

/**
 * Gemini message format
 */
export interface GeminiMessage {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

/**
 * Function parameter definition for tool calling
 */
export interface FunctionParameter {
  type: string;
  description?: string;
  required?: boolean;
  enum?: string[];
}

/**
 * Function definition for tool calling
 */
export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, FunctionParameter>;
    required?: string[];
  };
}

/**
 * LLM response types
 */
export type LlmResponse = 
  | { type: 'text'; content: string; }
  | { type: 'functionCall'; call: FunctionCall; }
  | { type: 'error'; message: string; };

/**
 * Content structure from Vertex AI response
 */
export interface VertexContent {
  parts: Array<{text?: string}>;
  functionCalls?: FunctionCall[];
}
