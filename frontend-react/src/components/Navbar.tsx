import { Home as HomeIcon, User, LogIn, LogOut, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-surface border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Left Links */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary font-heading">
              <HomeIcon className="w-6 h-6" />
              <span>Axion</span>
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <div className="hidden sm:flex items-center gap-2 text-text-secondary mr-2">
                  <span>Xin chào,</span>
                  <span className="font-medium text-text-primary">{user?.displayName}</span>
                </div>


                <Link 
                  to="/profile" 
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-background border border-gray-800 text-primary hover:bg-gray-800 transition-colors"
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-text-secondary hover:text-red-400 font-medium transition-colors ml-2"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="flex items-center gap-2 text-text-secondary hover:text-primary font-medium transition-colors"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Đăng nhập</span>
                </Link>
                <Link 
                  to="/register" 
                  className="flex items-center gap-2 bg-primary text-white hover:bg-primary-hover px-4 py-2 rounded-md font-medium transition-colors"
                >
                  <UserPlus className="w-5 h-5" />
                  <span className="hidden sm:inline">Đăng ký</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
