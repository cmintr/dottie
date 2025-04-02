import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import SignInButton from '../components/SignInButton';
import SignOutButton from '../components/SignOutButton';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

// Mock Firebase auth
vi.mock('firebase/auth', () => {
  return {
    getAuth: vi.fn(() => ({
      currentUser: null,
      onAuthStateChanged: vi.fn(),
    })),
    GoogleAuthProvider: vi.fn(() => ({})),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn(),
  };
});

// Mock Firebase app
vi.mock('../lib/firebase', () => {
  return {
    auth: {
      currentUser: null,
      onAuthStateChanged: vi.fn((auth, callback) => {
        callback(null);
        return vi.fn();
      }),
    },
  };
});

// Test component that uses the auth context
const TestComponent = () => {
  const { user, loading } = useAuth();
  return (
    <div>
      {loading ? (
        <div data-testid="loading">Loading...</div>
      ) : user ? (
        <div data-testid="user-info">
          <div data-testid="user-email">{user.email}</div>
          <div data-testid="user-name">{user.displayName}</div>
        </div>
      ) : (
        <div data-testid="no-user">Not signed in</div>
      )}
    </div>
  );
};

describe('Authentication Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should show loading state initially', () => {
    const { auth } = require('../lib/firebase');
    auth.onAuthStateChanged.mockImplementation((auth, callback) => {
      // Don't call the callback immediately to simulate loading
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('should show user info when user is signed in', async () => {
    const { auth } = require('../lib/firebase');
    const mockUser = {
      uid: '123',
      email: 'test@example.com',
      displayName: 'Test User',
      getIdToken: vi.fn().mockResolvedValue('mock-token'),
    };

    auth.onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser);
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toBeInTheDocument();
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    });
  });

  it('should show not signed in when user is not signed in', async () => {
    const { auth } = require('../lib/firebase');
    auth.onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null);
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('no-user')).toBeInTheDocument();
    });
  });

  it('should call signInWithPopup when SignInButton is clicked', async () => {
    signInWithPopup.mockResolvedValue({
      user: {
        uid: '123',
        email: 'test@example.com',
        displayName: 'Test User',
      },
    });

    render(
      <AuthProvider>
        <SignInButton />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(signInWithPopup).toHaveBeenCalled();
      expect(GoogleAuthProvider).toHaveBeenCalled();
    });
  });

  it('should call signOut when SignOutButton is clicked', async () => {
    signOut.mockResolvedValue(undefined);

    const { auth } = require('../lib/firebase');
    const mockUser = {
      uid: '123',
      email: 'test@example.com',
      displayName: 'Test User',
      getIdToken: vi.fn().mockResolvedValue('mock-token'),
    };

    auth.onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser);
      return vi.fn();
    });

    render(
      <AuthProvider>
        <SignOutButton />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });
  });

  it('should handle sign in error', async () => {
    const mockError = new Error('Failed to sign in');
    signInWithPopup.mockRejectedValue(mockError);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AuthProvider>
        <SignInButton />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(signInWithPopup).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Error signing in:', mockError);
    });

    consoleSpy.mockRestore();
  });

  it('should handle sign out error', async () => {
    const mockError = new Error('Failed to sign out');
    signOut.mockRejectedValue(mockError);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { auth } = require('../lib/firebase');
    const mockUser = {
      uid: '123',
      email: 'test@example.com',
      displayName: 'Test User',
      getIdToken: vi.fn().mockResolvedValue('mock-token'),
    };

    auth.onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser);
      return vi.fn();
    });

    render(
      <AuthProvider>
        <SignOutButton />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Error signing out:', mockError);
    });

    consoleSpy.mockRestore();
  });
});
