import axiosClient from './axiosClient';
import type { Page } from './articleApi';

export interface NotificationResponse {
  id: string;
  type: string;
  actorId: string;
  actorName: string;
  actorAvatarUrl: string;
  targetId: string;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCount {
  count: number;
}

export const notificationApi = {
  getNotifications: (page: number = 0, size: number = 20) => {
    return axiosClient.get<Page<NotificationResponse>>('/notifications', {
      params: { page, size }
    });
  },
  getUnreadCount: () => {
    return axiosClient.get<UnreadCount>('/notifications/unread-count');
  },
  markAsRead: (id: string) => {
    return axiosClient.patch(`/notifications/${id}/read`);
  },
  markAllAsRead: () => {
    return axiosClient.patch<UnreadCount>('/notifications/read-all');
  }
};
