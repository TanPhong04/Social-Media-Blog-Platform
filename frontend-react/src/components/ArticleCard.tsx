import React, { useState, useRef, useEffect } from 'react';
import type { ArticleResponse } from '../api/articleApi';
import { articleApi } from '../api/articleApi';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Heart, Bookmark, Share2, MoreHorizontal, Edit3, Trash2, X, Check } from 'lucide-react';

interface ArticleCardProps {
  article: ArticleResponse;
  onRefresh?: () => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onRefresh }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  
  // Trạng thái cho Dropdown Menu tác vụ
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Trạng thái cho Bookmark (localStorage)
  const [bookmarked, setBookmarked] = useState(false);

  // Trạng thái cho Modal Chỉnh sửa bài đăng
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(article.content);
  const [updating, setUpdating] = useState(false);

  // Trạng thái Toast thông báo thành công / lỗi
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  // Đọc trạng thái like thực tế từ backend
  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!user) return;
      try {
        const res: any = await articleApi.getArticleInteraction(article.id);
        setLiked(res.likedByCurrentUser);
        setLikeCount(res.count);
      } catch (err) {
        console.error('Lỗi khi fetch status like', err);
      }
    };
    fetchLikeStatus();
  }, [article.id, user]);

  // Đọc trạng thái bookmark khi mount
  useEffect(() => {
    if (user) {
      try {
        const bookmarks = JSON.parse(localStorage.getItem(`bookmarks_${user.id}`) || '[]');
        setBookmarked(bookmarks.some((b: any) => b.id === article.id));
      } catch (e) {
        setBookmarked(false);
      }
    }
  }, [article.id, user]);

  // Click ra ngoài đóng dropdown menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format ngày giờ thân thiện kiểu MXH
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'short'
    });
  };

  // Hàm highlight các hashtag trong nội dung
  const renderHighlightedContent = (text: string) => {
    if (!text) return null;
    const words = text.split(/(\s+)/);
    return words.map((word, index) => {
      if (word.startsWith('#') && word.length > 1) {
        return (
          <span
            key={index}
            className="text-primary hover:underline cursor-pointer font-medium transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {word}
          </span>
        );
      }
      return word;
    });
  };

  // Gọi API tương tác Like/Unlike và cập nhật local storage cho tab Likes
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      showToastMessage('Vui lòng đăng nhập để thích bài viết.', 'error');
      return;
    }

    const nextLiked = !liked;
    // Optimistic UI Update
    setLiked(nextLiked);
    setLikeCount(prev => nextLiked ? prev + 1 : prev - 1);

    try {
      if (nextLiked) {
        await articleApi.likeArticle(article.id);
      } else {
        await articleApi.unlikeArticle(article.id);
      }

      // Lưu trữ/Gỡ bỏ bài viết đã like ở localStorage của người dùng
      const likedKey = `liked_posts_${user.id}`;
      const likedList = JSON.parse(localStorage.getItem(likedKey) || '[]');
      let newLikedList;

      if (!nextLiked) {
        newLikedList = likedList.filter((b: any) => b.id !== article.id);
      } else {
        if (!likedList.some((b: any) => b.id === article.id)) {
          newLikedList = [...likedList, article];
        } else {
          newLikedList = likedList;
        }
      }
      localStorage.setItem(likedKey, JSON.stringify(newLikedList));

      // Refresh UI nếu đây là view đang hiển thị tab Likes
      if (onRefresh && !nextLiked) {
        setTimeout(() => {
          onRefresh();
        }, 400);
      }
    } catch (err) {
      console.error('Error liking/unliking article', err);
      // Revert UI state if error
      setLiked(liked);
      setLikeCount(prev => liked ? prev + 1 : prev - 1);
      showToastMessage('Không thể thực hiện tương tác thích.', 'error');
    }
  };

  // Xử lý lưu nguyên object bài viết vào localStorage
  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      showToastMessage('Vui lòng đăng nhập để lưu bài viết.', 'error');
      return;
    }

    try {
      const storageKey = `bookmarks_${user.id}`;
      const bookmarks = JSON.parse(localStorage.getItem(storageKey) || '[]');
      let newBookmarks;

      if (bookmarked) {
        newBookmarks = bookmarks.filter((b: any) => b.id !== article.id);
        showToastMessage('Đã bỏ lưu bài viết!');
      } else {
        newBookmarks = [...bookmarks, article];
        showToastMessage('Đã lưu bài viết thành công!');
      }

      localStorage.setItem(storageKey, JSON.stringify(newBookmarks));
      setBookmarked(!bookmarked);

      // Nếu parent là Bookmarks, bỏ lưu cần cập nhật UI nhanh
      if (onRefresh) {
        setTimeout(() => {
          onRefresh();
        }, 400);
      }
    } catch (err) {
      console.error('Error handling bookmark', err);
      showToastMessage('Thao tác lưu thất bại.', 'error');
    } finally {
      setShowDropdown(false);
    }
  };

  // Xử lý xóa bài viết và cập nhật local bookmarks, liked_posts
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) return;

    try {
      await articleApi.deleteArticle(article.id);
      showToastMessage('Xóa bài đăng thành công!');

      // Xóa khỏi bookmarks trong localStorage nếu bài đăng bị xóa
      if (user) {
        const storageKey = `bookmarks_${user.id}`;
        const bookmarks = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const newBookmarks = bookmarks.filter((b: any) => b.id !== article.id);
        localStorage.setItem(storageKey, JSON.stringify(newBookmarks));

        // Xóa khỏi liked_posts trong localStorage nếu bài đăng bị xóa
        const likedKey = `liked_posts_${user.id}`;
        const likedList = JSON.parse(localStorage.getItem(likedKey) || '[]');
        const newLikedList = likedList.filter((b: any) => b.id !== article.id);
        localStorage.setItem(likedKey, JSON.stringify(newLikedList));
      }

      // Kích hoạt callback UI reload sau 500ms
      setTimeout(() => {
        if (onRefresh) onRefresh();
      }, 500);
    } catch (err) {
      console.error('Error deleting article', err);
      showToastMessage('Xóa bài đăng thất bại.', 'error');
    } finally {
      setShowDropdown(false);
    }
  };

  // Xử lý cập nhật bài viết và đồng bộ bookmarks, liked_posts
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim()) return;

    setUpdating(true);
    const lines = editContent.trim().split('\n');
    const firstLine = lines[0].trim();
    const title = firstLine.substring(0, 100) || article.title;

    const hashtagRegex = /#(\w+)/g;
    const tags: string[] = [];
    let match;
    while ((match = hashtagRegex.exec(editContent)) !== null) {
      tags.push(match[1]);
    }

    const summary = editContent.substring(0, 150) + (editContent.length > 150 ? '...' : '');

    try {
      await articleApi.updateArticle(article.id, {
        title,
        summary,
        content: editContent.trim(),
        tags
      });

      // Đồng bộ nội dung mới vào danh sách bookmarks ở localStorage nếu có
      if (user) {
        const storageKey = `bookmarks_${user.id}`;
        const bookmarks = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const updatedBookmarks = bookmarks.map((b: any) => {
          if (b.id === article.id) {
            return {
              ...b,
              title,
              summary,
              content: editContent.trim(),
              tags,
              updatedAt: new Date().toISOString()
            };
          }
          return b;
        });
        localStorage.setItem(storageKey, JSON.stringify(updatedBookmarks));

        // Đồng bộ nội dung mới vào danh sách liked_posts ở localStorage nếu có
        const likedKey = `liked_posts_${user.id}`;
        const likedList = JSON.parse(localStorage.getItem(likedKey) || '[]');
        const updatedLiked = likedList.map((b: any) => {
          if (b.id === article.id) {
            return {
              ...b,
              title,
              summary,
              content: editContent.trim(),
              tags,
              updatedAt: new Date().toISOString()
            };
          }
          return b;
        });
        localStorage.setItem(likedKey, JSON.stringify(updatedLiked));
      }

      showToastMessage('Cập nhật bài viết thành công!');
      setIsEditing(false);

      // Kích hoạt callback reload sau 500ms
      setTimeout(() => {
        if (onRefresh) onRefresh();
      }, 500);
    } catch (err) {
      console.error('Error updating article', err);
      showToastMessage('Cập nhật thất bại.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const isOwner = user && user.id === article.authorId;
  const authorInitials = article.authorId.substring(0, 2).toUpperCase();
  const authorHandle = `@user_${article.authorId.substring(0, 8)}`;

  return (
    <div className="bg-surface p-4 border-b border-gray-800 hover:bg-white/[0.01] transition-colors duration-200 flex gap-3 animate-fade-in text-[15px] relative">
      {/* Cột bên trái: Avatar tròn */}
      <div className="shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-md cursor-pointer hover:opacity-90 transition-opacity">
          {authorInitials}
        </div>
      </div>

      {/* Cột bên phải: Nội dung */}
      <div className="flex-1 min-w-0">
        {/* Header: Tác giả và nút tác vụ */}
        <div className="flex items-center justify-between relative">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-text-primary hover:underline cursor-pointer">
              Tác giả {article.authorId.substring(0, 4)}
            </span>
            <span className="text-text-secondary text-sm">
              {authorHandle}
            </span>
            <span className="text-text-secondary text-sm">·</span>
            <span className="text-text-secondary text-sm">
              {formatTime(article.publishedAt || article.createdAt)}
            </span>
          </div>

          {/* Nút tác vụ ba chấm và Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              className="text-text-secondary hover:text-primary p-1.5 rounded-full hover:bg-primary/10 transition-colors cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-1 w-48 bg-surface border border-gray-800 rounded-lg shadow-xl py-1.5 z-30 animate-fade-in text-sm">
                {/* Hành động Bookmark */}
                <button
                  onClick={handleBookmark}
                  className="flex items-center gap-2.5 w-full text-left px-4 py-2 hover:bg-white/5 text-text-primary transition-colors cursor-pointer"
                >
                  <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-primary text-primary' : 'text-text-secondary'}`} />
                  <span>{bookmarked ? 'Bỏ lưu bài viết' : 'Thêm vào đã lưu'}</span>
                </button>

                {/* Các hành động chỉ dành cho chủ bài viết (Chỉnh sửa / Xóa) */}
                {isOwner && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                        setShowDropdown(false);
                      }}
                      className="flex items-center gap-2.5 w-full text-left px-4 py-2 hover:bg-white/5 text-text-primary transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4 text-text-secondary" />
                      <span>Chỉnh sửa bài đăng</span>
                    </button>
                    <div className="border-t border-gray-800/80 my-1" />
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-2.5 w-full text-left px-4 py-2 hover:bg-red-500/5 text-red-500 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Xóa bài đăng</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Body: Nội dung bài viết */}
        <div className="mt-1 space-y-1 text-text-primary whitespace-pre-wrap break-words leading-normal">
          {article.title && !article.content.startsWith(article.title) && (
            <h3 className="font-bold text-base mb-1 text-text-primary">
              {article.title}
            </h3>
          )}
          <p className="text-text-primary">
            {renderHighlightedContent(article.content)}
          </p>
        </div>

        {/* Footer: Hộp tương tác */}
        <div className="flex justify-between items-center max-w-md mt-3 text-text-secondary text-[13px] -ml-2">
          {/* Comment */}
          <button className="flex items-center gap-1.5 hover:text-primary group p-2 rounded-full hover:bg-primary/10 transition-all cursor-pointer">
            <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>{Math.floor(Math.random() * 15)}</span>
          </button>

          {/* Like */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 hover:text-red-500 group p-2 rounded-full hover:bg-red-500/10 transition-all cursor-pointer ${liked ? 'text-red-500' : ''}`}
          >
            <Heart className={`w-4 h-4 group-hover:scale-110 transition-transform ${liked ? 'fill-current' : ''}`} />
            <span>{likeCount}</span>
          </button>

          {/* Quick Bookmark (icon dưới footer đồng bộ) */}
          <button
            onClick={handleBookmark}
            className={`flex items-center gap-1.5 hover:text-blue-500 group p-2 rounded-full hover:bg-blue-500/10 transition-all cursor-pointer ${bookmarked ? 'text-blue-500' : ''}`}
          >
            <Bookmark className={`w-4 h-4 group-hover:scale-110 transition-transform ${bookmarked ? 'fill-current animate-pulse' : ''}`} />
          </button>

          {/* Share */}
          <button className="flex items-center gap-1.5 hover:text-green-500 group p-2 rounded-full hover:bg-green-500/10 transition-all cursor-pointer">
            <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* MODAL CHỈNH SỬA BÀI VIẾT (EDIT MODAL) */}
      {isEditing && (
        <div className="fixed inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface w-full max-w-lg rounded-app border border-gray-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="text-lg font-bold text-text-primary">Chỉnh sửa bài đăng</h2>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(article.content);
                }}
                className="text-text-secondary hover:text-text-primary p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdate}>
              <div className="p-6">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  disabled={updating}
                  rows={6}
                  className="w-full bg-background border border-gray-700 text-text-primary rounded-lg p-3 text-[15px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none placeholder-text-secondary"
                  placeholder="Nội dung bài viết mới..."
                />
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end items-center gap-3 px-6 py-4 bg-background border-t border-gray-800/80">
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(article.content);
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-text-primary text-sm font-semibold rounded-full transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updating || !editContent.trim() || editContent === article.content}
                  className="px-5 py-2 bg-primary hover:bg-primary/95 text-white text-sm font-bold rounded-full transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {updating ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
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

export default ArticleCard;
