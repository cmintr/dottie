import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SignInButton from '../../components/SignInButton';
import { AuthContext } from '../../context/AuthContext';

// Mock the useAuth hook context
const mockSignIn = vi.fn();
const mockAuthContextValue = {
  user: null,
  loading: false,
  error: null,
  signIn: mockSignIn,
  signOut: vi.fn(),
};

describe('SignInButton Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockSignIn.mockReset();
  });

  it('renders correctly', () => {
    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <SignInButton />
      </AuthContext.Provider>
    );
    
    expect(screen.getByText(/Sign in with Google/i)).toBeInTheDocument();
  });

  it('calls signIn when clicked', async () => {
    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <SignInButton />
      </AuthContext.Provider>
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockSignIn).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when loading', () => {
    const loadingAuthContextValue = {
      ...mockAuthContextValue,
      loading: true,
    };
    
    render(
      <AuthContext.Provider value={loadingAuthContextValue}>
        <SignInButton />
      </AuthContext.Provider>
    );
    
    expect(screen.getByText(/Signing in/i)).toBeInTheDocument();
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
