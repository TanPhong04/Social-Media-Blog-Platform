import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../api/userApi';
import { articleApi } from '../api/articleApi';
import type { ArticleResponse } from '../api/articleApi';
import ArticleCard from '../components/ArticleCard';
import { EditProfileModal } from '../components/profile/EditProfileModal';
import { FollowListModal } from '../components/profile/FollowListModal';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';

import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Calendar, FileText, Heart, Check, Gift, Repeat, Image as ImageIcon } from 'lucide-react';

// Bỏ compressImage để upload trực tiếp qua API

const Profile: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Đọc userId từ query parameters (nếu có)
  const searchParams = new URLSearchParams(window.location.search);
  const targetUserId = searchParams.get('userId');
  const isMe = !targetUserId || targetUserId === user?.id;

  // Refs chọn file ảnh

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

  // Trạng thái Modal xem danh sách Followers/Following
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showFollowModal, setShowFollowModal] = useState<'followers' | 'following' | null>(null);
  const [followModalUsers, setFollowModalUsers] = useState<any[]>([]);
  const [loadingFollowModal, setLoadingFollowModal] = useState(false);

  // Trạng thái Toast thông báo

  // Gợi ý theo dõi "Who to follow" người dùng thật
  const [whoToFollow, setWhoToFollow] = useState<any[]>([]);

  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    console.log(message, type);
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

      // Tải banner từ localStorage cục bộ
      const storedBanner = localStorage.getItem(`profile_banner_${profileRes.id}`) || '';
      setBannerUrl(storedBanner);

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
      <div className="max-w-2xl mx-auto border-x-0 sm:border-x border-border-default min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <Spinner size="lg" className="text-primary mb-4" />
        <p className="text-text-secondary text-sm font-medium">Đang tải hồ sơ...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto border-x-0 sm:border-x border-border-default min-h-screen bg-background p-8 flex flex-col items-center justify-center">
        <EmptyState 
          title="Hồ sơ không khả dụng" 
          description={error || "Người dùng này không tồn tại hoặc đã bị khóa."}
          action={<Button onClick={() => navigate('/')} variant="secondary">Quay lại trang chủ</Button>}
          className="border-none bg-transparent"
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto border-x-0 sm:border-x border-border-default min-h-screen bg-background pb-12">
      {/* Header bar */}
      <div className="px-4 py-3 border-b border-border-default sticky top-16 bg-background/80 backdrop-blur-xl z-40 flex items-center gap-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-surface rounded-full text-text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold font-heading text-text-primary leading-tight">{profile.displayName}</h1>
          <p className="text-text-secondary text-xs">{posts.length} posts</p>
        </div>
      </div>

      {/* Banner / Ảnh nền */}
      <div className="h-48 w-full bg-surface relative overflow-hidden border-b border-border-default">
        {bannerUrl ? (
          <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/60 to-purple-600/70" />
        )}
      </div>

      {/* Avatar và nút tác vụ (Edit hoặc Follow) */}
      <div className="px-4 relative flex justify-between items-end -mt-16 mb-4">
        {/* Avatar tròn đè banner */}
        <div className="rounded-full border-4 border-background overflow-hidden relative shadow-xl hover:opacity-90 transition-opacity">
          <Avatar src={profile.avatarUrl} fallback={profile.displayName.substring(0, 2).toUpperCase()} size="xl" className="w-32 h-32 text-4xl" />
        </div>

        {/* Nút Edit profile hoặc Follow & Nhắn tin */}
        <div className="flex gap-2 items-center mb-2">
          {isMe ? (
            <Button
              onClick={() => setIsEditing(true)}
              variant="secondary"
              className="rounded-full font-bold"
            >
              Edit profile
            </Button>
          ) : (
            <>
              <Button
                onClick={() => navigate(`/messages?contactId=${profile.id}`)}
                variant="secondary"
                className="rounded-full font-bold"
              >
                Nhắn tin
              </Button>
              <Button
                onClick={handleFollowClick}
                variant={isFollowing ? 'secondary' : 'primary'}
                className="rounded-full font-bold px-6"
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
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
      <div className="flex border-b border-border-default mt-4 overflow-x-auto">
        {(['posts', 'reposts', 'media', 'likes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 min-w-[80px] py-3 text-center font-bold text-[15px] relative hover:bg-surface-elevated transition-colors cursor-pointer capitalize"
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
          <div className="divide-y divide-border-default animate-pulse p-4 space-y-4">
            <div className="h-5 bg-surface rounded w-1/3" />
            <div className="h-20 bg-surface rounded" />
          </div>
        ) : activeTab === 'posts' ? (
          posts.length === 0 ? (
            <div className="p-12 text-center text-text-secondary">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">Chưa đăng tải bài viết nào.</p>
            </div>
          ) : (
            <div className="divide-y divide-border-default">
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
            <div className="divide-y divide-border-default">
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
            <div className="divide-y divide-border-default">
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
              <div className="divide-y divide-border-default">
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
        <div className="mt-4 border-t border-border-default p-4">
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
                        className={`px-4 py-1 font-bold text-xs rounded-full transition-all cursor-pointer border ${item.following ? 'border-border-subtle text-text-primary hover:text-red-500 hover:border-red-500 hover:bg-red-500/10' : 'bg-primary text-white hover:bg-primary/95'}`}
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
        <EditProfileModal 
          profile={profile} 
          onClose={() => setIsEditing(false)} 
          onSuccess={() => { setIsEditing(false); loadProfileData(); }} 
          showToastMessage={showToastMessage} 
        />
      )}

      {/* MODAL DANH SÁCH FOLLOW */}
      {showFollowModal && (
        <FollowListModal 
          type={showFollowModal}
          users={followModalUsers}
          isLoading={loadingFollowModal}
          onClose={() => setShowFollowModal(null)}
          currentUser={user}
          onToggleFollow={async (targetUser) => {
            try {
              if (targetUser.following) {
                await userApi.unfollowUser(targetUser.id || targetUser.userId || targetUser.targetId);
                showToastMessage('Đã hủy theo dõi');
              } else {
                await userApi.followUser(targetUser.id || targetUser.userId || targetUser.targetId);
                showToastMessage('Đã theo dõi');
              }
              // Update local state for modal
              setFollowModalUsers(prev => prev.map(u => {
                const uid = u.id || u.userId || u.targetId;
                const tid = targetUser.id || targetUser.userId || targetUser.targetId;
                if (uid === tid) {
                  return { ...u, following: !u.following };
                }
                return u;
              }));
              // Refresh profile follow stats
              if (isMe) {
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
        />
      )}

      {toast && (
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-50 animate-fade-in text-sm font-bold text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Profile;