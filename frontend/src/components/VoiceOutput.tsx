import { useState, useEffect, useRef } from 'react';

interface VoiceOutputProps {
  text: string;
  autoPlay?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
}

const VoiceOutput = ({ text, autoPlay = false, onStart, onEnd }: VoiceOutputProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize speech synthesis
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setError('Speech synthesis is not supported in this browser.');
      return;
    }

    // Get available voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        
        // Try to find and select an English female voice
        const preferredVoice = availableVoices.find(
          voice => voice.lang.includes('en') && voice.name.includes('Female')
        ) || availableVoices[0];
        
        setSelectedVoice(preferredVoice);
      }
    };

    loadVoices();

    // Chrome loads voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Handle text changes
  useEffect(() => {
    if (autoPlay && text && selectedVoice && !isPlaying) {
      speak();
    }
  }, [text, selectedVoice, autoPlay]);

  const speak = () => {
    if (!text || !selectedVoice) return;
    
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    utteranceRef.current = new SpeechSynthesisUtterance(text);
    utteranceRef.current.voice = selectedVoice;
    utteranceRef.current.rate = 1.0;
    utteranceRef.current.pitch = 1.0;
    
    utteranceRef.current.onstart = () => {
      setIsPlaying(true);
      if (onStart) onStart();
    };
    
    utteranceRef.current.onend = () => {
      setIsPlaying(false);
      if (onEnd) onEnd();
    };
    
    utteranceRef.current.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setError('Error during speech synthesis.');
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utteranceRef.current);
  };

  const stop = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const voice = voices.find(v => v.name === e.target.value) || null;
    setSelectedVoice(voice);
  };

  return (
    <div className="flex items-center space-x-2">
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
      
      <button
        onClick={isPlaying ? stop : speak}
        disabled={!text || !selectedVoice}
        className={`p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isPlaying 
            ? 'bg-red-500 text-white focus:ring-red-500' 
            : 'bg-blue-500 text-white focus:ring-blue-500'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isPlaying ? 'Stop speaking' : 'Speak text'}
      >
        {isPlaying ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.728-2.728" />
          </svg>
        )}
      </button>
      
      {voices.length > 0 && (
        <select
          value={selectedVoice?.name || ''}
          onChange={handleVoiceChange}
          className="text-sm border border-gray-300 rounded-md p-1"
        >
          {voices.map(voice => (
            <option key={voice.name} value={voice.name}>
              {voice.name} ({voice.lang})
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default VoiceOutput;
