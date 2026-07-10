import axiosClient from './axiosClient';

export const mediaApi = {
  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // We expect the backend to return { url: "http://..." }
    const response = await axiosClient.post<any>('/articles/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.url;
  }
};
