<?php
/**
 * Cấu hình CORS (Cross-Origin Resource Sharing)
 * 
 * Để thêm origin mới, sửa mảng $allowedOrigins bên dưới
 * Hoặc để cho phép tất cả origin, set $allowAllOrigins = true
 */

// Cho phép tất cả origin (để false nếu muốn chỉ định cụ thể)
$allowAllOrigins = true;

// Danh sách các origin được phép (chỉ dùng khi $allowAllOrigins = false)
$allowedOrigins = [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost',
    'http://127.0.0.1',
    // Thêm các origin khác của bạn vào đây
    // Ví dụ: 'https://yourdomain.com'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Xử lý CORS
if ($allowAllOrigins) {
    // Cho phép tất cả origin
    header('Access-Control-Allow-Origin: *');
} else {
    // Chỉ cho phép các origin trong danh sách
    if (in_array($origin, $allowedOrigins)) {
        header("Access-Control-Allow-Origin: $origin");
    } elseif (empty($origin)) {
        // Nếu không có origin header (ví dụ: request từ cùng domain)
        header('Access-Control-Allow-Origin: *');
    } else {
        // Origin không được phép - trả về 403
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'error',
            'data' => [
                'error' => 'Origin không được phép truy cập'
            ]
        ]);
        exit();
    }
}

// Các header CORS khác
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');

// Xử lý preflight request (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}