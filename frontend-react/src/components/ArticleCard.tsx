import React, { useState, useRef, useEffect } from 'react';
import type { ArticleResponse } from '../api/articleApi';
import { articleApi } from '../api/articleApi';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Heart, Bookmark, Share2, MoreHorizontal, Edit3, Trash2, X, Check, Image as ImageIcon } from 'lucide-react';

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
  const [editContent, setEditContent] = useState('');
  const [updating, setUpdating] = useState(false);

  // Trạng thái tệp đính kèm khi chỉnh sửa (Ảnh/Video)
  const [editFile, setEditFile] = useState<{
    url: string;
    base64: string;
    type: 'image' | 'video';
  } | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Trạng thái Toast thông báo thành công / lỗi
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  // Helper: Đổi file sang Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Helper: Nén hình ảnh dùng Canvas
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          resolve(dataUrl);
        };
      };
    });
  };

  // Helper: Đo thời lượng video
  const checkVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  // Tự động phân tách phần text và tệp đính kèm khi mở Modal Chỉnh sửa
  useEffect(() => {
    if (isEditing) {
      let text = article.content;
      let fileData: any = null;

      // Tìm ảnh nhúng Base64: ![image](data:...)
      const imgMatch = article.content.match(/!\[image\]\((data:image\/[^;]+;base64,[^\)]+)\)/);
      if (imgMatch) {
        fileData = {
          url: imgMatch[1],
          base64: imgMatch[1],
          type: 'image'
        };
        text = text.replace(imgMatch[0], '');
      }

      // Tìm video nhúng HTML base64: <video src="..."></video>
      const videoMatch = article.content.match(/<video src="([^"]+)"[^>]*><\/video>/);
      if (videoMatch) {
        fileData = {
          url: videoMatch[1],
          base64: videoMatch[1],
          type: 'video'
        };
        text = text.replace(videoMatch[0], '');
      }

      setEditContent(text.trim());
      setEditFile(fileData);
    } else {
      // Hủy URL Blob tạm thời của file chỉnh sửa nếu có khi đóng Modal
      if (editFile && editFile.url && editFile.url.startsWith('blob:')) {
        URL.revokeObjectURL(editFile.url);
      }
      setEditFile(null);
    }
  }, [isEditing, article.content]);

  // Đọc trạng thái like thực tế từ backend
  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!user) return;
      try {
        const res: any = await articleApi.getArticleInteraction(article.id);
        setLiked(res.likedByCurrentUser);
        setLikeCount(res.count);
      } catch (err) {
        console.warn('Interaction service unavailable, falling back to mock likes', err);
        setLikeCount(Math.floor(Math.random() * 30) + 5);
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

  // Hàm phân tích và hiển thị nội dung kèm Media Base64 nhúng
  const renderContentWithMedia = (content: string) => {
    if (!content) return null;

    let textToShow = content;
    let imageSrc = '';
    let videoSrc = '';

    // Phát hiện ảnh nhúng Markdown base64: ![image](data:...)
    const imgMatch = content.match(/!\[image\]\((data:image\/[^;]+;base64,[^\)]+)\)/);
    if (imgMatch) {
      imageSrc = imgMatch[1];
      textToShow = textToShow.replace(imgMatch[0], '');
    }

    // Phát hiện video nhúng HTML tag base64: <video src="..."></video>
    const videoMatch = content.match(/<video src="([^"]+)"[^>]*><\/video>/);
    if (videoMatch) {
      videoSrc = videoMatch[1];
      textToShow = textToShow.replace(videoMatch[0], '');
    }

    return (
      <div className="space-y-2.5">
        {textToShow.trim() && (
          <p className="text-text-primary text-[15px] whitespace-pre-wrap break-words leading-normal">
            {renderHighlightedContent(textToShow.trim())}
          </p>
        )}

        {imageSrc && (
          <div className="rounded-app overflow-hidden border border-gray-800 bg-black/20 max-h-[450px] flex items-center justify-center mt-2">
            <img
              src={imageSrc}
              alt="Attachment"
              className="max-h-[450px] max-w-full object-contain rounded-app hover:opacity-95 transition-opacity cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {videoSrc && (
          <div className="rounded-app overflow-hidden border border-gray-800 bg-black/20 max-h-[450px] flex items-center justify-center mt-2" onClick={(e) => e.stopPropagation()}>
            <video
              src={videoSrc}
              controls
              className="max-h-[450px] max-w-full object-contain rounded-app"
            />
          </div>
        )}
      </div>
    );
  };

  // Gọi API tương tác Like/Unlike và cập nhật local storage cho tab Likes
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      showToastMessage('Vui lòng đăng nhập để thích bài viết.', 'error');
      return;
    }

    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount(prev => nextLiked ? prev + 1 : prev - 1);

    try {
      if (nextLiked) {
        await articleApi.likeArticle(article.id);
      } else {
        await articleApi.unlikeArticle(article.id);
      }

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

      if (onRefresh && !nextLiked) {
        setTimeout(() => {
          onRefresh();
        }, 400);
      }
    } catch (err) {
      console.error('Error liking/unliking article', err);
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

      if (user) {
        const storageKey = `bookmarks_${user.id}`;
        const bookmarks = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const newBookmarks = bookmarks.filter((b: any) => b.id !== article.id);
        localStorage.setItem(storageKey, JSON.stringify(newBookmarks));

        const likedKey = `liked_posts_${user.id}`;
        const likedList = JSON.parse(localStorage.getItem(likedKey) || '[]');
        const newLikedList = likedList.filter((b: any) => b.id !== article.id);
        localStorage.setItem(likedKey, JSON.stringify(newLikedList));
      }

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

  // Xử lý khi chọn file trong Modal chỉnh sửa
  const handleEditFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      showToastMessage('Chỉ cho phép tải lên hình ảnh hoặc video.', 'error');
      return;
    }

    if (isVideo) {
      try {
        const duration = await checkVideoDuration(file);
        if (duration > 120) {
          showToastMessage('Thời lượng video phải dưới 2 phút!', 'error');
          return;
        }
      } catch (err) {
        console.error(err);
        showToastMessage('Không thể kiểm tra thời lượng video.', 'error');
        return;
      }
    }

    try {
      // Giải phóng URL Blob cũ nếu có
      if (editFile && editFile.url && editFile.url.startsWith('blob:')) {
        URL.revokeObjectURL(editFile.url);
      }

      let base64 = '';
      if (isImage) {
        base64 = await compressImage(file);
      } else {
        base64 = await fileToBase64(file);
      }
      const url = URL.createObjectURL(file);
      setEditFile({
        url,
        base64,
        type: isImage ? 'image' : 'video'
      });
    } catch (err) {
      console.error(err);
      showToastMessage('Lỗi đọc file.', 'error');
    }
  };

  const handleRemoveEditFile = () => {
    if (editFile && editFile.url && editFile.url.startsWith('blob:')) {
      URL.revokeObjectURL(editFile.url);
    }
    setEditFile(null);
    if (editFileInputRef.current) editFileInputRef.current.value = '';
  };

  // Xử lý cập nhật bài viết và đồng bộ bookmarks, liked_posts
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim() && !editFile) return;

    setUpdating(true);
    
    // Tách dòng đầu làm tiêu đề
    const lines = editContent.trim().split('\n');
    const firstLine = lines[0].trim();
    const title = firstLine.substring(0, 100) || (editFile?.type === 'image' ? 'Hình ảnh mới' : 'Video mới');

    const hashtagRegex = /#(\w+)/g;
    const tags: string[] = [];
    let match;
    while ((match = hashtagRegex.exec(editContent)) !== null) {
      tags.push(match[1]);
    }

    const summary = editContent.substring(0, 150) + (editContent.length > 150 ? '...' : '');

    // Nhúng mã Base64 vào nội dung gửi lên backend
    let mediaEmbed = '';
    if (editFile) {
      if (editFile.type === 'image') {
        mediaEmbed = `\n\n![image](${editFile.base64})`;
      } else {
        mediaEmbed = `\n\n<video src="${editFile.base64}" controls class="rounded-app w-full max-h-[450px] mt-2 bg-black"></video>`;
      }
    }

    const finalContent = editContent.trim() + mediaEmbed;

    try {
      await articleApi.updateArticle(article.id, {
        title,
        summary,
        content: finalContent,
        tags
      });

      // Giải phóng URL Blob tạm thời của file
      if (editFile && editFile.url && editFile.url.startsWith('blob:')) {
        URL.revokeObjectURL(editFile.url);
      }

      // Đồng bộ vào localStorage bookmarks
      if (user) {
        const storageKey = `bookmarks_${user.id}`;
        const bookmarks = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const updatedBookmarks = bookmarks.map((b: any) => {
          if (b.id === article.id) {
            return {
              ...b,
              title,
              summary,
              content: finalContent,
              tags,
              updatedAt: new Date().toISOString()
            };
          }
          return b;
        });
        localStorage.setItem(storageKey, JSON.stringify(updatedBookmarks));

        // Đồng bộ vào localStorage liked_posts
        const likedKey = `liked_posts_${user.id}`;
        const likedList = JSON.parse(localStorage.getItem(likedKey) || '[]');
        const updatedLiked = likedList.map((b: any) => {
          if (b.id === article.id) {
            return {
              ...b,
              title,
              summary,
              content: finalContent,
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
        <div className="mt-1 space-y-1 text-text-primary leading-normal">
          {article.title && !article.content.startsWith(article.title) && (
            <h3 className="font-bold text-base mb-1 text-text-primary">
              {article.title}
            </h3>
          )}
          {renderContentWithMedia(article.content)}
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

      {/* MODAL CHỈNH SỬA BÀI VIẾT (EDIT MODAL - NÂNG CẤP CHỌN FILE) */}
      {isEditing && (
        <div className="fixed inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface w-full max-w-lg rounded-app border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="text-lg font-bold text-text-primary">Chỉnh sửa bài đăng</h2>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                }}
                className="text-text-secondary hover:text-text-primary p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                disabled={updating}
                rows={5}
                className="w-full bg-background border border-gray-700 text-text-primary rounded-lg p-3 text-[15px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none placeholder-text-secondary"
                placeholder="Nội dung bài đăng..."
              />

              {/* Khung hiển thị Preview tệp đính kèm trong Modal */}
              {editFile && (
                <div className="relative mt-2 rounded-lg overflow-hidden border border-gray-800 bg-black/40 max-h-56 flex items-center justify-center">
                  {editFile.type === 'image' ? (
                    <img
                      src={editFile.url}
                      alt="Preview"
                      className="max-h-56 max-w-full object-contain"
                    />
                  ) : (
                    <video
                      src={editFile.url}
                      controls
                      className="max-h-56 max-w-full object-contain"
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleRemoveEditFile}
                    className="absolute top-2.5 right-2.5 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer hover:scale-105"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Input file ẩn trong Modal chỉnh sửa */}
            <input
              type="file"
              ref={editFileInputRef}
              onChange={handleEditFileChange}
              accept="image/*,video/mp4,video/quicktime"
              className="hidden"
            />

            {/* Modal Footer với nút công cụ chọn file */}
            <div className="flex justify-between items-center px-6 py-4 bg-background border-t border-gray-800/80">
              {/* Nút chọn hình ảnh/video mới */}
              <div>
                <button
                  type="button"
                  onClick={() => editFileInputRef.current?.click()}
                  className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors cursor-pointer"
                  title="Thay đổi hoặc thêm hình ảnh/video"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Các nút Hủy / Lưu */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => {
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-text-primary text-sm font-semibold rounded-full transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={updating || (!editContent.trim() && !editFile)}
                  className="px-5 py-2 bg-primary hover:bg-primary/95 text-white text-sm font-bold rounded-full transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {updating ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
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

export default ArticleCard;
