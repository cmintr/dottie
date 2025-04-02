import { useAuth } from '../context/AuthContext';
import SignInButton from './SignInButton';
import SignOutButton from './SignOutButton';

const Header = () => {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between w-full px-4 py-3 bg-white border-b shadow-sm">
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-gray-900">Dottie AI Assistant</h1>
      </div>

      <div className="flex items-center gap-4">
        {loading ? (
          <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
        ) : user ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="flex items-center justify-center w-8 h-8 text-white bg-blue-600 rounded-full">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <span className="text-sm font-medium text-gray-700">
                {user.displayName || user.email || 'User'}
              </span>
            </div>
            <SignOutButton />
          </div>
        ) : (
          <SignInButton />
        )}
      </div>
    </header>
  );
};

export default Header;
