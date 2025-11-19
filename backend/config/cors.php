<?php

$allowedOrigins = [ 
    'https://localhost:3000', // chèn url ở đây 
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

/**
 * Kiểm tra và set Access-Control-Allow-Origin
 */
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} elseif (empty($origin)) {

    header('Access-Control-Allow-Origin: *');
} else {
    // Nếu origin không trong danh sách, có thể set default hoặc reject
    header('Access-Control-Allow-Origin: *'); 
}

/**
 * Các HTTP methods được phép
 */
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');

/**
 * Các headers được phép trong request
 */
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}