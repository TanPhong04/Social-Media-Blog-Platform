import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { articleApi } from '../api/articleApi';
import type { ArticleResponse } from '../api/articleApi';
import ArticleCard from '../components/ArticleCard';
import { useAuth } from '../contexts/AuthContext';
import { Image, Smile, Calendar, MapPin, BarChart2, Globe, AlertCircle } from 'lucide-react';

const Home: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [articles, setArticles] = useState<ArticleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'for-you' | 'following'>('for-you');

  // Trạng thái cho Khung Đăng Bài (Tweet Box)
  const [postText, setPostText] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

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

  // Hàm xử lý đăng bài (Post)
  const handlePost = async () => {
    if (!postText.trim()) return;

    setPosting(true);
    setPostError(null);

    // 1. Tự động sinh tiêu đề (title) từ dòng đầu tiên hoặc 80 ký tự đầu
    const lines = postText.trim().split('\n');
    const firstLine = lines[0].trim();
    const title = firstLine.substring(0, 100) || 'Bài đăng mới';

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
      // Gọi API tạo bản nháp bài viết
      const res: any = await articleApi.createArticle({
        title,
        summary,
        content: postText.trim(),
        tags
      });

      // Xuất bản (Publish) bài viết ngay lập tức
      await articleApi.publishArticle(res.id);

      // Làm sạch ô nhập và tải lại feed
      setPostText('');
      fetchArticles();
    } catch (err: any) {
      console.error('Lỗi khi đăng bài viết', err);
      setPostError(err.response?.data?.message || 'Không thể đăng bài viết lúc này.');
    } finally {
      setPosting(false);
    }
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

              {/* Hộp icon giả lập và nút Post */}
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1 text-primary">
                  <button className="p-2 rounded-full hover:bg-primary/10 transition-colors cursor-pointer">
                    <Image className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-full hover:bg-primary/10 transition-colors cursor-pointer">
                    <BarChart2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-full hover:bg-primary/10 transition-colors cursor-pointer">
                    <Smile className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-full hover:bg-primary/10 transition-colors cursor-pointer">
                    <Calendar className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-full hover:bg-primary/10 transition-colors cursor-pointer">
                    <MapPin className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handlePost}
                  disabled={posting || !postText.trim()}
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
