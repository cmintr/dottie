import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const AuthStatusCheck = () => {
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAuthStatus = async () => {
    if (!user) {
      setError('You must be signed in to check authentication status');
      return;
    }

    try {
      setIsChecking(true);
      setError(null);
      
      // Get the user's ID token
      const idToken = await user.getIdToken();
      
      // Make an authenticated request to the backend
      const response = await fetch('http://localhost:3000/api/auth/status', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setStatus(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error checking auth status:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="p-4 mt-4 bg-white rounded-lg shadow">
      <h2 className="mb-4 text-lg font-medium">Authentication Status Check</h2>
      
      <button
        onClick={checkAuthStatus}
        disabled={loading || isChecking || !user}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isChecking ? 'Checking...' : 'Check Auth Status'}
      </button>
      
      {error && (
        <div className="p-3 mt-4 text-sm text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}
      
      {status && (
        <div className="p-3 mt-4 overflow-auto text-sm font-mono text-gray-800 bg-gray-100 rounded-md max-h-60">
          <pre>{status}</pre>
        </div>
      )}
      
      {!user && !loading && (
        <div className="p-3 mt-4 text-sm text-yellow-700 bg-yellow-100 rounded-md">
          Please sign in to check authentication status
        </div>
      )}
    </div>
  );
};

export default AuthStatusCheck;
