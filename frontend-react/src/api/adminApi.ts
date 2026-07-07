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

// Mock data for development (since backend admin endpoints don't exist yet)
const MOCK_STATS: AdminStats = {
  totalUsers: 1247,
  totalArticles: 3892,
  totalComments: 12450,
  activeUsers: 892,
  newUsersToday: 23,
  newArticlesToday: 47,
};

const MOCK_USERS: AdminUser[] = [
  { id: '1', email: 'alice@example.com', displayName: 'Alice Nguyễn', role: 'USER', status: 'ACTIVE', createdAt: '2026-01-15T10:30:00Z' },
  { id: '2', email: 'bob@example.com', displayName: 'Bob Trần', role: 'USER', status: 'ACTIVE', createdAt: '2026-02-20T14:00:00Z' },
  { id: '3', email: 'charlie@example.com', displayName: 'Charlie Lê', role: 'ADMIN', status: 'ACTIVE', createdAt: '2025-12-01T08:00:00Z' },
  { id: '4', email: 'diana@example.com', displayName: 'Diana Phạm', role: 'USER', status: 'SUSPENDED', createdAt: '2026-03-10T09:15:00Z' },
  { id: '5', email: 'edward@example.com', displayName: 'Edward Hoàng', role: 'USER', status: 'ACTIVE', createdAt: '2026-04-05T16:45:00Z' },
  { id: '6', email: 'fiona@example.com', displayName: 'Fiona Đặng', role: 'USER', status: 'ACTIVE', createdAt: '2026-05-12T11:20:00Z' },
  { id: '7', email: 'george@example.com', displayName: 'George Vũ', role: 'USER', status: 'DELETED', createdAt: '2026-01-25T07:30:00Z' },
  { id: '8', email: 'helen@example.com', displayName: 'Helen Bùi', role: 'USER', status: 'ACTIVE', createdAt: '2026-06-01T13:00:00Z' },
];

const MOCK_ARTICLES: AdminArticle[] = [
  { id: '1', authorId: '1', authorName: 'Alice Nguyễn', title: 'Hướng dẫn React Hooks chi tiết', slug: 'huong-dan-react-hooks', summary: 'Tìm hiểu về useState, useEffect và các hooks phổ biến...', status: 'PUBLISHED', tags: ['react', 'javascript'], createdAt: '2026-06-15T10:00:00Z', publishedAt: '2026-06-15T12:00:00Z' },
  { id: '2', authorId: '2', authorName: 'Bob Trần', title: 'Spring Boot Microservices từ A-Z', slug: 'spring-boot-microservices', summary: 'Xây dựng hệ thống microservices với Spring Boot...', status: 'PUBLISHED', tags: ['java', 'spring-boot'], createdAt: '2026-06-20T14:00:00Z', publishedAt: '2026-06-20T15:30:00Z' },
  { id: '3', authorId: '1', authorName: 'Alice Nguyễn', title: 'TypeScript Advanced Types', slug: 'typescript-advanced-types', summary: 'Khám phá generic types, conditional types...', status: 'DRAFT', tags: ['typescript'], createdAt: '2026-07-01T09:00:00Z' },
  { id: '4', authorId: '5', authorName: 'Edward Hoàng', title: 'Docker cho Developer', slug: 'docker-cho-developer', summary: 'Containerize ứng dụng của bạn với Docker...', status: 'PUBLISHED', tags: ['docker', 'devops'], createdAt: '2026-06-25T08:00:00Z', publishedAt: '2026-06-25T10:00:00Z' },
  { id: '5', authorId: '6', authorName: 'Fiona Đặng', title: 'UI/UX Design Principles', slug: 'ui-ux-design-principles', summary: 'Nguyên tắc thiết kế giao diện người dùng...', status: 'PUBLISHED', tags: ['design', 'ui-ux'], createdAt: '2026-07-02T11:00:00Z', publishedAt: '2026-07-02T13:00:00Z' },
  { id: '6', authorId: '8', authorName: 'Helen Bùi', title: 'Kafka Event Streaming', slug: 'kafka-event-streaming', summary: 'Xử lý sự kiện real-time với Apache Kafka...', status: 'ARCHIVED', tags: ['kafka', 'backend'], createdAt: '2026-05-10T07:00:00Z', publishedAt: '2026-05-10T09:00:00Z' },
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const adminApi = {
  // Dashboard
  getStats: async (): Promise<AdminStats> => {
    await delay(600);
    return MOCK_STATS;
    // Future: return axiosClient.get('/admin/stats');
  },

  // Users
  getUsers: async (page = 0, size = 10): Promise<PageResponse<AdminUser>> => {
    await delay(500);
    const start = page * size;
    const content = MOCK_USERS.slice(start, start + size);
    return { content, totalElements: MOCK_USERS.length, totalPages: Math.ceil(MOCK_USERS.length / size), pageNumber: page, pageSize: size };
    // Future: return axiosClient.get('/admin/users', { params: { page, size } });
  },

  suspendUser: async (userId: string): Promise<void> => {
    await delay(400);
    console.log('Suspend user:', userId);
    // Future: return axiosClient.put(`/admin/users/${userId}/suspend`);
  },

  activateUser: async (userId: string): Promise<void> => {
    await delay(400);
    console.log('Activate user:', userId);
    // Future: return axiosClient.put(`/admin/users/${userId}/activate`);
  },

  deleteUser: async (userId: string): Promise<void> => {
    await delay(400);
    console.log('Delete user:', userId);
    // Future: return axiosClient.delete(`/admin/users/${userId}`);
  },

  // Articles
  getArticles: async (page = 0, size = 10): Promise<PageResponse<AdminArticle>> => {
    await delay(500);
    const start = page * size;
    const content = MOCK_ARTICLES.slice(start, start + size);
    return { content, totalElements: MOCK_ARTICLES.length, totalPages: Math.ceil(MOCK_ARTICLES.length / size), pageNumber: page, pageSize: size };
    // Future: return axiosClient.get('/admin/articles', { params: { page, size } });
  },

  archiveArticle: async (articleId: string): Promise<void> => {
    await delay(400);
    console.log('Archive article:', articleId);
    // Future: return axiosClient.put(`/admin/articles/${articleId}/archive`);
  },

  deleteArticle: async (articleId: string): Promise<void> => {
    await delay(400);
    console.log('Delete article:', articleId);
    // Future: return axiosClient.delete(`/admin/articles/${articleId}`);
  },
};
