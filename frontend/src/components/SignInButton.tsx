import { useAuth } from '../context/AuthContext';

interface SignInButtonProps {
  className?: string;
}

const SignInButton = ({ className = '' }: SignInButtonProps) => {
  const { signIn, loading } = useAuth();

  const handleSignIn = async () => {
    console.log("SignInButton: handleSignIn clicked");
    try {
      await signIn();
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  return (
    <button
      onClick={handleSignIn}
      disabled={loading}
      className={`dottie-auth-button ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '8px 16px',
        backgroundColor: '#fff',
        color: '#333',
        border: '1px solid #ccc',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 500
      }}
    >
      {loading ? (
        <>
          <div className="dottie-loading-dots" style={{ display: 'flex', gap: '4px' }}>
            <div className="dottie-loading-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4285F4', animation: 'pulse 1.5s infinite' }}></div>
            <div className="dottie-loading-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4285F4', animation: 'pulse 1.5s infinite 0.2s' }}></div>
            <div className="dottie-loading-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4285F4', animation: 'pulse 1.5s infinite 0.4s' }}></div>
          </div>
          <span>Signing in...</span>
        </>
      ) : (
        <>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" style={{ width: '18px', height: '18px' }} />
          <span>Sign in with Google</span>
        </>
      )}
    </button>
  );
};

export default SignInButton;
