import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { articleApi } from '../api/articleApi';
import { userApi } from '../api/userApi';
import type { ArticleResponse } from '../api/articleApi';
import ArticleCard from '../components/ArticleCard';
import { useAuth } from '../contexts/AuthContext';
import { Image, Smile, Globe, AlertCircle, X } from 'lucide-react';

import { mediaApi } from '../api/mediaApi';
const EMOJI_CATEGORIES = [
  {
    icon: '🕒',
    title: 'Gần đây',
    emojis: ['😊', '😂', '🤣', '👍', '❤️', '🔥', '🎉', '✨', '👏', '😍', '🥰', '😘']
  },
  {
    icon: '😀',
    title: 'Mặt cười & con người',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😓', '🤔']
  },
  {
    icon: '🐱',
    title: 'Động vật & thiên nhiên',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞']
  },
  {
    icon: '🍎',
    title: 'Đồ ăn & thức uống',
    emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🧅', '🥖', '🥨', '🧀', '🍕', '🌭', '🍔', '🍟', '🍺', '🍻', '🍷', '🥤', '🧋']
  },
  {
    icon: '⚽',
    title: 'Hoạt động & thể thao',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🏆', '🥇', '🥈', '🥉', '🎖️', '🎗️', '🎫', '🎟️', '🎪', '🎨', '🎭', '🎬', '🎤', '🎧', '🎼', '🥁']
  },
  {
    icon: '🚗',
    title: 'Du lịch & địa điểm',
    emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🚲', '🛴', '🛺', '🚂', '🚆', '🚄', '🚅', '🚈', '🚇', '🚀', '🛸', '🚁', '🛶', '⛵', '🛥️', '🛳️', '🚢', '✈️', '🛫', '🛬', '🪂', '🪟', '🌋', '🗻', '🏠']
  },
  {
    icon: '💡',
    title: 'Đồ vật & bóng đèn',
    emojis: ['💡', '🔦', '🕯️', '🔌', '🔋', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🎛️', '🎞️', '📷', '📸', '📹', '🎥', '📻', '🎙️', '🎚️', '🎛️', '📺', '⏰', '⌚', '🧭', '⌛', '⏳', '🪓', '🛡️', '🔑', '🗝️', '🔨', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣']
  },
  {
    icon: '🔣',
    title: 'Ký hiệu & biểu tượng',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐']
  }
];

const Home: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  
  const [articles, setArticles] = useState<ArticleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'for-you' | 'following'>('for-you');

  // Thông tin profile thực của người dùng hiện tại
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  // Trạng thái cho Khung Đăng Bài (Tweet Box)
  const [postText, setPostText] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiTab, setActiveEmojiTab] = useState(1); // Mặc định chọn nhóm Mặt cười (idx = 1)
  const [searchEmoji, setSearchEmoji] = useState('');
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);

  // Trạng thái cho tệp đính kèm (Ảnh/Video)
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    url: string;
    type: 'image' | 'video';
    file: File;
  } | null>(null);

  // Helper: Kiểm tra thời lượng video
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

  // Tự động focus vào ô nhập khi click từ Sidebar
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('focus') === 'true' && textareaRef.current) {
      textareaRef.current.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  // Đóng emoji picker khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [activeTab]);

  // Fetch avatar thật của người dùng hiện tại
  useEffect(() => {
    if (isAuthenticated) {
      userApi.getProfile()
        .then((res: any) => {
          setCurrentUserProfile(res);
        })
        .catch(err => {
          console.warn('Không thể tải profile thật của user hiện tại, dùng fallback', err);
        });
    }
  }, [isAuthenticated]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response: any;
      if (activeTab === 'following' && isAuthenticated) {
        response = await articleApi.getFollowingFeed(0, 20);
      } else {
        response = await articleApi.getFeed(0, 20);
      }
      
      setArticles(response.content || []);
    } catch (err) {
      console.error('Failed to fetch articles', err);
      setError('Không thể tải danh sách bài viết. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý chọn hình ảnh hoặc video
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      setPostError('Chỉ cho phép tải lên hình ảnh hoặc video.');
      return;
    }

    // Kiểm tra giới hạn thời lượng video dưới 2.5 phút (150 giây)
    if (isVideo) {
      try {
        const duration = await checkVideoDuration(file);
        if (duration > 150) {
          setPostError('Thời lượng video phải dưới 2.5 phút!');
          return;
        }
      } catch (err) {
        console.error('Error checking video duration', err);
        setPostError('Không thể kiểm tra thời lượng video.');
        return;
      }
    }

    try {
      setPostError(null);
      const url = URL.createObjectURL(file);
      setSelectedFile({
        name: file.name,
        url,
        type: isImage ? 'image' : 'video',
        file: file
      });
    } catch (err) {
      console.error('Error reading file', err);
      setPostError('Lỗi đọc tệp tin từ thiết bị.');
    }
  };

  // Hàm xử lý đăng bài (Post)
  const handlePost = async () => {
    if (!postText.trim() && !selectedFile) return;

    setPosting(true);
    setPostError(null);

    // 1. Tự động sinh tiêu đề từ dòng đầu tiên
    const lines = postText.trim().split('\n');
    const firstLine = lines[0].trim();
    const title = firstLine.substring(0, 100) || (selectedFile?.type === 'image' ? 'Hình ảnh mới' : 'Video mới');

    // 2. Tự động lọc ra các hashtag từ nội dung bài viết
    const hashtagRegex = /#(\w+)/g;
    const tags: string[] = [];
    let match;
    while ((match = hashtagRegex.exec(postText)) !== null) {
      tags.push(match[1]);
    }

    // 3. Tự động sinh tóm tắt (summary)
    const summary = postText.substring(0, 150) + (postText.length > 150 ? '...' : '');

    try {
      let mediaUrl = '';
      if (selectedFile) {
        // Tải tệp qua Backend (MinIO)
        setPostError('Đang tải tệp tin lên hệ thống...');
        mediaUrl = await mediaApi.uploadFile(selectedFile.file);
        setPostError(null);
      }

      // 4. Nhúng URL Cloudinary vào nội dung thay thế cho Base64 cực nặng
      let mediaEmbed = '';
      if (mediaUrl) {
        if (selectedFile?.type === 'image') {
          mediaEmbed = `\n\n![image](${mediaUrl})`;
        } else {
          mediaEmbed = `\n\n<video src="${mediaUrl}" controls class="rounded-app w-full max-h-[450px] mt-2 bg-black"></video>`;
        }
      }

      const finalContent = postText.trim() + mediaEmbed;

      // Gọi API tạo bản nháp bài viết
      const res: any = await articleApi.createArticle({
        title,
        summary,
        content: finalContent,
        tags
      });

      // Xuất bản (Publish) bài viết ngay lập tức
      await articleApi.publishArticle(res.id);

      // Giải phóng bộ nhớ Blob URL
      if (selectedFile?.url) {
        URL.revokeObjectURL(selectedFile.url);
      }

      // Làm sạch ô nhập và tải lại feed
      setPostText('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchArticles();
    } catch (err: any) {
      console.error('Lỗi khi đăng bài viết', err);
      const serverError = err.response?.data;
      if (serverError && serverError.code === 'VALIDATION_FAILED' && serverError.fields) {
        const fieldErrors = Object.entries(serverError.fields)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(', ');
        setPostError(`Lỗi kiểm tra dữ liệu (${fieldErrors})`);
      } else {
        setPostError(err.message || err.response?.data?.message || 'Không thể đăng bài viết lúc này.');
      }
    } finally {
      setPosting(false);
    }
  };

  const handleRemoveFile = () => {
    if (selectedFile?.url) {
      URL.revokeObjectURL(selectedFile.url);
    }
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-2xl mx-auto border-x border-gray-800 min-h-screen bg-background">
      {/* Tab chuyển đổi ở đầu trang chủ */}
      <div className="flex border-b border-gray-800 sticky top-16 bg-background/80 backdrop-blur-md z-40">
        <button
          onClick={() => setActiveTab('for-you')}
          className="flex-1 py-4 text-center font-bold text-[15px] relative hover:bg-white/[0.02] transition-colors cursor-pointer"
        >
          <span className={activeTab === 'for-you' ? 'text-text-primary' : 'text-text-secondary'}>
            Dành cho bạn
          </span>
          {activeTab === 'for-you' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-primary rounded-full" />
          )}
        </button>

        {isAuthenticated && (
          <button
            onClick={() => setActiveTab('following')}
            className="flex-1 py-4 text-center font-bold text-[15px] relative hover:bg-white/[0.02] transition-colors cursor-pointer"
          >
            <span className={activeTab === 'following' ? 'text-text-primary' : 'text-text-secondary'}>
              Đang theo dõi
            </span>
            {activeTab === 'following' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-primary rounded-full" />
            )}
          </button>
        )}
      </div>

      {/* Khung Đăng Bài (Tweet Box) - Chỉ hiển thị khi đã đăng nhập */}
      {isAuthenticated && (
        <div className="p-4 border-b border-gray-800 flex gap-3">
          {/* Avatar người dùng */}
          <div className="shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-md overflow-hidden">
              {currentUserProfile?.avatarUrl ? (
                <img src={currentUserProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.displayName?.substring(0, 2).toUpperCase() || 'US'
              )}
            </div>
          </div>

          {/* Form nhập */}
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              disabled={posting}
              placeholder="Có chuyện gì thế?"
              rows={3}
              className="w-full bg-transparent border-0 text-text-primary text-lg focus:outline-none focus:ring-0 resize-none placeholder-text-secondary py-1"
            />

            {/* KHUNG XEM TRƯỚC (PREVIEW) TỆP ĐÃ CHỌN */}
            {selectedFile && (
              <div className="relative mt-2 rounded-app overflow-hidden border border-gray-800 bg-black/40 max-h-80 flex items-center justify-center">
                {selectedFile.type === 'image' ? (
                  <img
                    src={selectedFile.url}
                    alt="Preview"
                    className="max-h-80 max-w-full object-contain rounded-app"
                  />
                ) : (
                  <video
                    src={selectedFile.url}
                    controls
                    className="max-h-80 max-w-full object-contain rounded-app"
                  />
                )}
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="absolute top-2.5 right-2.5 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer hover:scale-105"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {postError && (
              <div className="text-error text-xs flex items-center gap-1.5 mt-2 bg-error/5 p-2 rounded-md border border-error/10">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{postError}</span>
              </div>
            )}

            {/* Quyền phản hồi & công cụ */}
            <div className="border-t border-gray-800/80 pt-3 mt-2 flex justify-between items-center">
              {/* Giả lập Everyone can reply */}
              <div className="flex items-center gap-1.5 text-primary text-[13px] font-bold cursor-pointer hover:bg-primary/5 px-2.5 py-1 rounded-full transition-colors">
                <Globe className="w-4 h-4" />
                <span>Mọi người đều có thể trả lời</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Nút chọn ảnh / video ẩn */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,video/mp4,video/quicktime"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={posting}
                  className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors cursor-pointer"
                  title="Thêm hình ảnh hoặc video ngắn"
                >
                  <Image className="w-5 h-5" />
                </button>

                {/* Nút biểu cảm Smile (Mở bảng chọn biểu cảm đa dạng) */}
                <div className="relative" ref={emojiPickerRef}>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    disabled={posting}
                    className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors cursor-pointer"
                    title="Biểu cảm"
                  >
                    <Smile className="w-5 h-5" />
                  </button>

                  {showEmojiPicker && (
                    <div className="absolute right-0 top-10 bg-[#15181c] border border-gray-800 rounded-2xl p-3.5 shadow-2xl z-50 w-72 flex flex-col gap-2.5">
                      {/* Search box */}
                      <div className="relative">
                        <input
                          type="text"
                          value={searchEmoji}
                          onChange={(e) => setSearchEmoji(e.target.value)}
                          placeholder="Tìm kiếm biểu tượng cảm xúc"
                          className="w-full bg-[#202327] border-0 text-text-primary text-xs rounded-full pl-8 pr-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-primary placeholder-text-secondary"
                        />
                        <span className="absolute left-3 top-2.5 text-text-secondary text-xs">🔍</span>
                      </div>

                      {/* Category tabs */}
                      <div className="flex justify-between border-b border-gray-800 pb-1.5 overflow-x-auto">
                        {EMOJI_CATEGORIES.map((cat, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setActiveEmojiTab(idx);
                              setSearchEmoji(''); // Xóa kết quả tìm kiếm khi chuyển tab
                            }}
                            className={`text-lg p-1.5 rounded transition-all cursor-pointer ${searchEmoji === '' && activeEmojiTab === idx ? 'bg-primary/20 scale-110 font-bold border-b-2 border-primary' : 'hover:bg-white/5 opacity-70 hover:opacity-100'}`}
                            title={cat.title}
                          >
                            {cat.icon}
                          </button>
                        ))}
                      </div>

                      {/* Category title */}
                      <div className="text-xs font-bold text-text-secondary">
                        {searchEmoji.trim() ? 'Kết quả tìm kiếm' : EMOJI_CATEGORIES[activeEmojiTab].title}
                      </div>
                      
                      {/* Emoji grid scrollable */}
                      <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
                        {(searchEmoji.trim()
                          ? EMOJI_CATEGORIES.flatMap(c => c.emojis).filter(emoji => {
                              const EMOJI_KEYWORDS: { [key: string]: string } = {
                                '😊': 'cuoi vui ve mat cuoi smile happy',
                                '😂': 'cuoi ra nuoc mat haha cuoi to lol joy',
                                '🤣': 'cuoi lan lon haha rofl',
                                '😍': 'yeu thich love heart eyes',
                                '🥰': 'yeu thuong hanh phuc love hearts',
                                '😘': 'hon kiss blowing kiss',
                                '👍': 'like thich tot nhat ok good yes',
                                '👎': 'dislike khong thich bad no',
                                '❤️': 'tim do love heart red',
                                '🔥': 'lua hot fire trend',
                                '🎉': 'chuc mung party celebrate',
                                '✨': 'lap lanh lanh lay sparkle',
                                '👏': 'vo tay clap bravo',
                                '😭': 'khoc to cry sad'
                              };
                              const keywords = EMOJI_KEYWORDS[emoji] || '';
                              return keywords.toLowerCase().includes(searchEmoji.toLowerCase()) || emoji === searchEmoji.trim();
                            })
                          : EMOJI_CATEGORIES[activeEmojiTab].emojis
                        ).map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onMouseEnter={() => setHoveredEmoji(emoji)}
                            onClick={() => {
                              setPostText(prev => prev + emoji);
                            }}
                            className="text-xl hover:bg-white/10 p-1.5 rounded transition-colors cursor-pointer text-center"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>

                      {/* Footer: Preview and check close button */}
                      <div className="flex items-center justify-between border-t border-gray-800 pt-2 mt-1">
                        {/* Hover preview */}
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{hoveredEmoji || '😊'}</span>
                          <span className="text-[10px] text-text-secondary font-medium">Nhấp để chèn</span>
                        </div>

                        {/* Nút check tròn màu vàng */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowEmojiPicker(false);
                            setSearchEmoji('');
                          }}
                          className="w-7 h-7 rounded-full bg-[#ffd43b] hover:bg-[#ffe066] text-[#1e1e1e] flex items-center justify-center font-bold text-xs shadow cursor-pointer transition-all hover:scale-105"
                          title="Hoàn tất"
                        >
                          ✓
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Nút đăng bài */}
                <button
                  onClick={handlePost}
                  disabled={posting || (!postText.trim() && !selectedFile)}
                  className="px-5 py-2 bg-primary hover:bg-primary/95 text-white font-bold text-sm rounded-full transition-colors disabled:opacity-50 cursor-pointer ml-2 shadow-md"
                >
                  {posting ? 'Đang đăng...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Danh sách bài đăng trên Newsfeed */}
      <div className="divide-y divide-gray-800">
        {loading ? (
          <div className="p-8 text-center text-text-secondary flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mb-3" />
            <p className="text-sm">Đang tải bảng tin của bạn...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-error text-sm font-semibold">{error}</p>
            <button
              onClick={fetchArticles}
              className="mt-4 px-4 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary font-bold text-xs rounded-full transition-colors cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        ) : articles.length === 0 ? (
          <div className="p-12 text-center text-text-secondary">
            <p className="text-base font-semibold">Bảng tin hiện đang trống.</p>
            <p className="text-xs mt-1">Hãy đăng bài viết đầu tiên của bạn hoặc theo dõi người dùng khác!</p>
          </div>
        ) : (
          articles.map((art) => (
            <ArticleCard key={art.id} article={art} onRefresh={fetchArticles} />
          ))
        )}
      </div>
    </div>
  );
};

export default Home;
