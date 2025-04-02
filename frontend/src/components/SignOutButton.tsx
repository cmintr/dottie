import { useAuth } from '../context/AuthContext';

interface SignOutButtonProps {
  className?: string;
}

const SignOutButton = ({ className = '' }: SignOutButtonProps) => {
  const { signOut, loading } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className={`px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 mr-2 border-2 border-gray-500 border-t-transparent rounded-full animate-spin inline-block"></span>
          Signing out...
        </>
      ) : (
        'Sign out'
      )}
    </button>
  );
};

export default SignOutButton;
