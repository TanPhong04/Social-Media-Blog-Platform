import axiosClient from './axiosClient';

// Types
export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  role: string;
  status: string; // ACTIVE, SUSPENDED, DELETED
  createdAt: string;
}

export interface AdminArticle {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  slug: string;
  summary: string;
  status: string; // DRAFT, PUBLISHED, ARCHIVED
  tags: string[];
  createdAt: string;
  publishedAt?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalArticles: number;
  totalComments: number;
  activeUsers: number;
  newUsersToday: number;
  newArticlesToday: number;
}

export interface AdminActivity {
  type: 'USER' | 'ARTICLE';
  text: string;
  time: string;
  color: string;
  icon: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

export const adminApi = {
  // Dashboard - API Composition
  getStats: async (): Promise<AdminStats> => {
    try {
      const [userStatsRes, articleStatsRes, commentStatsRes] = await Promise.all([
        axiosClient.get('/admin/users/stats'),
        axiosClient.get('/admin/articles/stats'),
        axiosClient.get('/admin/comments/stats')
      ]);
      
      return {
        totalUsers: userStatsRes.data.totalUsers || 0,
        activeUsers: userStatsRes.data.activeUsers || 0,
        newUsersToday: userStatsRes.data.newUsersToday || 0,
        totalArticles: articleStatsRes.data.totalArticles || 0,
        newArticlesToday: articleStatsRes.data.newArticlesToday || 0,
        totalComments: commentStatsRes.data.totalComments || 0,
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      // Fallback or throw error
      throw error;
    }
  },

  getRecentActivities: async (): Promise<AdminActivity[]> => {
    try {
      // Fetch newest 5 users and 5 articles
      const [usersRes, articlesRes] = await Promise.all([
        adminApi.getUsers(0, 5),
        adminApi.getArticles(0, 5)
      ]);

      const userActivities: AdminActivity[] = usersRes.content.map(u => ({
        type: 'USER',
        text: `${u.displayName} đã đăng ký tài khoản`,
        time: u.createdAt,
        color: 'text-blue-400',
        icon: 'UserCheck'
      }));

      const articleActivities: AdminActivity[] = articlesRes.content.map(a => ({
        type: 'ARTICLE',
        text: `${a.authorName} đã đăng bài "${a.title}"`,
        time: a.createdAt,
        color: 'text-purple-400',
        icon: 'BookOpen'
      }));

      // Combine and sort by newest first
      const all = [...userActivities, ...articleActivities].sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
      );

      // Return top 5
      return all.slice(0, 5);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  },

  // Users (Real API)
  getUsers: async (page = 0, size = 10): Promise<PageResponse<AdminUser>> => {
    return axiosClient.get('/admin/users', { params: { page, size } });
  },

  suspendUser: async (userId: string): Promise<void> => {
    return axiosClient.put(`/admin/users/${userId}/suspend`);
  },

  activateUser: async (userId: string): Promise<void> => {
    return axiosClient.put(`/admin/users/${userId}/activate`);
  },

  deleteUser: async (userId: string): Promise<void> => {
    return axiosClient.delete(`/admin/users/${userId}`);
  },

  // Articles (Real API)
  getArticles: async (page = 0, size = 10): Promise<PageResponse<AdminArticle>> => {
    return axiosClient.get('/admin/articles', { params: { page, size } });
  },

  archiveArticle: async (articleId: string): Promise<void> => {
    return axiosClient.put(`/admin/articles/${articleId}/archive`);
  },

  deleteArticle: async (articleId: string): Promise<void> => {
    return axiosClient.delete(`/admin/articles/${articleId}`);
  },
};
