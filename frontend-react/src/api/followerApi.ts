import axiosClient from './axiosClient';
import type { Page } from './articleApi';

export interface UserLink {
  userId: string;
  displayName: string;
  avatarUrl: string;
}

export interface Relationship {
  followerId: string;
  targetId: string;
  createdAt: string;
}

export const followerApi = {
  follow: (targetId: string) => {
    return axiosClient.put<Relationship>(`/follows/${targetId}`);
  },
  unfollow: (targetId: string) => {
    return axiosClient.delete<Relationship>(`/follows/${targetId}`);
  },
  status: (targetId: string) => {
    return axiosClient.get<Relationship>(`/follows/status/${targetId}`);
  },
  getFollowers: (userId: string, page: number = 0, size: number = 20) => {
    return axiosClient.get<Page<UserLink>>(`/follows/users/${userId}/followers`, {
      params: { page, size }
    });
  },
  getFollowing: (userId: string, page: number = 0, size: number = 20) => {
    return axiosClient.get<Page<UserLink>>(`/follows/users/${userId}/following`, {
      params: { page, size }
    });
  }
};
