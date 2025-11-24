# Dockerfile cho Render.com deployment - CHỈ DEPLOY BACKEND
# Sử dụng image PHP kèm Apache (Web server phổ biến nhất)
FROM php:8.2-apache

# Bật mod_rewrite cho Apache (cần cho .htaccess)
RUN a2enmod rewrite

COPY backend/ /var/www/html/

# Cài đặt các extension cơ bản nếu bạn cần kết nối Database (MySQL)
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Cấu hình Apache để cho phép .htaccess
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# Cấu hình DocumentRoot để trỏ vào /var/www/html (backend)
RUN sed -i 's|DocumentRoot /var/www/html|DocumentRoot /var/www/html|' /etc/apache2/sites-available/000-default.conf

# Mở cổng 80 (Render sẽ tự động map cổng này ra ngoài)
EXPOSE 80

# Cấp quyền để server có thể đọc/ghi file (tránh lỗi permission)
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html

# Chạy Apache
CMD ["apache2-foreground"]

