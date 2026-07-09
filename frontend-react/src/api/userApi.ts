import axiosClient from './axiosClient';

export interface ProfileResponse {
  id: string;
  email: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
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
}

export const userApi = {
  getProfile: () => {
    return axiosClient.get<ProfileResponse>('/users/me');
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
  }
};
