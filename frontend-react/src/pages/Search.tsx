import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { articleApi, type ArticleResponse } from '../api/articleApi';
import { userApi, type ProfileResponse } from '../api/userApi';
import ArticleCard from '../components/ArticleCard';
import { Search as SearchIcon } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';

const Search: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || searchParams.get('query') || '';
  const navigate = useNavigate();

  const [articles, setArticles] = useState<ArticleResponse[]>([]);
  const [users, setUsers] = useState<ProfileResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'articles' | 'users'>('articles');

  useEffect(() => {
    if (!query) return;

    const fetchResults = async () => {
      setLoading(true);
      try {
        const [articleRes, userRes] = await Promise.all([
          articleApi.searchArticles(query, 0, 20),
          userApi.searchUsers(query, 20)
        ]);
        
        // Handle paginated or direct array response
        const articleData = (articleRes as any)?.content || (articleRes as any)?.data || articleRes || [];
        setArticles(Array.isArray(articleData) ? articleData : []);
        
        const userData = (userRes as any)?.content || (userRes as any)?.data || userRes || [];
        setUsers(Array.isArray(userData) ? userData : []);
      } catch (err) {
        console.error('Error searching:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  if (!query) {
    return (
      <div className="max-w-2xl mx-auto border-x-0 sm:border-x border-border-default min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <EmptyState
          icon={<SearchIcon className="w-12 h-12 mb-4 opacity-50" />}
          title="Tìm kiếm trên Axion"
          description="Nhập từ khóa vào ô tìm kiếm để bắt đầu"
          className="border-none bg-transparent"
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto border-x-0 sm:border-x border-border-default min-h-screen bg-background pb-12">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-xl border-b border-border-default">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold font-heading text-text-primary">
            Kết quả tìm kiếm cho "{query}"
          </h1>
        </div>
        
        {/* Tabs */}
        <div className="flex px-4 gap-6 text-sm font-semibold border-b border-border-default">
          <button
            onClick={() => setActiveTab('articles')}
            className={`py-3 transition-colors relative cursor-pointer focus-visible:outline-none focus-visible:text-primary ${activeTab === 'articles' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Bài viết
            {activeTab === 'articles' && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 transition-colors relative cursor-pointer focus-visible:outline-none focus-visible:text-primary ${activeTab === 'users' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Mọi người
            {activeTab === 'users' && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[50vh]">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-text-secondary">
            <Spinner size="lg" className="text-primary mb-4" />
            <p className="text-sm font-medium">Đang tìm kiếm...</p>
          </div>
        ) : (
          <>
            {activeTab === 'articles' && (
              <div className="divide-y divide-border-default">
                {articles.length > 0 ? (
                  articles.map((art) => (
                    <ArticleCard key={art.id} article={art} onRefresh={() => {}} />
                  ))
                ) : (
                  <div className="p-8">
                    <EmptyState
                      title="Không tìm thấy bài viết nào"
                      description="Hãy thử tìm kiếm với các từ khóa khác."
                      className="border-none bg-transparent"
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="divide-y divide-border-default">
                {users.length > 0 ? (
                  users.map((u) => (
                    <div 
                      key={u.id}
                      onClick={() => navigate(`/profile?userId=${u.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          navigate(`/profile?userId=${u.id}`);
                        }
                      }}
                      tabIndex={0}
                      className="p-4 hover:bg-surface-elevated transition-colors cursor-pointer flex items-center gap-3 focus-visible:outline-none focus-visible:bg-surface-elevated"
                    >
                      <Avatar src={u.avatarUrl || undefined} fallback={u.displayName?.substring(0, 2).toUpperCase() || u.username?.substring(0, 2).toUpperCase()} size="lg" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-text-primary truncate">{u.displayName || u.username}</h3>
                        <p className="text-text-secondary text-sm truncate">@{u.username}</p>
                        {u.bio && <p className="text-text-primary text-sm mt-1 line-clamp-2">{u.bio}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8">
                    <EmptyState
                      title="Không tìm thấy người dùng nào"
                      description="Hãy thử tìm kiếm với các từ khóa khác."
                      className="border-none bg-transparent"
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Search;
