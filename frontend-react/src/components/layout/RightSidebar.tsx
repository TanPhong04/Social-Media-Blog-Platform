import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi, ProfileResponse } from '../../api/userApi';
import { useAuth } from '../../contexts/AuthContext';
import { UserPlus, Check, TrendingUp } from 'lucide-react';

const RightSidebar = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<ProfileResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingMap, setFollowingMap] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (isAuthenticated) {
      fetchSuggestions();
    }
  }, [isAuthenticated]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res: any = await userApi.getSuggestions();
      const users = res.data || res || [];
      // Filter out self just in case
      const filtered = users.filter((u: any) => u.id !== user?.id).slice(0, 5);
      setSuggestions(filtered);
    } catch (err) {
      console.error('Failed to fetch suggestions', err);
    } finally {
      setLoading(false);
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
      {/* Search Bar Placeholder if needed, but Navbar already has it */}
      
      {isAuthenticated && (
        <div className="bg-surface rounded-app p-5 border border-white/5 shadow-sm mb-6">
          <h3 className="font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            Gợi ý theo dõi
          </h3>
          
          {loading ? (
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
