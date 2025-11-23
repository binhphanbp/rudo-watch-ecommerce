# 1. Sử dụng image PHP kèm Apache (Web server phổ biến nhất)
FROM php:8.2-apache

# 2. Copy toàn bộ code của bạn vào thư mục web của server
COPY . /var/www/html/

# 3. Cài đặt các extension cơ bản nếu bạn cần kết nối Database (MySQL)
RUN docker-php-ext-install mysqli pdo pdo_mysql

# 4. Mở cổng 80 (Render sẽ tự động map cổng này ra ngoài)
EXPOSE 80

# 5. Cấp quyền để server có thể đọc/ghi file (tránh lỗi permission)
RUN chown -R www-data:www-data /var/www/html