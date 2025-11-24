<?php 

require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/app/core/response.php';
require_once __DIR__ . '/app/core/Router.php';

$response = new Response();

// Parse URI
$uri = isset($_GET['url']) ? trim($_GET['url'], '/') : '';

if (empty($uri) && isset($_SERVER['REQUEST_URI'])) {
    $requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $scriptName = dirname($_SERVER['SCRIPT_NAME']);
    
    if ($scriptName !== '/' && $scriptName !== '\\') {
        $basePath = rtrim($scriptName, '/');
        if (strpos($requestUri, $basePath) === 0) {
            $requestUri = substr($requestUri, strlen($basePath));
        }
    }
    
    $requestUri = preg_replace('#^/backend/#', '', $requestUri);
    $uri = trim($requestUri, '/');
}

$uriSegments = explode('/', $uri);

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