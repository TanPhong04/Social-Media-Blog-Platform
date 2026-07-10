import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../api/userApi';
import { Users, AlertCircle, Check, X, Sparkles } from 'lucide-react';

const Following: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'suggestions' | 'following'>('suggestions');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [followStatusMap, setFollowStatusMap] = useState<{ [uid: string]: boolean }>({});
  
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Tải danh sách những người đang theo dõi
      let followingData: any[] = [];
      try {
        const followingRes: any = await userApi.getFollowing(user.id, 0, 100);
        followingData = followingRes.content || [];
        setFollowingList(followingData);
      } catch (err) {
        console.warn('Lỗi tải danh sách following', err);
      }

      // Tạo map trạng thái theo dõi từ danh sách đang theo dõi
      const followMap: { [uid: string]: boolean } = {};
      followingData.forEach((item) => {
        followMap[item.userId] = true;
      });

      // 2. Tải danh sách gợi ý theo dõi
      try {
        const suggestionsRes: any = await userApi.getSuggestions();
        const suggestionsData = suggestionsRes || [];
        
        // Lọc bỏ những tài khoản đã nằm trong danh sách đang theo dõi
        const filteredSuggestions = suggestionsData.filter(
          (item: any) => !followMap[item.id]
        );
        
        setSuggestions(filteredSuggestions);
        
        // Đăng ký trạng thái chưa theo dõi cho các tài khoản gợi ý
        filteredSuggestions.forEach((item: any) => {
          followMap[item.id] = false;
        });
      } catch (err) {
        console.warn('Lỗi tải danh sách gợi ý', err);
      }

      setFollowStatusMap(followMap);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu', err);
      showToastMessage('Không thể tải danh sách kết nối.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý click Theo dõi / Hủy theo dõi
  const handleFollowToggle = async (targetUserId: string, displayName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrentlyFollowing = followStatusMap[targetUserId] || false;
    
    try {
      // Cập nhật Optimistic UI
      setFollowStatusMap(prev => ({ ...prev, [targetUserId]: !isCurrentlyFollowing }));
      
      if (isCurrentlyFollowing) {
        await userApi.unfollowUser(targetUserId);
        showToastMessage(`Đã hủy theo dõi @${displayName}`);
      } else {
        await userApi.followUser(targetUserId);
        showToastMessage(`Đã theo dõi @${displayName}!`);
      }
    } catch (err) {
      console.error(err);
      // Rollback nếu API thất bại
      setFollowStatusMap(prev => ({ ...prev, [targetUserId]: isCurrentlyFollowing }));
      showToastMessage('Tác vụ thất bại.', 'error');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto border-x border-gray-800 min-h-screen bg-background p-8 text-center flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-primary mb-4" />
        <h3 className="text-xl font-bold text-text-primary mb-2">Yêu cầu đăng nhập</h3>
        <p className="text-text-secondary text-sm">Vui lòng đăng nhập để xem và quản lý kết nối của bạn.</p>
      </div>
    );
  }

  // Danh sách hiển thị dựa trên Tab
  const listToRender = activeTab === 'suggestions' ? suggestions : followingList;

  return (
    <div className="max-w-2xl mx-auto border-x border-gray-800 min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 sticky top-16 bg-background/85 backdrop-blur-md z-40 flex items-center gap-3">
        <div className="p-2.5 bg-surface text-primary rounded-app border border-white/10 shadow-md">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-heading font-bold text-text-primary flex items-center gap-1.5">
            Kết nối bạn bè <Sparkles className="w-4.5 h-4.5 text-primary" />
          </h1>
          <p className="text-text-secondary text-xs mt-0.5">
            Tìm kiếm, kết nối và theo dõi những gương mặt mới
          </p>
        </div>
      </div>

      {/* Tabs tương tự X */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('suggestions')}
          className="flex-1 py-4 text-center font-bold text-sm relative hover:bg-white/[0.02] transition-colors cursor-pointer"
        >
          <span className={activeTab === 'suggestions' ? 'text-text-primary' : 'text-text-secondary'}>
            Người dành cho bạn
          </span>
          {activeTab === 'suggestions' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full mx-10" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('following')}
          className="flex-1 py-4 text-center font-bold text-sm relative hover:bg-white/[0.02] transition-colors cursor-pointer"
        >
          <span className={activeTab === 'following' ? 'text-text-primary' : 'text-text-secondary'}>
            Đang theo dõi
          </span>
          {activeTab === 'following' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full mx-10" />
          )}
        </button>
      </div>

      {/* Body: Loading hoặc Lưới danh sách người dùng */}
      {loading ? (
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex items-center gap-3 animate-pulse p-3 rounded-xl border border-gray-800/20">
              <div className="w-11 h-11 rounded-full bg-white/5 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="w-1/3 h-4 bg-white/5 rounded" />
                <div className="w-2/3 h-3 bg-white/5 rounded" />
              </div>
              <div className="w-20 h-8 bg-white/5 rounded-full" />
            </div>
          ))}
        </div>
      ) : listToRender.length === 0 ? (
        <div className="p-16 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-text-secondary" />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-1">
            {activeTab === 'suggestions' ? 'Đã hết gợi ý mới' : 'Bạn chưa theo dõi ai'}
          </h3>
          <p className="text-text-secondary text-sm max-w-sm">
            {activeTab === 'suggestions'
              ? 'Tất cả tài khoản trong hệ thống đã được kết nối!'
              : 'Hãy chuyển qua tab gợi ý để xem những gương mặt nổi bật dành cho bạn.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-800/80 px-2">
          {listToRender.map((item) => {
            // Normalise key name của 2 API khác nhau
            const uid = item.id || item.userId;
            const displayName = item.displayName;
            const username = item.username || `user_${uid.substring(0, 8)}`;
            const avatarUrl = item.avatarUrl;
            const bio = item.bio || 'Chưa thiết lập tiểu sử.';
            
            const initials = displayName.substring(0, 2).toUpperCase();
            const isFollowing = followStatusMap[uid] || false;

            return (
              <div
                key={uid}
                onClick={() => navigate(`/profile?userId=${uid}`)}
                className="flex gap-3 p-4 hover:bg-white/[0.015] transition-colors cursor-pointer items-start"
              >
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-semibold text-sm shrink-0 overflow-hidden shadow">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>

                {/* Info & Bio */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-text-primary text-[15px] truncate hover:underline leading-tight">
                        {displayName}
                      </h4>
                      <p className="text-text-secondary text-xs">@{username}</p>
                    </div>

                    {/* Nút Follow / Following */}
                    <button
                      onClick={(e) => handleFollowToggle(uid, displayName, e)}
                      className={`px-4 py-1.5 font-bold text-xs rounded-full transition-all cursor-pointer shadow-sm ${
                        isFollowing
                          ? 'border border-gray-700 text-text-primary hover:border-red-500 hover:text-red-500 hover:bg-red-500/10'
                          : 'bg-primary text-white hover:bg-primary/95'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                  <p className="text-text-secondary text-xs mt-2 leading-relaxed break-words line-clamp-2">
                    {bio}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TOAST SYSTEM */}
      {toast && (
        <div className="fixed bottom-5 right-5 bg-surface border border-gray-800 text-text-primary px-4 py-3.5 rounded-app shadow-2xl flex items-center gap-2.5 animate-fade-in z-50 min-w-[200px]">
          <div className={`p-1 rounded-full ${toast.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
            {toast.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </div>
          <span className="font-semibold text-sm">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default Following;
