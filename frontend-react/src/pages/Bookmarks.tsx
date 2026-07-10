import React, { useEffect, useState } from 'react';
import ArticleCard from '../components/ArticleCard';
import { useAuth } from '../contexts/AuthContext';
import { Bookmark, Trash2, AlertCircle } from 'lucide-react';
import type { ArticleResponse } from '../api/articleApi';

const Bookmarks: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [articles, setArticles] = useState<ArticleResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchBookmarks();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchBookmarks = () => {
    setLoading(true);
    if (user) {
      try {
        const savedArticles = JSON.parse(localStorage.getItem(`bookmarks_${user.id}`) || '[]');
        // Đảo ngược mảng để bài viết lưu gần nhất hiển thị lên đầu
        setArticles([...savedArticles].reverse());
      } catch (err) {
        console.error('Error reading bookmarks from localStorage', err);
        setArticles([]);
      }
    }
    setLoading(false);
  };

  const handleClearAll = () => {
    if (!user) return;
    if (!window.confirm('Bạn có chắc chắn muốn bỏ lưu tất cả bài viết không?')) return;

    try {
      localStorage.setItem(`bookmarks_${user.id}`, '[]');
      setArticles([]);
    } catch (err) {
      console.error('Error clearing bookmarks', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto border-x border-gray-800 min-h-screen bg-background p-8 text-center flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-primary mb-4" />
        <h3 className="text-xl font-bold text-text-primary mb-2">Yêu cầu đăng nhập</h3>
        <p className="text-text-secondary text-sm">Vui lòng đăng nhập để xem các bài viết đã lưu của bạn.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto border-x border-gray-800 min-h-screen bg-background">
      {/* Header trang */}
      <div className="p-4 border-b border-gray-800 sticky top-16 bg-background/80 backdrop-blur-md z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-surface text-primary rounded-app border border-white/10 shadow-md">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-bold text-text-primary">
              Bookmarks
            </h1>
            <p className="text-text-secondary text-xs mt-0.5">
              Danh sách {articles.length} bài đăng đã lưu
            </p>
          </div>
        </div>

        {articles.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-red-500/20 hover:border-red-500 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-xs font-semibold rounded-full transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Bỏ lưu tất cả</span>
          </button>
        )}
      </div>

      {/* Feed bài viết */}
      {loading ? (
        <div className="divide-y divide-gray-800">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-4 flex gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-white/5 shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="w-1/3 h-4 bg-white/5 rounded" />
                <div className="w-full h-5 bg-white/5 rounded" />
                <div className="w-1/2 h-4 bg-white/5 rounded mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <Bookmark className="w-6 h-6 text-text-secondary" />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-1">Chưa lưu bài đăng nào</h3>
          <p className="text-text-secondary text-sm max-w-sm">
            Lưu các bài viết yêu thích của bạn bằng cách nhấp vào biểu tượng Bookmark hoặc tùy chọn lưu trong menu bài viết.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-800">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onRefresh={fetchBookmarks}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookmarks;
