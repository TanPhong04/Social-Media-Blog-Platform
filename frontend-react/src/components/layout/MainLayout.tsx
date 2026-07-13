import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { userApi } from '../../api/userApi';
import { notificationApi } from '../../api/notificationApi';
import { Bell, Heart, MessageCircle, UserPlus, Repeat, X, MessageSquare } from 'lucide-react';

const MainLayout = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [realtimeToast, setRealtimeToast] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // Thiết lập stream SSE nhận thông báo realtime
    const baseUrl = import.meta.env.VITE_API_URL || '/api/v1';
    const sseUrl = `${baseUrl}/notifications/stream?token=${token}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.addEventListener('NOTIFICATION', async (event: MessageEvent) => {
      try {
        const notification = JSON.parse(event.data);
        
        // Tải thông tin người gửi tương tác
        let actorName = 'Người dùng';
        let avatarUrl = '';
        try {
          const profileRes = await userApi.getUserById(notification.actorId);
          const profile = (profileRes as any).data || profileRes;
          actorName = profile.displayName || `Người dùng ${notification.actorId.substring(0, 4)}`;
          avatarUrl = profile.avatarUrl || '';
        } catch (e) {
          actorName = `Người dùng ${notification.actorId.substring(0, 4)}`;
        }

        // Bắn sự kiện toàn cục để các trang đang hiển thị (như trang Notifications, Sidebar) cập nhật dữ liệu ngay lập tức
        window.dispatchEvent(new CustomEvent('new-notification-received', { detail: notification }));

        let message = '';
        let iconType = 'bell';
        
        let isRepost = false;
        try {
          const meta = JSON.parse(notification.metadata);
          if (meta.content && meta.content.includes('[repost]')) {
            isRepost = true;
          }
        } catch (e) {}

        switch (notification.type) {
          case 'NEW_LIKE':
            message = `${actorName} đã thích bài viết của bạn.`;
            iconType = 'like';
            break;
          case 'NEW_COMMENT':
            if (isRepost) {
              message = `${actorName} đã đăng lại bài viết của bạn.`;
              iconType = 'repost';
            } else {
              message = `${actorName} đã bình luận về bài viết của bạn.`;
              iconType = 'comment';
            }
            break;
          case 'NEW_REPLY':
            message = `${actorName} đã phản hồi bình luận của bạn.`;
            iconType = 'comment';
            break;
          case 'NEW_FOLLOWER':
            message = `${actorName} đã bắt đầu theo dõi bạn.`;
            iconType = 'follow';
            break;
          case 'NEW_ARTICLE':
            message = `${actorName} vừa đăng một bài viết mới.`;
            iconType = 'article';
            break;
          default:
            message = `${actorName} đã tương tác với bạn.`;
            iconType = 'bell';
        }

        setRealtimeToast({
          id: notification.id,
          message,
          iconType,
          avatarUrl,
          actorName,
          notification
        });

      } catch (err) {
        console.error('Error parsing realtime notification', err);
      }
    });

    eventSource.addEventListener('CHAT_MESSAGE', async (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);
        
        window.dispatchEvent(new CustomEvent('new-chat-message-received', { detail: msg }));
        window.dispatchEvent(new CustomEvent('chat-unread-count-changed'));

        const urlParams = new URLSearchParams(window.location.search);
        const activeContactId = urlParams.get('contactId');
        const isAtMessagesPage = window.location.pathname === '/messages';

        if (msg.senderId !== user?.id && !(isAtMessagesPage && activeContactId === msg.senderId)) {
          let senderName = 'Người dùng';
          let avatarUrl = '';
          try {
            const profileRes = await userApi.getUserById(msg.senderId);
            const profile = (profileRes as any).data || profileRes;
            senderName = profile.displayName || `Người dùng ${msg.senderId.substring(0, 4)}`;
            avatarUrl = profile.avatarUrl || '';
          } catch (e) {
            senderName = `Người dùng ${msg.senderId.substring(0, 4)}`;
          }

          let textContent = msg.content;
          if (textContent.startsWith('![chat_image]')) {
            textContent = '[Hình ảnh]';
          }

          setRealtimeToast({
            id: msg.id,
            message: `${senderName}: ${textContent}`,
            iconType: 'chat',
            avatarUrl,
            actorName: senderName,
            isChat: true,
            senderId: msg.senderId
          });
        }
      } catch (err) {
        console.error('Error parsing realtime chat message', err);
      }
    });

    eventSource.addEventListener('error', (e) => {
      console.warn('SSE stream connection warning. Browser will attempt auto-reconnect.', e);
    });

    return () => {
      eventSource.close();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (realtimeToast) {
      const timer = setTimeout(() => {
        setRealtimeToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [realtimeToast]);

  const handleToastClick = async () => {
    if (!realtimeToast) return;
    
    if (realtimeToast.isChat) {
      const senderId = realtimeToast.senderId;
      setRealtimeToast(null);
      navigate(`/messages?contactId=${senderId}`);
      return;
    }

    const { notification } = realtimeToast;
    setRealtimeToast(null);

    // Đánh dấu đã đọc
    try {
      await notificationApi.markAsRead(notification.id);
      window.dispatchEvent(new CustomEvent('notification-marked-read'));
    } catch (e) {
      console.warn('Error marking read from toast click', e);
    }

    // Điều hướng tương tự trang Notifications
    if (notification.type === 'NEW_FOLLOWER') {
      navigate(`/profile?userId=${notification.actorId}`);
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
        }
      } catch (e) {}

      if (articleId) {
        navigate(`/?articleId=${articleId}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary font-sans flex flex-col relative">
      <style>{`
        @keyframes slideIn {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .toast-animate {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>

      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area with Sidebar */}
      <div className="flex-1 max-w-7xl mx-auto w-full flex">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Center Content */}
        <main className="flex-1 w-full min-w-0 pb-12">
          <Outlet />
        </main>
        
        {/* Right Sidebar */}
        <RightSidebar />
      </div>

      {/* Realtime Toast Notification */}
      {realtimeToast && (
        <div 
          onClick={handleToastClick}
          className="fixed bottom-5 right-5 z-[9999] max-w-sm w-full bg-surface border border-white/10 rounded-app shadow-2xl p-4 flex gap-3 toast-animate cursor-pointer hover:bg-white/[0.02] active:scale-[0.98] transition-all"
        >
          <div className="shrink-0 relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 overflow-hidden flex items-center justify-center text-white font-bold shadow">
              {realtimeToast.avatarUrl ? (
                <img src={realtimeToast.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                realtimeToast.actorName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="absolute -bottom-1 -right-1">
              {realtimeToast.iconType === 'like' && (
                <div className="p-1 bg-red-500 text-white rounded-full"><Heart className="w-3 h-3 fill-current" /></div>
              )}
              {realtimeToast.iconType === 'comment' && (
                <div className="p-1 bg-blue-500 text-white rounded-full"><MessageCircle className="w-3 h-3" /></div>
              )}
              {realtimeToast.iconType === 'repost' && (
                <div className="p-1 bg-green-500 text-white rounded-full"><Repeat className="w-3 h-3" /></div>
              )}
              {realtimeToast.iconType === 'follow' && (
                <div className="p-1 bg-emerald-500 text-white rounded-full"><UserPlus className="w-3 h-3" /></div>
              )}
              {realtimeToast.iconType === 'article' && (
                <div className="p-1 bg-primary text-white rounded-full"><Bell className="w-3 h-3" /></div>
              )}
              {realtimeToast.iconType === 'bell' && (
                <div className="p-1 bg-primary text-white rounded-full"><Bell className="w-3 h-3" /></div>
              )}
              {realtimeToast.iconType === 'chat' && (
                <div className="p-1 bg-green-500 text-white rounded-full"><MessageSquare className="w-3 h-3" /></div>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <h4 className="text-xs font-bold text-primary">{realtimeToast.isChat ? 'Tin nhắn mới' : 'Thông báo mới'}</h4>
            <p className="text-xs text-text-secondary mt-0.5 font-medium leading-relaxed truncate">{realtimeToast.message}</p>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setRealtimeToast(null);
            }}
            className="shrink-0 text-text-secondary hover:text-text-primary self-start p-0.5 rounded-full hover:bg-white/5 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
