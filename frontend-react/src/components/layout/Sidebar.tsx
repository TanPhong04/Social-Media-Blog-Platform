import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, User, Users, FileText, Bell, Bookmark, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationApi } from '../../api/notificationApi';
import clsx from 'clsx';

const Sidebar = () => {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    try {
      const res: any = await notificationApi.getUnreadCount();
      const countObj = res.data || res;
      setUnreadCount(countObj.count || 0);
    } catch (e) {
      console.warn('Error fetching unread count', e);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    const handleNewNotif = () => {
      setUnreadCount(prev => prev + 1);
    };

    const handleReadNotif = () => {
      fetchUnreadCount();
    };

    window.addEventListener('new-notification-received', handleNewNotif);
    window.addEventListener('notification-marked-read', handleReadNotif);
    window.addEventListener('unread-count-changed', handleReadNotif);

    return () => {
      window.removeEventListener('new-notification-received', handleNewNotif);
      window.removeEventListener('notification-marked-read', handleReadNotif);
      window.removeEventListener('unread-count-changed', handleReadNotif);
    };
  }, [isAuthenticated]);

  const navItems = [
    { name: 'Bảng tin', path: '/', icon: Home },
    { name: 'Hồ sơ', path: '/profile', icon: User, requiresAuth: true },
    { name: 'Theo dõi', path: '/following', icon: Users, requiresAuth: true },
    { name: 'Bài viết của tôi', path: '/my-articles', icon: FileText, requiresAuth: true },
    { name: 'Đã lưu', path: '/bookmarks', icon: Bookmark, requiresAuth: true },
    { name: 'Thông báo', path: '/notifications', icon: Bell, requiresAuth: true },
    { name: 'Cài đặt', path: '/settings', icon: Settings, requiresAuth: true },
  ];

  return (
    <aside className="hidden lg:block w-64 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto py-6 px-4 bg-background border-r border-white/5">
      <nav className="space-y-2">
        {navItems.map((item) => {
          if (item.requiresAuth && !isAuthenticated) return null;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-4 px-4 py-3 rounded-app transition-all duration-300 group',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={clsx(
                       'w-5 h-5 transition-transform duration-300',
                       isActive ? 'scale-110' : 'group-hover:scale-110'
                    )}
                  />
                  <span>{item.name}</span>
                  {item.path === '/notifications' && unreadCount > 0 && (
                    <span className="ml-auto bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {isAuthenticated && (
        <div className="mt-8 pt-6 border-t border-white/5 px-2">
          <NavLink
            to="/?focus=true"
            className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-white py-3 px-4 rounded-app transition-colors shadow-lg hover:shadow-primary/25 font-medium"
          >
            <FileText className="w-5 h-5" />
            Viết bài mới
          </NavLink>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
