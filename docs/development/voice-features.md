# Voice Input and Output Features

This document outlines the implementation of voice input and output features in the Dottie AI Assistant application.

## Overview

The Dottie AI Assistant includes voice interaction capabilities, allowing users to:

1. Input messages using speech recognition
2. Listen to assistant responses through text-to-speech
3. Toggle automatic speech output for hands-free operation

These features enhance accessibility and provide a more natural interaction experience.

## Implementation Details

### Voice Input

Voice input is implemented using the Web Speech API's SpeechRecognition interface:

- **VoiceInput Component** (`src/components/VoiceInput.tsx`): Manages speech recognition
- **Integration with ChatInput** (`src/components/ChatInput.tsx`): Combines text and voice input

#### Key Features:

- Real-time speech-to-text conversion
- Continuous listening mode
- Visual feedback during recording
- Error handling for unsupported browsers

#### Usage Example:

```tsx
const [isListening, setIsListening] = useState(false);
const [transcript, setTranscript] = useState('');

<VoiceInput
  onTranscript={setTranscript}
  isListening={isListening}
  setIsListening={setIsListening}
/>
```

### Voice Output

Voice output is implemented using the Web Speech API's SpeechSynthesis interface:

- **VoiceOutput Component** (`src/components/VoiceOutput.tsx`): Manages text-to-speech
- **Integration with Conversation** (`src/pages/Conversation.tsx`): Speaks assistant responses

#### Key Features:

- Text-to-speech conversion
- Voice selection from available system voices
- Auto-play option for automatic response reading
- Play/pause controls
- Visual feedback during playback

#### Usage Example:

```tsx
const [autoPlay, setAutoPlay] = useState(false);

<VoiceOutput
  text="Hello, I am Dottie, your AI assistant."
  autoPlay={autoPlay}
  onStart={() => console.log('Started speaking')}
  onEnd={() => console.log('Finished speaking')}
/>
```

## Technical Implementation

### Speech Recognition

The speech recognition implementation uses the SpeechRecognition API with the following configuration:

- **Continuous Mode**: Allows for uninterrupted listening
- **Interim Results**: Provides real-time feedback as the user speaks
- **Language**: Default is 'en-US' but can be configured
- **Error Handling**: Gracefully handles recognition errors and browser compatibility

### Speech Synthesis

The speech synthesis implementation uses the SpeechSynthesis API with the following features:

- **Voice Selection**: Automatically selects an appropriate voice or allows user selection
- **Playback Control**: Start, stop, and rate adjustment
- **Event Handling**: Provides callbacks for speech start and end events

## Browser Compatibility

These features rely on the Web Speech API, which has varying levels of support across browsers:

- **Chrome**: Full support for both speech recognition and synthesis
- **Edge**: Full support for both speech recognition and synthesis
- **Firefox**: Support for speech synthesis only; limited speech recognition support
- **Safari**: Support for speech synthesis; speech recognition requires user permission
- **Mobile Browsers**: Varying levels of support; generally better on Chrome for Android

The implementation includes fallbacks and error messages for unsupported browsers.

## User Experience Considerations

1. **Visual Feedback**: Clear indicators when voice input is active
2. **Error Messages**: Informative messages when speech features are unavailable
3. **Accessibility**: Voice features enhance accessibility for users with different needs
4. **Performance**: Efficient handling of speech recognition to avoid UI blocking
5. **Privacy**: Clear indication when the microphone is active

## Future Improvements

1. **Offline Support**: Implement offline speech recognition using models like TensorFlow.js
2. **Voice Commands**: Add specific voice commands for application control
3. **Voice Profiles**: Allow users to save preferred voices and speech settings
4. **Multi-language Support**: Expand beyond English to support multiple languages
5. **Improved Voice Quality**: Integrate with advanced TTS services for better voice quality
6. **Noise Filtering**: Improve recognition accuracy in noisy environments

## Testing

Testing voice features requires both automated and manual approaches:

1. **Unit Tests**: Test component rendering and state management
2. **Mock Testing**: Use mocked speech APIs for automated testing
3. **Manual Testing**: Test actual speech recognition and synthesis across browsers
4. **Accessibility Testing**: Ensure voice features work well with screen readers and other assistive technologies

## Integration with Backend

Voice features primarily operate on the frontend, but the transcribed text is sent to the backend like any other text input. The backend doesn't need special handling for voice-originated requests.
