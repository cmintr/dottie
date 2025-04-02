import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const GoogleAccountLink = () => {
  const { user } = useAuth();
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkStatus, setLinkStatus] = useState<'not_linked' | 'linking' | 'linked'>('not_linked');

  const linkGoogleAccount = async () => {
    if (!user) {
      setError('You must be signed in to link your Google account');
      return;
    }

    try {
      setIsLinking(true);
      setError(null);
      setLinkStatus('linking');
      
      // Get the user's ID token
      const idToken = await user.getIdToken();
      
      // Make an authenticated request to the backend to start the linking process
      const response = await fetch('http://localhost:3000/api/auth/google', {
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
      
      // If the backend returns an authUrl, redirect the user to it
      if (data.authUrl) {
        // In a real implementation, we would redirect to the authUrl
        // window.location.href = data.authUrl;
        console.log('Redirecting to:', data.authUrl);
        
        // For demonstration purposes, we'll just set the status to linked
        setLinkStatus('linked');
      } else {
        throw new Error('No authorization URL returned from the server');
      }
    } catch (error) {
      console.error('Error linking Google account:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setLinkStatus('not_linked');
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="p-4 mt-4 bg-white rounded-lg shadow">
      <h2 className="mb-4 text-lg font-medium">Google Workspace Integration</h2>
      
      {linkStatus === 'linked' ? (
        <div className="p-3 text-sm text-green-700 bg-green-100 rounded-md">
          Your Google Workspace account is linked. You can now use Google services.
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-600">
            Link your Google Workspace account to access Gmail, Calendar, and Sheets.
          </p>
          
          <button
            onClick={linkGoogleAccount}
            disabled={!user || isLinking}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLinking ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                  />
                </svg>
                Link Google Workspace
              </>
            )}
          </button>
          
          {error && (
            <div className="p-3 mt-4 text-sm text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GoogleAccountLink;
