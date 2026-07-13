import { Home as HomeIcon, User, LogIn, Settings as SettingsIcon, UserPlus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <nav className="bg-surface border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Search */}
          <div className="flex items-center gap-4">
            <Link
              to="/"
              onClick={(e) => {
                if (window.location.pathname === '/') {
                  e.preventDefault();
                  window.location.reload();
                }
              }}
              className="flex items-center gap-2 font-bold text-xl text-primary font-heading"
            >
              <HomeIcon className="w-6 h-6" />
              <span className="hidden sm:inline">Axion</span>
            </Link>

            {/* Search Bar */}
            <div className="relative hidden md:flex items-center">
              <Search className="w-4 h-4 absolute left-3 text-text-secondary" />
              <input
                type="text"
                placeholder="Tìm kiếm trên Axion"
                className="bg-background border border-gray-800 rounded-full py-2 pl-10 pr-4 text-sm w-64 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-text-primary placeholder-text-secondary transition-all"
              />
            </div>
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
                <Link 
                  to="/settings"
                  className="flex items-center gap-2 text-text-secondary hover:text-primary font-medium transition-colors ml-2 cursor-pointer"
                >
                  <SettingsIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Cài đặt</span>
                </Link>
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
