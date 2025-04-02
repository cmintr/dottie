import { useState } from 'react';
import ConversationHistory from '../components/ConversationHistory';
import ChatInput from '../components/ChatInput';
import AuthStatusCheck from '../components/AuthStatusCheck';
import GoogleAccountLink from '../components/GoogleAccountLink';
import VoiceOutput from '../components/VoiceOutput';
import { useAuth } from '../context/AuthContext';
import { ChatService } from '../services/chatService';

// Define message type
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  functionCalls?: Array<{
    name: string;
    arguments: Record<string, any>;
    result?: any;
  }>;
}

function Conversation() {
  // State for messages, input value, and loading state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [lastAssistantMessage, setLastAssistantMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  /**
   * Send a message to the backend server
   * @param message The message to send
   * @returns Response from the server
   */
  async function sendMessageToServer(message: string): Promise<{ 
    response: string;
    conversationId: string;
    functionCalls?: Array<{
      name: string;
      arguments: Record<string, any>;
      result?: any;
    }>;
  }> {
    console.log('Sending message to server:', message);
    
    if (!user) {
      throw new Error('You must be signed in to send messages');
    }
    
    try {
      // Use the ChatService to send the message to the backend
      const response = await ChatService.sendMessage(message, conversationId);
      return response;
    } catch (error) {
      console.error('Error sending message to server:', error);
      throw error;
    }
  }

  /**
   * Handle form submission
   * @param e Form submit event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;
    
    // Create a new user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    // Add user message to the conversation
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input field
    setInputValue('');
    
    // Set loading state
    setIsLoading(true);
    setError(null);
    
    try {
      // Send message to server
      const { response, conversationId: newConversationId, functionCalls } = await sendMessageToServer(userMessage.content);
      
      // Update conversation ID
      setConversationId(newConversationId);
      
      // Create a new assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        functionCalls
      };
      
      // Add assistant message to the conversation
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update last assistant message for voice output
      setLastAssistantMessage(response);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Set error message
      setError(error instanceof Error ? error.message : 'An error occurred while processing your request');
      
      // Add error message to the conversation
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, there was an error processing your request. Please try again.',
          timestamp: new Date()
        }
      ]);
    } finally {
      // Reset loading state
      setIsLoading(false);
    }
  };

  const toggleAutoSpeak = () => {
    setAutoSpeak(!autoSpeak);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white shadow-sm p-4">
        <h1 className="text-xl font-semibold text-gray-800">Dottie AI Assistant</h1>
      </header>
      
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <AuthStatusCheck />
          <GoogleAccountLink />
        </div>
        
        {error && (
          <div className="mx-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto p-4">
          <ConversationHistory messages={messages} />
        </div>
        
        <div className="p-4 bg-white border-t flex items-center space-x-4">
          <div className="flex-1">
            <ChatInput
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              setValue={setInputValue}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleAutoSpeak}
              className={`p-2 rounded-md ${autoSpeak ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
              title={autoSpeak ? 'Disable auto-speak' : 'Enable auto-speak'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.728-2.728" />
              </svg>
            </button>
            
            <VoiceOutput 
              text={lastAssistantMessage} 
              autoPlay={autoSpeak}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default Conversation;
