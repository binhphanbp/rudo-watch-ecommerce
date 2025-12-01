<?php

// MUST BE FIRST LINE OF FILE – no spaces above

// Xóa CORS header cũ từ Apache để tránh duplicate
header_remove('Access-Control-Allow-Origin');

$allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',  // Vite dev server
    'http://127.0.0.1:5500',  // Thêm domain production của bạn
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Nếu origin trong whitelist, cho phép origin đó
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
} else {
    // Nếu không có origin hoặc không trong whitelist, cho phép tất cả NHƯNG không có credentials
    header("Access-Control-Allow-Origin: *");
    // KHÔNG set Credentials khi dùng wildcard
}

// header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
// header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
// header('Access-Control-Max-Age: 86400');

// BẮT BUỘC: xử lý Preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
