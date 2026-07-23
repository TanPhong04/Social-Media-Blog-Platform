import React, { useEffect, useState } from 'react';
import ArticleCard from '../components/ArticleCard';
import { useAuth } from '../contexts/AuthContext';
import { Bookmark, Trash2, AlertCircle } from 'lucide-react';
import type { ArticleResponse } from '../api/articleApi';
import { ConfirmModal } from '../components/ConfirmModal';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';

const Bookmarks: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [articles, setArticles] = useState<ArticleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

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
    
    setConfirmModal({
      isOpen: true,
      title: 'Bỏ lưu tất cả',
      message: 'Bạn có chắc chắn muốn bỏ lưu tất cả bài viết không?',
      onConfirm: () => {
        try {
          localStorage.setItem(`bookmarks_${user.id}`, '[]');
          setArticles([]);
        } catch (err) {
          console.error('Error clearing bookmarks', err);
        }
      }
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-[840px] mx-auto border-x border-border-default min-h-screen bg-background p-8 flex items-center justify-center">
        <EmptyState 
          icon={<AlertCircle className="w-12 h-12 text-primary" />}
          title="Yêu cầu đăng nhập"
          description="Vui lòng đăng nhập để xem các bài viết đã lưu của bạn."
          action={<Button onClick={() => window.location.href = '/login'}>Đăng nhập ngay</Button>}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[840px] mx-auto border-x border-border-default min-h-screen bg-background">
      {/* Header trang */}
      <div className="p-4 border-b border-border-default sticky top-[64px] sm:top-16 bg-surface/80 backdrop-blur-md z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl border border-primary/20 shadow-sm">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-bold text-text-primary">
              Bookmarks
            </h1>
            <p className="text-text-secondary text-xs mt-0.5 font-medium">
              Danh sách {articles.length} bài đăng đã lưu
            </p>
          </div>
        </div>

        {articles.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="flex items-center gap-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 focus-visible:ring-red-500 border border-transparent hover:border-red-500/20 rounded-full"
            aria-label="Bỏ lưu tất cả"
          >
            <Trash2 className="w-4 h-4" />
            <span className="font-semibold text-xs hidden sm:inline">Bỏ lưu tất cả</span>
          </Button>
        )}
      </div>

      {/* Feed bài viết */}
      {loading ? (
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
        </div>
      ) : articles.length === 0 ? (
        <div className="p-12">
          <EmptyState
            icon={<Bookmark className="w-12 h-12 text-text-secondary opacity-50" />}
            title="Chưa lưu bài đăng nào"
            description="Lưu các bài viết yêu thích của bạn bằng cách nhấp vào biểu tượng Bookmark hoặc tùy chọn lưu trong menu bài viết."
            action={<Button onClick={() => window.location.href = '/'}>Khám phá bài viết</Button>}
          />
        </div>
      ) : (
        <div className="divide-y divide-border-default">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onRefresh={fetchBookmarks}
            />
          ))}
        </div>
      )}

      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={() => {
            confirmModal.onConfirm();
            setConfirmModal(null);
          }}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
};

export default Bookmarks;
