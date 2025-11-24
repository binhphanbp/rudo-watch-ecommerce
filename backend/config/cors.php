<?php

$allowAllOrigins = true;

$allowedOrigins = [
    ''
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($allowAllOrigins) {
    header('Access-Control-Allow-Origin: *');
} else {
    if (in_array($origin, $allowedOrigins)) {
        header("Access-Control-Allow-Origin: $origin");
    } elseif (empty($origin)) {
        header('Access-Control-Allow-Origin: *');
    } else {
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

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}