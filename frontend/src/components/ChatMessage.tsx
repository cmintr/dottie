import { Message } from '../pages/Conversation';
import { cn } from '../lib/utils';
import FunctionCallDisplay from './FunctionCallDisplay';

interface ChatMessageProps {
  message: Message;
}

/**
 * Component to display a single chat message
 */
function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  return (
    <div
      className={cn(
        'flex flex-col gap-2 mb-4',
        isUser ? 'items-end' : 'items-start'
      )}
    >
      <div className={cn(
        'flex items-start gap-2',
        isUser ? 'justify-end' : 'justify-start'
      )}>
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
            D
          </div>
        )}
        
        <div
          className={cn(
            'rounded-lg p-3 max-w-[80%]',
            isUser 
              ? 'bg-primary text-primary-foreground rounded-tr-none' 
              : 'bg-muted text-foreground rounded-tl-none'
          )}
        >
          {message.content}
        </div>
        
        {isUser && (
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
            U
          </div>
        )}
      </div>
      
      {/* Display function call results if available */}
      {!isUser && message.functionCalls && message.functionCalls.length > 0 && (
        <div className={cn(
          'max-w-[90%]',
          isUser ? 'self-end' : 'self-start ml-10'
        )}>
          {message.functionCalls.map((functionCall, index) => (
            <FunctionCallDisplay 
              key={`${message.id}-function-${index}`} 
              functionCall={functionCall} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ChatMessage;
