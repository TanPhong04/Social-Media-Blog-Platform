import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi, type ProfileResponse } from '../../api/userApi';
import { chatApi } from '../../api/chatApi';
import { useAuth } from '../../contexts/AuthContext';
import { UserPlus, Check, TrendingUp, Users } from 'lucide-react';

// Helper to format time ago
const formatTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'vài giây trước';
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

const RightSidebar = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<ProfileResponse[]>([]);
  const [contacts, setContacts] = useState<ProfileResponse[]>([]);
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, { isOnline: boolean, lastOnlineTime?: string }>>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [followingMap, setFollowingMap] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchSuggestions();
      fetchContacts();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    // Poll online statuses every 30 seconds
    if (contacts.length > 0) {
      fetchOnlineStatuses(contacts.map(c => c.id));
      const interval = setInterval(() => {
        fetchOnlineStatuses(contacts.map(c => c.id));
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [contacts]);

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const res: any = await userApi.getSuggestions();
      const users = res.data || res || [];
      const filtered = users.filter((u: any) => u.id !== user?.id).slice(0, 3);
      setSuggestions(filtered);
    } catch (err) {
      console.error('Failed to fetch suggestions', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const fetchContacts = async () => {
    setLoadingContacts(true);
    try {
      if (!user) return;
      const res: any = await userApi.getFollowing(user.id, 0, 20);
      const followingList = res.data?.content || res.content || res.data || res || [];
      // Extract target properties if the API returns relationship objects, or just ProfileResponses
      const formattedContacts = followingList.map((item: any) => item.target || item).filter((u: any) => u.id && u.id !== user.id);
      setContacts(formattedContacts);
      if (formattedContacts.length > 0) {
        fetchOnlineStatuses(formattedContacts.map((c: any) => c.id));
      }
    } catch (err) {
      console.error('Failed to fetch contacts', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchOnlineStatuses = async (userIds: string[]) => {
    try {
      const res = await chatApi.checkOnlineStatuses(userIds);
      setOnlineStatuses(res.data);
    } catch (err) {
      console.error('Failed to fetch online statuses', err);
    }
  };

  const handleFollowToggle = async (targetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (followingMap[targetId]) {
        await userApi.unfollowUser(targetId);
        setFollowingMap(prev => ({ ...prev, [targetId]: false }));
      } else {
        await userApi.followUser(targetId);
        setFollowingMap(prev => ({ ...prev, [targetId]: true }));
      }
    } catch (err) {
      console.error('Failed to toggle follow', err);
    }
  };

  return (
    <aside className="hidden xl:block w-80 h-[calc(100vh-4rem)] sticky top-16 py-6 px-4 overflow-y-auto custom-scrollbar">
      
      {isAuthenticated && (
        <div className="bg-surface rounded-app p-5 border border-white/5 shadow-sm mb-6">
          <h3 className="font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            Gợi ý theo dõi
          </h3>
          
          {loadingSuggestions ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/5 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-white/5 rounded w-3/4" />
                    <div className="h-2 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-4">
              {suggestions.map((sUser) => (
                <div 
                  key={sUser.id} 
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => navigate(`/profile?userId=${sUser.id}`)}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 shrink-0 overflow-hidden text-white flex items-center justify-center font-bold text-sm">
                    {sUser.avatarUrl ? (
                      <img src={sUser.avatarUrl} alt={sUser.displayName} className="w-full h-full object-cover" />
                    ) : (
                      (sUser.displayName || sUser.username || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate group-hover:text-primary transition-colors">
                      {sUser.displayName || sUser.username}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      @{sUser.username}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => handleFollowToggle(sUser.id, e)}
                    className={`shrink-0 p-1.5 rounded-full transition-colors ${followingMap[sUser.id] ? 'bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'}`}
                  >
                    {followingMap[sUser.id] ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-secondary text-center py-2">Chưa có gợi ý nào cho bạn lúc này.</p>
          )}
        </div>
      )}

      {/* Contacts / Người liên hệ */}
      {isAuthenticated && (
        <div className="bg-surface rounded-app p-5 border border-white/5 shadow-sm mb-6">
          <h3 className="font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Người liên hệ
          </h3>
          
          {loadingContacts ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/5 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-white/5 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : contacts.length > 0 ? (
            <div className="space-y-3">
              {contacts.map((cUser) => {
                const status = onlineStatuses[cUser.id];
                const isOnline = status?.isOnline;
                const lastOnlineStr = status?.lastOnlineTime ? formatTimeAgo(status.lastOnlineTime) : '';
                
                return (
                  <div 
                    key={cUser.id} 
                    className="flex items-center gap-3 cursor-pointer group hover:bg-white/5 p-2 rounded-lg transition-colors -mx-2"
                    onClick={() => navigate(`/profile?userId=${cUser.id}`)}
                  >
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-purple-500 shrink-0 overflow-hidden text-white flex items-center justify-center font-bold text-sm">
                        {cUser.avatarUrl ? (
                          <img src={cUser.avatarUrl} alt={cUser.displayName} className="w-full h-full object-cover" />
                        ) : (
                          (cUser.displayName || cUser.username || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      {/* Online Status Indicator */}
                      {isOnline ? (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-surface rounded-full"></div>
                      ) : (
                        lastOnlineStr ? (
                          <div className="absolute bottom-[-4px] right-[-4px] bg-surface text-[9px] font-bold text-green-500 px-1 rounded-full border border-gray-800">
                            {lastOnlineStr.replace(' phút', 'p').replace(' giờ', 'h').replace(' ngày', 'd')}
                          </div>
                        ) : null
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex justify-between items-center">
                      <p className="text-sm font-semibold text-text-primary truncate group-hover:text-primary transition-colors">
                        {cUser.displayName || cUser.username}
                      </p>
                      {!isOnline && lastOnlineStr && (
                        <span className="text-xs text-text-secondary whitespace-nowrap ml-2">
                          {lastOnlineStr}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-text-secondary text-center py-2">Bạn chưa theo dõi ai.</p>
          )}
        </div>
      )}

      {/* Trending Widget */}
      <div className="bg-surface rounded-app p-5 border border-white/5 shadow-sm">
        <h3 className="font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Đang thịnh hành
        </h3>
        <div className="space-y-4">
          {[
            { tag: '#javascript', posts: '12.5K' },
            { tag: '#reactjs', posts: '8.2K' },
            { tag: '#webdev', posts: '5.1K' },
            { tag: '#uiux', posts: '3.4K' },
            { tag: '#coding', posts: '2.9K' }
          ].map((item, i) => (
            <div key={i} className="flex flex-col cursor-pointer group">
              <span className="text-xs text-text-secondary font-medium">Chủ đề {i+1}</span>
              <span className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">{item.tag}</span>
              <span className="text-xs text-text-secondary">{item.posts} bài viết</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-6 text-xs text-text-secondary text-center">
        &copy; 2026 Social Blog Platform. All rights reserved.
      </div>
    </aside>
  );
};

export default RightSidebar;
