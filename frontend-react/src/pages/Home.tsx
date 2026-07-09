import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { articleApi } from '../api/articleApi';
import type { ArticleResponse } from '../api/articleApi';
import ArticleCard from '../components/ArticleCard';
import { useAuth } from '../contexts/AuthContext';
import { Image, Smile, Calendar, MapPin, BarChart2, Globe, AlertCircle, X } from 'lucide-react';

const Home: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [articles, setArticles] = useState<ArticleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'for-you' | 'following'>('for-you');

  // Trạng thái cho Khung Đăng Bài (Tweet Box)
  const [postText, setPostText] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  // Trạng thái cho tệp đính kèm (Ảnh/Video)
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    url: string;
    base64: string;
    type: 'image' | 'video';
  } | null>(null);

  // Helper: Chuyển đổi tệp sang chuỗi Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Helper: Kiểm tra thời lượng video bằng cách tạo thẻ video ảo
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

  useEffect(() => {
    fetchArticles();
  }, [activeTab]);

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

  // Helper: Nén ảnh dùng canvas trước khi chuyển sang Base64
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
          
          // Nén JPEG chất lượng 0.6 (giúp giảm dung lượng mạnh từ vài MB xuống còn ~50KB-150KB)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          resolve(dataUrl);
        };
      };
    });
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

    // Nếu là video, kiểm tra giới hạn dưới 2 phút (120 giây)
    if (isVideo) {
      try {
        const duration = await checkVideoDuration(file);
        if (duration > 120) {
          setPostError('Thời lượng video phải dưới 2 phút!');
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
      let base64 = '';
      if (isImage) {
        base64 = await compressImage(file);
      } else {
        base64 = await fileToBase64(file);
      }
      const url = URL.createObjectURL(file);
      setSelectedFile({
        name: file.name,
        url,
        base64,
        type: isImage ? 'image' : 'video'
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

    // 1. Tự động sinh tiêu đề (title) từ dòng đầu tiên hoặc 80 ký tự đầu
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

    // 4. Nhúng mã Base64 vào nội dung nếu có file đính kèm
    let mediaEmbed = '';
    if (selectedFile) {
      if (selectedFile.type === 'image') {
        mediaEmbed = `\n\n![image](${selectedFile.base64})`;
      } else {
        mediaEmbed = `\n\n<video src="${selectedFile.base64}" controls class="rounded-app w-full max-h-[450px] mt-2 bg-black"></video>`;
      }
    }

    const finalContent = postText.trim() + mediaEmbed;

    try {
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
      setPostError(err.response?.data?.message || 'Không thể đăng bài viết lúc này.');
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
              {user?.displayName?.substring(0, 2).toUpperCase() || 'US'}
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

              {/* Hộp icon và nút Post */}
              <div className="flex items-center gap-2">
                {/* Input File ẩn */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,video/mp4,video/quicktime"
                  className="hidden"
                />
                
                <div className="hidden sm:flex items-center gap-1 text-primary">
                  {/* Thay nút Image thành nút click chọn file thực tế */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-full hover:bg-primary/10 transition-colors cursor-pointer"
                    title="Chọn hình ảnh hoặc video"
                  >
                    <Image className="w-4 h-4" />
                  </button>
                  <button type="button" className="p-2 rounded-full hover:bg-primary/10 transition-colors cursor-pointer">
                    <BarChart2 className="w-4 h-4" />
                  </button>
                  <button type="button" className="p-2 rounded-full hover:bg-primary/10 transition-colors cursor-pointer">
                    <Smile className="w-4 h-4" />
                  </button>
                  <button type="button" className="p-2 rounded-full hover:bg-primary/10 transition-colors cursor-pointer">
                    <Calendar className="w-4 h-4" />
                  </button>
                  <button type="button" className="p-2 rounded-full hover:bg-primary/10 transition-colors cursor-pointer">
                    <MapPin className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handlePost}
                  disabled={posting || (!postText.trim() && !selectedFile)}
                  className="px-5 py-2 bg-primary hover:bg-primary/95 text-white font-bold text-sm rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {posting ? 'Đang đăng...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feed hiển thị các bài đăng */}
      {loading ? (
        <div className="divide-y divide-gray-800">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-4 flex gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-white/5 shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="w-1/3 h-4 bg-white/5 rounded" />
                <div className="w-full h-5 bg-white/5 rounded" />
                <div className="w-5/6 h-5 bg-white/5 rounded" />
                <div className="w-1/2 h-4 bg-white/5 rounded mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center">
          <p className="text-error mb-4">{error}</p>
          <button
            onClick={fetchArticles}
            className="px-4 py-2 bg-primary/20 text-primary hover:bg-primary/30 rounded-full transition-colors font-medium cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : articles.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <Globe className="w-6 h-6 text-text-secondary" />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-1">Chưa có bài đăng nào</h3>
          <p className="text-text-secondary text-sm">Hãy là người đầu tiên chia sẻ câu chuyện!</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-800">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} onRefresh={fetchArticles} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
