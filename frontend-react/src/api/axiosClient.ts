import axios from 'axios';

const axiosClient = axios.create({
  // Because we use Caddy reverse proxy, all API calls start with /api
  // Caddy will forward this to the Backend running on port 8080.
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for Request
axiosClient.interceptors.request.use(
  (config) => {
    // Automatically attach JWT Token from localStorage
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor for Response
axiosClient.interceptors.response.use(
  (response) => {
    return response.data; // Usually API returns data inside 'data'
  },
  (error) => {
    // Handle global errors here (e.g. 401 Unauthorized -> redirect to login)
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized, please login again.');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
