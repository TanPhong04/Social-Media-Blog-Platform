import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../api/userApi';
import { articleApi } from '../api/articleApi';
import type { ArticleResponse } from '../api/articleApi';
import ArticleCard from '../components/ArticleCard';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Calendar, FileText, Heart, Globe, X, Check, Gift, Repeat } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Trạng thái hồ sơ
  const [profile, setProfile] = useState<any>(null);
  const [followStats, setFollowStats] = useState({ followerCount: 0, followingCount: 0 });
  const [bannerUrl, setBannerUrl] = useState('');
  
  // Trạng thái danh sách bài viết/likes
  const [posts, setPosts] = useState<ArticleResponse[]>([]);
  const [likedPosts, setLikedPosts] = useState<ArticleResponse[]>([]);
  const [repostedPosts, setRepostedPosts] = useState<ArticleResponse[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Trạng thái tab và loading
  const [activeTab, setActiveTab] = useState<'posts' | 'reposts' | 'highlights' | 'articles' | 'media' | 'likes'>('posts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Trạng thái Modal Chỉnh sửa hồ sơ
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editBanner, setEditBanner] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editDob, setEditDob] = useState('');
  const [updating, setUpdating] = useState(false);

  // Trạng thái Toast thông báo
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Gợi ý theo dõi "Who to follow" giả lập tương tác
  const [whoToFollow, setWhoToFollow] = useState([
    { id: '1', displayName: 'Prodigy', handle: '@Prodigyftn', bio: 'Professional Fortnite Player Business inquiries @DillMgmt', following: false, avatar: 'P' },
    { id: '2', displayName: 'tphageru', handle: '@tphageru', bio: 'Designer & Artist. No reuploading & No AI training', following: false, avatar: 'T' },
    { id: '3', displayName: '木毎 🍉', handle: '@melvinfeat', bio: 'mel/葉 | 20↑ | OC/FFXIV *NO AI*', following: false, avatar: 'M' }
  ]);

  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadProfileData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (profile) {
      loadTabData();
    }
  }, [profile, activeTab]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 1. Tải thông tin cá nhân
      const profileRes: any = await userApi.getProfile();
      setProfile(profileRes);

      // Điền sẵn form chỉnh sửa
      setEditName(profileRes.displayName);
      setEditBio(profileRes.bio || '');
      setEditAvatar(profileRes.avatarUrl || '');
      setEditUsername(profileRes.username || '');
      setEditDob(profileRes.dob || '');

      // Tải banner từ localStorage cục bộ
      const storedBanner = localStorage.getItem(`profile_banner_${profileRes.id}`) || '';
      setBannerUrl(storedBanner);
      setEditBanner(storedBanner);

      // 2. Tải số lượng follow/following
      try {
        const followRes: any = await userApi.getFollowStatus(profileRes.id);
        setFollowStats({
          followerCount: followRes.followerCount,
          followingCount: followRes.followingCount
        });
      } catch (followErr) {
        console.warn('Follower service unavailable, falling back to 0', followErr);
        setFollowStats({
          followerCount: 0,
          followingCount: 0
        });
      }

    } catch (err) {
      console.error('Failed to load profile details', err);
      setError('Không thể tải thông tin hồ sơ của bạn.');
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async () => {
    if (!profile) return;
    setLoadingPosts(true);
    try {
      if (activeTab === 'posts' || activeTab === 'articles') {
        const res: any = await articleApi.getMine(0, 50);
        setPosts(res.content || []);
      } else if (activeTab === 'likes') {
        const liked = JSON.parse(localStorage.getItem(`liked_posts_${profile.id}`) || '[]');
        setLikedPosts([...liked].reverse());
      } else if (activeTab === 'reposts') {
        const reposted = JSON.parse(localStorage.getItem(`reposts_${profile.id}`) || '[]');
        setRepostedPosts([...reposted].reverse());
      }
    } catch (err) {
      console.error('Error fetching tab data', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Cập nhật thông tin profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToastMessage('Tên hiển thị không được để trống.', 'error');
      return;
    }
    if (!editUsername.trim()) {
      showToastMessage('Tên tài khoản (username) không được để trống.', 'error');
      return;
    }

    // Kiểm tra định dạng username (chỉ cho phép chữ thường, số và dấu gạch dưới từ 3-30 ký tự)
    const usernameRegex = /^[a-z0-9_]{3,30}$/;
    if (!usernameRegex.test(editUsername.trim())) {
      showToastMessage('Username chỉ được dùng chữ thường, số, dấu gạch dưới (từ 3-30 ký tự).', 'error');
      return;
    }

    setUpdating(true);
    try {
      const res: any = await userApi.updateProfile({
        displayName: editName.trim(),
        bio: editBio.trim(),
        avatarUrl: editAvatar.trim(),
        username: editUsername.trim().toLowerCase(),
        dob: editDob.trim()
      });

      // Lưu bannerUrl vào localStorage
      if (profile) {
        localStorage.setItem(`profile_banner_${profile.id}`, editBanner.trim());
        setBannerUrl(editBanner.trim());
      }

      setProfile(res);
      setIsEditing(false);
      showToastMessage('Cập nhật hồ sơ thành công!');
      
      // Load lại dữ liệu follow và bài đăng để đồng bộ
      loadProfileData();
    } catch (err: any) {
      console.error('Failed to update profile', err);
      const serverMsg = err.response?.data?.message || 'Cập nhật hồ sơ thất bại.';
      showToastMessage(serverMsg, 'error');
    } finally {
      setUpdating(false);
    }
  };

  // Helper format Joined Date
  const formatJoinedDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      month: 'long',
      year: 'numeric'
    });
  };

  // Helper format DOB
  const formatDobDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Tương tác follow gợi ý
  const handleFollowSuggestion = async (id: string) => {
    try {
      const target = whoToFollow.find(item => item.id === id);
      if (!target) return;

      const nextFollowing = !target.following;

      // Giả lập cập nhật trạng thái UI gợi ý
      setWhoToFollow(prev => prev.map(item => {
        if (item.id === id) {
          return { ...item, following: nextFollowing };
        }
        return item;
      }));

      // Đồng thời tăng/giảm realtime số lượng Following của tài khoản hiện tại trên giao diện
      setFollowStats(prev => ({
        ...prev,
        followingCount: nextFollowing ? prev.followingCount + 1 : prev.followingCount - 1
      }));

      showToastMessage(nextFollowing ? `Đã theo dõi ${target.displayName}` : `Đã bỏ theo dõi ${target.displayName}`);
    } catch (e) {
      console.error(e);
      showToastMessage('Tác vụ thất bại.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto border-x border-gray-800 min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto border-x border-gray-800 min-h-screen bg-background p-8 text-center">
        <p className="text-error mb-4">{error || 'Có lỗi xảy ra.'}</p>
        <button
          onClick={loadProfileData}
          className="px-4 py-2 bg-primary/20 text-primary hover:bg-primary/30 rounded-full transition-colors font-medium cursor-pointer"
        >
          Tải lại trang
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto border-x border-gray-800 min-h-screen bg-background relative text-text-primary">
      {/* Header Profile kiểu X */}
      <div className="px-4 py-2 border-b border-gray-800 sticky top-16 bg-background/85 backdrop-blur-md z-45 flex items-center gap-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white/5 rounded-full text-text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold leading-tight">{profile.displayName}</h1>
          <p className="text-text-secondary text-xs">{posts.length} posts</p>
        </div>
      </div>

      {/* Banner / Ảnh nền */}
      <div className="h-48 w-full bg-surface relative overflow-hidden border-b border-gray-800">
        {bannerUrl ? (
          <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/60 to-purple-600/70" />
        )}
      </div>

      {/* Avatar và nút Chỉnh sửa */}
      <div className="px-4 relative flex justify-between items-end -mt-16 mb-4">
        {/* Avatar tròn đè banner */}
        <div className="w-32 h-32 rounded-full border-4 border-background bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white text-4xl font-bold shadow-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            profile.displayName.substring(0, 2).toUpperCase()
          )}
        </div>

        {/* Nút Edit profile */}
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 border border-gray-700 hover:bg-white/5 text-text-primary font-bold text-[15px] rounded-full transition-all cursor-pointer mb-2"
        >
          Edit profile
        </button>
      </div>

      {/* Thông tin văn bản của User */}
      <div className="px-4 space-y-3">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-2xl font-bold leading-tight">{profile.displayName}</h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
              <Check className="w-3 h-3" /> Get verified
            </span>
          </div>
          <p className="text-text-secondary text-[15px]">@{profile.username || `user_${profile.id.substring(0, 8)}`}</p>
        </div>

        {/* Tiểu sử (Bio) */}
        {profile.bio ? (
          <p className="text-[15px] whitespace-pre-wrap leading-normal">{profile.bio}</p>
        ) : (
          <p className="text-[15px] text-text-secondary italic">Chưa cấu hình tiểu sử. Chọn Edit profile để thêm câu chuyện của bạn.</p>
        )}

        {/* Thông tin metadata (Ngày sinh, Ngày gia nhập) */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-text-secondary text-[14px]">
          {profile.dob && (
            <div className="flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-primary" />
              <span>Sinh ngày {formatDobDate(profile.dob)}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>Đã tham gia {formatJoinedDate(profile.createdAt)}</span>
          </div>
        </div>

        {/* Thống kê Following / Followers */}
        <div className="flex items-center gap-5 text-[14px]">
          <span className="hover:underline cursor-pointer text-text-secondary">
            <strong className="text-text-primary font-bold">{followStats.followingCount}</strong> Following
          </span>
          <span className="hover:underline cursor-pointer text-text-secondary">
            <strong className="text-text-primary font-bold">{followStats.followerCount}</strong> Followers
          </span>
        </div>
      </div>

      {/* Hệ thống Tabs */}
      <div className="flex border-b border-gray-800 mt-4 overflow-x-auto">
        {(['posts', 'reposts', 'highlights', 'articles', 'media', 'likes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 min-w-[80px] py-3.5 text-center font-bold text-[15px] relative hover:bg-white/[0.02] transition-colors cursor-pointer capitalize"
          >
            <span className={activeTab === tab ? 'text-text-primary' : 'text-text-secondary'}>
              {tab}
            </span>
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full mx-3" />
            )}
          </button>
        ))}
      </div>

      {/* Nội dung danh sách theo Tab */}
      <div className="min-h-[200px]">
        {loadingPosts ? (
          <div className="divide-y divide-gray-800 animate-pulse p-4 space-y-4">
            <div className="h-5 bg-white/5 rounded w-1/3" />
            <div className="h-20 bg-white/5 rounded" />
          </div>
        ) : activeTab === 'posts' || activeTab === 'articles' ? (
          posts.length === 0 ? (
            <div className="p-12 text-center text-text-secondary">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">Chưa đăng tải bài viết nào.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {posts.map((art) => (
                <ArticleCard key={art.id} article={art} onRefresh={loadTabData} />
              ))}
            </div>
          )
        ) : activeTab === 'likes' ? (
          likedPosts.length === 0 ? (
            <div className="p-12 text-center text-text-secondary">
              <Heart className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">Chưa thích bài đăng nào.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {likedPosts.map((art) => (
                <ArticleCard key={art.id} article={art} onRefresh={loadTabData} />
              ))}
            </div>
          )
        ) : activeTab === 'reposts' ? (
          repostedPosts.length === 0 ? (
            <div className="p-12 text-center text-text-secondary">
              <Repeat className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">Chưa đăng lại bài viết nào.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {repostedPosts.map((art) => (
                <ArticleCard key={art.id} article={art} onRefresh={loadTabData} />
              ))}
            </div>
          )
        ) : (
          /* Các tab khác (Highlights, Media) */
          <div className="p-12 text-center text-text-secondary flex flex-col items-center justify-center">
            <Globe className="w-10 h-10 mb-3 opacity-30" />
            <h4 className="text-sm font-bold text-text-primary capitalize mb-1">Chưa có {activeTab}</h4>
            <p className="text-xs">Tính năng này đang được phát triển thêm.</p>
          </div>
        )}
      </div>

      {/* MỤC "WHO TO FOLLOW" */}
      <div className="mt-4 border-t border-gray-800 p-4">
        <h3 className="text-lg font-bold mb-4 font-heading text-text-primary">Who to follow</h3>
        <div className="space-y-4">
          {whoToFollow.map(item => (
            <div key={item.id} className="flex justify-between items-start gap-3">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-surface text-primary border border-white/10 flex items-center justify-center font-bold text-sm shrink-0">
                  {item.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-sm text-text-primary hover:underline cursor-pointer">
                      {item.displayName}
                    </span>
                    <span className="inline-flex items-center p-0.5 rounded-full bg-primary/10 text-primary">
                      <Check className="w-3 h-3 fill-current" />
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">{item.handle}</p>
                  <p className="text-xs text-text-primary mt-1 leading-normal">{item.bio}</p>
                </div>
              </div>

              <button
                onClick={() => handleFollowSuggestion(item.id)}
                className={`px-4 py-1.5 font-bold text-xs rounded-full transition-all cursor-pointer shrink-0 ${
                  item.following
                    ? 'border border-gray-700 bg-transparent text-text-primary hover:border-red-500 hover:bg-red-500/10 hover:text-red-400'
                    : 'bg-text-primary text-background hover:opacity-90'
                }`}
              >
                {item.following ? 'Following' : 'Follow'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* POPUP MODAL CHỈNH SỬA HỒ SƠ (EDIT PROFILE MODAL) */}
      {isEditing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface w-full max-w-lg rounded-app border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-text-secondary hover:text-text-primary p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-bold text-text-primary">Chỉnh sửa hồ sơ</h2>
              </div>
              <button
                onClick={handleUpdateProfile}
                disabled={updating || !editName.trim() || !editUsername.trim()}
                className="px-5 py-1.5 bg-text-primary text-background font-bold text-sm rounded-full transition-colors disabled:opacity-50 cursor-pointer"
              >
                {updating ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>

            {/* Modal Content Form */}
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-5 overflow-y-auto flex-1 text-sm">
              {/* Tên hiển thị */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
                  Tên hiển thị <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  maxLength={80}
                  required
                  disabled={updating}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-background border border-gray-700 text-text-primary rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-medium text-sm"
                  placeholder="Nhập tên hiển thị..."
                />
              </div>

              {/* Tên tài khoản (username) */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
                  Tên tài khoản (Username) <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  maxLength={50}
                  required
                  disabled={updating}
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  className="w-full bg-background border border-gray-700 text-text-primary rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-medium text-sm"
                  placeholder="Nhập tên tài khoản (viết liền không dấu)..."
                />
                <p className="text-[11px] text-text-secondary mt-1">Viết liền không dấu, chỉ gồm chữ thường, số và dấu gạch dưới. Không được trùng với người khác.</p>
              </div>

              {/* Ngày sinh */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
                  Ngày sinh (DOB)
                </label>
                <input
                  type="date"
                  disabled={updating}
                  value={editDob}
                  onChange={(e) => setEditDob(e.target.value)}
                  className="w-full bg-background border border-gray-700 text-text-primary rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-medium text-sm"
                />
              </div>

              {/* Tiểu sử */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
                  Tiểu sử (Bio)
                </label>
                <textarea
                  maxLength={500}
                  disabled={updating}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full bg-background border border-gray-700 text-text-primary rounded-lg p-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none placeholder-text-secondary text-sm"
                  placeholder="Giới thiệu đôi chút về bản thân bạn..."
                />
              </div>

              {/* URL Ảnh đại diện */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
                  Link Ảnh đại diện (Avatar URL)
                </label>
                <input
                  type="text"
                  maxLength={500}
                  disabled={updating}
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  className="w-full bg-background border border-gray-700 text-text-primary rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm"
                  placeholder="Nhập URL ảnh đại diện của bạn..."
                />
              </div>

              {/* URL Ảnh nền banner */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
                  Link Ảnh nền (Banner URL)
                </label>
                <input
                  type="text"
                  maxLength={500}
                  disabled={updating}
                  value={editBanner}
                  onChange={(e) => setEditBanner(e.target.value)}
                  className="w-full bg-background border border-gray-700 text-text-primary rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm"
                  placeholder="Nhập URL ảnh nền banner của bạn..."
                />
              </div>
            </form>
          </div>
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

export default Profile;
