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
import { Table } from '../../components/ui/Table';
import type { Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'default'; icon: typeof CheckCircle }> = {
  PUBLISHED: { label: 'Đã đăng', variant: 'success', icon: CheckCircle },
  DRAFT: { label: 'Bản nháp', variant: 'warning', icon: Clock },
  ARCHIVED: { label: 'Lưu trữ', variant: 'default', icon: ArchiveRestore },
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

  const columns: Column<AdminArticle>[] = [
    {
      key: 'article',
      header: 'Bài viết',
      render: (article) => (
        <div className="max-w-xs">
          <p className="font-medium text-text-primary truncate" title={article.title}>{article.title}</p>
          <p className="text-sm text-text-secondary truncate" title={article.summary}>{article.summary}</p>
        </div>
      )
    },
    {
      key: 'author',
      header: 'Tác giả',
      render: (article) => (
        <div className="flex items-center gap-2">
          <Avatar src="" fallback={article.authorName.charAt(0).toUpperCase()} size="sm" />
          <span className="text-sm text-text-primary">{article.authorName}</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (article) => {
        const status = statusConfig[article.status] || statusConfig.DRAFT;
        const StatusIcon = status.icon;
        return (
          <Badge variant={status.variant} className="inline-flex items-center gap-1">
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </Badge>
        );
      }
    },
    {
      key: 'tags',
      header: 'Tags',
      render: (article) => (
        <div className="flex flex-wrap gap-1 max-w-[150px]">
          {article.tags.slice(0, 2).map(tag => (
            <Badge key={tag} variant="default" className="px-1.5 py-0.5 text-[10px] uppercase">
              {tag}
            </Badge>
          ))}
          {article.tags.length > 2 && (
            <Badge variant="default" className="px-1.5 py-0.5 text-[10px]">
              +{article.tags.length - 2}
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      render: (article) => (
        <span className="text-sm text-text-secondary whitespace-nowrap">
          {new Date(article.createdAt).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Hành động',
      className: 'text-right',
      render: (article) => (
        <div className="relative inline-block text-left">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActionMenuId(actionMenuId === article.id ? null : article.id)}
            disabled={actionLoading === article.id}
          >
            {actionLoading === article.id ? <Spinner size="sm" /> : <MoreVertical className="w-5 h-5" />}
          </Button>

          {actionMenuId === article.id && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-surface-elevated border border-border-default rounded-xl shadow-2xl z-50 animate-fade-in py-1">
              <button
                onClick={() => window.open(`/article/${article.slug}`, '_blank')}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-text-primary hover:bg-surface transition-colors"
              >
                <Eye className="w-4 h-4" /> Xem bài viết
              </button>
              {article.status !== 'ARCHIVED' && (
                <button
                  onClick={() => handleArchive(article.id)}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-amber-500 hover:bg-surface transition-colors"
                >
                  <Archive className="w-4 h-4" /> Lưu trữ
                </button>
              )}
              <button
                onClick={() => handleDelete(article.id)}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-surface transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Xóa bài viết
              </button>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <FileText className="w-6 h-6 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-heading font-bold">Quản lý bài viết</h1>
          </div>
          <p className="text-text-secondary">Tổng cộng {totalElements} bài viết trong hệ thống</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
        <input
          type="text"
          placeholder="Tìm kiếm theo tiêu đề hoặc tác giả..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-surface border border-border-default rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-all duration-300"
        />
      </div>

      <Table
        columns={columns}
        data={filteredArticles}
        keyExtractor={(article) => article.id}
        loading={loading}
        emptyIcon={<FileText className="w-12 h-12 text-text-secondary opacity-50" />}
        emptyTitle="Không tìm thấy bài viết"
      />

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-2">
          <p className="text-sm text-text-secondary">
            Trang {page + 1} / {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
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
}
