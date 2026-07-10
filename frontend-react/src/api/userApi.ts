import axiosClient from './axiosClient';

export interface ProfileResponse {
  id: string;
  email: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
  username: string;
  dob: string | null;
  createdAt: string;
}

export interface RelationshipResponse {
  targetId: string;
  following: boolean;
  followerCount: number;
  followingCount: number;
}

export interface UpdateProfileRequest {
  displayName: string;
  bio: string;
  avatarUrl: string;
  username: string;
  dob: string;
}

export const userApi = {
  getProfile: () => {
    return axiosClient.get<ProfileResponse>('/users/me');
  },
  getUserById: (userId: string) => {
    return axiosClient.get<ProfileResponse>(`/users/${userId}`);
  },
  updateProfile: (data: UpdateProfileRequest) => {
    return axiosClient.put<ProfileResponse>('/users/me', data);
  },
  getFollowStatus: (userId: string) => {
    return axiosClient.get<RelationshipResponse>(`/follows/status/${userId}`);
  },
  followUser: (userId: string) => {
    return axiosClient.put<RelationshipResponse>(`/follows/${userId}`);
  },
  unfollowUser: (userId: string) => {
    return axiosClient.delete<RelationshipResponse>(`/follows/${userId}`);
  },
  getFollowers: (userId: string, page: number = 0, size: number = 20) => {
    return axiosClient.get<any>(`/follows/users/${userId}/followers?page=${page}&size=${size}`);
  },
  getFollowing: (userId: string, page: number = 0, size: number = 20) => {
    return axiosClient.get<any>(`/follows/users/${userId}/following?page=${page}&size=${size}`);
  },
  getSuggestions: () => {
    return axiosClient.get<ProfileResponse[]>('/users/suggestions');
  }
};
