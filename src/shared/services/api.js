import axios from 'axios';

// 1. CẤU HÌNH ĐƯỜNG DẪN
// API_BASE_URL: Nơi gọi dữ liệu JSON
export const API_BASE_URL =
  'https://rudowatchbe-production.up.railway.app/api/v1/';

// IMG_BASE_URL: Nơi chứa folder 'uploads' (Thư mục gốc của backend)
export const IMG_BASE_URL = 'https://rudowatchbe-production.up.railway.app/';
// Tạo instance Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds timeout (cho forgot password email)
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// 2. TỰ ĐỘNG GỬI TOKEN (Nếu đã đăng nhập)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 3. XỬ LÝ LỖI RESPONSE (Network, CORS, Server errors)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Lỗi code 0 = Network error hoặc CORS bị block
    if (!error.response) {
      console.error('Network Error:', error.message);
      error.message =
        'Không thể kết nối đến server. Kiểm tra:\n1. Server backend đã chạy chưa?\n2. URL API có đúng không?\n3. CORS có được cấu hình đúng không?';
    } else if (error.response.status === 0) {
      error.message = 'CORS bị block hoặc server không phản hồi';
    }
    return Promise.reject(error);
  }
);

// 3. HELPER XỬ LÝ ẢNH (Quan trọng)
export const getImageUrl = (path) => {
  // Trường hợp 1: Không có đường dẫn -> Trả về ảnh placeholder
  if (!path) return 'https://placehold.co/600x600?text=No+Image';

  // Trường hợp 2: Đường dẫn là link online (http...) -> Giữ nguyên
  if (path.startsWith('http')) return path;

  // Trường hợp 3: Đường dẫn từ DB nội bộ
  // Bước A: Thay thế dấu gạch chéo ngược '\' thành '/' (Fix lỗi Windows path)
  let cleanPath = path.replace(/\\/g, '/');

  // Bước B: Xóa dấu '/' ở đầu nếu có (để tránh bị trùng // với base url)
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.substring(1);
  }

  // Bước C: Đảm bảo Base URL luôn có dấu '/' ở cuối
  const baseUrl = IMG_BASE_URL.endsWith('/')
    ? IMG_BASE_URL
    : IMG_BASE_URL + '/';

  // Kết quả: http://localhost/.../backend/uploads/products/anh.png
  return `${baseUrl}${cleanPath}`;
};

export default api;
