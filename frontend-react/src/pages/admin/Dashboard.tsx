import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FileText,
  MessageSquare,
  TrendingUp,
  UserPlus,
  PenLine,
  ArrowUpRight,
  UserCheck,
  BookOpen,
  Clock,
  Sparkles,
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import type { AdminStats, AdminActivity } from '../../api/adminApi';

const statCards = [
  { key: 'totalUsers' as keyof AdminStats, label: 'Tổng người dùng', icon: Users, gradient: 'from-blue-500 to-cyan-500', glow: 'shadow-blue-500/20' },
  { key: 'totalArticles' as keyof AdminStats, label: 'Tổng bài viết', icon: FileText, gradient: 'from-violet-500 to-purple-500', glow: 'shadow-violet-500/20' },
  { key: 'totalComments' as keyof AdminStats, label: 'Tổng bình luận', icon: MessageSquare, gradient: 'from-emerald-500 to-green-500', glow: 'shadow-emerald-500/20' },
  { key: 'activeUsers' as keyof AdminStats, label: 'Đang hoạt động', icon: TrendingUp, gradient: 'from-amber-500 to-orange-500', glow: 'shadow-amber-500/20' },
  { key: 'newUsersToday' as keyof AdminStats, label: 'Người dùng mới hôm nay', icon: UserPlus, gradient: 'from-rose-500 to-pink-500', glow: 'shadow-rose-500/20' },
  { key: 'newArticlesToday' as keyof AdminStats, label: 'Bài viết mới hôm nay', icon: PenLine, gradient: 'from-indigo-500 to-blue-500', glow: 'shadow-indigo-500/20' },
];

// Todo: Fetch real recent activities from API when available

const quickActions = [
  { label: 'Quản lý người dùng', path: '/admin/users', icon: Users, description: 'Xem, tạm ngưng, hoặc xóa tài khoản' },
  { label: 'Quản lý bài viết', path: '/admin/articles', icon: FileText, description: 'Kiểm duyệt và quản lý nội dung' },
  { label: 'Xem trang chính', path: '/', icon: ArrowUpRight, description: 'Mở giao diện người dùng' },
];

export default function Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getStats(),
      adminApi.getRecentActivities()
    ])
      .then(([statsData, activitiesData]) => {
        setStats(statsData);
        setActivities(activitiesData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load dashboard data:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-heading font-bold">Tổng quan</h1>
        </div>
        <p className="text-text-secondary">Chào mừng trở lại, quản trị viên. Đây là tổng quan hệ thống hôm nay.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className={`group relative bg-surface/60 backdrop-blur-md rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all duration-500 hover:${card.glow} hover:shadow-xl overflow-hidden`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Glow background */}
              <div className={`absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br ${card.gradient} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity duration-500`} />
              
              <div className="relative flex items-start justify-between">
                <div>
                  {loading ? (
                    <>
                      <div className="h-9 w-20 bg-white/5 rounded-lg animate-pulse mb-2" />
                      <div className="h-4 w-28 bg-white/5 rounded animate-pulse" />
                    </>
                  ) : (
                    <>
                      <p className="text-3xl font-heading font-bold text-text-primary mb-1">
                        {stats?.[card.key]?.toLocaleString()}
                      </p>
                      <p className="text-sm text-text-secondary">{card.label}</p>
                    </>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-3 bg-surface/60 backdrop-blur-md rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-heading font-semibold">Hoạt động gần đây</h2>
          </div>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-white/5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/5 rounded w-3/4" />
                    <div className="h-3 bg-white/5 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-4">Chưa có hoạt động nào</p>
              ) : (
                activities.map((activity, index) => {
                  const Icon = activity.icon === 'UserCheck' ? UserCheck : BookOpen;
                  const timeStr = new Date(activity.time).toLocaleString('vi-VN');
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors duration-300 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors duration-300">
                        <Icon className={`w-5 h-5 ${activity.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary truncate">{activity.text}</p>
                        <p className="text-xs text-text-secondary">{timeStr}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-surface/60 backdrop-blur-md rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-heading font-semibold">Thao tác nhanh</h2>
          </div>
          <div className="space-y-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.path}
                  to={action.path}
                  className="flex items-center gap-4 p-4 rounded-xl border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{action.label}</p>
                    <p className="text-xs text-text-secondary">{action.description}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-text-secondary group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
