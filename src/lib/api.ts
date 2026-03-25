import axios from 'axios';

// ============================================
// CENTRALIZED API CONFIGURATION
// Khi deploy production, chỉ cần thay đổi 2 biến trong .env.local:
//   NEXT_PUBLIC_API_URL=https://api.rudowatch.store/api/v1
//   NEXT_PUBLIC_IMG_URL=https://api.rudowatch.store
// ============================================

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const IMG_BASE_URL =
  process.env.NEXT_PUBLIC_IMG_URL || 'http://localhost:8000';

// Tạo Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Tự động gắn JWT token vào mọi request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Xử lý lỗi response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error('Network Error:', error.message);
      error.message = 'Không thể kết nối đến server.';
    } else if (error.response.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to login only if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Helper xử lý URL ảnh
export const getImageUrl = (path?: string | null): string => {
  if (!path) return 'https://placehold.co/600x600?text=No+Image';
  if (path.startsWith('http')) return path;

  let cleanPath = path.replace(/\\/g, '/');
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.substring(1);
  }

  const baseUrl = IMG_BASE_URL.endsWith('/') ? IMG_BASE_URL : IMG_BASE_URL + '/';
  return `${baseUrl}${cleanPath}`;
};

export default api;
