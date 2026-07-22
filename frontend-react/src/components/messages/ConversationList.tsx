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

export const ConversationList: React.FC<ConversationListProps> = ({
  contacts, contactProfiles, loading, searchQuery, setSearchQuery,
  showSuggestions, setShowSuggestions, filteredSuggestions, selectContact, activeContactId
}) => {
  return (
    <div className={`w-full md:w-80 border-r border-border-default flex flex-col bg-background ${activeContactId ? 'hidden md:flex' : 'flex'}`}>
      <div className="p-4 border-b border-border-default relative z-30">
        <h2 className="text-xl font-heading font-bold mb-4 text-text-primary">Tin nhắn</h2>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Tìm người dùng chat mới..."
            className="w-full bg-surface-elevated border border-border-default rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 text-text-primary placeholder-text-secondary transition-colors"
          />
          <Search className="w-4 h-4 text-text-secondary absolute left-4 top-2.5" />
        </div>

        {showSuggestions && searchQuery.trim().length > 0 && (
          <div className="absolute left-4 right-4 mt-2 bg-surface-elevated border border-border-default rounded-xl shadow-2xl max-h-60 overflow-y-auto p-1.5 z-50 animate-fade-in">
            <div className="flex justify-between items-center px-3 py-2 text-xs text-text-secondary font-semibold border-b border-border-subtle mb-1">
              <span>Gợi ý liên hệ</span>
              <button onClick={() => setShowSuggestions(false)} className="hover:text-text-primary p-1">Đóng</button>
            </div>
            {filteredSuggestions.length === 0 ? (
              <div className="p-4 text-center text-xs text-text-secondary italic">Không tìm thấy người dùng phù hợp.</div>
            ) : (
              filteredSuggestions.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() => selectContact(profile.id)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && selectContact(profile.id)}
                  className="flex items-center gap-3 p-2 hover:bg-surface rounded-lg cursor-pointer transition-colors focus-visible:outline-none focus-visible:bg-surface"
                >
                  <Avatar src={profile.avatarUrl} fallback={profile.displayName.charAt(0).toUpperCase()} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-text-primary">{profile.displayName}</p>
                    <p className="text-xs text-text-secondary truncate">@{profile.username}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border-subtle">
        {loading ? (
          <div className="p-8 flex justify-center"><Spinner size="md" /></div>
        ) : contacts.length === 0 ? (
          <div className="p-8 text-center text-text-secondary flex flex-col items-center">
            <MessageSquare className="w-10 h-10 opacity-20 mb-3" />
            <p className="text-sm font-bold text-text-primary">Chưa có tin nhắn</p>
            <p className="text-xs mt-1 max-w-[200px]">Tìm người dùng mới ở thanh tìm kiếm phía trên để bắt đầu nhắn tin.</p>
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
                className={`flex items-center gap-3 p-4 cursor-pointer transition-all relative focus-visible:outline-none focus-visible:bg-surface-elevated ${
                  isActive ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-surface-elevated border-l-4 border-transparent'
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar src={profile?.avatarUrl} fallback={initials} size="md" />
                  {c.isOnline ? (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full shadow" title="Đang online" />
                  ) : (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-gray-500 border-2 border-background rounded-full shadow" title="Ngoại tuyến" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-text-primary truncate pr-2">{name}</span>
                    <span className="text-[10px] text-text-secondary shrink-0 font-medium">
                      {new Date(c.lastMessageTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={`text-xs truncate ${c.unreadCount > 0 ? 'text-text-primary font-bold' : 'text-text-secondary'}`}>
                    {c.lastMessage.startsWith('![chat_image]') ? '[Hình ảnh]' : c.lastMessage}
                  </p>
                </div>

                {c.unreadCount > 0 && (
                  <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm shrink-0">
                    {c.unreadCount}
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
