import { Message } from '../pages/Conversation';
import ChatMessage from './ChatMessage';

interface ConversationHistoryProps {
  messages: Message[];
}

/**
 * Component to display the conversation history
 */
function ConversationHistory({ messages }: ConversationHistoryProps) {
  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6 max-w-md">
          <h2 className="text-2xl font-semibold mb-2">Welcome to Dottie AI Assistant</h2>
          <p className="text-muted-foreground">
            How can I help you today? You can ask me about your calendar, emails, or any other questions you might have.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
    </div>
  );
}

export default ConversationHistory;
