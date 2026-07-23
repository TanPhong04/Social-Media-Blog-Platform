import axiosClient from './axiosClient';

export interface CreateLiveRequest {
  title: string;
  summary?: string;
  tags?: string[];
}

export interface LiveSessionResponse {
  id: string;
  title: string;
  rtmpUrl: string;
  streamKey: string;
  hlsUrl: string;
}

export interface ActiveLiveResponse {
  id: string;
  authorId: string;
  title: string;
  slug: string;
  summary: string;
  hlsUrl: string;
  startedAt: string;
}

export const livestreamApi = {
  createLiveSession: (data: CreateLiveRequest) => {
    return axiosClient.post<LiveSessionResponse>('/articles/livestream/create', data);
  },
  getActiveLiveSessions: () => {
    return axiosClient.get<ActiveLiveResponse[]>('/articles/livestream/active');
  },
  endLiveSession: (articleId: string) => {
    return axiosClient.delete(`/articles/livestream/${articleId}/end`);
  }
};
