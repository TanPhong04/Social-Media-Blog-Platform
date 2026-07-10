import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { articleApi, type ArticleResponse } from '../api/articleApi';
import ArticleCard from '../components/ArticleCard';
import { Users, AlertCircle } from 'lucide-react';

const Following: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [articles, setArticles] = useState<ArticleResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowingFeed = async () => {
    setLoading(true);
    try {
      const data = await articleApi.getFollowingFeed(0, 20);
      setArticles((data as any).content || []);
    } catch (err) {
      console.error('Error fetching following feed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchFollowingFeed();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto border-x border-gray-800 min-h-screen bg-background p-8 text-center flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-primary mb-4" />
        <h3 className="text-xl font-bold text-text-primary mb-2">Yêu cầu đăng nhập</h3>
        <p className="text-text-secondary text-sm">Vui lòng đăng nhập để xem bài viết từ những người bạn theo dõi.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto border-x border-gray-800 min-h-screen bg-background">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 sticky top-16 bg-background/80 backdrop-blur-md z-40 flex items-center gap-3">
        <div className="p-2.5 bg-surface text-primary rounded-app border border-white/10 shadow-md">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-heading font-bold text-text-primary">
            Đang theo dõi
          </h1>
          <p className="text-text-secondary text-xs mt-0.5">
            Bài viết mới nhất từ tác giả yêu thích
          </p>
        </div>
      </div>

      {/* Feed */}
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
            <Users className="w-6 h-6 text-text-secondary" />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-1">Chưa có bài viết mới</h3>
          <p className="text-text-secondary text-sm max-w-sm">
            Những người bạn theo dõi chưa đăng bài viết nào, hoặc bạn chưa theo dõi ai.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-800 pb-20">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onRefresh={fetchFollowingFeed}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Following;
