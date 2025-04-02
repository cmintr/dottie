import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VoiceInput from '../components/VoiceInput';
import VoiceOutput from '../components/VoiceOutput';

// Mock the Web Speech API
const mockSpeechRecognition = {
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  continuous: false,
  interimResults: true,
  lang: 'en-US',
};

const mockSpeechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  speaking: false,
  paused: false,
  pending: false,
  getVoices: vi.fn().mockReturnValue([
    {
      name: 'English Voice',
      lang: 'en-US',
      default: true,
    },
    {
      name: 'Spanish Voice',
      lang: 'es-ES',
      default: false,
    },
  ]),
};

const mockSpeechSynthesisUtterance = vi.fn().mockImplementation((text) => ({
  text,
  voice: null,
  rate: 1,
  pitch: 1,
  volume: 1,
  lang: 'en-US',
  onend: null,
  onerror: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));

// Mock the global objects
Object.defineProperty(global, 'SpeechRecognition', {
  value: vi.fn().mockImplementation(() => mockSpeechRecognition),
  writable: true,
});

Object.defineProperty(global, 'webkitSpeechRecognition', {
  value: vi.fn().mockImplementation(() => mockSpeechRecognition),
  writable: true,
});

Object.defineProperty(global, 'speechSynthesis', {
  value: mockSpeechSynthesis,
  writable: true,
});

Object.defineProperty(global, 'SpeechSynthesisUtterance', {
  value: mockSpeechSynthesisUtterance,
  writable: true,
});

describe('Voice Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('VoiceInput Component', () => {
    it('should render the voice input button', () => {
      render(<VoiceInput onResult={vi.fn()} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByTitle(/voice input/i)).toBeInTheDocument();
    });

    it('should start speech recognition when button is clicked', async () => {
      render(<VoiceInput onResult={vi.fn()} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockSpeechRecognition.start).toHaveBeenCalled();
    });

    it('should stop speech recognition when button is clicked again', async () => {
      render(<VoiceInput onResult={vi.fn()} />);
      
      const button = screen.getByRole('button');
      
      // First click to start
      fireEvent.click(button);
      
      // Simulate recognition starting
      const startEventListener = mockSpeechRecognition.addEventListener.mock.calls.find(
        call => call[0] === 'start'
      )[1];
      startEventListener();
      
      // Second click to stop
      fireEvent.click(button);
      
      expect(mockSpeechRecognition.stop).toHaveBeenCalled();
    });

    it('should call onResult with the recognized text', async () => {
      const onResultMock = vi.fn();
      render(<VoiceInput onResult={onResultMock} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Simulate a result event
      const resultEventListener = mockSpeechRecognition.addEventListener.mock.calls.find(
        call => call[0] === 'result'
      )[1];
      
      const mockResultEvent = {
        results: [
          [
            {
              transcript: 'Hello Dottie',
              confidence: 0.9,
              isFinal: true,
            },
          ],
        ],
        resultIndex: 0,
      };
      
      resultEventListener(mockResultEvent);
      
      expect(onResultMock).toHaveBeenCalledWith('Hello Dottie');
    });

    it('should handle errors during speech recognition', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<VoiceInput onResult={vi.fn()} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Simulate an error event
      const errorEventListener = mockSpeechRecognition.addEventListener.mock.calls.find(
        call => call[0] === 'error'
      )[1];
      
      const mockErrorEvent = {
        error: 'not-allowed',
        message: 'Permission denied',
      };
      
      errorEventListener(mockErrorEvent);
      
      expect(consoleSpy).toHaveBeenCalledWith('Speech recognition error:', expect.any(Object));
      
      consoleSpy.mockRestore();
    });
  });

  describe('VoiceOutput Component', () => {
    it('should render the voice output button', () => {
      render(<VoiceOutput text="Hello world" autoPlay={false} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByTitle(/speak/i)).toBeInTheDocument();
    });

    it('should speak the text when button is clicked', async () => {
      render(<VoiceOutput text="Hello world" autoPlay={false} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      expect(mockSpeechSynthesisUtterance).toHaveBeenCalledWith('Hello world');
    });

    it('should automatically speak the text when autoPlay is true', async () => {
      render(<VoiceOutput text="Hello world" autoPlay={true} />);
      
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      expect(mockSpeechSynthesisUtterance).toHaveBeenCalledWith('Hello world');
    });

    it('should cancel current speech when new text is provided', async () => {
      const { rerender } = render(<VoiceOutput text="Hello world" autoPlay={true} />);
      
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      
      // Simulate speech synthesis speaking
      mockSpeechSynthesis.speaking = true;
      
      // Rerender with new text
      rerender(<VoiceOutput text="Goodbye world" autoPlay={true} />);
      
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(2);
    });

    it('should handle errors during speech synthesis', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<VoiceOutput text="Hello world" autoPlay={true} />);
      
      // Get the utterance instance
      const utterance = mockSpeechSynthesisUtterance.mock.results[0].value;
      
      // Simulate an error event
      const errorCallback = utterance.addEventListener.mock.calls.find(
        call => call[0] === 'error'
      )[1];
      
      errorCallback({ error: 'synthesis-failed' });
      
      expect(consoleSpy).toHaveBeenCalledWith('Speech synthesis error:', expect.any(Object));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Browser Compatibility', () => {
    it('should use webkitSpeechRecognition if SpeechRecognition is not available', () => {
      // Temporarily remove SpeechRecognition
      const originalSpeechRecognition = global.SpeechRecognition;
      Object.defineProperty(global, 'SpeechRecognition', {
        value: undefined,
        writable: true,
      });
      
      render(<VoiceInput onResult={vi.fn()} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(global.webkitSpeechRecognition).toHaveBeenCalled();
      
      // Restore SpeechRecognition
      Object.defineProperty(global, 'SpeechRecognition', {
        value: originalSpeechRecognition,
        writable: true,
      });
    });

    it('should display a message if speech recognition is not supported', () => {
      // Temporarily remove both SpeechRecognition implementations
      const originalSpeechRecognition = global.SpeechRecognition;
      const originalWebkitSpeechRecognition = global.webkitSpeechRecognition;
      
      Object.defineProperty(global, 'SpeechRecognition', {
        value: undefined,
        writable: true,
      });
      
      Object.defineProperty(global, 'webkitSpeechRecognition', {
        value: undefined,
        writable: true,
      });
      
      render(<VoiceInput onResult={vi.fn()} />);
      
      expect(screen.getByText(/speech recognition not supported/i)).toBeInTheDocument();
      
      // Restore the original implementations
      Object.defineProperty(global, 'SpeechRecognition', {
        value: originalSpeechRecognition,
        writable: true,
      });
      
      Object.defineProperty(global, 'webkitSpeechRecognition', {
        value: originalWebkitSpeechRecognition,
        writable: true,
      });
    });

    it('should display a message if speech synthesis is not supported', () => {
      // Temporarily remove speechSynthesis
      const originalSpeechSynthesis = global.speechSynthesis;
      
      Object.defineProperty(global, 'speechSynthesis', {
        value: undefined,
        writable: true,
      });
      
      render(<VoiceOutput text="Hello world" autoPlay={false} />);
      
      expect(screen.getByText(/text-to-speech not supported/i)).toBeInTheDocument();
      
      // Restore speechSynthesis
      Object.defineProperty(global, 'speechSynthesis', {
        value: originalSpeechSynthesis,
        writable: true,
      });
    });
  });
});
