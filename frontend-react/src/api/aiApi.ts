import axiosClient from './axiosClient';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AiChatRequest {
  question: string;
  conversationHistory: ChatMessage[];
}

export interface AiChatResponse {
  reply: string;
}

export const aiApi = {
  askAi: (articleId: string, data: AiChatRequest) => {
    return axiosClient.post<AiChatResponse>(`/articles/${articleId}/ask-ai`, data);
  }
};
