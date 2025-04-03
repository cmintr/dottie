// Mock adapter for frontend services
// This file integrates the mock API with the existing service structure

import * as mockApi from './mockApi';

// Check if mock mode is enabled via environment variable
const useMockApi = import.meta.env.VITE_MOCK_API === 'true';

console.log('Mock API mode:', useMockApi ? 'ENABLED' : 'DISABLED');

// Function to wrap a service with mock implementation
export const withMock = (realImplementation, mockImplementation) => {
  return (...args) => {
    if (useMockApi) {
      console.log('Using mock implementation');
      return mockImplementation(...args);
    }
    console.log('Using real implementation');
    return realImplementation(...args);
  };
};

// Export mock-aware service functions
export const mockServices = {
  chat: {
    sendMessage: withMock(
      // Real implementation would go here
      async (message) => {
        // This would normally call the real API
        console.log('Would call real API with:', message);
        throw new Error('Real API not configured');
      },
      // Mock implementation
      mockApi.sendMessage
    )
  },
  auth: {
    signIn: withMock(
      // Real implementation would go here
      async () => {
        console.log('Would call real auth service');
        throw new Error('Real auth not configured');
      },
      // Mock implementation
      mockApi.signIn
    ),
    signOut: withMock(
      // Real implementation would go here
      async () => {
        console.log('Would call real sign out');
        throw new Error('Real auth not configured');
      },
      // Mock implementation
      mockApi.signOut
    ),
    getCurrentUser: withMock(
      // Real implementation would go here
      () => {
        console.log('Would get real current user');
        return null;
      },
      // Mock implementation
      mockApi.getCurrentUser
    )
  },
  voice: {
    transcribeAudio: withMock(
      // Real implementation would go here
      async (audioBlob) => {
        console.log('Would transcribe real audio');
        throw new Error('Real transcription not configured');
      },
      // Mock implementation
      mockApi.transcribeAudio
    )
  }
};
