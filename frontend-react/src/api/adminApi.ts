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

// Mock data for Dashboard ONLY since we didn't build cross-service aggregator yet
const MOCK_STATS: AdminStats = {
  totalUsers: 1247,
  totalArticles: 3892,
  totalComments: 12450,
  activeUsers: 892,
  newUsersToday: 23,
  newArticlesToday: 47,
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const adminApi = {
  // Dashboard (Still Mocked as requested, since creating a cross-db aggregator was deemed unnecessary)
  getStats: async (): Promise<AdminStats> => {
    await delay(600);
    return MOCK_STATS;
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
