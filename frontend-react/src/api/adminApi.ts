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
