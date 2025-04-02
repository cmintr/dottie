import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatService } from '../services/chatService';
import Conversation from '../pages/Conversation';
import { AuthProvider } from '../context/AuthContext';

// Mock the API service
vi.mock('../services/api', () => {
  return {
    ApiService: {
      post: vi.fn(),
      get: vi.fn(),
    },
  };
});

// Mock the auth context
vi.mock('../context/AuthContext', () => {
  return {
    useAuth: vi.fn(() => ({
      user: {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
        getIdToken: vi.fn().mockResolvedValue('mock-token'),
      },
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

// Mock the chat service
vi.mock('../services/chatService', () => {
  return {
    ChatService: {
      sendMessage: vi.fn(),
    },
  };
});

// Mock components that aren't directly tested
vi.mock('../components/AuthStatusCheck', () => ({
  default: () => <div data-testid="auth-status-check">Auth Status Check</div>,
}));

vi.mock('../components/GoogleAccountLink', () => ({
  default: () => <div data-testid="google-account-link">Google Account Link</div>,
}));

vi.mock('../components/VoiceOutput', () => ({
  default: ({ text, autoPlay }: { text: string; autoPlay: boolean }) => (
    <div data-testid="voice-output" data-text={text} data-autoplay={autoPlay.toString()}>
      Voice Output
    </div>
  ),
}));

describe('Chat Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should render the conversation component', () => {
    render(<Conversation />);
    
    expect(screen.getByText('Dottie AI Assistant')).toBeInTheDocument();
    expect(screen.getByTestId('auth-status-check')).toBeInTheDocument();
    expect(screen.getByTestId('google-account-link')).toBeInTheDocument();
  });

  it('should send a message and display the response', async () => {
    // Mock the chat service response
    const mockResponse = {
      response: 'This is a test response from the assistant',
      conversationId: 'test-conversation-id',
    };
    
    (ChatService.sendMessage as any).mockResolvedValue(mockResponse);

    render(<Conversation />);

    // Find the input field and submit button
    const inputField = screen.getByPlaceholderText(/type a message/i) || 
                       screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: /send/i });

    // Type a message and submit
    fireEvent.change(inputField, { target: { value: 'Hello, Dottie!' } });
    fireEvent.click(submitButton);

    // Check if the chat service was called with the correct parameters
    expect(ChatService.sendMessage).toHaveBeenCalledWith('Hello, Dottie!', undefined);

    // Wait for the response to be displayed
    await waitFor(() => {
      expect(screen.getByText('Hello, Dottie!')).toBeInTheDocument();
      expect(screen.getByText('This is a test response from the assistant')).toBeInTheDocument();
    });
  });

  it('should handle function calls in the response', async () => {
    // Mock the chat service response with function calls
    const mockResponse = {
      response: 'Here are your recent emails',
      conversationId: 'test-conversation-id',
      functionCalls: [
        {
          name: 'getGmailMessages',
          arguments: { maxResults: 5 },
          result: {
            messages: [
              {
                id: 'msg1',
                subject: 'Test Email 1',
                from: { name: 'Sender 1', email: 'sender1@example.com' },
                date: '2025-04-01T10:00:00Z',
                snippet: 'This is a test email 1',
              },
              {
                id: 'msg2',
                subject: 'Test Email 2',
                from: { name: 'Sender 2', email: 'sender2@example.com' },
                date: '2025-04-01T11:00:00Z',
                snippet: 'This is a test email 2',
              },
            ],
          },
        },
      ],
    };
    
    (ChatService.sendMessage as any).mockResolvedValue(mockResponse);

    render(<Conversation />);

    // Find the input field and submit button
    const inputField = screen.getByPlaceholderText(/type a message/i) || 
                       screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: /send/i });

    // Type a message and submit
    fireEvent.change(inputField, { target: { value: 'Show me my recent emails' } });
    fireEvent.click(submitButton);

    // Wait for the response and function call results to be displayed
    await waitFor(() => {
      expect(screen.getByText('Show me my recent emails')).toBeInTheDocument();
      expect(screen.getByText('Here are your recent emails')).toBeInTheDocument();
      // The function call display component would be rendered here
      // We can't directly test for its content since it's mocked
    });
  });

  it('should handle errors when sending messages', async () => {
    // Mock the chat service to throw an error
    const mockError = new Error('Failed to send message');
    (ChatService.sendMessage as any).mockRejectedValue(mockError);

    render(<Conversation />);

    // Find the input field and submit button
    const inputField = screen.getByPlaceholderText(/type a message/i) || 
                       screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: /send/i });

    // Type a message and submit
    fireEvent.change(inputField, { target: { value: 'Hello, Dottie!' } });
    fireEvent.click(submitButton);

    // Wait for the error message to be displayed
    await waitFor(() => {
      expect(screen.getByText('Sorry, there was an error processing your request. Please try again.')).toBeInTheDocument();
    });
  });

  it('should toggle auto-speak when the button is clicked', () => {
    render(<Conversation />);

    // Find the auto-speak toggle button
    const autoSpeakButton = screen.getByTitle(/auto-speak/i);

    // Initially, auto-speak should be off
    expect(screen.getByTestId('voice-output')).toHaveAttribute('data-autoplay', 'false');

    // Click the button to toggle auto-speak on
    fireEvent.click(autoSpeakButton);

    // Auto-speak should now be on
    expect(screen.getByTestId('voice-output')).toHaveAttribute('data-autoplay', 'true');

    // Click the button again to toggle auto-speak off
    fireEvent.click(autoSpeakButton);

    // Auto-speak should now be off again
    expect(screen.getByTestId('voice-output')).toHaveAttribute('data-autoplay', 'false');
  });
});
