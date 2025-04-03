import { useAuth } from '../context/AuthContext';

interface SignInButtonProps {
  className?: string;
}

const SignInButton = ({ className = '' }: SignInButtonProps) => {
  const { signIn, loading } = useAuth();

  const handleSignIn = async () => {
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
    >
      {loading ? (
        <>
          <div className="dottie-loading-dots">
            <div className="dottie-loading-dot"></div>
            <div className="dottie-loading-dot"></div>
            <div className="dottie-loading-dot"></div>
          </div>
          <span>Signing in...</span>
        </>
      ) : (
        <>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" />
          <span>Sign in with Google</span>
        </>
      )}
    </button>
  );
};

export default SignInButton;
