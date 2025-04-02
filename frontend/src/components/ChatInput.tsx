import { useState } from 'react';
import { PaperPlaneIcon } from '@radix-ui/react-icons';
import VoiceInput from './VoiceInput';

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  setValue?: (value: string) => void;
}

/**
 * Component for the chat input field and send button
 */
function ChatInput({ value, onChange, onSubmit, isLoading, setValue }: ChatInputProps) {
  const [isListening, setIsListening] = useState(false);

  const handleTranscript = (transcript: string) => {
    if (setValue) {
      setValue(transcript);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex gap-2 items-center">
      <div className="relative flex-1 flex items-center">
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder="Type your message..."
          className="w-full px-4 py-2 pr-10 rounded-full border focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={isLoading}
        />
        <div className="absolute right-2">
          <VoiceInput 
            onTranscript={handleTranscript}
            isListening={isListening}
            setIsListening={setIsListening}
          />
        </div>
      </div>
      <button
        type="submit"
        className="bg-primary text-primary-foreground rounded-full p-2 w-10 h-10 flex items-center justify-center disabled:opacity-50"
        disabled={isLoading || !value.trim()}
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin" />
        ) : (
          <PaperPlaneIcon className="w-5 h-5" />
        )}
      </button>
    </form>
  );
}

export default ChatInput;
