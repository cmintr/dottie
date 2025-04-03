import { useState, useEffect, useRef } from 'react';
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
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-message',
          role: 'assistant',
          content: "Hello! I'm Dottie, your AI assistant for Google Workspace. How can I help you today?",
          timestamp: new Date(),
        },
      ]);
    }
  }, [messages.length]);

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Add user message to state
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };
    
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);
    
    try {
      // Send message to server
      const response = await ChatService.sendMessage(userMessage.content, conversationId);
      
      // Update conversation ID
      if (response.conversationId) {
        setConversationId(response.conversationId);
      }
      
      // Add assistant message to state
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        functionCalls: response.functionCalls,
      };
      
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render function call results
  const renderFunctionResults = (functionCalls: Message['functionCalls']) => {
    if (!functionCalls || functionCalls.length === 0) return null;
    
    return functionCalls.map((call, index) => {
      const { name, result } = call;
      
      // Render email results
      if (name === 'getEmails' && result) {
        return (
          <div key={`function-${index}`} className="dottie-function-result">
            <h4>Recent Emails</h4>
            <ul className="dottie-email-list">
              {result.map((email: any) => (
                <li key={email.id} className="dottie-email-item">
                  <div className="dottie-email-subject">{email.subject}</div>
                  <div className="dottie-email-sender">From: {email.from}</div>
                  <div className="dottie-email-snippet">{email.snippet}</div>
                </li>
              ))}
            </ul>
          </div>
        );
      }
      
      // Render calendar results
      if (name === 'getCalendarEvents' && result) {
        return (
          <div key={`function-${index}`} className="dottie-function-result">
            <h4>Upcoming Events</h4>
            <ul className="dottie-calendar-list">
              {result.map((event: any) => {
                const startDate = new Date(event.start.dateTime);
                const endDate = new Date(event.end.dateTime);
                const formattedDate = startDate.toLocaleDateString();
                const formattedTime = `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                
                return (
                  <li key={event.id} className="dottie-calendar-item">
                    <div className="dottie-calendar-title">{event.summary}</div>
                    <div className="dottie-calendar-time">{formattedDate}, {formattedTime}</div>
                    <div className="dottie-calendar-location">{event.location}</div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      }
      
      // Render spreadsheet results
      if (name === 'createSpreadsheet' && result) {
        return (
          <div key={`function-${index}`} className="dottie-function-result">
            <h4>{result.title}</h4>
            {result.sheets && result.sheets[0] && (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                  <tr>
                    {result.sheets[0].data[0].map((header: string, i: number) => (
                      <th key={i} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.sheets[0].data.slice(1).map((row: any[], i: number) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} style={{ border: '1px solid #ddd', padding: '8px' }}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ marginTop: '10px' }}>
              <a href="#" style={{ color: '#4285F4', textDecoration: 'none' }}>
                Open Spreadsheet
              </a>
            </div>
          </div>
        );
      }
      
      // Render email draft results
      if (name === 'createDraft' && result) {
        return (
          <div key={`function-${index}`} className="dottie-function-result">
            <h4>Email Draft</h4>
            <div style={{ marginBottom: '10px' }}>
              <strong>To:</strong> {call.arguments.to}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Subject:</strong> {call.arguments.subject}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Body:</strong>
              <div style={{ whiteSpace: 'pre-line', border: '1px solid #ddd', padding: '10px', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
                {call.arguments.body}
              </div>
            </div>
            <div>
              <button style={{ backgroundColor: '#34a853', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', marginRight: '8px', cursor: 'pointer' }}>
                Send Email
              </button>
              <button style={{ backgroundColor: '#ea4335', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                Discard
              </button>
            </div>
          </div>
        );
      }
      
      return null;
    });
  };

  return (
    <div className="dottie-container">
      {!user ? (
        <div className="dottie-auth-section">
          <h2>Authentication Required</h2>
          <p>Please sign in to use Dottie AI Assistant.</p>
        </div>
      ) : (
        <>
          <div className="dottie-chat-container">
            <div className="dottie-chat-messages">
              {messages.map((message) => (
                <div key={message.id} className={`dottie-message dottie-message-${message.role}`}>
                  <div>{message.content}</div>
                  {message.functionCalls && renderFunctionResults(message.functionCalls)}
                </div>
              ))}
              {isLoading && (
                <div className="dottie-loading">
                  <div className="dottie-loading-dots">
                    <div className="dottie-loading-dot"></div>
                    <div className="dottie-loading-dot"></div>
                    <div className="dottie-loading-dot"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSubmit} className="dottie-chat-input">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message here..."
                disabled={isLoading}
              />
              <button type="submit" disabled={isLoading || !inputValue.trim()}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z"/>
                </svg>
              </button>
            </form>
          </div>
          
          {error && (
            <div style={{ color: '#ea4335', marginTop: '10px', textAlign: 'center' }}>
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Conversation;
