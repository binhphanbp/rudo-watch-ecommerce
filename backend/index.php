<?php 

// Fix Authorization header cho Apache/FastCGI
if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION']) && !isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $_SERVER['HTTP_AUTHORIZATION'] = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
}

// Nếu không có HTTP_AUTHORIZATION, thử lấy từ getallheaders()
if (!isset($_SERVER['HTTP_AUTHORIZATION']) && function_exists('getallheaders')) {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        $_SERVER['HTTP_AUTHORIZATION'] = $headers['Authorization'];
    } elseif (isset($headers['authorization'])) {
        $_SERVER['HTTP_AUTHORIZATION'] = $headers['authorization'];
    }
}

require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/app/core/response.php';
require_once __DIR__ . '/app/core/Router.php';

$response = new Response();

// Parse URI
$uri = isset($_GET['url']) ? trim($_GET['url'], '/') : '';

// Nếu không có $_GET['url'], thử parse từ REQUEST_URI
if (empty($uri) && isset($_SERVER['REQUEST_URI'])) {
    $requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    
    // Loại bỏ query string nếu có
    $requestUri = strtok($requestUri, '?');
    
    // Loại bỏ /backend/ nếu có ở đầu
    $requestUri = preg_replace('#^/backend/#', '/', $requestUri);
    $requestUri = preg_replace('#^/backend$#', '/', $requestUri);
    
    // Loại bỏ /index.php nếu có
    $requestUri = preg_replace('#/index\.php$#', '', $requestUri);
    $requestUri = preg_replace('#^/index\.php#', '', $requestUri);
    
    // Loại bỏ leading và trailing slashes
    $uri = trim($requestUri, '/');
}

// Debug: Uncomment để xem URI được parse như thế nào
// error_log("Parsed URI: " . $uri);
// error_log("URI Segments: " . print_r(explode('/', $uri), true));

$uriSegments = explode('/', $uri);

// Handle Swagger UI
if ($uriSegments[0] === 'swagger' || $uriSegments[0] === 'api-docs') {
    $swaggerPath = __DIR__ . '/swagger/index.html';
    if (file_exists($swaggerPath)) {
        readfile($swaggerPath);
        exit();
    }
}

// Handle Swagger JSON
if ($uriSegments[0] === 'swagger.json' || ($uriSegments[0] === 'swagger' && isset($uriSegments[1]) && $uriSegments[1] === 'swagger.json')) {
    $swaggerJsonPath = __DIR__ . '/swagger/swagger.json';
    if (file_exists($swaggerJsonPath)) {
        header('Content-Type: application/json');
        readfile($swaggerJsonPath);
        exit();
    }
}

// Validate API format
if ($uriSegments[0] !== 'api' || !isset($uriSegments[1])) {
    $response->json(['error' => 'Yêu cầu không hợp lệ'], 400);
    exit();
}

// Initialize Router
$router = new Router($uriSegments, $response);

// Try special routes first (register, login, home, user)
if ($router->handleSpecialRoute()) {
    exit();
}

// Handle standard CRUD routes
if ($router->handleStandardRoute()) {
    exit();
}

// No route matched
$response->json(['error' => 'Endpoint không tồn tại'], 404);
exit();
?>