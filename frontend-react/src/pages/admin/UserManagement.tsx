import { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Shield,
  UserX,
  UserCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreVertical,
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import type { AdminUser, PageResponse } from '../../api/adminApi';
import { ConfirmModal } from '../../components/ConfirmModal';
import { Table } from '../../components/ui/Table';
import type { Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error'; icon: typeof CheckCircle }> = {
  ACTIVE: { label: 'Hoạt động', variant: 'success', icon: CheckCircle },
  SUSPENDED: { label: 'Tạm ngưng', variant: 'warning', icon: AlertTriangle },
  DELETED: { label: 'Đã xóa', variant: 'error', icon: XCircle },
};

export default function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data: PageResponse<AdminUser> = await adminApi.getUsers(page, 10);
      setUsers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const handleSuspend = async (userId: string) => {
    setActionLoading(userId);
    try {
      await adminApi.suspendUser(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'SUSPENDED' } : u));
    } catch (err) {
      console.error(err);
      alert('Lỗi tạm ngưng tài khoản');
    } finally {
      setActionLoading(null);
      setActionMenuId(null);
    }
  };

  const handleActivate = async (userId: string) => {
    setActionLoading(userId);
    try {
      await adminApi.activateUser(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'ACTIVE' } : u));
    } catch (err) {
      console.error(err);
      alert('Lỗi kích hoạt tài khoản');
    } finally {
      setActionLoading(null);
      setActionMenuId(null);
    }
  };

  const handleDelete = async (userId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa tài khoản',
      message: 'Bạn có chắc muốn xóa tài khoản này không?',
      onConfirm: async () => {
        setActionLoading(userId);
        try {
          await adminApi.deleteUser(userId);
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'DELETED' } : u));
        } catch (err) {
          console.error(err);
          alert('Lỗi xóa tài khoản');
        } finally {
          setActionLoading(null);
          setActionMenuId(null);
        }
      }
    });
  };

  const filteredUsers = searchQuery
    ? users.filter(u =>
        u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  const columns: Column<AdminUser>[] = [
    {
      key: 'user',
      header: 'Người dùng',
      render: (user) => (
        <div className="flex items-center gap-3">
          <Avatar src="" fallback={user.displayName.charAt(0).toUpperCase()} size="md" />
          <div>
            <p className="font-medium text-text-primary">{user.displayName}</p>
            <p className="text-sm text-text-secondary">{user.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Vai trò',
      render: (user) => (
        <Badge variant={user.role === 'ADMIN' ? 'primary' : 'default'} className="inline-flex items-center gap-1">
          {user.role === 'ADMIN' && <Shield className="w-3 h-3" />}
          {user.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}
        </Badge>
      )
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (user) => {
        const status = statusConfig[user.status] || statusConfig.ACTIVE;
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
      key: 'createdAt',
      header: 'Ngày tạo',
      render: (user) => (
        <span className="text-sm text-text-secondary">
          {new Date(user.createdAt).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Hành động',
      className: 'text-right',
      render: (user) => (
        <div className="relative inline-block text-left">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActionMenuId(actionMenuId === user.id ? null : user.id)}
            disabled={actionLoading === user.id}
          >
            {actionLoading === user.id ? <Spinner size="sm" /> : <MoreVertical className="w-5 h-5" />}
          </Button>

          {actionMenuId === user.id && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-surface-elevated border border-border-default rounded-xl shadow-2xl z-50 animate-fade-in py-1">
              {user.status !== 'SUSPENDED' && (
                <button
                  onClick={() => handleSuspend(user.id)}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-amber-500 hover:bg-surface transition-colors"
                >
                  <UserX className="w-4 h-4" /> Tạm ngưng
                </button>
              )}
              {user.status === 'SUSPENDED' && (
                <button
                  onClick={() => handleActivate(user.id)}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-emerald-500 hover:bg-surface transition-colors"
                >
                  <UserCheck className="w-4 h-4" /> Kích hoạt lại
                </button>
              )}
              {user.status !== 'DELETED' && (
                <button
                  onClick={() => handleDelete(user.id)}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-surface transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Xóa tài khoản
                </button>
              )}
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
            <Users className="w-6 h-6 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-heading font-bold">Quản lý người dùng</h1>
          </div>
          <p className="text-text-secondary">Tổng cộng {totalElements} người dùng trong hệ thống</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-surface border border-border-default rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-all duration-300"
        />
      </div>

      <Table
        columns={columns}
        data={filteredUsers}
        keyExtractor={(user) => user.id}
        loading={loading}
        emptyIcon={<Users className="w-12 h-12 text-text-secondary opacity-50" />}
        emptyTitle="Không tìm thấy người dùng"
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
