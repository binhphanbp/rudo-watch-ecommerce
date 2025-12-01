# 1. Sử dụng image PHP kèm Apache (Web server phổ biến nhất)
FROM php:8.2-apache

# 2. Bật mod_rewrite và mod_headers cho Apache
RUN a2enmod rewrite headers

# 3. Copy toàn bộ code của bạn vào thư mục web của server
COPY . /var/www/html/

# 4. Cài đặt các extension cơ bản nếu bạn cần kết nối Database (MySQL)
RUN docker-php-ext-install mysqli pdo pdo_mysql

# 5. Cấu hình Apache để cho phép .htaccess và set CORS headers
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# 5.1 Thêm CORS headers vào Apache config
RUN echo '<IfModule mod_headers.c>\n\
    Header always set Access-Control-Allow-Origin "*"\n\
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS"\n\
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, Accept, Origin"\n\
    Header always set Access-Control-Max-Age "86400"\n\
</IfModule>' >> /etc/apache2/conf-available/cors.conf && a2enconf cors

# 6. Mở cổng 80 (Render sẽ tự động map cổng này ra ngoài)
EXPOSE 80

# 7. Cấp quyền để server có thể đọc/ghi file (tránh lỗi permission)
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html