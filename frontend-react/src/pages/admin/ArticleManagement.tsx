import { useEffect, useState } from 'react';
import {
  FileText,
  Search,
  Archive,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreVertical,
  CheckCircle,
  Clock,
  ArchiveRestore,
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import type { AdminArticle, PageResponse } from '../../api/adminApi';
import { ConfirmModal } from '../../components/ConfirmModal';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  PUBLISHED: { label: 'Đã đăng', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle },
  DRAFT: { label: 'Bản nháp', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Clock },
  ARCHIVED: { label: 'Lưu trữ', color: 'text-gray-400', bg: 'bg-gray-500/10', icon: ArchiveRestore },
};

export default function ArticleManagement() {
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const data: PageResponse<AdminArticle> = await adminApi.getArticles(page, 10);
      setArticles(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArticles(); }, [page]);

  const handleArchive = async (articleId: string) => {
    setActionLoading(articleId);
    try {
      await adminApi.archiveArticle(articleId);
      setArticles(prev => prev.map(a => a.id === articleId ? { ...a, status: 'ARCHIVED' } : a));
    } catch (err) {
      console.error(err);
      alert('Lỗi lưu trữ bài viết');
    } finally {
      setActionLoading(null);
      setActionMenuId(null);
    }
  };

  const handleDelete = async (articleId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa bài viết',
      message: 'Bạn có chắc muốn xóa bài viết này không?',
      onConfirm: async () => {
        setActionLoading(articleId);
        try {
          await adminApi.deleteArticle(articleId);
          setArticles(prev => prev.filter(a => a.id !== articleId));
        } catch (err) {
          console.error(err);
          alert('Lỗi xóa bài viết');
        } finally {
          setActionLoading(null);
          setActionMenuId(null);
        }
      }
    });
  };

  const filteredArticles = searchQuery
    ? articles.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.authorName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : articles;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <FileText className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-heading font-bold">Quản lý bài viết</h1>
          </div>
          <p className="text-text-secondary">Tổng cộng {totalElements} bài viết trong hệ thống</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
        <input
          type="text"
          placeholder="Tìm kiếm theo tiêu đề hoặc tác giả..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-surface/60 backdrop-blur-md border border-white/10 rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-all duration-300"
        />
      </div>

      {/* Articles Table */}
      <div className="bg-surface/60 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/5 rounded w-2/3" />
                  <div className="h-3 bg-white/5 rounded w-1/3" />
                </div>
                <div className="h-6 bg-white/5 rounded-full w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto pb-32 min-h-[50vh]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-6 py-4">Bài viết</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-6 py-4">Tác giả</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-6 py-4">Trạng thái</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-6 py-4">Tags</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-6 py-4">Ngày tạo</th>
                  <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider px-6 py-4">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredArticles.map((article) => {
                  const status = statusConfig[article.status] || statusConfig.DRAFT;
                  const StatusIcon = status.icon;
                  const date = new Date(article.createdAt).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' });

                  return (
                    <tr key={article.id} className="hover:bg-white/[0.02] transition-colors duration-200 group">
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="font-medium text-text-primary truncate">{article.title}</p>
                          <p className="text-sm text-text-secondary truncate">{article.summary}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                            {article.authorName.charAt(0)}
                          </div>
                          <span className="text-sm text-text-primary">{article.authorName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${status.bg} ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {article.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="px-2 py-0.5 rounded-md bg-white/5 text-xs text-text-secondary">#{tag}</span>
                          ))}
                          {article.tags.length > 2 && (
                            <span className="px-2 py-0.5 rounded-md bg-white/5 text-xs text-text-secondary">+{article.tags.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary whitespace-nowrap">{date}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setActionMenuId(actionMenuId === article.id ? null : article.id)}
                            className="p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-text-primary transition-colors duration-200"
                            disabled={actionLoading === article.id}
                          >
                            {actionLoading === article.id ? (
                              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <MoreVertical className="w-5 h-5" />
                            )}
                          </button>

                          {actionMenuId === article.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-white/10 rounded-xl shadow-2xl shadow-black/50 py-1 z-50 animate-fade-in">
                              <button
                                onClick={() => window.open(`/article/${article.slug}`, '_blank')}
                                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-text-primary hover:bg-white/5 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                                Xem bài viết
                              </button>
                              {article.status !== 'ARCHIVED' && (
                                <button
                                  onClick={() => handleArchive(article.id)}
                                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-amber-400 hover:bg-white/5 transition-colors"
                                >
                                  <Archive className="w-4 h-4" />
                                  Lưu trữ
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(article.id)}
                                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                Xóa bài viết
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
            <p className="text-sm text-text-secondary">
              Trang {page + 1} / {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 rounded-lg border border-white/10 text-text-secondary hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-lg border border-white/10 text-text-secondary hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

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
}
