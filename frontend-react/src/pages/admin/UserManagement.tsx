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

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  ACTIVE: { label: 'Hoạt động', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle },
  SUSPENDED: { label: 'Tạm ngưng', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: AlertTriangle },
  DELETED: { label: 'Đã xóa', color: 'text-red-400', bg: 'bg-red-500/10', icon: XCircle },
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
    if (!window.confirm('Bạn có chắc muốn xóa tài khoản này không?')) return;
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
  };

  const filteredUsers = searchQuery
    ? users.filter(u =>
        u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Users className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-heading font-bold">Quản lý người dùng</h1>
          </div>
          <p className="text-text-secondary">Tổng cộng {totalElements} người dùng trong hệ thống</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-surface/60 backdrop-blur-md border border-white/10 rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-all duration-300"
        />
      </div>

      {/* Table */}
      <div className="bg-surface/60 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-white/5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/5 rounded w-1/3" />
                  <div className="h-3 bg-white/5 rounded w-1/4" />
                </div>
                <div className="h-6 bg-white/5 rounded-full w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-6 py-4">Người dùng</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-6 py-4">Vai trò</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-6 py-4">Trạng thái</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-6 py-4">Ngày tạo</th>
                  <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider px-6 py-4">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((user) => {
                  const status = statusConfig[user.status] || statusConfig.ACTIVE;
                  const StatusIcon = status.icon;
                  const date = new Date(user.createdAt).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' });

                  return (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors duration-200 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                            {user.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">{user.displayName}</p>
                            <p className="text-sm text-text-secondary">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                          user.role === 'ADMIN'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-white/5 text-text-secondary'
                        }`}>
                          {user.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                          {user.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${status.bg} ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">{date}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setActionMenuId(actionMenuId === user.id ? null : user.id)}
                            className="p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-text-primary transition-colors duration-200"
                            disabled={actionLoading === user.id}
                          >
                            {actionLoading === user.id ? (
                              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <MoreVertical className="w-5 h-5" />
                            )}
                          </button>

                          {actionMenuId === user.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-white/10 rounded-xl shadow-2xl shadow-black/50 py-1 z-50 animate-fade-in">
                              {user.status !== 'SUSPENDED' && (
                                <button
                                  onClick={() => handleSuspend(user.id)}
                                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-amber-400 hover:bg-white/5 transition-colors"
                                >
                                  <UserX className="w-4 h-4" />
                                  Tạm ngưng
                                </button>
                              )}
                              {user.status === 'SUSPENDED' && (
                                <button
                                  onClick={() => handleActivate(user.id)}
                                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-emerald-400 hover:bg-white/5 transition-colors"
                                >
                                  <UserCheck className="w-4 h-4" />
                                  Kích hoạt lại
                                </button>
                              )}
                              {user.status !== 'DELETED' && (
                                <button
                                  onClick={() => handleDelete(user.id)}
                                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Xóa tài khoản
                                </button>
                              )}
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
    </div>
  );
}
