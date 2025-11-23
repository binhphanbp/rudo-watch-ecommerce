<?php
/**
 * Root index.php - Redirect to backend API
 * File này được tạo để tránh lỗi "No matching DirectoryIndex" trên Render.com
 */

// Redirect đến backend API
header('Location: /backend/api/v1/', true, 301);
exit();

