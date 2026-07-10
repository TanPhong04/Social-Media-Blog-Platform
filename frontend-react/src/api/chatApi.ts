import axiosClient from './axiosClient';
import type { Page } from './articleApi';

export interface ChatMessageResponse {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface ChatContactResponse {
  contactId: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
}

export const chatApi = {
  sendMessage: (recipientId: string, content: string) => {
    return axiosClient.post<ChatMessageResponse>('/chats', { recipientId, content });
  },
  getChatHistory: (contactId: string, page = 0, size = 50) => {
    return axiosClient.get<Page<ChatMessageResponse>>(`/chats/${contactId}`, {
      params: { page, size }
    });
  },
  getContacts: () => {
    return axiosClient.get<ChatContactResponse[]>('/chats/contacts');
  },
  markAsRead: (contactId: string) => {
    return axiosClient.put(`/chats/${contactId}/read`);
  },
  checkOnlineStatuses: (userIds: string[]) => {
    return axiosClient.post<Record<string, boolean>>('/chats/online-statuses', userIds);
  }
};
