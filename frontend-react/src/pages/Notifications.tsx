import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../api/userApi';
import { notificationApi } from '../api/notificationApi';
import { Bell, Heart, MessageCircle, UserPlus, CheckCircle2, Repeat, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Notifications: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actorProfiles, setActorProfiles] = useState<{ [id: string]: any }>({});

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data: any = await notificationApi.getNotifications(0, 50);
      const list = data.content || [];
      
      // Nạp thông tin thật (Tên & Avatar) của tất cả actors song song
      const actorIds = Array.from(new Set(list.map((n: any) => n.actorId))) as string[];
      const profileMap: { [id: string]: any } = {};
      
      await Promise.all(actorIds.map(async (id) => {
        try {
          const uProfile = await userApi.getUserById(id);
          profileMap[id] = uProfile;
        } catch (err) {
          profileMap[id] = {
            displayName: `Người dùng ${id.substring(0, 4)}`,
            avatarUrl: null
          };
        }
      }));

      setActorProfiles(profileMap);
      setNotifications(list);
    } catch (err) {
      console.error('Error fetching notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleNewNotif = () => {
      fetchNotifications();
    };
    window.addEventListener('new-notification-received', handleNewNotif);
    return () => {
      window.removeEventListener('new-notification-received', handleNewNotif);
    };
  }, [isAuthenticated]);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      // Phát sự kiện cập nhật lại Badge ở Sidebar
      window.dispatchEvent(new CustomEvent('unread-count-changed'));
    } catch (err) {
      console.error('Error marking all as read', err);
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      try {
        await notificationApi.markAsRead(notification.id);
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
        // Phát sự kiện cập nhật lại Badge ở Sidebar
        window.dispatchEvent(new CustomEvent('unread-count-changed'));
      } catch (err) {
        console.error('Error marking read', err);
      }
    }

    // Điều hướng thông minh dựa trên Event Type
    if (notification.type === 'NEW_FOLLOWER') {
      navigate(`/profile?userId=${notification.actorId}`);
    } else if (notification.type === 'NEW_MESSAGE') {
      navigate(`/messages?contactId=${notification.actorId}`);
    } else if (
      notification.type === 'NEW_LIKE' ||
      notification.type === 'NEW_COMMENT' ||
      notification.type === 'NEW_REPLY' ||
      notification.type === 'NEW_ARTICLE'
    ) {
      // Tìm articleId từ payload lưu trong metadata
      let articleId = notification.entityId;
      try {
        const meta = JSON.parse(notification.metadata);
        if (meta.articleId) {
          articleId = meta.articleId;
        } else if (meta.targetId && notification.entityType === 'ARTICLE') {
          articleId = meta.targetId;
        }
      } catch (e) {
        console.warn('Error parsing notification metadata', e);
      }
      
      if (articleId) {
        navigate(`/?articleId=${articleId}`);
      } else {
        navigate('/');
      }
    }
  };

  const renderIcon = (notification: any) => {
    let isRepost = false;
    try {
      const meta = JSON.parse(notification.metadata);
      if (meta.content && meta.content.includes('[repost]')) {
        isRepost = true;
      }
    } catch (e) {}

    switch (notification.type) {
      case 'NEW_LIKE':
        return <div className="p-2 bg-red-500/10 text-red-500 rounded-full"><Heart className="w-4 h-4 fill-current" /></div>;
      case 'NEW_COMMENT':
      case 'NEW_REPLY':
        if (isRepost) {
          return <div className="p-2 bg-green-500/10 text-green-500 rounded-full"><Repeat className="w-4 h-4" /></div>;
        }
        return <div className="p-2 bg-blue-500/10 text-blue-500 rounded-full"><MessageCircle className="w-4 h-4" /></div>;
      case 'NEW_FOLLOWER':
        return <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-full"><UserPlus className="w-4 h-4" /></div>;
      case 'NEW_MESSAGE':
        return <div className="p-2 bg-green-500/10 text-green-500 rounded-full"><MessageSquare className="w-4 h-4" /></div>;
      default:
        return <div className="p-2 bg-primary/10 text-primary rounded-full"><Bell className="w-4 h-4" /></div>;
    }
  };

  const renderMessage = (notification: any) => {
    const profile = actorProfiles[notification.actorId];
    const actorName = profile ? profile.displayName : `Người dùng ${notification.actorId.substring(0, 4)}`;
    const actor = <span className="font-semibold text-text-primary">{actorName}</span>;
    
    let isRepost = false;
    try {
      const meta = JSON.parse(notification.metadata);
      if (meta.content && meta.content.includes('[repost]')) {
        isRepost = true;
      }
    } catch (e) {}

    switch (notification.type) {
      case 'NEW_LIKE': 
        return <>{actor} đã thích bài viết của bạn</>;
      case 'NEW_COMMENT': 
        if (isRepost) {
          return <>{actor} đã đăng lại bài viết của bạn</>;
        }
        return <>{actor} đã bình luận về bài viết của bạn</>;
      case 'NEW_REPLY': 
        return <>{actor} đã phản hồi bình luận của bạn</>;
      case 'NEW_FOLLOWER': 
        return <>{actor} đã bắt đầu theo dõi bạn</>;
      case 'NEW_ARTICLE': 
        return <>{actor} vừa đăng một bài viết mới</>;
      case 'NEW_MESSAGE':
        return <>{actor} đã gửi cho bạn một tin nhắn</>;
      default: 
        return <>{actor} đã tương tác với bạn</>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto border-x border-gray-800 min-h-screen bg-background p-8 text-center flex flex-col items-center justify-center">
        <Bell className="w-12 h-12 text-primary mb-4" />
        <h3 className="text-xl font-bold text-text-primary mb-2">Yêu cầu đăng nhập</h3>
        <p className="text-text-secondary text-sm">Vui lòng đăng nhập để xem thông báo của bạn.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto border-x border-gray-800 min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 sticky top-16 bg-background/80 backdrop-blur-md z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-surface text-primary rounded-app border border-white/10 shadow-md">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-bold text-text-primary">
              Thông báo
            </h1>
            <p className="text-text-secondary text-xs mt-0.5">
              Cập nhật tương tác mới nhất
            </p>
          </div>
        </div>

        {notifications.some(n => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-primary/20 hover:border-primary bg-primary/5 hover:bg-primary/10 text-primary text-xs font-semibold rounded-full transition-all cursor-pointer shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đánh dấu đã đọc</span>
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="divide-y divide-gray-800">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-4 flex gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-white/5 shrink-0" />
              <div className="flex-1 space-y-3 mt-2">
                <div className="w-full h-4 bg-white/5 rounded" />
                <div className="w-1/3 h-3 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <Bell className="w-6 h-6 text-text-secondary" />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-1">Chưa có thông báo nào</h3>
          <p className="text-text-secondary text-sm max-w-sm">
            Khi có người tương tác với bài viết hoặc theo dõi bạn, thông báo sẽ hiển thị ở đây.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-800">
          {notifications.map((notification) => {
            const profile = actorProfiles[notification.actorId];
            const hasAvatar = !!(profile && profile.avatarUrl);
            const initials = profile ? profile.displayName.substring(0, 2).toUpperCase() : 'U';

            return (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`flex gap-4 p-4 cursor-pointer transition-colors duration-200 ${
                  notification.isRead ? 'hover:bg-white/[0.02] opacity-80' : 'bg-primary/5 hover:bg-primary/10'
                }`}
              >
                <div className="shrink-0 relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 overflow-hidden flex items-center justify-center text-white font-bold shadow shadow-primary/20">
                    {hasAvatar ? (
                       <img src={profile.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                       initials
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1">
                     {renderIcon(notification)}
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-text-secondary text-sm">
                    {renderMessage(notification)}
                  </p>
                  <p className="text-xs text-text-secondary/50 mt-1">
                    {new Date(notification.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {!notification.isRead && (
                   <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
