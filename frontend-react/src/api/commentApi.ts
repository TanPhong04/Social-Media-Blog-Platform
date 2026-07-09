import axiosClient from './axiosClient';

export interface CommentResponse {
  id: string;
  articleId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  articleId: string;
  parentId?: string | null;
  content: string;
}

export const commentApi = {
  getComments: (articleId: string, page = 0, size = 50) => {
    return axiosClient.get<{ content: CommentResponse[] }>(`/comments/articles/${articleId}`, {
      params: { page, size }
    });
  },
  createComment: (data: CreateCommentRequest) => {
    return axiosClient.post<CommentResponse>('/comments', data);
  },
  deleteComment: (id: string) => {
    return axiosClient.delete(`/comments/${id}`);
  }
};
