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
  targetUrl?: string | null;
  content: string;
}

export const commentApi = {
  getComments: (articleId: string, targetUrl?: string | null, page = 0, size = 50) => {
    return axiosClient.get<{ content: CommentResponse[] }>(`/comments/articles/${articleId}`, {
      params: { page, size, ...(targetUrl ? { targetUrl } : {}) }
    });
  },
  createComment: (data: CreateCommentRequest) => {
    return axiosClient.post<CommentResponse>('/comments', data);
  },
  updateComment: (id: string, data: { content: string }) => {
    return axiosClient.put<CommentResponse>(`/comments/${id}`, data);
  },
  deleteComment: (id: string) => {
    return axiosClient.delete(`/comments/${id}`);
  },
  
  // Tương tác thả tim bình luận (COMMENT) qua interaction-service
  getCommentInteraction: (commentId: string) => {
    return axiosClient.get<{ count: number; likedByCurrentUser: boolean }>(`/interactions/COMMENT/${commentId}`);
  },
  likeComment: (commentId: string, reaction: string = 'LIKE') => {
    return axiosClient.put(`/interactions/COMMENT/${commentId}/like?reaction=${reaction}`);
  },
  unlikeComment: (commentId: string) => {
    return axiosClient.delete(`/interactions/COMMENT/${commentId}/like`);
  }
};
