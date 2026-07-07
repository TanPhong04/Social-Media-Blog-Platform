import React, { useEffect, useState } from 'react';
import { articleApi } from '../api/articleApi';
import type { ArticleResponse } from '../api/articleApi';
import ArticleCard from '../components/ArticleCard';
import { Newspaper } from 'lucide-react';

const Home: React.FC = () => {
  const [articles, setArticles] = useState<ArticleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: any = await articleApi.getFeed(0, 20);
      setArticles(response.content);
    } catch (err) {
      console.error('Failed to fetch articles', err);
      setError('Không thể tải danh sách bài viết. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-surface text-primary rounded-app border border-white/10 shadow-lg">
          <Newspaper className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
            Dành cho bạn
          </h1>
          <p className="text-text-secondary mt-1">
            Khám phá những bài viết mới nhất từ cộng đồng
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-surface rounded-app p-5 border border-white/5 animate-pulse flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/5" />
                <div className="w-24 h-4 rounded bg-white/5" />
              </div>
              <div className="w-3/4 h-6 rounded bg-white/5 mt-2" />
              <div className="w-full h-4 rounded bg-white/5" />
              <div className="w-5/6 h-4 rounded bg-white/5" />
              <div className="mt-4 flex gap-2">
                <div className="w-16 h-6 rounded bg-white/5" />
                <div className="w-16 h-6 rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-error/10 border border-error/20 rounded-app p-6 text-center">
          <p className="text-error mb-4">{error}</p>
          <button 
            onClick={fetchArticles}
            className="px-4 py-2 bg-primary/20 text-primary hover:bg-primary/30 rounded-md transition-colors font-medium"
          >
            Thử lại
          </button>
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-surface rounded-app p-12 text-center border border-white/5 border-dashed flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 relative z-10 shadow-lg">
            <Newspaper className="w-8 h-8 text-text-secondary" />
          </div>
          <h3 className="text-xl font-heading font-semibold text-text-primary mb-2 relative z-10">Chưa có bài viết nào</h3>
          <p className="text-text-secondary relative z-10">Hãy là người đầu tiên chia sẻ câu chuyện của bạn!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
