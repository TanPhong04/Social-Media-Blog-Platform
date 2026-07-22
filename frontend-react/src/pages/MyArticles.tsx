import React, { useEffect, useState } from 'react';
import { articleApi } from '../api/articleApi';
import type { ArticleResponse } from '../api/articleApi';
import ArticleCard from '../components/ArticleCard';
import { useAuth } from '../contexts/AuthContext';
import { FileText, AlertCircle } from 'lucide-react';

const MyArticles: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [articles, setArticles] = useState<ArticleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyArticles();
    }
  }, [isAuthenticated]);

  const fetchMyArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: any = await articleApi.getMine(0, 50); // Lấy tối đa 50 bài gần nhất
      setArticles(response.content || []);
    } catch (err) {
      console.error('Failed to fetch my articles', err);
      setError('Không thể tải bài viết của bạn. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto border-x border-border-default min-h-screen bg-background p-8 text-center flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-primary mb-4" />
        <h3 className="text-xl font-bold text-text-primary mb-2">Yêu cầu đăng nhập</h3>
        <p className="text-text-secondary text-sm">Vui lòng đăng nhập để xem các bài viết của bạn.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto border-x border-border-default min-h-screen bg-background">
      {/* Header trang */}
      <div className="p-4 border-b border-border-default sticky top-16 bg-background/80 backdrop-blur-md z-40 flex items-center gap-3">
        <div className="p-2.5 bg-surface text-primary rounded-app border border-border-default shadow-md">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-heading font-bold text-text-primary">
            Bài viết của tôi
          </h1>
          <p className="text-text-secondary text-xs mt-0.5">
            Quản lý {articles.length} bài đăng cá nhân của bạn
          </p>
        </div>
      </div>

      {/* Feed bài viết */}
      {loading ? (
        <div className="divide-y divide-border-default">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-4 flex gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-surface-elevated shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="w-1/3 h-4 bg-surface-elevated rounded" />
                <div className="w-full h-5 bg-surface-elevated rounded" />
                <div className="w-1/2 h-4 bg-surface-elevated rounded mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center">
          <p className="text-error mb-4">{error}</p>
          <button
            onClick={fetchMyArticles}
            className="px-4 py-2 bg-primary/20 text-primary hover:bg-primary/30 rounded-full transition-colors font-medium cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : articles.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-surface-elevated border border-border-default flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-text-secondary" />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-1">Bạn chưa đăng bài viết nào</h3>
          <p className="text-text-secondary text-sm">Những bài viết bạn đăng sẽ xuất hiện tại đây.</p>
        </div>
      ) : (
        <div className="divide-y divide-border-default">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onRefresh={fetchMyArticles}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyArticles;
