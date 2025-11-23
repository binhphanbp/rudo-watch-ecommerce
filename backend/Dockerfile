# 1. Sử dụng image PHP kèm Apache (Web server phổ biến nhất)
FROM php:8.2-apache

# 2. Bật mod_rewrite cho Apache (cần cho .htaccess)
RUN a2enmod rewrite

# 3. Copy toàn bộ code của bạn vào thư mục web của server
COPY . /var/www/html/

# 4. Cài đặt các extension cơ bản nếu bạn cần kết nối Database (MySQL)
RUN docker-php-ext-install mysqli pdo pdo_mysql

# 5. Cấu hình Apache để cho phép .htaccess
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# 6. Mở cổng 80 (Render sẽ tự động map cổng này ra ngoài)
EXPOSE 80

# 7. Cấp quyền để server có thể đọc/ghi file (tránh lỗi permission)
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html