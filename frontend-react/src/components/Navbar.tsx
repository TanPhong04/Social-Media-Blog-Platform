import { Home as HomeIcon, User, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
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
            <Link 
              to="/login" 
              className="flex items-center gap-2 text-text-secondary hover:text-primary font-medium transition-colors"
            >
              <LogIn className="w-5 h-5" />
              <span>Login</span>
            </Link>
            <Link 
              to="/profile" 
              className="flex items-center justify-center w-10 h-10 rounded-full bg-background border border-gray-800 text-primary hover:bg-gray-800 transition-colors"
            >
              <User className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
