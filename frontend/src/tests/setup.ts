/// <reference types="vitest/globals" />

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Clean up after each test case (e.g., clearing jsdom)
afterEach(() => {
  cleanup();
});

// Mock Firebase Auth
vi.mock('firebase/auth', () => {
  return {
    getAuth: vi.fn(() => ({
      currentUser: null,
      onAuthStateChanged: vi.fn(),
      signInWithPopup: vi.fn(),
      signOut: vi.fn(),
    })),
    GoogleAuthProvider: vi.fn(() => ({})),
    onAuthStateChanged: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
  };
});

// Mock Firebase App
vi.mock('firebase/app', () => {
  return {
    initializeApp: vi.fn(() => ({})),
  };
});
