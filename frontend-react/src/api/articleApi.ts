import axiosClient from './axiosClient';

export interface ArticleResponse {
  id: string;
  authorId: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  status: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface ArticleWriteRequest {
  title: string;
  summary: string;
  content: string;
  tags: string[];
}

export interface Page<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  empty: boolean;
}

export const articleApi = {
  getFeed: (page: number = 0, size: number = 20) => {
    return axiosClient.get<Page<ArticleResponse>>('/articles', {
      params: { page, size }
    });
  },
  getFollowingFeed: (page: number = 0, size: number = 20) => {
    return axiosClient.get<Page<ArticleResponse>>('/articles/following', {
      params: { page, size }
    });
  },
  getMine: (page: number = 0, size: number = 20) => {
    return axiosClient.get<Page<ArticleResponse>>('/articles/mine', {
      params: { page, size }
    });
  },
  createArticle: (data: ArticleWriteRequest) => {
    return axiosClient.post<ArticleResponse>('/articles', data);
  },
  updateArticle: (id: string, data: ArticleWriteRequest) => {
    return axiosClient.put<ArticleResponse>(`/articles/${id}`, data);
  },
  deleteArticle: (id: string) => {
    return axiosClient.delete(`/articles/${id}`);
  },
  publishArticle: (id: string) => {
    return axiosClient.post<ArticleResponse>(`/articles/${id}/publish`);
  },
  unpublishArticle: (id: string) => {
    return axiosClient.post<ArticleResponse>(`/articles/${id}/unpublish`);
  }
};

