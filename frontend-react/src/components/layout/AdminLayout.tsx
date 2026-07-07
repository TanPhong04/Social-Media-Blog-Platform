import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  Shield,
  LogOut,
  ArrowLeft,
  ChevronRight,
  Activity,
} from 'lucide-react';
import clsx from 'clsx';

const adminNavItems = [
  { name: 'Tổng quan', path: '/admin', icon: LayoutDashboard, end: true },
  { name: 'Quản lý người dùng', path: '/admin/users', icon: Users },
  { name: 'Quản lý bài viết', path: '/admin/articles', icon: FileText },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background text-text-primary font-sans flex">
      {/* Sidebar */}
      <aside className="w-72 min-h-screen bg-surface/50 backdrop-blur-xl border-r border-white/5 flex flex-col fixed left-0 top-0 bottom-0 z-40">
        {/* Admin Header */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg text-text-primary">Axion Admin</h1>
              <p className="text-xs text-text-secondary">Bảng điều khiển</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden',
                    isActive
                      ? 'bg-primary/15 text-primary font-medium shadow-sm'
                      : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                    )}
                    <Icon
                      className={clsx(
                        'w-5 h-5 transition-all duration-300',
                        isActive ? 'scale-110' : 'group-hover:scale-110'
                      )}
                    />
                    <span className="flex-1">{item.name}</span>
                    <ChevronRight
                      className={clsx(
                        'w-4 h-4 transition-all duration-300',
                        isActive
                          ? 'opacity-100 translate-x-0'
                          : 'opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0'
                      )}
                    />
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:bg-white/5 hover:text-text-primary transition-all duration-300 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
            <span>Về trang chính</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 w-full group"
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            <span>Đăng xuất</span>
          </button>
        </div>

        {/* User info */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
              {user?.displayName?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{user?.displayName}</p>
              <p className="text-xs text-text-secondary truncate">{user?.email}</p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/15 text-primary">
              <Activity className="w-3 h-3" />
              <span className="text-xs font-semibold">Admin</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-72">
        {/* Top bar */}
        <header className="h-16 bg-surface/30 backdrop-blur-md border-b border-white/5 sticky top-0 z-30 flex items-center px-8">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Shield className="w-4 h-4 text-primary" />
            <span>Admin Panel</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
