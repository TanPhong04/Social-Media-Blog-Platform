import React from 'react';
import { Heart, MessageCircle, UserPlus, Repeat, MessageSquare, Bell } from 'lucide-react';
import { Avatar } from '../ui/Avatar';

interface NotificationItemProps {
  notification: any;
  profile: any;
  onClick: (notification: any) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, profile, onClick }) => {
  const displayName = profile ? profile.displayName : `Người dùng ${notification.actorId.substring(0, 4)}`;
  const initials = profile ? profile.displayName.substring(0, 2).toUpperCase() : 'U';

  const renderIcon = () => {
    let isRepost = false;
    let reactionType = 'LIKE';
    try {
      const meta = JSON.parse(notification.metadata);
      if (meta.content && meta.content.includes('[repost]')) {
        isRepost = true;
      }
      if (meta.reactionType) {
        reactionType = meta.reactionType;
      }
    } catch (e) {}

    switch (notification.type) {
      case 'NEW_LIKE':
        if (reactionType === 'LOVE') return <div className="p-1.5 bg-background shadow border border-border-subtle rounded-full text-[10px] leading-none absolute -bottom-1 -right-1 z-10">❤️</div>;
        if (reactionType === 'HAHA') return <div className="p-1.5 bg-background shadow border border-border-subtle rounded-full text-[10px] leading-none absolute -bottom-1 -right-1 z-10">😆</div>;
        if (reactionType === 'WOW') return <div className="p-1.5 bg-background shadow border border-border-subtle rounded-full text-[10px] leading-none absolute -bottom-1 -right-1 z-10">😮</div>;
        if (reactionType === 'SAD') return <div className="p-1.5 bg-background shadow border border-border-subtle rounded-full text-[10px] leading-none absolute -bottom-1 -right-1 z-10">😢</div>;
        if (reactionType === 'ANGRY') return <div className="p-1.5 bg-background shadow border border-border-subtle rounded-full text-[10px] leading-none absolute -bottom-1 -right-1 z-10">😡</div>;
        return <div className="p-1.5 bg-red-500 text-white shadow border border-background rounded-full absolute -bottom-1 -right-1 z-10"><Heart className="w-3.5 h-3.5 fill-current" /></div>;
      case 'NEW_COMMENT':
      case 'NEW_REPLY':
        if (isRepost) return <div className="p-1.5 bg-green-500 text-white shadow border border-background rounded-full absolute -bottom-1 -right-1 z-10"><Repeat className="w-3.5 h-3.5" /></div>;
        return <div className="p-1.5 bg-blue-500 text-white shadow border border-background rounded-full absolute -bottom-1 -right-1 z-10"><MessageCircle className="w-3.5 h-3.5 fill-current" /></div>;
      case 'NEW_FOLLOWER':
        return <div className="p-1.5 bg-emerald-500 text-white shadow border border-background rounded-full absolute -bottom-1 -right-1 z-10"><UserPlus className="w-3.5 h-3.5" /></div>;
      case 'NEW_MESSAGE':
        return <div className="p-1.5 bg-purple-500 text-white shadow border border-background rounded-full absolute -bottom-1 -right-1 z-10"><MessageSquare className="w-3.5 h-3.5 fill-current" /></div>;
      default:
        return <div className="p-1.5 bg-primary text-white shadow border border-background rounded-full absolute -bottom-1 -right-1 z-10"><Bell className="w-3.5 h-3.5" /></div>;
    }
  };

  const renderMessage = () => {
    const actor = <span className="font-bold text-text-primary">{displayName}</span>;
    let isRepost = false;
    let reactionType = 'LIKE';
    try {
      const meta = JSON.parse(notification.metadata);
      if (meta.content && meta.content.includes('[repost]')) {
        isRepost = true;
      }
      if (meta.reactionType) {
        reactionType = meta.reactionType;
      }
    } catch (e) {}

    switch (notification.type) {
      case 'NEW_LIKE': 
        if (reactionType === 'LOVE') return <>{actor} đã yêu thích bài viết của bạn</>;
        if (reactionType === 'HAHA') return <>{actor} đã bày tỏ cảm xúc Haha về bài viết của bạn</>;
        if (reactionType === 'WOW') return <>{actor} đã bày tỏ cảm xúc Wow về bài viết của bạn</>;
        if (reactionType === 'SAD') return <>{actor} đã bày tỏ cảm xúc Buồn về bài viết của bạn</>;
        if (reactionType === 'ANGRY') return <>{actor} đã bày tỏ cảm xúc Phẫn nộ về bài viết của bạn</>;
        return <>{actor} đã thích bài viết của bạn</>;
      case 'NEW_COMMENT': 
        if (isRepost) return <>{actor} đã đăng lại bài viết của bạn</>;
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

  return (
    <div
      onClick={() => onClick(notification)}
      onKeyDown={(e) => e.key === 'Enter' && onClick(notification)}
      tabIndex={0}
      className={`flex gap-4 p-4 cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:bg-surface-elevated ${
        notification.isRead ? 'hover:bg-surface opacity-80' : 'bg-primary/5 hover:bg-primary/10'
      }`}
    >
      <div className="shrink-0 relative">
        <Avatar src={profile?.avatarUrl} fallback={initials} size="lg" />
        {renderIcon()}
      </div>
      <div className="flex-1 pt-1 min-w-0">
        <p className="text-text-secondary text-sm break-words leading-relaxed">
          {renderMessage()}
        </p>
        <p className="text-[11px] font-medium text-text-secondary/60 mt-1.5 uppercase tracking-wide">
          {new Date(notification.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
        </p>
      </div>
      {!notification.isRead && (
        <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2 shrink-0 shadow-[0_0_8px_rgba(var(--color-primary),0.5)]"></div>
      )}
    </div>
  );
};
