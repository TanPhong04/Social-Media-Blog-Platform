import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../api/userApi';
import { notificationApi } from '../api/notificationApi';
import { commentApi } from '../api/commentApi';
import { Bell, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationItem } from '../components/notifications/NotificationItem';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';

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
        window.dispatchEvent(new CustomEvent('unread-count-changed'));
      } catch (err) {
        console.error('Error marking read', err);
      }
    }

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
      let articleId = notification.entityId;
      try {
        const meta = JSON.parse(notification.metadata);
        if (meta.articleId) {
          articleId = meta.articleId;
        } else if (meta.targetId && notification.entityType === 'ARTICLE') {
          articleId = meta.targetId;
        } else if (meta.targetId && notification.entityType === 'COMMENT') {
          try {
            const commentRes = await commentApi.getCommentById(meta.targetId);
            const comment = (commentRes as any).data || commentRes;
            if (comment && comment.articleId) {
              articleId = comment.articleId;
            }
          } catch (e) {
            console.warn('Error fetching comment for articleId', e);
          }
        }
      } catch (e) {
        console.warn('Error parsing notification metadata', e);
      }
      
      if (articleId) {
        navigate(`/article/${articleId}`);
      } else {
        navigate('/');
      }
    }
  };

  const groupNotifications = (notifs: any[]) => {
    const groups: { [key: string]: any[] } = { 'Hôm nay': [], 'Hôm qua': [], 'Cũ hơn': [] };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    notifs.forEach(n => {
      const d = new Date(n.createdAt);
      if (d >= today) groups['Hôm nay'].push(n);
      else if (d >= yesterday) groups['Hôm qua'].push(n);
      else groups['Cũ hơn'].push(n);
    });
    return groups;
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-[840px] mx-auto border-x-0 sm:border-x border-border-default min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <EmptyState 
          icon={<Bell className="w-12 h-12 mb-4 text-primary" />}
          title="Yêu cầu đăng nhập"
          description="Vui lòng đăng nhập để xem thông báo của bạn."
          className="border-none bg-transparent"
        />
      </div>
    );
  }

  const grouped = groupNotifications(notifications);

  return (
    <div className="w-full max-w-[840px] mx-auto border-x-0 sm:border-x border-border-default min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-default sticky top-16 bg-background/80 backdrop-blur-xl z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-heading font-bold text-text-primary">
              Thông báo
            </h1>
          </div>
        </div>

        {notifications.some(n => !n.isRead) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-primary hover:bg-primary/10 rounded-full font-bold px-3 py-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Đánh dấu đã đọc</span>
          </Button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-text-secondary">
           <Spinner size="lg" className="text-primary mb-4" />
           <p className="text-sm font-medium">Đang tải thông báo...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-8 mt-10">
          <EmptyState
            icon={<Bell className="w-12 h-12 mb-4 text-text-secondary opacity-50" />}
            title="Chưa có thông báo nào"
            description="Khi có người tương tác với bài viết hoặc theo dõi bạn, thông báo sẽ hiển thị ở đây."
            className="border-none bg-transparent"
          />
        </div>
      ) : (
        <div className="flex flex-col">
          {Object.entries(grouped).map(([label, items]) => (
            items.length > 0 && (
              <div key={label}>
                <div className="px-4 py-3 bg-surface/30 border-y border-border-subtle backdrop-blur-sm sticky top-[112px] z-30">
                  <h2 className="text-sm font-bold text-text-primary">{label}</h2>
                </div>
                <div className="divide-y divide-border-default">
                  {items.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      profile={actorProfiles[notification.actorId]}
                      onClick={handleNotificationClick}
                    />
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
