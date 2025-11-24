# Dự Án 1: Website E-commerce Rudo Watch

[![PHP](https://img.shields.io/badge/PHP-8.2-777BB4?style=for-the-badge&logo=php)](https://www.php.net/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql)](https://www.mysql.com/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://en.wikipedia.org/wiki/HTML5)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?style=for-the-badge&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

Đây là dự án E-commerce (Website Thương mại Điện tử) cho môn Dự án 1. Website tập trung vào việc kinh doanh các sản phẩm đồng hồ đeo tay.

Dự án được xây dựng và quản lý bằng Git, tuân thủ quy trình **Feature Branch Workflow** và **Pull Request** để đảm bảo chất lượng code và khả năng làm việc nhóm.

## 👥 Thành Viên Nhóm

- **Phan Đức Bình** - _Team Leader / Frontend Developer_ - https://github.com/binhphanbp
- **Phan Đức Toàn** - _Backend Developer_ - https://github.com/DucToanDev
- **Nguyễn Anh Khôi** - _Frontend Developer_ - https://github.com/Khoiundie

---

## 🌟 Tính Năng Chính

Dự án bao gồm 2 phần chính: Giao diện người dùng (Client) và Trang quản trị (Admin).

### 1. Giao Diện Người Dùng (Client)

- **Trang chủ:** Hiển thị slider, sản phẩm mới, sản phẩm nổi bật.
- **Trang Sản phẩm:**
  - Hiển thị danh sách sản phẩm (list/grid).
  - Bộ lọc sản phẩm (theo giá, danh mục, thương hiệu).
  - Tìm kiếm sản phẩm (live search).
- **Trang Chi tiết Sản phẩm:** Hiển thị thông tin chi tiết, hình ảnh, mô tả, bình luận/đánh giá.
- **Giỏ hàng:**
  - Thêm/Xóa/Cập nhật số lượng sản phẩm.
  - Áp dụng mã giảm giá.
- **Thanh toán (Checkout):** Nhập thông tin giao hàng, chọn phương thức thanh toán.
- **Xác thực người dùng:**
  - Đăng ký tài khoản.
  - Đăng nhập (với session/cookie).
  - Quên mật khẩu.
- **Trang cá nhân:** Xem/cập nhật thông tin, xem lịch sử đơn hàng.

### 2. Trang Quản Trị (Admin)

- **Dashboard:** Thống kê tổng quan (doanh thu, đơn hàng, người dùng).
- **Quản lý Sản phẩm (CRUD):** Thêm/Sửa/Xóa sản phẩm, quản lý hình ảnh, giá.
- **Quản lý Danh mục (CRUD):** Thêm/Sửa/Xóa danh mục.
- **Quản lý Đơn hàng:** Xem danh sách đơn hàng, cập nhật trạng thái (đang xử lý, đã giao...).
- **Quản lý Người dùng:** Xem danh sách, phân quyền (Admin/User).
- **Quản lý Bình luận:** Duyệt/Xóa bình luận.

---

## 🎨 Sơ Đồ ERD (Database)

Dưới đây là Sơ đồ Quan hệ Thực thể (ERD) cho CSDL của dự án.

## 🏗️ Cấu Trúc Dự Án (MVC)

Dự án được chia làm 2 phần rõ rệt: Backend (API) chịu trách nhiệm xử lý logic/dữ liệu và trả về JSON, Frontend (Client) chịu trách nhiệm hiển thị và gọi API.

```
/rudo-watch-ecommerce
│
├── /backend # PHẦN SERVER (PHP API)
│ ├── /config # Cấu hình Database, CORS...
│ ├── /controllers # Nhận request, xử lý logic, trả về JSON
│ │ ├── AuthController.php
│ │ ├── ProductController.php
│ │ └── ...
│ ├── /models # Tương tác trực tiếp với Database (CRUD)
│ │ ├── User.php
│ │ ├── Product.php
│ │ └── ...
│ ├── /core # Các class cốt lõi (Database, Router, Controller gốc...)
│ └── index.php # API Entry Point (http://localhost/api/...)
│ ├── /database # Lưu trữ file SQL
│ │ ├── db_rudo_watch.sql
│ │ ├── erd_diagram.png
│
├── /frontend # PHẦN GIAO DIỆN (HTML, JS, Tailwind)
│ ├── /src # Mã nguồn Tailwind (input.css)
│ ├── /public # Nơi chạy web thực tế
│ │ ├── index.html # Trang chủ
│ │ ├── admin.html # Trang quản trị
│ │ └── /assets
│ │ ├── /css # CSS đã build từ Tailwind (output.css)
│ │ ├── /js # File JS dùng fetch/axios gọi API
│ │ └── /images
│ └── tailwind.config.js # Cấu hình Tailwind
│
│
├── .gitignore
└── README.md
```

---

## 🛠️ Hướng Dẫn Cài Đặt (Getting Started)

Để chạy dự án này ở local, hãy làm theo các bước sau:

1.  **Clone Repository:**

    ```bash
    git clone https://github.com/binhphanbp/rudo-watch-ecommerce.git
    cd rudo-watch-ecommerce
    ```

2.  **Cài Đặt Database:**

    - Tạo một database mới trong MySQL (ví dụ: `rudo_watch`).
    - Import file SQL từ thư mục `backend/` (ví dụ: `rudo_watch (4).sql`) vào database vừa tạo.

3.  **Cấu Hình Môi Trường:**

    - **Backend (PHP):**
      ```bash
      cd backend
      composer install
      ```
    - **Tạo file `.env` cho Backend:**
      - Copy file `.env.example` thành `.env`:
        ```bash
        cp .env.example .env
        # Hoặc trên Windows:
        copy .env.example .env
        ```
      - Mở file `.env` và cập nhật thông tin database:
        ```env
        DB_HOST=localhost
        DB_PORT=3306
        DB_DATABASE=rudo_watch
        DB_USERNAME=root
        DB_PASSWORD=your_password
        ```
    - **Cấu hình CORS (nếu cần):**
      - Mở file `backend/config/cors.php`
      - Nếu muốn cho phép tất cả origin, giữ nguyên `$allowAllOrigins = true`
      - Nếu muốn chỉ định cụ thể, set `$allowAllOrigins = false` và thêm origin vào mảng `$allowedOrigins`

4.  **Cài Đặt Thư Viện:**

    - **Frontend (Node.js):**
      ```bash
      cd frontend
      npm install
      # hoặc
      pnpm install
      ```

5.  **Chạy Dự Án:**

    - Chạy câu lệnh build của Tailwind (hoặc chạy "watch" để tự động cập nhật):
      ```bash
      npm run build
      ```
    - Sử dụng một server ảo (như Laragon, XAMPP).
    - Trỏ domain ảo (hoặc `localhost`) vào thư mục `/public` của dự án.
    - Mở trình duyệt và tận hưởng.

    - **Backend:**

      - Sử dụng server ảo (Laragon, XAMPP, hoặc PHP built-in server)
      - Trỏ domain ảo vào thư mục `backend/`
      - Ví dụ với Laragon: `http://rudo-watch-ecommerce.test/backend/api/v1/`
      - Hoặc với PHP built-in server:
        ```bash
        cd backend
        php -S localhost:8000
        ```
        Truy cập: `http://localhost:8000/api/v1/`

    - **Frontend:**
      - Chạy dev server:
        ```bash
        cd frontend
        npm run dev
        # hoặc
        pnpm dev
        ```
      - Hoặc build production:
        ```bash
        npm run build
        ```

## ⚠️ Lưu Ý Khi Deploy

### Vấn đề Forbidden (403) thường gặp:

1. **File `.env` chưa được tạo:**

   - Đảm bảo đã copy `.env.example` thành `.env` và cấu hình đúng thông tin database

2. **CORS chặn request:**

   - Kiểm tra file `backend/config/cors.php`
   - Nếu deploy production, nên set `$allowAllOrigins = false` và chỉ định origin cụ thể
   - Hoặc thêm domain của bạn vào mảng `$allowedOrigins`

3. **Quyền truy cập file/folder:**

   - Đảm bảo web server có quyền đọc file trong thư mục `backend/`
   - Kiểm tra file `.htaccess` có tồn tại và đúng cấu hình

4. **Database connection:**

   - Kiểm tra thông tin database trong file `.env` đã đúng chưa
   - Đảm bảo database đã được import đầy đủ

5. **URL Rewrite:**
   - Đảm bảo Apache mod_rewrite đã được bật
   - File `.htaccess` trong thư mục `backend/` phải tồn tại
