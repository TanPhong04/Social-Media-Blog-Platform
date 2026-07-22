import React from 'react';
import { Search, MessageSquare } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Spinner } from '../ui/Spinner';

interface ConversationListProps {
  contacts: any[];
  contactProfiles: Record<string, any>;
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showSuggestions: boolean;
  setShowSuggestions: (s: boolean) => void;
  filteredSuggestions: any[];
  selectContact: (id: string) => void;
  activeContactId: string | null;
}

const formatConversationTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  
  const isToday = date.getDate() === now.getDate() && 
                  date.getMonth() === now.getMonth() && 
                  date.getFullYear() === now.getFullYear();
                  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.getDate() === yesterday.getDate() && 
                      date.getMonth() === yesterday.getMonth() && 
                      date.getFullYear() === yesterday.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } else if (isYesterday) {
    return 'Hôm qua';
  } else {
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  }
};

const renderLastMessage = (msg: string) => {
  if (!msg) return '';
  if (msg.startsWith('![chat_image]')) return '🖼️ Hình ảnh';
  if (msg.startsWith('[CALL_LOG]:')) {
    try {
      const payload = JSON.parse(msg.replace('[CALL_LOG]:', ''));
      if (payload.type === 'MISSED') return '📞 Cuộc gọi nhỡ';
      if (payload.type === 'REJECTED') return '📞 Cuộc gọi bị từ chối';
      if (payload.type === 'ENDED') return payload.isVideo ? '📹 Cuộc gọi video' : '📞 Cuộc gọi thoại';
    } catch(e) {}
  }
  return msg;
};

export const ConversationList: React.FC<ConversationListProps> = ({
  contacts, contactProfiles, loading, searchQuery, setSearchQuery,
  showSuggestions, setShowSuggestions, filteredSuggestions, selectContact, activeContactId
}) => {
  return (
    <div className={`w-full md:w-80 border-r border-border-default flex flex-col bg-background/50 backdrop-blur-xl ${activeContactId ? 'hidden md:flex' : 'flex'}`}>
      <div className="p-4 border-b border-border-default relative z-30 bg-surface/50 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-heading font-extrabold bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">Tin nhắn</h2>
        </div>
        <div className="relative group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Tìm người chat..."
            className="w-full bg-surface-elevated border border-border-default rounded-2xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-text-primary placeholder-text-secondary transition-all shadow-sm group-hover:shadow-md"
          />
          <Search className="w-4 h-4 text-text-secondary absolute left-4 top-3 transition-colors group-focus-within:text-primary" />
        </div>

        {showSuggestions && searchQuery.trim().length > 0 && (
          <div className="absolute left-4 right-4 mt-2 bg-surface-elevated border border-border-default rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-2 z-50 animate-fade-in">
            <div className="flex justify-between items-center px-2 py-2 text-xs text-text-secondary font-bold border-b border-border-subtle mb-1 uppercase tracking-wider">
              <span>Gợi ý</span>
              <button onClick={() => setShowSuggestions(false)} className="hover:text-primary transition-colors p-1">Đóng</button>
            </div>
            {filteredSuggestions.length === 0 ? (
              <div className="p-6 text-center text-sm text-text-secondary italic">Không tìm thấy...</div>
            ) : (
              filteredSuggestions.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() => selectContact(profile.id)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && selectContact(profile.id)}
                  className="flex items-center gap-3 p-2.5 hover:bg-surface rounded-xl cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 group"
                >
                  <Avatar src={profile.avatarUrl} fallback={profile.displayName.charAt(0).toUpperCase()} size="sm" className="shadow-sm group-hover:scale-105 transition-transform" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate text-text-primary">{profile.displayName}</p>
                    <p className="text-xs text-text-secondary truncate">@{profile.username}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 custom-scrollbar">
        {loading ? (
          <div className="p-8 flex justify-center"><Spinner size="md" /></div>
        ) : contacts.length === 0 ? (
          <div className="p-8 text-center text-text-secondary flex flex-col items-center justify-center h-full animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center mb-4 shadow-inner">
              <MessageSquare className="w-8 h-8 opacity-40 text-primary" />
            </div>
            <p className="text-sm font-bold text-text-primary">Hộp thư trống</p>
            <p className="text-xs mt-2 max-w-[200px] leading-relaxed">Tìm bạn bè để bắt đầu những cuộc trò chuyện thú vị.</p>
          </div>
        ) : (
          contacts.map((c) => {
            const profile = contactProfiles[c.contactId];
            const isActive = c.contactId === activeContactId;
            const name = profile ? profile.displayName : `Người dùng ${c.contactId.substring(0, 4)}`;
            const initials = profile ? profile.displayName.charAt(0).toUpperCase() : 'U';

            return (
              <div
                key={c.contactId}
                onClick={() => selectContact(c.contactId)}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && selectContact(c.contactId)}
                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive ? 'bg-primary/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'hover:bg-surface-elevated hover:shadow-sm'
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar src={profile?.avatarUrl} fallback={initials} size="md" className={isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-background transition-all" : ""} />
                  {c.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-[2.5px] border-background rounded-full shadow-sm animate-pulse" title="Đang online" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-sm font-bold truncate pr-2 ${isActive ? 'text-primary' : 'text-text-primary'}`}>{name}</span>
                    <span className={`text-[10px] shrink-0 font-medium ${isActive ? 'text-primary/70' : 'text-text-secondary'}`}>
                      {formatConversationTime(c.lastMessageTime)}
                    </span>
                  </div>
                  <p className={`text-xs truncate ${c.unreadCount > 0 ? 'text-text-primary font-bold' : isActive ? 'text-primary/80' : 'text-text-secondary'}`}>
                    {renderLastMessage(c.lastMessage)}
                  </p>
                </div>

                {c.unreadCount > 0 && (
                  <span className="bg-primary text-white text-[10px] font-bold min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full shadow-md shrink-0 animate-bounce-subtle">
                    {c.unreadCount > 99 ? '99+' : c.unreadCount}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
