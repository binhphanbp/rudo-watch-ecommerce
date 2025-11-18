# Danh sách API Endpoints cho Frontend

## Base URL
```
http://localhost/rudo-watch-ecommerce/backend/api/v1
```

## 1. Trang Chủ (Home Page)

### 1.1. Lấy sản phẩm nổi bật
**Endpoint:** `GET /products/featured`

**Query Parameters:**
- `limit` (optional): Số lượng sản phẩm (mặc định: 10)

**Ví dụ:**
```
GET /api/v1/products/featured?limit=8
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "category_id": 1,
      "brand_id": 1,
      "name": "Đồng hồ Rolex Submariner",
      "slug": "dong-ho-rolex-submariner",
      "description": "Đồng hồ cao cấp",
      "image": "/images/rolex.jpg",
      "create_at": "2024-01-01 10:00:00",
      "status": 1
    }
  ]
}
```

---

### 1.2. Lấy sản phẩm mới nhất
**Endpoint:** `GET /products/latest`

**Query Parameters:**
- `limit` (optional): Số lượng sản phẩm (mặc định: 10)

**Ví dụ:**
```
GET /api/v1/products/latest?limit=8
```

**Response:** (Tương tự như featured)

---

### 1.3. Lấy danh sách sản phẩm (có phân trang)
**Endpoint:** `GET /products`

**Query Parameters:**
- `page` (optional): Số trang (mặc định: 1)
- `limit` (optional): Số lượng mỗi trang (mặc định: 10)
- `status` (optional): Lọc theo trạng thái (1 = active)
- `sort_by` (optional): Sắp xếp theo (name, create_at, status)
- `sort_order` (optional): Thứ tự (ASC, DESC)

**Ví dụ:**
```
GET /api/v1/products?page=1&limit=12&status=1&sort_by=create_at&sort_order=DESC
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "data": [...],
    "pagination": {
      "current_page": 1,
      "per_page": 12,
      "total": 100,
      "total_pages": 9
    }
  }
}
```

---

## 2. Danh mục sản phẩm

### 2.1. Lấy sản phẩm theo danh mục
**Endpoint:** `GET /products/category/{category_id}`

**Query Parameters:**
- `limit` (optional): Số lượng sản phẩm

**Ví dụ:**
```
GET /api/v1/products/category/1?limit=12
```

**Response:**
```json
{
  "status": "success",
  "data": [...]
}
```

---

### 2.2. Lấy sản phẩm theo thương hiệu
**Endpoint:** `GET /products/brand/{brand_id}`

**Query Parameters:**
- `limit` (optional): Số lượng sản phẩm

**Ví dụ:**
```
GET /api/v1/products/brand/1?limit=12
```

---

## 3. Chi tiết sản phẩm

### 3.1. Lấy chi tiết sản phẩm theo ID
**Endpoint:** `GET /products/{id}`

**Ví dụ:**
```
GET /api/v1/products/1
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "category_id": 1,
    "brand_id": 1,
    "name": "Đồng hồ Rolex Submariner",
    "slug": "dong-ho-rolex-submariner",
    "description": "Đồng hồ cao cấp Rolex Submariner...",
    "image": "/images/rolex.jpg",
    "create_at": "2024-01-01 10:00:00",
    "status": 1
  }
}
```

---

## 4. Tìm kiếm & Lọc

### 4.1. Tìm kiếm sản phẩm
**Endpoint:** `GET /products?search={keyword}`

**Ví dụ:**
```
GET /api/v1/products?search=rolex&page=1&limit=12
```

---

### 4.2. Lọc sản phẩm
**Endpoint:** `GET /products?category_id={id}&brand_id={id}&status={status}`

**Ví dụ:**
```
GET /api/v1/products?category_id=1&brand_id=2&status=1&page=1&limit=12
```

---

## Tổng hợp Endpoints cho Trang Chủ

### Các API cần gọi khi load trang chủ:

```javascript
// 1. Lấy sản phẩm nổi bật (Featured Products)
GET /api/v1/products/featured?limit=8

// 2. Lấy sản phẩm mới nhất (Latest Products)
GET /api/v1/products/latest?limit=8

// 3. Lấy danh sách sản phẩm chính (có phân trang)
GET /api/v1/products?page=1&limit=12&status=1&sort_by=create_at&sort_order=DESC
```

### Ví dụ sử dụng với JavaScript/Fetch:

```javascript
// Lấy sản phẩm nổi bật
async function getFeaturedProducts() {
  const response = await fetch('http://localhost/rudo-watch-ecommerce/backend/api/v1/products/featured?limit=8');
  const result = await response.json();
  return result.data; // Array of products
}

// Lấy sản phẩm mới nhất
async function getLatestProducts() {
  const response = await fetch('http://localhost/rudo-watch-ecommerce/backend/api/v1/products/latest?limit=8');
  const result = await response.json();
  return result.data;
}

// Lấy danh sách sản phẩm với phân trang
async function getProducts(page = 1, limit = 12) {
  const response = await fetch(`http://localhost/rudo-watch-ecommerce/backend/api/v1/products?page=${page}&limit=${limit}&status=1`);
  const result = await response.json();
  return result.data; // { data: [...], pagination: {...} }
}
```

### Ví dụ sử dụng với Axios:

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost/rudo-watch-ecommerce/backend/api/v1';

// Lấy sản phẩm nổi bật
export const getFeaturedProducts = (limit = 8) => {
  return axios.get(`${API_BASE_URL}/products/featured`, {
    params: { limit }
  });
};

// Lấy sản phẩm mới nhất
export const getLatestProducts = (limit = 8) => {
  return axios.get(`${API_BASE_URL}/products/latest`, {
    params: { limit }
  });
};

// Lấy danh sách sản phẩm
export const getProducts = (params = {}) => {
  return axios.get(`${API_BASE_URL}/products`, {
    params: {
      page: 1,
      limit: 12,
      status: 1,
      ...params
    }
  });
};

// Lấy chi tiết sản phẩm
export const getProductById = (id) => {
  return axios.get(`${API_BASE_URL}/products/${id}`);
};

// Lấy sản phẩm theo danh mục
export const getProductsByCategory = (categoryId, limit = null) => {
  return axios.get(`${API_BASE_URL}/products/category/${categoryId}`, {
    params: { limit }
  });
};

// Lấy sản phẩm theo thương hiệu
export const getProductsByBrand = (brandId, limit = null) => {
  return axios.get(`${API_BASE_URL}/products/brand/${brandId}`, {
    params: { limit }
  });
};

// Tìm kiếm sản phẩm
export const searchProducts = (keyword, page = 1, limit = 12) => {
  return axios.get(`${API_BASE_URL}/products`, {
    params: {
      search: keyword,
      page,
      limit
    }
  });
};
```

## Response Format

Tất cả các API đều trả về format chuẩn:

**Thành công:**
```json
{
  "status": "success",
  "data": {...}
}
```

**Lỗi:**
```json
{
  "status": "error",
  "data": {
    "error": "Thông báo lỗi"
  }
}
```

## HTTP Status Codes

- `200`: Thành công
- `201`: Tạo thành công
- `400`: Dữ liệu không hợp lệ
- `404`: Không tìm thấy
- `500`: Lỗi server

## Lưu ý

1. Tất cả endpoints đều hỗ trợ CORS
2. Không cần authentication cho các endpoint GET (public)
3. `status = 1` nghĩa là sản phẩm đang hoạt động
4. Slug được tự động tạo từ tên sản phẩm (SEO-friendly)
5. Tất cả timestamps theo format: `YYYY-MM-DD HH:MM:SS`

