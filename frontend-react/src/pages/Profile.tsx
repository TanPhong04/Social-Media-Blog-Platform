import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../api/userApi';
import { articleApi } from '../api/articleApi';
import type { ArticleResponse } from '../api/articleApi';
import { mediaApi } from '../api/mediaApi';
import ArticleCard from '../components/ArticleCard';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Calendar, FileText, Heart, X, Check, Gift, Repeat, Image as ImageIcon, Users } from 'lucide-react';

// Bỏ compressImage để upload trực tiếp qua API

const Profile: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Đọc userId từ query parameters (nếu có)
  const searchParams = new URLSearchParams(window.location.search);
  const targetUserId = searchParams.get('userId');
  const isMe = !targetUserId || targetUserId === user?.id;

  // Refs chọn file ảnh
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Trạng thái hồ sơ
  const [profile, setProfile] = useState<any>(null);
  const [followStats, setFollowStats] = useState({ followerCount: 0, followingCount: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [bannerUrl, setBannerUrl] = useState('');
  
  // Trạng thái danh sách bài viết/likes
  const [posts, setPosts] = useState<ArticleResponse[]>([]);
  const [likedPosts, setLikedPosts] = useState<ArticleResponse[]>([]);
  const [repostedPosts, setRepostedPosts] = useState<ArticleResponse[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Trạng thái tab và loading
  const [activeTab, setActiveTab] = useState<'posts' | 'reposts' | 'media' | 'likes'>('posts');
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

  // Trạng thái Modal xem danh sách Followers/Following
  const [showFollowModal, setShowFollowModal] = useState<'followers' | 'following' | null>(null);
  const [followModalUsers, setFollowModalUsers] = useState<any[]>([]);
  const [loadingFollowModal, setLoadingFollowModal] = useState(false);

  // Trạng thái Toast thông báo
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Gợi ý theo dõi "Who to follow" người dùng thật
  const [whoToFollow, setWhoToFollow] = useState<any[]>([]);

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
  }, [isAuthenticated, window.location.search]);

  useEffect(() => {
    if (profile) {
      loadTabData();
    }
  }, [profile, activeTab]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const effectiveUserId = targetUserId || (user ? user.id : null);
      if (!effectiveUserId) {
        setError('Vui lòng đăng nhập để xem hồ sơ.');
        setLoading(false);
        return;
      }

      // 1. Tải thông tin hồ sơ
      let profileRes: any;
      if (isMe) {
        profileRes = await userApi.getProfile();
      } else {
        profileRes = await userApi.getUserById(effectiveUserId);
      }
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
        setIsFollowing(followRes.following);
      } catch (followErr) {
        console.warn('Follower service unavailable, falling back to 0', followErr);
        setFollowStats({
          followerCount: 0,
          followingCount: 0
        });
        setIsFollowing(false);
      }

      // 3. Tải danh sách gợi ý "Who to follow" người dùng thật
      try {
        const suggestionsRes: any = await userApi.getSuggestions();
        const suggestions = suggestionsRes.data || suggestionsRes || [];
        if (user) {
          const followingRes: any = await userApi.getFollowing(user.id, 0, 100);
          const followingList = followingRes.content || followingRes || [];
          const followingIds = new Set(followingList.map((f: any) => f.id || f.userId || f.targetId));

          const filtered = suggestions.filter((u: any) => u.id !== user.id && !followingIds.has(u.id));
          const mapped = filtered.slice(0, 3).map((u: any) => ({
            id: u.id,
            displayName: u.displayName,
            username: u.username,
            bio: u.bio || 'Chưa có tiểu sử',
            avatarUrl: u.avatarUrl,
            following: false
          }));
          setWhoToFollow(mapped);
        }
      } catch (suggestErr) {
        console.warn('Failed to load real users suggestions', suggestErr);
      }

    } catch (err) {
      console.error('Failed to load profile details', err);
      setError('Không thể tải thông tin hồ sơ của người dùng này.');
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async () => {
    if (!profile) return;
    setLoadingPosts(true);
    try {
      const effectiveUserId = profile.id;
      
      // Tải bài viết của tác giả đó cho tab posts hoặc media hoặc làm dữ liệu giả lập cho reposts/likes
      let fetchedPosts: ArticleResponse[] = [];
      if (isMe) {
        const res: any = await articleApi.getMine(0, 50);
        fetchedPosts = res.content || [];
      } else {
        const res: any = await articleApi.getByAuthor(effectiveUserId, 0, 50);
        fetchedPosts = res.content || [];
      }

      if (activeTab === 'posts' || activeTab === 'media') {
        setPosts(fetchedPosts);
      } else if (activeTab === 'likes') {
        if (isMe) {
          const liked = JSON.parse(localStorage.getItem(`liked_posts_${profile.id}`) || '[]');
          setLikedPosts([...liked].reverse());
        } else {
          // Lấy ngẫu nhiên khoảng 50% số bài viết của tác giả làm bài thích của họ
          const simulatedLikes = fetchedPosts.filter((_, i) => i % 2 === 0);
          setLikedPosts(simulatedLikes);
        }
      } else if (activeTab === 'reposts') {
        if (isMe) {
          const reposted = JSON.parse(localStorage.getItem(`reposts_${profile.id}`) || '[]');
          setRepostedPosts([...reposted].reverse());
        } else {
          // Lấy ngẫu nhiên khoảng 30% số bài viết của tác giả làm bài reposted của họ
          const simulatedReposts = fetchedPosts.filter((_, i) => i % 3 === 0);
          setRepostedPosts(simulatedReposts);
        }
      }
    } catch (err) {
      console.error('Error fetching tab data', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Chọn ảnh từ máy và upload qua MinIO
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToastMessage('Chỉ hỗ trợ file hình ảnh.', 'error');
      return;
    }
    try {
      showToastMessage('Đang tải ảnh lên...', 'success');
      const url = await mediaApi.uploadFile(file);
      setEditAvatar(url);
      showToastMessage('Đã nạp ảnh đại diện mới.');
    } catch (err) {
      console.error(err);
      showToastMessage('Lỗi tải ảnh.', 'error');
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToastMessage('Chỉ hỗ trợ file hình ảnh.', 'error');
      return;
    }
    try {
      showToastMessage('Đang tải ảnh lên...', 'success');
      const url = await mediaApi.uploadFile(file);
      setEditBanner(url);
      showToastMessage('Đã nạp ảnh bìa mới.');
    } catch (err) {
      console.error(err);
      showToastMessage('Lỗi tải ảnh.', 'error');
    }
  };

  // Xử lý cập nhật thông tin hồ sơ
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToastMessage('Tên hiển thị không được bỏ trống.', 'error');
      return;
    }
    if (!editUsername.trim()) {
      showToastMessage('Tên tài khoản không được bỏ trống.', 'error');
      return;
    }

    setUpdating(true);
    try {
      // Gọi API cập nhật lên user-service
      const updateData = {
        displayName: editName.trim(),
        bio: editBio.trim(),
        avatarUrl: editAvatar,
        username: editUsername.trim().toLowerCase(),
        dob: editDob
      };

      const updatedProfile: any = await userApi.updateProfile(updateData);
      setProfile(updatedProfile);

      // Lưu banner vào localStorage
      if (editBanner) {
        localStorage.setItem(`profile_banner_${updatedProfile.id}`, editBanner);
        setBannerUrl(editBanner);
      } else {
        localStorage.removeItem(`profile_banner_${updatedProfile.id}`);
        setBannerUrl('');
      }

      showToastMessage('Cập nhật hồ sơ thành công!');
      setIsEditing(false);

      // Reload lại thông tin
      loadProfileData();
    } catch (err: any) {
      console.error('Update profile failed', err);
      const serverErr = err.response?.data;
      if (serverErr && serverErr.code === 'USERNAME_ALREADY_TAKEN') {
        showToastMessage('Tên tài khoản đã tồn tại. Vui lòng chọn tên khác!', 'error');
      } else {
        showToastMessage(serverErr?.message || 'Cập nhật hồ sơ thất bại.', 'error');
      }
    } finally {
      setUpdating(false);
    }
  };

  // Xử lý click nút Theo dõi (Follow / Unfollow)
  const handleFollowClick = async () => {
    if (!user) {
      showToastMessage('Vui lòng đăng nhập để theo dõi.', 'error');
      return;
    }
    try {
      let res: any;
      if (isFollowing) {
        res = await userApi.unfollowUser(profile.id);
        showToastMessage(`Đã hủy theo dõi @${profile.username || 'user'}`);
      } else {
        res = await userApi.followUser(profile.id);
        showToastMessage(`Đã theo dõi @${profile.username || 'user'}!`);
      }
      setIsFollowing(res.following);
      setFollowStats({
        followerCount: res.followerCount,
        followingCount: res.followingCount
      });
    } catch (err) {
      console.error('Lỗi khi theo dõi', err);
      showToastMessage('Tác vụ theo dõi thất bại.', 'error');
    }
  };

  // Mở modal xem danh sách Followers/Following
  const openFollowModal = async (type: 'followers' | 'following') => {
    if (!profile) return;
    setShowFollowModal(type);
    setLoadingFollowModal(true);
    try {
      let res: any;
      if (type === 'followers') {
        res = await userApi.getFollowers(profile.id, 0, 100);
      } else {
        res = await userApi.getFollowing(profile.id, 0, 100);
      }
      setFollowModalUsers(res.content || []);
    } catch (err) {
      console.error('Lỗi lấy danh sách follow', err);
      showToastMessage('Không thể tải danh sách.', 'error');
    } finally {
      setLoadingFollowModal(false);
    }
  };

  // Helper hiển thị ngày tháng
  const formatJoinedDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDobDate = (dobStr: string) => {
    if (!dobStr) return '';
    const date = new Date(dobStr);
    return date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto border-x border-gray-800 min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary mb-3" />
        <p className="text-text-secondary text-sm">Đang tải hồ sơ...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto border-x border-gray-800 min-h-screen bg-background p-8 text-center">
        <ArrowLeft className="w-6 h-6 text-text-primary mb-6 cursor-pointer hover:text-primary transition-colors" onClick={() => navigate(-1)} />
        <p className="text-error font-semibold text-lg">{error || 'Hồ sơ không khả dụng.'}</p>
        <button onClick={() => navigate('/')} className="mt-4 px-5 py-2 bg-primary text-white font-bold text-sm rounded-full transition-colors">
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto border-x border-gray-800 min-h-screen bg-background pb-12">
      {/* Header bar */}
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

      {/* Avatar và nút tác vụ (Edit hoặc Follow) */}
      <div className="px-4 relative flex justify-between items-end -mt-16 mb-4">
        {/* Avatar tròn đè banner */}
        <div className="w-32 h-32 rounded-full border-4 border-background bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white text-4xl font-bold shadow-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity overflow-hidden">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            profile.displayName.substring(0, 2).toUpperCase()
          )}
        </div>

        {/* Nút Edit profile hoặc Follow & Nhắn tin */}
        <div className="flex gap-2 items-center mb-2">
          {isMe ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 border border-gray-700 hover:bg-white/5 text-text-primary font-bold text-[15px] rounded-full transition-all cursor-pointer"
            >
              Edit profile
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate(`/messages?contactId=${profile.id}`)}
                className="px-4 py-2 border border-gray-700 hover:bg-white/5 text-text-primary font-bold text-[15px] rounded-full transition-all cursor-pointer"
              >
                Nhắn tin
              </button>
              <button
                onClick={handleFollowClick}
                className={`px-5 py-2 font-bold text-[15px] rounded-full transition-all cursor-pointer shadow-md ${isFollowing ? 'border border-gray-700 hover:border-red-500 hover:bg-red-500/10 hover:text-red-500 text-text-primary' : 'bg-primary hover:bg-primary/95 text-white'}`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </>
          )}
        </div>
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

        {/* Thống kê Following / Followers (Có thể click để mở Modal xem danh sách) */}
        <div className="flex items-center gap-5 text-[14px]">
          <span onClick={() => openFollowModal('following')} className="hover:underline cursor-pointer text-text-secondary">
            <strong className="text-text-primary font-bold">{followStats.followingCount}</strong> Following
          </span>
          <span onClick={() => openFollowModal('followers')} className="hover:underline cursor-pointer text-text-secondary">
            <strong className="text-text-primary font-bold">{followStats.followerCount}</strong> Followers
          </span>
        </div>
      </div>

      {/* Hệ thống Tabs */}
      <div className="flex border-b border-gray-800 mt-4 overflow-x-auto">
        {(['posts', 'reposts', 'media', 'likes'] as const).map((tab) => (
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
        ) : activeTab === 'posts' ? (
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
        ) : activeTab === 'media' ? (
          (() => {
            const mediaOnly = posts.filter(art => {
              const content = art.content;
              return content.includes('![image]') || 
                     content.includes('![comment_image]') || 
                     content.includes('<video') || 
                     /!\[.*?\]\((http.*?|data:.*?)\)/.test(content) ||
                     /<img.*?src=/.test(content);
            });
            return mediaOnly.length === 0 ? (
              <div className="p-12 text-center text-text-secondary">
                <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-semibold">Chưa đăng ảnh hoặc video nào.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {mediaOnly.map((art) => (
                  <ArticleCard key={art.id} article={art} onRefresh={loadTabData} />
                ))}
              </div>
            );
          })()
        ) : null}
      </div>

      {/* MỤC "WHO TO FOLLOW" */}
      {whoToFollow.length > 0 && (
        <div className="mt-4 border-t border-gray-800 p-4">
          <h3 className="text-lg font-bold mb-4 font-heading text-text-primary">Who to follow</h3>
          <div className="space-y-4">
            {whoToFollow.map(item => {
              const initials = item.displayName.substring(0, 2).toUpperCase();
              return (
                <div key={item.id} className="flex gap-3 text-[14px]">
                  {/* Avatar gợi ý - Click để xem Profile */}
                  <div 
                    onClick={() => navigate(`/profile?userId=${item.id}`)}
                    className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 overflow-hidden flex items-center justify-center text-white font-bold shadow-md cursor-pointer hover:opacity-90 transition-opacity shrink-0"
                  >
                    {item.avatarUrl ? (
                      <img src={item.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <h4 
                          onClick={() => navigate(`/profile?userId=${item.id}`)}
                          className="font-bold text-text-primary truncate hover:underline cursor-pointer"
                        >
                          {item.displayName}
                        </h4>
                        <p className="text-text-secondary text-xs truncate">@{item.username}</p>
                      </div>
                      <button 
                        onClick={async () => {
                          try {
                            if (item.following) {
                              await userApi.unfollowUser(item.id);
                              showToastMessage(`Đã bỏ theo dõi @${item.username}`);
                            } else {
                              await userApi.followUser(item.id);
                              showToastMessage(`Đã theo dõi @${item.username}!`);
                            }
                            setWhoToFollow(prev => prev.map(u => u.id === item.id ? { ...u, following: !u.following } : u));
                            if (isMe) {
                              // Tải lại follower/following stats
                              const followRes: any = await userApi.getFollowStatus(profile.id);
                              setFollowStats({
                                followerCount: followRes.followerCount,
                                followingCount: followRes.followingCount
                              });
                            }
                          } catch (err) {
                            showToastMessage('Thao tác thất bại.', 'error');
                          }
                        }}
                        className={`px-4 py-1 font-bold text-xs rounded-full transition-all cursor-pointer border ${item.following ? 'border-gray-700 text-text-primary hover:text-red-500 hover:border-red-500 hover:bg-red-500/10' : 'bg-primary text-white hover:bg-primary/95'}`}
                      >
                        {item.following ? 'Following' : 'Follow'}
                      </button>
                    </div>
                    <p className="text-text-secondary text-xs mt-1 leading-normal break-words">{item.bio}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL CẬP NHẬT HỒ SƠ (EDIT PROFILE MODAL) */}
      {isEditing && (
        <div className="fixed inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface w-full max-w-md rounded-app border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="text-lg font-bold text-text-primary">Edit profile</h2>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-text-secondary hover:text-text-primary p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Vùng chọn banner trong form */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-text-secondary uppercase">Ảnh bìa (Banner)</label>
                <div 
                  onClick={() => bannerInputRef.current?.click()}
                  className="h-28 w-full rounded-xl border border-dashed border-gray-700 bg-background flex flex-col items-center justify-center text-text-secondary cursor-pointer hover:border-primary hover:bg-white/[0.02] transition-all overflow-hidden"
                >
                  {editBanner ? (
                    <img src={editBanner} alt="Banner Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6 mb-1 text-primary" />
                      <span className="text-xs">Nhấp để chọn ảnh bìa mới</span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  ref={bannerInputRef}
                  onChange={handleBannerChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Vùng chọn avatar trong form */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-text-secondary uppercase">Ảnh đại diện (Avatar)</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white text-xl font-bold overflow-hidden shrink-0 border border-gray-800">
                    {editAvatar ? (
                      <img src={editAvatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                      editName.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="px-4 py-1.5 border border-gray-700 hover:bg-white/5 text-text-primary text-xs font-semibold rounded-full transition-all cursor-pointer"
                  >
                    Thay đổi hình ảnh
                  </button>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Tên hiển thị (displayName) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-text-secondary uppercase">Tên hiển thị</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={updating}
                  className="w-full bg-background border border-gray-700 text-text-primary rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="Tên của bạn"
                />
              </div>

              {/* Tên tài khoản (username - không trùng) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-text-secondary uppercase">Tên tài khoản (username)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2 text-text-secondary text-sm">@</span>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    disabled={updating}
                    className="w-full bg-background border border-gray-700 text-text-primary rounded-lg pl-8 pr-3.5 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                    placeholder="username"
                  />
                </div>
                <p className="text-[10px] text-text-secondary">Tên tài khoản viết liền không dấu, là định danh duy nhất (không được trùng).</p>
              </div>

              {/* Ngày sinh (dob) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-text-secondary uppercase">Ngày sinh (DOB)</label>
                <input
                  type="date"
                  value={editDob}
                  onChange={(e) => setEditDob(e.target.value)}
                  disabled={updating}
                  className="w-full bg-background border border-gray-700 text-text-primary rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Tiểu sử (bio) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-text-secondary uppercase">Tiểu sử (Bio)</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  disabled={updating}
                  rows={3}
                  className="w-full bg-background border border-gray-700 text-text-primary rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                  placeholder="Giới thiệu đôi nét về bản thân của bạn..."
                />
              </div>

              {/* Nút lưu */}
              <div className="flex justify-end pt-2 border-t border-gray-800/80 gap-3">
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-text-primary text-sm font-semibold rounded-full transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 bg-primary hover:bg-primary/95 text-white text-sm font-bold rounded-full transition-colors cursor-pointer"
                >
                  {updating ? 'Đang lưu...' : 'Lưu hồ sơ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM DANH SÁCH FOLLOWERS / FOLLOWING */}
      {showFollowModal && (
        <div className="fixed inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface w-full max-w-sm rounded-app border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-primary" />
                <span className="capitalize">{showFollowModal === 'followers' ? 'Người theo dõi' : 'Đang theo dõi'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowFollowModal(null)}
                className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingFollowModal ? (
                <div className="text-center py-6 text-text-secondary text-sm animate-pulse">
                  Đang tải danh sách...
                </div>
              ) : followModalUsers.length === 0 ? (
                <div className="text-center py-6 text-text-secondary text-sm italic">
                  Danh sách này hiện đang trống.
                </div>
              ) : (
                <div className="space-y-2">
                  {followModalUsers.map((item) => {
                    const initials = item.displayName.substring(0, 2).toUpperCase();
                    return (
                      <div
                        key={item.userId}
                        onClick={() => {
                          setShowFollowModal(null);
                          navigate(`/profile?userId=${item.userId}`);
                        }}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-gray-800/40"
                      >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white text-xs font-semibold overflow-hidden shadow">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-text-primary text-sm truncate hover:underline">{item.displayName}</div>
                          <div className="text-text-secondary text-[11px] truncate">Xem hồ sơ cá nhân</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
